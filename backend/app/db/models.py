"""SQLAlchemy 2.0 database models for ResearchNexus.

Models the cross-disciplinary institutional knowledge graph, vector embeddings,
research papers, authors, departments, and redundancy detection alerts.
"""

from datetime import datetime, timezone
from typing import List, Optional
from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.config import settings
from backend.app.db.session import Base

# Association table for Paper <-> Author
paper_authors = Table(
    "paper_authors",
    Base.metadata,
    Column("paper_id", String(64), ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True),
    Column("author_id", String(64), ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True),
)


class Department(Base):
    """Academic departments participating in cross-disciplinary indexing."""
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(16), nullable=False, unique=True)
    color_hex: Mapped[str] = mapped_column(String(16), default="#00F0FF")
    icon: Mapped[str] = mapped_column(String(64), default="fa-building-columns")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    papers: Mapped[List["Paper"]] = relationship("Paper", back_populates="department")
    authors: Mapped[List["Author"]] = relationship("Author", back_populates="department")


class Author(Base):
    """University faculty and research scholars."""
    __tablename__ = "authors"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(256), nullable=False, unique=True, index=True)
    department_id: Mapped[str] = mapped_column(String(32), ForeignKey("departments.id"), nullable=False)
    orcid: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    h_index: Mapped[int] = mapped_column(Integer, default=0)
    specialization: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    department: Mapped["Department"] = relationship("Department", back_populates="authors")
    papers: Mapped[List["Paper"]] = relationship("Paper", secondary=paper_authors, back_populates="authors")


class Paper(Base):
    """Indexed academic papers, preprints, and research technical reports."""
    __tablename__ = "papers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    abstract: Mapped[str] = mapped_column(Text, nullable=False)
    department_id: Mapped[str] = mapped_column(String(32), ForeignKey("departments.id"), nullable=False)
    doi: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    repo_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    publication_year: Mapped[int] = mapped_column(Integer, default=2024)
    detected_genre: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    mathematical_kernels: Mapped[Optional[list]] = mapped_column(JSONB, default=list)
    ast_extracted_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # 768-dimensional vector embedding column (pgvector)
    embedding: Mapped[Optional[list]] = mapped_column(Vector(settings.VECTOR_DIMENSION), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    department: Mapped["Department"] = relationship("Department", back_populates="papers")
    authors: Mapped[List["Author"]] = relationship("Author", secondary=paper_authors, back_populates="papers")
    nodes: Mapped[List["KnowledgeNode"]] = relationship("KnowledgeNode", back_populates="paper")


class KnowledgeNode(Base):
    """Knowledge graph nodes for Cytoscape WebGL rendering."""
    __tablename__ = "knowledge_nodes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    label: Mapped[str] = mapped_column(String(256), nullable=False)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)  # paper, dataset, algorithm, author, code
    department_id: Mapped[str] = mapped_column(String(32), ForeignKey("departments.id"), nullable=False)
    paper_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("papers.id", ondelete="SET NULL"), nullable=True)
    similarity_score: Mapped[float] = mapped_column(Float, default=1.0)
    ast_match_label: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    
    # Node vector for clustering and proximity projection
    embedding: Mapped[Optional[list]] = mapped_column(Vector(settings.VECTOR_DIMENSION), nullable=True)

    paper: Mapped[Optional["Paper"]] = relationship("Paper", back_populates="nodes")
    source_edges: Mapped[List["KnowledgeEdge"]] = relationship(
        "KnowledgeEdge", foreign_keys="KnowledgeEdge.source_id", back_populates="source_node"
    )
    target_edges: Mapped[List["KnowledgeEdge"]] = relationship(
        "KnowledgeEdge", foreign_keys="KnowledgeEdge.target_id", back_populates="target_node"
    )


class KnowledgeEdge(Base):
    """Directed edges connecting research entities with semantic similarity weights."""
    __tablename__ = "knowledge_edges"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_id: Mapped[str] = mapped_column(String(64), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False)
    target_id: Mapped[str] = mapped_column(String(64), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False)
    relation_type: Mapped[str] = mapped_column(String(64), nullable=False)  # redundancy, citation, authorship, dataset
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    label: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    source_node: Mapped["KnowledgeNode"] = relationship("KnowledgeNode", foreign_keys=[source_id], back_populates="source_edges")
    target_node: Mapped["KnowledgeNode"] = relationship("KnowledgeNode", foreign_keys=[target_id], back_populates="target_edges")


class RedundancyAlert(Base):
    """Flagged cross-departmental duplicate or overlapping research initiatives."""
    __tablename__ = "redundancy_alerts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    status: Mapped[str] = mapped_column(String(64), default="CRITICAL_OVERLAP")
    similarity_score: Mapped[int] = mapped_column(Integer, nullable=False)
    
    dept_a_id: Mapped[str] = mapped_column(String(32), ForeignKey("departments.id"), nullable=False)
    dept_b_id: Mapped[str] = mapped_column(String(32), ForeignKey("departments.id"), nullable=False)
    
    paper_a_id: Mapped[str] = mapped_column(String(64), ForeignKey("papers.id"), nullable=False)
    paper_b_id: Mapped[str] = mapped_column(String(64), ForeignKey("papers.id"), nullable=False)
    
    description: Mapped[str] = mapped_column(Text, nullable=False)
    grant_estimated_waste_usd: Mapped[str] = mapped_column(String(64), default="$0 USD")
    potential_action: Mapped[str] = mapped_column(Text, nullable=False)
    ast_diff_data: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class IngestionJob(Base):
    """Background document ingestion and AST extraction jobs."""
    __tablename__ = "ingestion_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    file_name: Mapped[str] = mapped_column(String(256), nullable=False)
    department_id: Mapped[str] = mapped_column(String(32), nullable=False)
    author_name: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    progress_pct: Mapped[int] = mapped_column(Integer, default=0)
    current_stage: Mapped[str] = mapped_column(String(256), default="Initialized")
    nodes_created: Mapped[int] = mapped_column(Integer, default=0)
    edges_created: Mapped[int] = mapped_column(Integer, default=0)
    redundancies_detected: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
