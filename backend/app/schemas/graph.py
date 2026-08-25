"""Pydantic schemas for Cytoscape Knowledge Graph API endpoints."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class NodeData(BaseModel):
    id: str
    label: str
    name: str
    type: str  # paper, dataset, algorithm, author, code
    dept: str
    author: Optional[str] = "Institutional Faculty"
    year: Optional[int] = 2024
    astMatch: Optional[str] = None
    similarity: Optional[float] = 1.0
    doi: Optional[str] = None
    repo: Optional[str] = None
    abstract: Optional[str] = None
    mathAstCode: Optional[str] = None


class GraphNode(BaseModel):
    data: NodeData


class EdgeData(BaseModel):
    id: str
    source: str
    target: str
    similarity: Optional[float] = 1.0
    label: Optional[str] = None
    type: Optional[str] = "citation"
    relation: Optional[str] = None
    weight: Optional[float] = 1.0


class GraphEdge(BaseModel):
    data: EdgeData


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class GraphFilterRequest(BaseModel):
    selectedDepts: Optional[List[str]] = Field(default_factory=lambda: ["cs", "bio", "mech", "physics", "chem", "mat"])
    selectedTypes: Optional[List[str]] = Field(default_factory=lambda: ["paper", "dataset", "algorithm", "author", "code"])
    similarityThreshold: Optional[float] = 0.50
    searchQuery: Optional[str] = None


class DepartmentSchema(BaseModel):
    id: str
    name: str
    code: str
    color: str
    icon: str
    papersCount: int = 0


class EntityTypeSchema(BaseModel):
    id: str
    label: str
    icon: str
