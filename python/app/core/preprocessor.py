import statistics
import unicodedata
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Literal
from app.api.schemas import FeedbackRequest
from app.utils.ethical import sanity_check_input

@dataclass
class PreprocessedData:
    session_id: str
    cleaned_feedback: List[str]
    poll_summary: str
    confidence: Literal["low", "medium", "high"]

def normalize_text(text: str) -> str:
    """Normalizes unicode characters and strips whitespace."""
    return unicodedata.normalize("NFKC", text).strip()

def compute_confidence(count: int) -> Literal["low", "medium", "high"]:
    """Determines confidence level based on feedback volume."""
    if count < 3:
        return "low"
    elif count < 15:
        return "medium"
    else:
        return "high"

def summarize_polls(poll_stats: Optional[Dict[str, List[int]]]) -> str:
    """Generates a text summary of poll statistics."""
    if not poll_stats:
        return "No poll data provided."
    
    summary_parts = []
    for poll_name, values in poll_stats.items():
        if not values:
            continue
        try:
            mean_val = statistics.mean(values)
            median_val = statistics.median(values)
            count = len(values)
            summary_parts.append(
                f"{poll_name}: mean={mean_val:.2f}, median={median_val:.2f}, count={count}"
            )
        except statistics.StatisticsError:
            continue
            
    return "\n".join(summary_parts) if summary_parts else "No valid poll data."

def preprocess(request: FeedbackRequest) -> PreprocessedData:
    """
    Main preprocessing pipeline:
    1. Sanity check (PII redact, length check)
    2. Normalize text
    3. Deduplicate
    4. Compute stats and confidence
    """
    # Step 1: Sanity check & Redaction
    safe_feedback = sanity_check_input(request.feedback)
    
    # Step 2: Normalize
    normalized_feedback = [normalize_text(fb) for fb in safe_feedback]
    
    # Step 3: Deduplicate (keeping order roughly)
    seen = set()
    deduped_feedback = []
    for fb in normalized_feedback:
        if fb and fb not in seen:
            deduped_feedback.append(fb)
            seen.add(fb)
            
    # Step 4: Compute metadata
    confidence = compute_confidence(len(deduped_feedback))
    poll_summary = summarize_polls(request.poll_stats)
    
    return PreprocessedData(
        session_id=request.session_id,
        cleaned_feedback=deduped_feedback,
        poll_summary=poll_summary,
        confidence=confidence
    )
