import os
import sys

root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.app.main import app as fastapi_app
except ImportError:
    from app.main import app as fastapi_app

app = fastapi_app
handler = fastapi_app
application = fastapi_app

__all__ = ["app", "handler", "application"]
