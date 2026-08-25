"""API v1 master router configuration for ResearchNexus."""

from fastapi import APIRouter

from backend.app.api.v1.endpoints import (
    graph,
    ingest,
    matcher,
    metrics,
    redundancy,
)

api_router = APIRouter()

api_router.include_router(graph.router, prefix="/graph", tags=["Knowledge Graph"])
api_router.include_router(redundancy.router, prefix="/redundancy", tags=["Redundancy Engine"])
api_router.include_router(matcher.router, prefix="/matcher", tags=["Paper Matcher"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["Document Ingestion"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["System Metrics"])

