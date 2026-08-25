"""Pydantic schemas for multi-modal document ingestion & processing jobs."""

from typing import Optional
from pydantic import BaseModel


class IngestionProgress(BaseModel):
    stage: str
    pct: int


class IngestionResponse(BaseModel):
    success: bool = True
    ingestionId: str
    nodesCreated: int
    edgesCreated: int
    potentialRedundancies: int
    message: Optional[str] = "Document successfully ingested and mapped into the knowledge graph."


class SystemMetricsResponse(BaseModel):
    papersIndexed: int
    departmentsLinked: int
    redundanciesDetected: int
    grantsSavedUSD: str
    computeHoursConsolidated: str
