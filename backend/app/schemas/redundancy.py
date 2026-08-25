"""Pydantic schemas for Redundancy Matrix and Redundancy Alert cards."""

from typing import List, Optional
from pydantic import BaseModel, Field


class MatrixCell(BaseModel):
    score: Optional[int] = None
    label: Optional[str] = None
    alert: Optional[bool] = False
    count: Optional[int] = 0


class RedundancyMatrixResponse(BaseModel):
    departments: List[str]
    matrix: List[List[MatrixCell]]


class ASTDiffPayload(BaseModel):
    titleA: str
    codeA: List[str]
    titleB: str
    codeB: List[str]


class RedundancyAlertCard(BaseModel):
    id: str
    similarity: int
    status: str
    deptA: str
    deptB: str
    studyA: str
    authorA: str
    emailA: str
    studyB: str
    authorB: str
    emailB: str
    description: str
    grantEstimatedWaste: str
    potentialAction: str
    astDiff: ASTDiffPayload


class CollaborationInviteRequest(BaseModel):
    alertId: str
    authorAEmail: str
    authorBEmail: str
    customMessage: Optional[str] = None


class TriggerAnalysisRequest(BaseModel):
    departmentScope: Optional[List[str]] = Field(default_factory=lambda: ["all"])
    forceReindexAST: Optional[bool] = False
