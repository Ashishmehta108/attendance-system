from fastapi import APIRouter, HTTPException, Depends, Request
from app.api.schemas import FeedbackRequest, AnalysisResponse, ErrorResponse
from app.core.pipeline import analyze_feedback
from app.core.inference import Phi4MiniEngine
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_engine(request: Request) -> Phi4MiniEngine:
    if not hasattr(request.app.state, "engine") or request.app.state.engine is None:
        raise HTTPException(status_code=503, detail="AI Model not loaded")
    return request.app.state.engine

@router.post(
    "/analyze", 
    response_model=AnalysisResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Validation Error"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
        503: {"model": ErrorResponse, "description": "Model Not Loaded"}
    }
)
async def analyze_endpoint(
    request: FeedbackRequest, 
    engine: Phi4MiniEngine = Depends(get_engine)
):
    try:
        response = await analyze_feedback(request, engine)
        return response
    except ValueError as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate valid analysis. Please try again.")
    except Exception as e:
        logger.exception("Unexpected error during analysis")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check(request: Request):
    is_loaded = hasattr(request.app.state, "engine") and request.app.state.engine is not None
    return {
        "status": "ok", 
        "model_loaded": is_loaded
    }
