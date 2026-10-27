from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.analytics_service import analytics_service
from ..services.hindsight_service import hindsight_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    metrics = analytics_service.get_dashboard_metrics(db)
    h_status = hindsight_service.get_status()
    metrics["hindsight_memory_count"] = h_status["total_local_memories"]
    metrics["hindsight_mode"] = "live" if h_status["is_live"] else "local"
    return metrics

@router.get("/sales-trends")
def get_sales_trends(days: int = Query(14, ge=3, le=90), db: Session = Depends(get_db)):
    return analytics_service.get_sales_trends(db, days=days)

@router.get("/top-products")
def get_top_products(limit: int = 6, db: Session = Depends(get_db)):
    return analytics_service.get_top_products(db, limit=limit)

@router.get("/category-breakdown")
def get_category_breakdown(db: Session = Depends(get_db)):
    return analytics_service.get_category_breakdown(db)

@router.get("/payment-methods")
def get_payment_methods(db: Session = Depends(get_db)):
    return analytics_service.get_payment_method_breakdown(db)

@router.get("/ai-insight")
def get_live_ai_insight(db: Session = Depends(get_db)):
    metrics = analytics_service.get_dashboard_metrics(db)
    # Perform a quick recall from Hindsight for high priority events
    recall = hindsight_service.recall("urgent stockout credit risk demand", limit=2)
    memories = recall.get("results", [])

    insight_text = ""
    badge = "Proactive"
    if memories:
        top_mem = memories[0]
        insight_text = f"Hindsight Memory #{top_mem['id']}: {top_mem['text'][:120]}..."
        badge = "Hindsight Grounded"
    else:
        if metrics["low_stock_count"] > 0:
            insight_text = f"Attention: {metrics['low_stock_count']} items are currently below safety threshold. Restock staples before weekend rush."
            badge = "Stock Alert"
        else:
            insight_text = f"Healthy turnover: ₹{metrics['today_revenue']:,.2f} generated today across {metrics['today_sales_count']} sales."
            badge = "Healthy"

    return {
        "badge": badge,
        "insight": insight_text,
        "low_stock_count": metrics["low_stock_count"],
        "expiring_count": metrics["expiring_soon_count"],
        "total_credit": metrics["outstanding_credit"],
        "hindsight_mode": "Live Cloud" if hindsight_service.is_live else "Local Engine"
    }
