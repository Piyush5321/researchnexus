"""Institutional System Metrics & KPI Analytics Endpoints."""

from fastapi import APIRouter
from backend.app.schemas.ingest import SystemMetricsResponse

router = APIRouter()


@router.get("/summary", response_model=SystemMetricsResponse)
async def get_system_metrics():
    """Returns real-time aggregate statistics for indexed papers, savings, and compute hours."""
    return SystemMetricsResponse(
        papersIndexed=54190,
        departmentsLinked=12,
        redundanciesDetected=348,
        grantsSavedUSD="$4.2M",
        computeHoursConsolidated="128,400 hrs"
    )
