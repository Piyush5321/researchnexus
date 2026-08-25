-- ========================================================================
-- ResearchNexus Database Schema DDL for AlloyDB / PostgreSQL 15+
-- Automated Cross-Disciplinary Knowledge Graph & Research Redundancy Engine
-- ========================================================================

-- Enable pgvector extension for dense embedding similarity queries
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    code VARCHAR(16) NOT NULL UNIQUE,
    color_hex VARCHAR(16) DEFAULT '#00F0FF',
    icon VARCHAR(64) DEFAULT 'fa-building-columns',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Authors Table
CREATE TABLE IF NOT EXISTS authors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL UNIQUE,
    department_id VARCHAR(32) NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    orcid VARCHAR(64),
    h_index INTEGER DEFAULT 0,
    specialization TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);
CREATE INDEX IF NOT EXISTS idx_authors_dept ON authors(department_id);

-- 3. Papers Table
CREATE TABLE IF NOT EXISTS papers (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(512) NOT NULL,
    abstract TEXT NOT NULL,
    department_id VARCHAR(32) NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    doi VARCHAR(128),
    repo_url VARCHAR(512),
    publication_year INTEGER DEFAULT 2024,
    detected_genre VARCHAR(128),
    mathematical_kernels JSONB DEFAULT '[]'::jsonb,
    ast_extracted_code TEXT,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_papers_dept ON papers(department_id);
CREATE INDEX IF NOT EXISTS idx_papers_title ON papers(title);

-- High-Performance HNSW Vector Cosine Distance Index for 768-d Embeddings
CREATE INDEX IF NOT EXISTS idx_papers_embedding_hnsw 
ON papers 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Paper-Author Junction Table
CREATE TABLE IF NOT EXISTS paper_authors (
    paper_id VARCHAR(64) NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    author_id VARCHAR(64) NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    PRIMARY KEY (paper_id, author_id)
);

-- 5. Knowledge Graph Nodes
CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id VARCHAR(64) PRIMARY KEY,
    label VARCHAR(256) NOT NULL,
    name VARCHAR(512) NOT NULL,
    type VARCHAR(32) NOT NULL,
    department_id VARCHAR(32) NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    paper_id VARCHAR(64) REFERENCES papers(id) ON DELETE SET NULL,
    similarity_score FLOAT DEFAULT 1.0,
    ast_match_label VARCHAR(128),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    embedding vector(768)
);
CREATE INDEX IF NOT EXISTS idx_nodes_dept ON knowledge_nodes(department_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON knowledge_nodes(type);
CREATE INDEX IF NOT EXISTS idx_nodes_embedding_hnsw 
ON knowledge_nodes 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 6. Knowledge Graph Edges
CREATE TABLE IF NOT EXISTS knowledge_edges (
    id VARCHAR(64) PRIMARY KEY,
    source_id VARCHAR(64) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_id VARCHAR(64) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relation_type VARCHAR(64) NOT NULL,
    weight FLOAT DEFAULT 1.0,
    label VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_edges_source ON knowledge_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON knowledge_edges(target_id);

-- 7. Redundancy Alerts
CREATE TABLE IF NOT EXISTS redundancy_alerts (
    id VARCHAR(64) PRIMARY KEY,
    status VARCHAR(64) DEFAULT 'CRITICAL_OVERLAP',
    similarity_score INTEGER NOT NULL,
    dept_a_id VARCHAR(32) NOT NULL REFERENCES departments(id),
    dept_b_id VARCHAR(32) NOT NULL REFERENCES departments(id),
    paper_a_id VARCHAR(64) NOT NULL REFERENCES papers(id),
    paper_b_id VARCHAR(64) NOT NULL REFERENCES papers(id),
    description TEXT NOT NULL,
    grant_estimated_waste_usd VARCHAR(64) DEFAULT '$0 USD',
    potential_action TEXT NOT NULL,
    ast_diff_data JSONB DEFAULT '{}'::jsonb,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Ingestion Jobs
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id VARCHAR(64) PRIMARY KEY,
    status VARCHAR(32) DEFAULT 'PENDING',
    file_name VARCHAR(256) NOT NULL,
    department_id VARCHAR(32) NOT NULL,
    author_name VARCHAR(256),
    progress_pct INTEGER DEFAULT 0,
    current_stage VARCHAR(256) DEFAULT 'Initialized',
    nodes_created INTEGER DEFAULT 0,
    edges_created INTEGER DEFAULT 0,
    redundancies_detected INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================================================
-- Seed Initial Academic Departments
-- ========================================================================
INSERT INTO departments (id, name, code, color_hex, icon) VALUES
('cs', 'Computer Science', 'CS', '#00F0FF', 'fa-code-branch'),
('bio', 'Biomedical Engineering', 'BIO', '#8A2BE2', 'fa-dna'),
('mech', 'Mechanical Engineering', 'MECH', '#FFB300', 'fa-cogs'),
('physics', 'Applied Physics', 'PHYS', '#00FA64', 'fa-atom'),
('chem', 'Chemistry & Nanotech', 'CHEM', '#3B82F6', 'fa-flask'),
('mat', 'Materials Science', 'MAT', '#EC4899', 'fa-cubes')
ON CONFLICT (id) DO NOTHING;
