from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router
from app.core.inference import Phi4MiniEngine
import logging
import os

# Setup logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model on startup
    logger.info("Startup: Loading AI Model...")
    try:
        if os.path.exists(settings.model_path):
             app.state.engine = Phi4MiniEngine(settings.model_path)
             logger.info("Startup: AI Model loaded successfully.")
        else:
             logger.warning(f"Startup: Model path {settings.model_path} not found. functionality will be limited.")
             raise FileNotFoundError("Model files not found")
    except Exception as e:
        logger.error(f"Startup: Failed to load real model: {e}")
        logger.warning("FALLBACK: Initializing Mock AI Engine for testing purposes.")
        
        # --- Mock Engine Definition ---
        class MockPhi4MiniEngine:
            def generate(self, prompt: str, max_tokens: int = 512) -> str:
                return '''
                {
                  "sentiment_score": 0.85,
                  "themes": ["clarity", "engagement"],
                  "strengths": ["Clear explanations", "Interactive polls"],
                  "improvements": ["More time for questions"],
                  "summary": "[MOCK] Students appreciated the clear explanations. However, some requested more time for questions.",
                  "confidence": "high"
                }
                '''
        # -----------------------------
        
        app.state.engine = MockPhi4MiniEngine()
        
    yield
    
    # Cleanup on shutdown (if needed)
    logger.info("Shutdown: cleaning up resources...")
    if hasattr(app.state, "engine"):
        del app.state.engine

app = FastAPI(
    title="Classroom Feedback Analysis AI Service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Classroom Feedback AI Service is running."}
