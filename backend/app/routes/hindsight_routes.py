from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import MemoryAudit
from ..schemas import (
    MemoryRetainRequest,
    MemoryRecallRequest,
    MemoryReflectRequest,
    MemoryRecallResultResponse,
    MemoryAuditResponse
)
from ..services.hindsight_service import hindsight_service

router = APIRouter(prefix="/api/hindsight", tags=["hindsight"])

@router.get("/status")
def get_hindsight_status():
    return hindsight_service.get_status()

@router.post("/retain")
def retain_memory(request: MemoryRetainRequest, db: Session = Depends(get_db)):
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Memory content cannot be empty.")

    res = hindsight_service.retain(
        content=request.content,
        bank_id=request.bank_id,
        context=request.context,
        tags=request.tags,
        entities=request.entities
    )

    # Log to audit trail
    audit = MemoryAudit(
        bank_id=res.get("bank_id", "dukaansmart-store-1"),
        action="RETAIN",
        content_or_query=request.content,
        result_summary=f"Retained in {res.get('mode')} with {len(request.tags or [])} tags",
        tags=str(request.tags),
        retrieval_strategy="Multi-Strategy (BM25 + Semantic + Graph + Temporal)"
    )
    db.add(audit)
    db.commit()

    return res

@router.post("/recall", response_model=MemoryRecallResultResponse)
def recall_memories(request: MemoryRecallRequest, db: Session = Depends(get_db)):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Recall query cannot be empty.")

    res = hindsight_service.recall(
        query=request.query,
        bank_id=request.bank_id,
        budget=request.budget or "mid",
        tags=request.tags,
        limit=8
    )

    # Log audit
    audit = MemoryAudit(
        bank_id=res.get("bank_id", "dukaansmart-store-1"),
        action="RECALL",
        content_or_query=request.query,
        result_summary=f"Recalled {res.get('total_memories', 0)} memories via {res.get('mode')}",
        retrieval_strategy=", ".join(res.get("retrieval_strategies", []))
    )
    db.add(audit)
    db.commit()

    return res

@router.post("/reflect")
def reflect_on_memories(request: MemoryReflectRequest, db: Session = Depends(get_db)):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Reflect query cannot be empty.")

    res = hindsight_service.reflect(
        query=request.query,
        bank_id=request.bank_id,
        budget=request.budget or "low"
    )

    audit = MemoryAudit(
        bank_id=res.get("bank_id", "dukaansmart-store-1"),
        action="REFLECT",
        content_or_query=request.query,
        result_summary=res.get("reflection", "")[:200],
        retrieval_strategy="Autonomous Agentic Reflection Loop"
    )
    db.add(audit)
    db.commit()

    return res

@router.get("/memories")
def list_memories(bank_id: Optional[str] = None):
    return hindsight_service.list_all_memories(bank_id=bank_id)

@router.get("/audits", response_model=List[MemoryAuditResponse])
def get_memory_audits(limit: int = 50, db: Session = Depends(get_db)):
    audits = db.query(MemoryAudit).order_by(desc(MemoryAudit.timestamp)).limit(limit).all()
    return audits
