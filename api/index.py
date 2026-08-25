import os
import sys

# Ensure root and backend are on sys.path for Vercel Serverless execution
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.app.main import app
except ImportError:
    try:
        from app.main import app
    except ImportError:
        from backend.main import app

__all__ = ["app"]
