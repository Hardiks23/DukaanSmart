from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ChatRequest, ChatResponse
from ..services.llm_service import llm_service
from ..services.analytics_service import analytics_service

router = APIRouter(prefix="/api/ai", tags=["ai_assistant"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_agent(chat_in: ChatRequest, db: Session = Depends(get_db)):
    # Gather live database context to ground the LLM
    metrics = analytics_service.get_dashboard_metrics(db)
    db_context = {
        "today_revenue": metrics["today_revenue"],
        "total_revenue": metrics["total_revenue_all_time"],
        "total_profit": metrics["estimated_gross_profit_all_time"],
        "total_products": metrics["total_products"],
        "low_stock_count": metrics["low_stock_count"],
        "expiring_count": metrics["expiring_soon_count"],
        "total_credit": metrics["outstanding_credit"],
    }

    history_dicts = [{"role": m.role, "content": m.content} for m in chat_in.history]

    response = llm_service.generate_chat_response(
        user_message=chat_in.message,
        conversation_history=history_dicts,
        bank_id=chat_in.bank_id,
        db_context=db_context
    )

    return ChatResponse(**response)

@router.get("/suggested-prompts")
def get_suggested_prompts():
    return [
        {
            "id": 1,
            "category": "Credit Risk",
            "title": "Can I extend credit to Ramesh Kumar?",
            "prompt": "Customer Ramesh Kumar wants Rs 2,000 on Udhar today. Based on past memories, what is his repayment track record and should I approve it?"
        },
        {
            "id": 2,
            "category": "Procurement",
            "title": "How much Aashirvaad Atta should I stock for the upcoming festival?",
            "prompt": "Diwali and festive season is coming up next month. What happened to our Aashirvaad Atta stock last year and how much should I order now?"
        },
        {
            "id": 3,
            "category": "Pricing & Margins",
            "title": "How should I handle wholesale price increases on Sunflower Oil?",
            "prompt": "Wholesaler Balaji is quoting higher rates for Sunflower oil. How did we handle cooking oil price hikes in the past without losing margin?"
        },
        {
            "id": 4,
            "category": "Credit Alert",
            "title": "Evaluate Vikram Singh's credit risk",
            "prompt": "Vikram Singh is asking for additional credit. Check our historical records regarding his repayment delays."
        },
        {
            "id": 5,
            "category": "Merchandising",
            "title": "How to increase snack & namkeen impulse sales?",
            "prompt": "What does our shop memory say about placement of Haldiram Bhujia and Kurkure near the billing counter?"
        }
    ]
