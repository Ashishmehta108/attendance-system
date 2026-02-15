import hashlib
import json
from collections import OrderedDict
from typing import Any, Optional
import time
from app.config import settings

class FeedbackCache:
    def __init__(self, maxsize: int = settings.cache_maxsize, ttl: int = settings.cache_ttl_seconds):
        self.cache = OrderedDict()
        self.maxsize = maxsize
        self.ttl = ttl

    def _generate_key(self, feedback: list[str], poll_stats: Optional[dict]) -> str:
        """
        Generates a deterministic hash based on content.
        """
        # Sort feedback list to ensure order independence
        sorted_feedback = sorted(feedback)
        
        # Canonicalize poll_stats
        canonical_poll = None
        if poll_stats:
            canonical_poll = {k: sorted(v) if isinstance(v, list) else v for k, v in sorted(poll_stats.items())}
            
        payload = {
            "feedback": sorted_feedback,
            "poll_stats": canonical_poll
        }
        
        serialized = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def get(self, feedback: list[str], poll_stats: Optional[dict]) -> Optional[Any]:
        key = self._generate_key(feedback, poll_stats)
        if key not in self.cache:
            return None
            
        entry = self.cache[key]
        if time.time() > entry["expires_at"]:
            del self.cache[key]
            return None
            
        # Move to end (MRU)
        self.cache.move_to_end(key)
        return entry["data"]

    def set(self, feedback: list[str], poll_stats: Optional[dict], data: Any):
        key = self._generate_key(feedback, poll_stats)
        
        if key in self.cache:
            self.cache.move_to_end(key)
        
        self.cache[key] = {
            "data": data,
            "expires_at": time.time() + self.ttl
        }
        
        if len(self.cache) > self.maxsize:
            self.cache.popitem(last=False)

# Singleton instance
analysis_cache = FeedbackCache()
