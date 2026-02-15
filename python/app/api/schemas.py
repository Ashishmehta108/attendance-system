from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Any, Literal

# --- Request Models ---

class FeedbackRequest(BaseModel):
    session_id: str = Field(..., description="Unique opaque ID for the session from the main backend")
    feedback: List[str] = Field(..., min_length=1, max_length=500, description="List of anonymous student feedback text items")
    poll_stats: Optional[Dict[str, List[int]]] = Field(None, description="Optional poll statistics, mapping poll name to list of numeric responses")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Reserved for future metadata fields")

    model_config = ConfigDict(extra="ignore")

# --- Response Models ---

class AnalysisResponse(BaseModel):
    session_id: str
    sentiment_score: float = Field(..., ge=0.0, le=1.0, description="Overall sentiment score (0.0 to 1.0)")
    themes: List[str] = Field(..., description="Main themes detected in the feedback")
    strengths: List[str] = Field(..., description="Key strengths identified")
    improvements: List[str] = Field(..., description="Areas for improvement")
    summary: str = Field(..., description="Concise summary of the feedback (max 3 sentences)")
    confidence: Literal["low", "medium", "high"] = Field(..., description="Confidence level based on data volume")
    processing_time_ms: int = Field(..., description="Time taken to process the request in milliseconds")

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
