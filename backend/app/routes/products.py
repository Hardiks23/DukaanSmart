from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Product, SaleItem
from ..schemas import ProductCreate, ProductUpdate, ProductResponse, ProductStockAdjust
from ..services.hindsight_service import hindsight_service

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    filter_type: Optional[str] = Query("all"),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Product.name.ilike(s), Product.sku.ilike(s), Product.barcode.ilike(s)))

    if category and category != "All":
        query = query.filter(Product.category == category)

    products = query.order_by(Product.name.asc()).all()

    now_str = datetime.utcnow().strftime("%Y-%m-%d")
    expiring_soon_str = (datetime.utcnow() + timedelta(days=45)).strftime("%Y-%m-%d")

    results = []
    for p in products:
        # Calculate calculated fields
        margin = 0.0
        if p.selling_price > 0:
            margin = round(((p.selling_price - p.purchase_cost) / p.selling_price) * 100, 1)
        stock_val = round(p.quantity * p.purchase_cost, 2)

        # Apply stock/expiry filters
        if filter_type == "low_stock" and p.quantity > p.min_threshold:
            continue
        elif filter_type == "out_of_stock" and p.quantity > 0:
            continue
        elif filter_type == "expiring":
            if not p.expiry_date or not (now_str <= p.expiry_date <= expiring_soon_str):
                continue

        p_dict = {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "barcode": p.barcode,
            "category": p.category,
            "purchase_cost": p.purchase_cost,
            "selling_price": p.selling_price,
            "quantity": p.quantity,
            "min_threshold": p.min_threshold,
            "unit": p.unit,
            "supplier": p.supplier,
            "expiry_date": p.expiry_date,
            "is_active": p.is_active,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "margin_percentage": margin,
            "stock_value": stock_val,
        }
        results.append(ProductResponse(**p_dict))

    return results

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Product.category).filter(Product.is_active == True).distinct().all()
    return [c[0] for c in cats if c[0]]

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    margin = round(((p.selling_price - p.purchase_cost) / p.selling_price) * 100, 1) if p.selling_price > 0 else 0.0
    stock_val = round(p.quantity * p.purchase_cost, 2)

    return ProductResponse(
        id=p.id,
        name=p.name,
        sku=p.sku,
        barcode=p.barcode,
        category=p.category,
        purchase_cost=p.purchase_cost,
        selling_price=p.selling_price,
        quantity=p.quantity,
        min_threshold=p.min_threshold,
        unit=p.unit,
        supplier=p.supplier,
        expiry_date=p.expiry_date,
        is_active=p.is_active,
        created_at=p.created_at,
        updated_at=p.updated_at,
        margin_percentage=margin,
        stock_value=stock_val,
    )

@router.post("", response_model=ProductResponse)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{product_in.sku}' already exists.")

    p = Product(**product_in.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)

    # Retain in Hindsight as inventory event
    hindsight_service.retain(
        content=f"New product added to inventory: {p.name} ({p.sku}) at purchase price Rs {p.purchase_cost} and selling price Rs {p.selling_price} with initial stock {p.quantity}.",
        tags=["inventory_add", "procurement", p.category.lower().replace(" ", "_")],
        context="Inventory Management"
    )

    margin = round(((p.selling_price - p.purchase_cost) / p.selling_price) * 100, 1) if p.selling_price > 0 else 0.0
    return ProductResponse(
        **product_in.model_dump(),
        id=p.id,
        is_active=p.is_active,
        created_at=p.created_at,
        updated_at=p.updated_at,
        margin_percentage=margin,
        stock_value=round(p.quantity * p.purchase_cost, 2)
    )

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    old_price = p.selling_price
    old_cost = p.purchase_cost

    update_data = product_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(p, field, val)

    p.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(p)

    # Retain in Hindsight if price or cost changed
    if (product_in.selling_price and product_in.selling_price != old_price) or (product_in.purchase_cost and product_in.purchase_cost != old_cost):
        hindsight_service.retain(
            content=f"Price revised for {p.name}: Cost updated from Rs {old_cost} to Rs {p.purchase_cost}, Selling price from Rs {old_price} to Rs {p.selling_price}.",
            tags=["price_change", "margin_adjustment", p.category.lower().replace(" ", "_")],
            context="Pricing Decision"
        )

    margin = round(((p.selling_price - p.purchase_cost) / p.selling_price) * 100, 1) if p.selling_price > 0 else 0.0
    return ProductResponse(
        id=p.id,
        name=p.name,
        sku=p.sku,
        barcode=p.barcode,
        category=p.category,
        purchase_cost=p.purchase_cost,
        selling_price=p.selling_price,
        quantity=p.quantity,
        min_threshold=p.min_threshold,
        unit=p.unit,
        supplier=p.supplier,
        expiry_date=p.expiry_date,
        is_active=p.is_active,
        created_at=p.created_at,
        updated_at=p.updated_at,
        margin_percentage=margin,
        stock_value=round(p.quantity * p.purchase_cost, 2)
    )

@router.post("/{product_id}/adjust-stock")
def adjust_stock(product_id: int, adj: ProductStockAdjust, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    new_qty = p.quantity + adj.adjustment
    if new_qty < 0:
        raise HTTPException(status_code=400, detail=f"Cannot reduce stock below 0. Current stock: {p.quantity}")

    p.quantity = new_qty
    p.updated_at = datetime.utcnow()
    db.commit()

    # Retain significant restock in Hindsight
    if adj.adjustment > 10:
        hindsight_service.retain(
            content=f"Restocked {p.name} with +{adj.adjustment} units (Total: {new_qty}). Reason: {adj.reason}.",
            tags=["restock", "inventory_replenishment"],
            context="Stock Replenishment"
        )

    return {"success": True, "product_id": p.id, "name": p.name, "new_quantity": p.quantity}

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    p.is_active = False
    db.commit()
    return {"success": True, "message": f"Product '{p.name}' marked inactive."}
