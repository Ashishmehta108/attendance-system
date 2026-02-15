from pathlib import Path
from app.core.preprocessor import PreprocessedData

# Load system prompt once at module level (or could be in a lifespan event)
# For simplicity, we'll read it lazily or at import time if file exists.
SYSTEM_PROMPT_PATH = Path("prompts/analysis_system.txt")

def load_system_prompt() -> str:
    try:
        return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "You are a helpful AI assistant. Return JSON only." # Fallback

def build_prompt(data: PreprocessedData) -> str:
    """
    Constructs the final user message for the LLM.
    """
    feedback_text = ""
    if not data.cleaned_feedback:
        feedback_text = "No text feedback provided."
    else:
        # Create a bulleted list of feedback items
        feedback_text = "\n".join([f"- {item}" for item in data.cleaned_feedback])

    user_prompt = f"""
SESSION: {data.session_id}
FEEDBACK COUNT: {len(data.cleaned_feedback)}

FEEDBACK ENTRIES:
{feedback_text}

POLL STATISTICS:
{data.poll_summary}

Analyze the above and return valid JSON matching the schema.
"""
    return user_prompt.strip()
