from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db, Base, engine
from ..models import ShopProfile, Product, Sale, SaleItem, Customer, CreditLedger, MemoryAudit
from ..schemas import ShopProfileUpdate, ShopProfileResponse
from ..services.hindsight_service import hindsight_service
from ..services.llm_service import llm_service
from ..seed import seed_database

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=ShopProfileResponse)
def get_settings(db: Session = Depends(get_db)):
    profile = db.query(ShopProfile).first()
    if not profile:
        profile = ShopProfile()
        db.add(profile)
        db.commit()
        db.refresh(profile)

    status = hindsight_service.get_status()
    profile.is_live_hindsight = status["is_live"]
    return profile

@router.put("", response_model=ShopProfileResponse)
def update_settings(update_in: ShopProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(ShopProfile).first()
    if not profile:
        profile = ShopProfile()
        db.add(profile)

    update_data = update_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)

    db.commit()
    db.refresh(profile)

    # Propagate to services
    if update_in.hindsight_api_key is not None or update_in.hindsight_base_url is not None or update_in.hindsight_bank_id is not None:
        hindsight_service.update_config(
            base_url=profile.hindsight_base_url,
            api_key=profile.hindsight_api_key,
            bank_id=profile.hindsight_bank_id
        )

    if update_in.groq_api_key is not None or update_in.llm_model is not None:
        llm_service.update_config(
            api_key=profile.groq_api_key,
            model=profile.llm_model
        )

    profile.is_live_hindsight = hindsight_service.is_live
    return profile

@router.post("/test-hindsight")
def test_hindsight_connection():
    status = hindsight_service.get_status()
    if not status["has_api_key"]:
        return {
            "success": False,
            "mode": "Local Hindsight Engine",
            "message": "No Hindsight API key configured. Currently running in high-fidelity Local Memory Engine mode."
        }
    
    if status["is_live"]:
        return {
            "success": True,
            "mode": "Live Hindsight Cloud",
            "message": f"Successfully connected to Hindsight at {status['base_url']}! Memory bank: {status['bank_id']}"
        }
    else:
        return {
            "success": False,
            "mode": "Local Hindsight Engine",
            "message": f"Could not establish connection to {status['base_url']}. Local engine active."
        }

@router.post("/reset-database")
def reset_demo_database(db: Session = Depends(get_db)):
    # Drop and recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Reset local hindsight memory
    hindsight_service._local_banks.clear()
    
    # Re-seed
    seed_database(db)
    
    return {
        "success": True,
        "message": "DukaanSmart database and Hindsight memory bank re-seeded with fresh Kirana demo records!"
    }
