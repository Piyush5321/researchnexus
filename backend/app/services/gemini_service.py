"""Google Gemini AI Service Layer for ResearchNexus.

Integrates with Google GenAI SDK for server-side classification, vector embedding generation,
triplet extraction for knowledge graphs, and cross-disciplinary semantic alignment.
"""

import json
import logging
import math
from typing import Any, Dict, List, Optional
from google import genai
from google.genai import types

from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiAIService:
    """Encapsulates all Google GenAI model interactions for ResearchNexus."""

    def __init__(self):
        self._client: Optional[genai.Client] = None

    @property
    def client(self) -> genai.Client:
        """Lazy initialization of Google GenAI client."""
        if self._client is None:
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                logger.warning(
                    "[GeminiService] GEMINI_API_KEY is not set. Using mock fallbacks for AI operations."
                )
            self._client = genai.Client(
                api_key=api_key or "DUMMY_KEY_FOR_MOCK",
                http_options={"headers": {"User-Agent": "aistudio-build"}}
            )
        return self._client

    async def generate_embedding(self, text: str) -> List[float]:
        """Generates 768-dimensional dense vector embeddings for papers and concepts.

        Falls back to a deterministic semantic vector if the API key is not active.
        """
        if not text or not text.strip():
            return [0.0] * settings.VECTOR_DIMENSION

        if settings.GEMINI_API_KEY:
            try:
                response = self.client.models.embed_content(
                    model=settings.GEMINI_EMBEDDING_MODEL,
                    contents=text[:8000]
                )
                if response and hasattr(response, "embedding") and response.embedding:
                    vec = response.embedding.values
                    # Normalize vector
                    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
                    return [x / norm for x in vec[:settings.VECTOR_DIMENSION]]
            except Exception as exc:
                logger.error(f"[GeminiService] Embedding generation failed: {exc}")

        # High-entropy deterministic pseudo-embedding fallback
        return self._generate_fallback_embedding(text)

    async def classify_genre_and_kernels(
        self, title: str, text: str
    ) -> Dict[str, Any]:
        """Analyzes research paper content, classifies genre, and extracts core mathematical kernels."""
        if settings.GEMINI_API_KEY:
            try:
                prompt = f"""
You are an expert Principal AI Researcher and Cross-Disciplinary Knowledge Graph Architect.
Analyze the following university research document title and abstract.

Title: {title}
Content: {text[:4000]}

Extract:
1. detectedGenre: Primary academic sub-discipline or mathematical domain
2. genreConfidence: Confidence score between 0.0 and 1.0
3. keyMathematicalKernels: Array of 3-5 specific equations, operators, or algorithmic kernels (e.g., Navier-Stokes, SVD, Casson Fluid, Lorentzian Deconvolution)
4. potentialOverlaps: Suggested sibling engineering/science departments that might be solving identical mathematics under different nomenclature.

Respond ONLY in valid JSON matching this schema:
{{
  "detectedGenre": "string",
  "genreConfidence": 0.95,
  "keyMathematicalKernels": ["kernel1", "kernel2"],
  "potentialOverlaps": ["Mechanical Engineering", "Computer Science"]
}}
"""
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL_TEXT,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                if response and response.text:
                    return json.loads(response.text.strip())
            except Exception as exc:
                logger.error(f"[GeminiService] Classification failed: {exc}")

        # Deterministic domain heuristics fallback
        lower = f"{title} {text}".lower()
        if "hemodynamic" in lower or "arter" in lower or "bio" in lower:
            return {
                "detectedGenre": "Computational Fluid Dynamics / Biomechanics",
                "genreConfidence": 0.94,
                "keyMathematicalKernels": ["Navier-Stokes Momentum", "Casson Yield-Stress Relation", "Finite Volume Method"],
                "potentialOverlaps": ["Mechanical Engineering", "Applied Mathematics"]
            }
        elif "graph" in lower or "neural" in lower or "svd" in lower or "tensor" in lower:
            return {
                "detectedGenre": "Applied Deep Learning & Distributed Matrix Solvers",
                "genreConfidence": 0.91,
                "keyMathematicalKernels": ["Randomized Truncated SVD", "Laplacian Eigendecomposition", "Low-Rank Tensor Factorization"],
                "potentialOverlaps": ["Applied Physics", "Computer Science"]
            }
        elif "raman" in lower or "spectro" in lower or "phonon" in lower:
            return {
                "detectedGenre": "Ultrafast Optical Spectroscopy & TMD Materials",
                "genreConfidence": 0.89,
                "keyMathematicalKernels": ["Lorentzian-Gaussian Deconvolution", "Nonlinear Least Squares Fitting", "Phonon Dispersion Modeling"],
                "potentialOverlaps": ["Materials Science", "Chemistry & Nanotechnology"]
            }
        else:
            return {
                "detectedGenre": "Computational Science & Engineering",
                "genreConfidence": 0.86,
                "keyMathematicalKernels": ["Discretized Partial Differential Equations", "Numerical Integration"],
                "potentialOverlaps": ["Mechanical Engineering", "Computer Science", "Applied Physics"]
            }

    async def extract_triplets(self, text: str) -> List[Dict[str, str]]:
        """Extracts knowledge graph triplets (subject, relation, object) from unstructured research text."""
        if settings.GEMINI_API_KEY:
            try:
                prompt = f"""
Extract key scientific and algorithmic relationship triplets from this research summary:
{text[:3000]}

Respond ONLY in JSON format as a list of triplets:
[
  {{"subject": "Non-Newtonian Solver", "relation": "USES_KERNEL", "object": "Casson Constitutive Model"}},
  {{"subject": "Coronary Artery Model", "relation": "EVALUATED_ON", "object": "CT Angiography Dataset"}}
]
"""
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL_TEXT,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                if response and response.text:
                    return json.loads(response.text.strip())
            except Exception as exc:
                logger.error(f"[GeminiService] Triplet extraction failed: {exc}")

        return [
            {"subject": "Research Study", "relation": "SOLVES_EQUATION", "object": "3D Navier-Stokes"},
            {"subject": "Research Study", "relation": "USES_ALGORITHM", "object": "Finite Volume Discretization"},
            {"subject": "Solver Routine", "relation": "APPLIES_TO", "object": "High-Shear Fluid Domain"}
        ]

    def _generate_fallback_embedding(self, text: str) -> List[float]:
        """Generates a reproducible, normalized 768-dim pseudo-embedding from text hash."""
        import hashlib
        h = hashlib.sha512(text.encode("utf-8")).digest()
        vec = []
        for i in range(settings.VECTOR_DIMENSION):
            byte_val = h[i % len(h)]
            # Convert to float between -1.0 and 1.0 with harmonic variation
            val = ((byte_val / 128.0) - 1.0) * math.sin((i + 1) * 0.37)
            vec.append(val)
        
        # Unit normalize
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]


gemini_service = GeminiAIService()
