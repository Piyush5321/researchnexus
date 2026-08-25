"""Pydantic schemas for Paper Matcher & Genre Classification."""

from typing import List, Optional
from pydantic import BaseModel, Field


class AnalyzedDocument(BaseModel):
    title: str
    detectedGenre: str
    genreConfidence: float
    keyMathematicalKernels: List[str]
    estimatedEmbeddingDimensions: int = 768
    vectorNorm: float = 1.0


class MatchedPaper(BaseModel):
    id: str
    title: str
    department: str
    deptCode: str
    author: str
    similarityScore: float
    genreOverlap: str
    equationsMatched: List[str]
    recommendedCollaboration: str


class PaperMatchResponse(BaseModel):
    success: bool = True
    analyzedDocument: AnalyzedDocument
    topMatches: List[MatchedPaper]


class PaperMatchRequest(BaseModel):
    rawText: Optional[str] = None
    department: Optional[str] = "all"
    topK: Optional[int] = 5
    threshold: Optional[float] = 0.65
