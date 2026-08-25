import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
for p in [backend_dir, parent_dir]:
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
