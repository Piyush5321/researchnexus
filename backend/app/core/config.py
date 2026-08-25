"""Core application configuration settings for ResearchNexus.

Configures AlloyDB / PostgreSQL connections, vector dimensions, Gemini API credentials,
CORS policies, and authentication parameters using Pydantic Settings.
"""

import os
from typing import List, Union

try:
    from pydantic import AnyHttpUrl, field_validator
    from pydantic_settings import BaseSettings, SettingsConfigDict
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False
    BaseSettings = object  # type: ignore


class Settings(BaseSettings if HAS_PYDANTIC else object):
    """Application settings and environment configuration."""

    if HAS_PYDANTIC:
        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            case_sensitive=True,
            extra="ignore"
        )

    PROJECT_NAME: str = "ResearchNexus"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DEBUG: bool = False

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS Origins
    BACKEND_CORS_ORIGINS: List[Union[str, AnyHttpUrl if HAS_PYDANTIC else str]] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    if HAS_PYDANTIC:
        @field_validator("BACKEND_CORS_ORIGINS", mode="before")
        @classmethod
        def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
            if isinstance(v, str) and not v.startswith("["):
                return [i.strip() for i in v.split(",")]
            elif isinstance(v, (list, str)):
                return v
            raise ValueError(v)

    # Database: AlloyDB / PostgreSQL with pgvector
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://nexus_admin:NexusSecurePass2026!@127.0.0.1:5432/research_nexus")
    SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL", "postgresql://nexus_admin:NexusSecurePass2026!@127.0.0.1:5432/research_nexus")
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30

    # Vector Embeddings
    VECTOR_DIMENSION: int = 768
    SIMILARITY_THRESHOLD_DEFAULT: float = 0.75
    REDUNDANCY_CRITICAL_THRESHOLD: float = 0.85

    # Google Gemini AI Config
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL_TEXT: str = "gemini-3.7-flash"
    GEMINI_MODEL_REASONING: str = "gemini-3.1-pro-preview"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-2-preview"

    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-signing-key-research-nexus-2026-secure-token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days


settings = Settings()

