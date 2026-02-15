import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from app.core.inference import Phi4MiniEngine
from app.config import settings

print(f"Attempting to load model from: {settings.model_path}")
try:
    engine = Phi4MiniEngine(settings.model_path)
    print("Success! Model loaded.")
except Exception as e:
    print(f"FAILED to load model: {e}")
    import traceback
    traceback.print_exc()
