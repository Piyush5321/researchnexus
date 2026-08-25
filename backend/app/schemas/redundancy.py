"""Schemas for Redundancy Matrix and Redundancy Alert cards."""

from typing import List, Optional

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False
    BaseModel = object  # type: ignore


class MatrixCell(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, score: Optional[int] = None, label: Optional[str] = None, alert: Optional[bool] = False, count: Optional[int] = 0, **kwargs):
        if not HAS_PYDANTIC:
            self.score = score
            self.label = label
            self.alert = alert
            self.count = count
        else:
            super().__init__(score=score, label=label, alert=alert, count=count, **kwargs)

    score: Optional[int] = None
    label: Optional[str] = None
    alert: Optional[bool] = False
    count: Optional[int] = 0


class RedundancyMatrixResponse(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, departments: List[str] = None, matrix: List[List[MatrixCell]] = None, **kwargs):
        if not HAS_PYDANTIC:
            self.departments = departments or []
            self.matrix = matrix or []
        else:
            super().__init__(departments=departments or [], matrix=matrix or [], **kwargs)

    departments: List[str] = []
    matrix: List[List[MatrixCell]] = []


class ASTDiffPayload(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, titleA: str = "", codeA: List[str] = None, titleB: str = "", codeB: List[str] = None, **kwargs):
        if not HAS_PYDANTIC:
            self.titleA = titleA
            self.codeA = codeA or []
            self.titleB = titleB
            self.codeB = codeB or []
        else:
            super().__init__(titleA=titleA, codeA=codeA or [], titleB=titleB, codeB=codeB or [], **kwargs)

    titleA: str = ""
    codeA: List[str] = []
    titleB: str = ""
    codeB: List[str] = []


class RedundancyAlertCard(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, id: str = "", similarity: int = 0, status: str = "", deptA: str = "", deptB: str = "",
                 studyA: str = "", authorA: str = "", emailA: str = "", studyB: str = "", authorB: str = "",
                 emailB: str = "", description: str = "", grantEstimatedWaste: str = "", potentialAction: str = "",
                 astDiff: Optional[ASTDiffPayload] = None, **kwargs):
        if not HAS_PYDANTIC:
            self.id = id
            self.similarity = similarity
            self.status = status
            self.deptA = deptA
            self.deptB = deptB
            self.studyA = studyA
            self.authorA = authorA
            self.emailA = emailA
            self.studyB = studyB
            self.authorB = authorB
            self.emailB = emailB
            self.description = description
            self.grantEstimatedWaste = grantEstimatedWaste
            self.potentialAction = potentialAction
            self.astDiff = astDiff or ASTDiffPayload()
        else:
            super().__init__(id=id, similarity=similarity, status=status, deptA=deptA, deptB=deptB,
                             studyA=studyA, authorA=authorA, emailA=emailA, studyB=studyB, authorB=authorB,
                             emailB=emailB, description=description, grantEstimatedWaste=grantEstimatedWaste,
                             potentialAction=potentialAction, astDiff=astDiff or ASTDiffPayload(), **kwargs)

    id: str = ""
    similarity: int = 0
    status: str = ""
    deptA: str = ""
    deptB: str = ""
    studyA: str = ""
    authorA: str = ""
    emailA: str = ""
    studyB: str = ""
    authorB: str = ""
    emailB: str = ""
    description: str = ""
    grantEstimatedWaste: str = ""
    potentialAction: str = ""
    astDiff: Optional[ASTDiffPayload] = None


class CollaborationInviteRequest(BaseModel if HAS_PYDANTIC else object):
    alertId: str = ""
    authorAEmail: str = ""
    authorBEmail: str = ""
    customMessage: Optional[str] = None


class TriggerAnalysisRequest(BaseModel if HAS_PYDANTIC else object):
    departmentScope: Optional[List[str]] = None
    forceReindexAST: Optional[bool] = False

