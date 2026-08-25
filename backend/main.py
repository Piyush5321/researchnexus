import os
import sys

# Ensure backend root and project root are in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from app.main import app
except ImportError:
    from backend.app.main import app

__all__ = ["app"]
