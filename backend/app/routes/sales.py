from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Sale, SaleItem, Product, Customer, CreditLedger, ShopProfile
from ..schemas import SaleCreate, SaleResponse
from ..services.hindsight_service import hindsight_service

router = APIRouter(prefix="/api/sales", tags=["sales"])

@router.get("", response_model=List[SaleResponse])
def get_sales(
    limit: int = 50,
    offset: int = 0,
    payment_method: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Sale)
    if payment_method:
        query = query.filter(Sale.payment_method == payment_method.upper())
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)

    sales = query.order_by(desc(Sale.created_at)).offset(offset).limit(limit).all()
    return sales

@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.post("", response_model=SaleResponse)
def create_sale(sale_in: SaleCreate, db: Session = Depends(get_db)):
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Cannot create sale with an empty cart.")

    # 1. Validate customer if credit sale
    customer = None
    if sale_in.payment_method.upper() == "CREDIT":
        if not sale_in.customer_id:
            raise HTTPException(status_code=400, detail="Customer must be selected for Credit (Udhar) transactions.")
        customer = db.query(Customer).filter(Customer.id == sale_in.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Selected customer does not exist.")

    # 2. Validate items & stock
    subtotal = 0.0
    total_cost = 0.0
    items_to_create = []

    for item in sale_in.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found.")

        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}"
            )

        # Deduct stock
        product.quantity -= item.quantity
        product.updated_at = datetime.utcnow()

        item_subtotal = (product.selling_price * item.quantity) - item.discount
        item_cost = product.purchase_cost * item.quantity
        item_profit = item_subtotal - item_cost

        subtotal += item_subtotal
        total_cost += item_cost

        items_to_create.append({
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "unit": product.unit,
            "unit_cost": product.purchase_cost,
            "unit_price": product.selling_price,
            "quantity": item.quantity,
            "total_amount": round(item_subtotal, 2),
            "total_profit": round(item_profit, 2)
        })

    total_amount = subtotal - sale_in.discount_amount + sale_in.tax_amount
    gross_profit = total_amount - total_cost

    # 3. Check customer credit limit
    if customer:
        if (customer.current_balance + total_amount) > customer.credit_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Credit limit exceeded for {customer.name}. Limit: Rs {customer.credit_limit}, Current: Rs {customer.current_balance}, Purchase: Rs {total_amount}"
            )
        customer.current_balance += total_amount

    # 4. Generate Invoice No
    today_prefix = datetime.utcnow().strftime("%Y%m%d")
    count_today = db.query(Sale).filter(Sale.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)).count()
    invoice_no = f"INV-{today_prefix}-{(count_today + 1):04d}"

    # 5. Create Sale
    sale = Sale(
        invoice_no=invoice_no,
        customer_id=customer.id if customer else None,
        customer_name=customer.name if customer else sale_in.customer_name,
        payment_method=sale_in.payment_method.upper(),
        subtotal=round(subtotal, 2),
        discount_amount=round(sale_in.discount_amount, 2),
        tax_amount=round(sale_in.tax_amount, 2),
        total_amount=round(total_amount, 2),
        total_cost=round(total_cost, 2),
        gross_profit=round(gross_profit, 2),
        notes=sale_in.notes or f"POS checkout via {sale_in.payment_method.upper()}",
        created_at=datetime.utcnow()
    )
    db.add(sale)
    db.flush()

    # 6. Create Sale Items
    for itm in items_to_create:
        s_item = SaleItem(sale_id=sale.id, **itm)
        db.add(s_item)

    # 7. Create Ledger Entry if Udhar
    if customer:
        ledger = CreditLedger(
            customer_id=customer.id,
            transaction_type="UDHAR",
            amount=round(total_amount, 2),
            balance_after=round(customer.current_balance, 2),
            reference_sale_id=sale.id,
            payment_mode="CREDIT_SALE",
            notes=f"Purchase on Credit: Invoice {invoice_no}",
            created_at=datetime.utcnow()
        )
        db.add(ledger)

    db.commit()
    db.refresh(sale)

    # 8. Retain significant retail events in Hindsight
    if sale.payment_method == "CREDIT" and customer:
        hindsight_service.retain(
            content=f"Customer {customer.name} took Rs {sale.total_amount:,.2f} of groceries on credit (Invoice {invoice_no}). Outstanding balance now stands at Rs {customer.current_balance:,.2f} against limit Rs {customer.credit_limit:,.2f}.",
            tags=["credit_granted", "udhar", customer.name.lower().replace(" ", "_")],
            context="Credit Transaction"
        )
    elif sale.total_amount > 2000.0:
        hindsight_service.retain(
            content=f"High-value counter sale of Rs {sale.total_amount:,.2f} completed via {sale.payment_method} (Invoice {invoice_no}) comprising {len(sale.items)} items.",
            tags=["high_value_sale", "revenue_milestone"],
            context="POS High Value Sale"
        )

    return sale
