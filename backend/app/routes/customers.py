from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Customer, CreditLedger, ShopProfile
from ..schemas import CustomerCreate, CustomerUpdate, CustomerResponse, CreditPaymentCreate, CreditLedgerResponse
from ..services.hindsight_service import hindsight_service

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.get("", response_model=List[CustomerResponse])
def get_customers(
    search: Optional[str] = None,
    trust_tier: Optional[str] = None,
    has_balance_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Customer.name.ilike(s)) | (Customer.phone.ilike(s)))
    if trust_tier and trust_tier != "All":
        query = query.filter(Customer.trust_tier == trust_tier)
    if has_balance_only:
        query = query.filter(Customer.current_balance > 0)

    customers = query.order_by(desc(Customer.current_balance)).all()
    return customers

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("", response_model=CustomerResponse)
def create_customer(cust_in: CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.phone == cust_in.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Customer with phone {cust_in.phone} already exists.")

    customer = Customer(
        name=cust_in.name,
        phone=cust_in.phone,
        address=cust_in.address,
        credit_limit=cust_in.credit_limit,
        current_balance=cust_in.initial_balance or 0.0,
        trust_tier=cust_in.trust_tier,
        notes=cust_in.notes
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    if customer.current_balance > 0:
        ledger = CreditLedger(
            customer_id=customer.id,
            transaction_type="UDHAR",
            amount=customer.current_balance,
            balance_after=customer.current_balance,
            payment_mode="INITIAL_BALANCE",
            notes="Opening Udhar balance",
            created_at=datetime.utcnow()
        )
        db.add(ledger)
        db.commit()

    # Retain customer onboarded into Hindsight
    hindsight_service.retain(
        content=f"New customer khata account opened for {customer.name} (Phone: {customer.phone}). Credit limit set to Rs {customer.credit_limit:,.2f} with trust rating '{customer.trust_tier}'.",
        tags=["customer_onboard", customer.name.lower().replace(" ", "_")],
        context="Customer Khata Onboarding"
    )

    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, cust_in: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = cust_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(customer, field, val)

    db.commit()
    db.refresh(customer)
    return customer

@router.post("/{customer_id}/payment", response_model=CustomerResponse)
def record_payment(customer_id: int, payment_in: CreditPaymentCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if payment_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero.")

    old_balance = customer.current_balance
    new_balance = max(0.0, old_balance - payment_in.amount)
    customer.current_balance = round(new_balance, 2)

    ledger = CreditLedger(
        customer_id=customer.id,
        transaction_type="JAMA",
        amount=round(payment_in.amount, 2),
        balance_after=customer.current_balance,
        payment_mode=payment_in.payment_mode.upper(),
        notes=payment_in.notes or f"Payment received via {payment_in.payment_mode.upper()}",
        created_at=datetime.utcnow()
    )
    db.add(ledger)
    db.commit()
    db.refresh(customer)

    # Retain repayment into Hindsight!
    hindsight_service.retain(
        content=f"Customer {customer.name} paid Rs {payment_in.amount:,.2f} via {payment_in.payment_mode.upper()} against their Udhar khata. Outstanding balance reduced from Rs {old_balance:,.2f} to Rs {customer.current_balance:,.2f}.",
        tags=["repayment", "credit_cleared", "jama", customer.name.lower().replace(" ", "_")],
        context="Credit Repayment Event"
    )

    return customer

@router.get("/{customer_id}/reminder-template")
def get_reminder_template(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    profile = db.query(ShopProfile).first()
    shop_name = profile.shop_name if profile else "Sharma Kirana & General Store"
    upi_id = profile.upi_id if profile else "dukaansmart@upi"

    message = (
        f"Namaste {customer.name} Ji! 🙏\n\n"
        f"This is a gentle reminder from {shop_name}.\n"
        f"Your current pending shop balance is: ₹{customer.current_balance:,.2f}.\n\n"
        f"You can pay conveniently via UPI to: {upi_id} or visit our store counter.\n"
        f"Thank you for your continued trust and patronage! 🛍️"
    )

    whatsapp_link = f"https://api.whatsapp.com/send?phone=91{customer.phone}&text={message.replace(' ', '%20').replace('\n', '%0A')}"

    return {
        "customer_name": customer.name,
        "phone": customer.phone,
        "balance": customer.current_balance,
        "message": message,
        "whatsapp_link": whatsapp_link
    }
