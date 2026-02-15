import re
import logging

logger = logging.getLogger(__name__)

# Patterns for common PII
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b')
# Simple heuristic for potential names (Capitalized words in sequence - likely false positives so we are conservative)
# For this purpose, we focus on high-confidence PII like emails/phones and explicit ID patterns.

def redact_pii(text: str) -> str:
    """
    Redacts email addresses and phone numbers from the text.
    """
    redacted = EMAIL_REGEX.sub("[EMAIL REDACTED]", text)
    redacted = PHONE_REGEX.sub("[PHONE REDACTED]", redacted)
    return redacted

def validate_feedback_entry(text: str, max_chars: int = 500) -> bool:
    """
    Checks if a feedback entry is within safe limits.
    """
    if len(text) > max_chars:
        return False
    return True

def sanity_check_input(feedback: list[str]) -> list[str]:
    """
    Applies PII redaction and validation to a list of feedback entries.
    Drops entries that are too long (potential injection/spam).
    """
    clean_feedback = []
    dropped_count = 0
    
    for entry in feedback:
        if not validate_feedback_entry(entry):
            dropped_count += 1
            continue
        
        clean_entry = redact_pii(entry)
        clean_feedback.append(clean_entry)
        
    if dropped_count > 0:
        logger.warning(f"Dropped {dropped_count} feedback entries due to length violation.")
        
    return clean_feedback
