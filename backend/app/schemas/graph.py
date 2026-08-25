"""Schemas for Cytoscape Knowledge Graph API endpoints."""

from typing import Any, Dict, List, Optional

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False
    BaseModel = object  # type: ignore


class NodeData(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, id: str = "", label: str = "", name: str = "", type: str = "", dept: str = "",
                 author: Optional[str] = "Institutional Faculty", year: Optional[int] = 2024,
                 astMatch: Optional[str] = None, similarity: Optional[float] = 1.0,
                 doi: Optional[str] = None, repo: Optional[str] = None, abstract: Optional[str] = None,
                 mathAstCode: Optional[str] = None, **kwargs):
        if not HAS_PYDANTIC:
            self.id = id
            self.label = label
            self.name = name
            self.type = type
            self.dept = dept
            self.author = author
            self.year = year
            self.astMatch = astMatch
            self.similarity = similarity
            self.doi = doi
            self.repo = repo
            self.abstract = abstract
            self.mathAstCode = mathAstCode
        else:
            super().__init__(id=id, label=label, name=name, type=type, dept=dept, author=author,
                             year=year, astMatch=astMatch, similarity=similarity, doi=doi, repo=repo,
                             abstract=abstract, mathAstCode=mathAstCode, **kwargs)

    id: str = ""
    label: str = ""
    name: str = ""
    type: str = ""
    dept: str = ""
    author: Optional[str] = "Institutional Faculty"
    year: Optional[int] = 2024
    astMatch: Optional[str] = None
    similarity: Optional[float] = 1.0
    doi: Optional[str] = None
    repo: Optional[str] = None
    abstract: Optional[str] = None
    mathAstCode: Optional[str] = None


class GraphNode(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, data: Optional[NodeData] = None, **kwargs):
        if not HAS_PYDANTIC:
            self.data = data or NodeData()
        else:
            super().__init__(data=data or NodeData(), **kwargs)

    data: NodeData = NodeData()


class EdgeData(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, id: str = "", source: str = "", target: str = "", similarity: Optional[float] = 1.0,
                 label: Optional[str] = None, type: Optional[str] = "citation", relation: Optional[str] = None,
                 weight: Optional[float] = 1.0, **kwargs):
        if not HAS_PYDANTIC:
            self.id = id
            self.source = source
            self.target = target
            self.similarity = similarity
            self.label = label
            self.type = type
            self.relation = relation
            self.weight = weight
        else:
            super().__init__(id=id, source=source, target=target, similarity=similarity, label=label,
                             type=type, relation=relation, weight=weight, **kwargs)

    id: str = ""
    source: str = ""
    target: str = ""
    similarity: Optional[float] = 1.0
    label: Optional[str] = None
    type: Optional[str] = "citation"
    relation: Optional[str] = None
    weight: Optional[float] = 1.0


class GraphEdge(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, data: Optional[EdgeData] = None, **kwargs):
        if not HAS_PYDANTIC:
            self.data = data or EdgeData()
        else:
            super().__init__(data=data or EdgeData(), **kwargs)

    data: EdgeData = EdgeData()


class GraphResponse(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, nodes: Optional[List[GraphNode]] = None, edges: Optional[List[GraphEdge]] = None, **kwargs):
        if not HAS_PYDANTIC:
            self.nodes = nodes or []
            self.edges = edges or []
        else:
            super().__init__(nodes=nodes or [], edges=edges or [], **kwargs)

    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []


class GraphFilterRequest(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, selectedDepts: Optional[List[str]] = None, selectedTypes: Optional[List[str]] = None,
                 similarityThreshold: Optional[float] = 0.50, searchQuery: Optional[str] = None, **kwargs):
        depts = selectedDepts if selectedDepts is not None else ["cs", "bio", "mech", "physics", "chem", "mat"]
        types = selectedTypes if selectedTypes is not None else ["paper", "dataset", "algorithm", "author", "code"]
        if not HAS_PYDANTIC:
            self.selectedDepts = depts
            self.selectedTypes = types
            self.similarityThreshold = similarityThreshold
            self.searchQuery = searchQuery
        else:
            super().__init__(selectedDepts=depts, selectedTypes=types, similarityThreshold=similarityThreshold,
                             searchQuery=searchQuery, **kwargs)

    selectedDepts: Optional[List[str]] = ["cs", "bio", "mech", "physics", "chem", "mat"]
    selectedTypes: Optional[List[str]] = ["paper", "dataset", "algorithm", "author", "code"]
    similarityThreshold: Optional[float] = 0.50
    searchQuery: Optional[str] = None


class DepartmentSchema(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, id: str = "", name: str = "", code: str = "", color: str = "", icon: str = "",
                 papersCount: int = 0, **kwargs):
        if not HAS_PYDANTIC:
            self.id = id
            self.name = name
            self.code = code
            self.color = color
            self.icon = icon
            self.papersCount = papersCount
        else:
            super().__init__(id=id, name=name, code=code, color=color, icon=icon, papersCount=papersCount, **kwargs)

    id: str = ""
    name: str = ""
    code: str = ""
    color: str = ""
    icon: str = ""
    papersCount: int = 0



class EntityTypeSchema(BaseModel if HAS_PYDANTIC else object):
    def __init__(self, id: str = "", label: str = "", icon: str = "", **kwargs):
        if not HAS_PYDANTIC:
            self.id = id
            self.label = label
            self.icon = icon
        else:
            super().__init__(id=id, label=label, icon=icon, **kwargs)

    id: str = ""
    label: str = ""
    icon: str = ""

