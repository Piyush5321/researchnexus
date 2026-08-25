"""Graph visualization endpoints for Cytoscape.js WebGL rendering."""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db
from backend.app.schemas.graph import (
    DepartmentSchema,
    EntityTypeSchema,
    GraphFilterRequest,
    GraphResponse,
    NodeData,
)
from backend.app.services.graph_service import graph_service

router = APIRouter()


@router.get("/elements", response_model=GraphResponse)
async def get_graph_elements(
    depts: List[str] = Query(default=["cs", "bio", "mech", "physics", "chem", "mat"]),
    types: List[str] = Query(default=["paper", "dataset", "algorithm", "author", "code"]),
    min_similarity: float = Query(default=0.50),
    db: AsyncSession = Depends(get_db)
):
    """Fetches knowledge graph nodes and edges matching active filter parameters."""
    filters = GraphFilterRequest(
        selectedDepts=depts,
        selectedTypes=types,
        similarityThreshold=min_similarity
    )
    return await graph_service.get_filtered_graph(db, filters)


@router.post("/filter", response_model=GraphResponse)
async def filter_graph(
    payload: GraphFilterRequest,
    db: AsyncSession = Depends(get_db)
):
    """POST filtering endpoint for complex multi-criteria knowledge graph queries."""
    return await graph_service.get_filtered_graph(db, payload)


@router.get("/departments", response_model=List[DepartmentSchema])
async def list_departments():
    """Returns active academic departments with color schemes and paper counts."""
    return [
        DepartmentSchema(id="cs", name="Computer Science", code="CS", color="#00F0FF", icon="fa-code-branch", papersCount=1420),
        DepartmentSchema(id="bio", name="Biomedical Eng", code="BIO", color="#8A2BE2", icon="fa-dna", papersCount=980),
        DepartmentSchema(id="mech", name="Mechanical Eng", code="MECH", color="#FFB300", icon="fa-cogs", papersCount=1150),
        DepartmentSchema(id="physics", name="Applied Physics", code="PHYS", color="#00FA64", icon="fa-atom", papersCount=840),
        DepartmentSchema(id="chem", name="Chemistry & Nano", code="CHEM", color="#3B82F6", icon="fa-flask", papersCount=760),
        DepartmentSchema(id="mat", name="Materials Science", code="MAT", color="#EC4899", icon="fa-cubes", papersCount=690),
    ]


@router.get("/entity-types", response_model=List[EntityTypeSchema])
async def list_entity_types():
    """Returns supported knowledge graph entity types."""
    return [
        EntityTypeSchema(id="paper", label="Research Papers", icon="fa-file-lines"),
        EntityTypeSchema(id="dataset", label="Datasets", icon="fa-database"),
        EntityTypeSchema(id="algorithm", label="Algorithms", icon="fa-diagram-project"),
        EntityTypeSchema(id="author", label="Lead Authors", icon="fa-user-astronaut"),
        EntityTypeSchema(id="code", label="Code Repositories", icon="fa-terminal"),
    ]
