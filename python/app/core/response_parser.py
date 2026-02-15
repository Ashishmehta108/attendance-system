import json
import re
import logging
from typing import Any, Dict, Optional, Literal
from app.api.schemas import AnalysisResponse

logger = logging.getLogger(__name__)

def extract_json(text: str) -> Optional[Dict[str, Any]]:
    """
    Attempts to extract a JSON object from a string using multiple strategies.
    """
    # Strategy 1: Try parsing the entire text as JSON
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Strategy 2: Find JSON between ```json ... ``` code blocks
    code_block_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if code_block_match:
        try:
            return json.loads(code_block_match.group(1))
        except json.JSONDecodeError:
            pass

    # Strategy 3: Find the first { ... } block using brace matching
    start = text.find('{')
    if start != -1:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == '{':
                depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(text[start:i+1])
                    except json.JSONDecodeError:
                        break

    # Strategy 4: Greedy regex for any JSON-like object
    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    logger.error(f"Could not extract JSON from: {text[:300]}...")
    return None

def parse_response(
    raw_output: str, 
    confidence: Literal["low", "medium", "high"], 
    session_id: str
) -> AnalysisResponse:
    """
    Parses the raw LLM output, validates it, and merges deterministic fields.
    """
    parsed_json = extract_json(raw_output)
    
    if not parsed_json:
        raise ValueError("LLM output is not valid JSON")

    # Clamp sentiment
    sentiment = float(parsed_json.get("sentiment_score", 0.5))
    sentiment = max(0.0, min(1.0, sentiment))
    
    # Construct final response with defaults for missing fields
    return AnalysisResponse(
        session_id=session_id,
        sentiment_score=sentiment,
        themes=parsed_json.get("themes", ["general"]),
        strengths=parsed_json.get("strengths", []),
        improvements=parsed_json.get("improvements", []),
        summary=parsed_json.get("summary", "Analysis completed."),
        confidence=confidence,
        processing_time_ms=0
    )
