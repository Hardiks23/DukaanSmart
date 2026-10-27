import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .database import engine, Base, SessionLocal
from .seed import seed_database
from .services.hindsight_service import hindsight_service
from .services.llm_service import llm_service

from .routes.products import router as products_router
from .routes.sales import router as sales_router
from .routes.customers import router as customers_router
from .routes.hindsight_routes import router as hindsight_router
from .routes.ai_assistant import router as ai_router
from .routes.dashboard import router as dashboard_router
from .routes.settings_routes import router as settings_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("dukaansmart")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    logger.info("Initializing DukaanSmart SQLite database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Run seed
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    logger.info("DukaanSmart Backend started successfully.")
    yield
    logger.info("DukaanSmart Backend shutting down.")

app = FastAPI(
    title="DukaanSmart API",
    description="A Clearer Way to Run the Everyday Shop — Powered by Hindsight AI Long-Term Memory",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard_router)
app.include_router(products_router)
app.include_router(sales_router)
app.include_router(customers_router)
app.include_router(hindsight_router)
app.include_router(ai_router)
app.include_router(settings_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "product": "DukaanSmart",
        "tagline": "A clearer way to run the everyday shop.",
        "hackathon": "HackWithHyderabad 3.0 — AI Agents That Learn Using Hindsight",
        "team": "404 - COMPETITION NOT FOUND",
        "members": [
            "Hardik Sachdeva",
            "Uday Narayan Dubey",
            "Simardeep Singh Bhatia",
            "Amit Kumar"
        ],
        "hindsight": hindsight_service.get_status()
    }
