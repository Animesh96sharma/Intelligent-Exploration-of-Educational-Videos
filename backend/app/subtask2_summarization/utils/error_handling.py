"""
Robust error handling for LLM calls and JSON parsing.
"""

import json
import re
import time
import logging
from typing import Optional, Any
from functools import wraps

logger = logging.getLogger(__name__)


def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """Decorator to retry failed function calls."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                    time.sleep(delay * (2 ** attempt))  # Exponential backoff
            return None
        return wrapper
    return decorator


def robust_json_parse(raw: str) -> Optional[dict]:
    """
    Parse JSON from LLM output, fixing common formatting issues.
    """
    if not raw:
        return None
    
    # Remove markdown code fences
    raw = re.sub(r'```json\s*', '', raw)
    raw = re.sub(r'```\s*$', '', raw)
    
    # Try direct parse
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    
    # Extract JSON object using regex
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    
    # Fix missing quotes around keys (common LLM issue)
    fixed = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', raw)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass
    
    logger.error(f"Could not parse JSON after all fixes. Preview: {raw[:200]}")
    return None 