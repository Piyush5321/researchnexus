"""Test suite for Google Gemini AI Service integration, fallback vectors, and triplet extraction."""

import pytest
from backend.app.core.config import settings
from backend.app.services.gemini_service import gemini_service


class TestGeminiAIService:
    """Validates vector embedding dimension, fallback entropy, and NLP extraction."""

    @pytest.mark.asyncio
    async def test_generate_embedding_dimension(self):
        """Verifies vector embeddings match the required 768 dimensions and are unit normalized."""
        sample_text = "Navier-Stokes non-Newtonian Casson yield stress fluid dynamics model."
        vector = await gemini_service.generate_embedding(sample_text)

        assert isinstance(vector, list)
        assert len(vector) == settings.VECTOR_DIMENSION
        # Check normalization: sum of squares should equal ~1.0
        norm_squared = sum(x * x for x in vector)
        assert abs(norm_squared - 1.0) < 0.05

    @pytest.mark.asyncio
    async def test_generate_embedding_empty_text(self):
        """Verifies empty string returns zero-filled vector safely."""
        vector = await gemini_service.generate_embedding("")
        assert len(vector) == settings.VECTOR_DIMENSION
        assert all(x == 0.0 for x in vector)

    @pytest.mark.asyncio
    async def test_classify_genre_and_kernels(self):
        """Verifies document classification extracts valid genre, confidence, and mathematical kernels."""
        title = "Hemodynamic Wall Shear Stress in Coronary Bifurcations"
        abstract = "We model non-Newtonian blood rheology using Casson constitutive equations and solve via Finite Volume Method."

        result = await gemini_service.classify_genre_and_kernels(title, abstract)

        assert "detectedGenre" in result
        assert "genreConfidence" in result
        assert "keyMathematicalKernels" in result
        assert isinstance(result["keyMathematicalKernels"], list)
        assert len(result["keyMathematicalKernels"]) > 0
        assert result["genreConfidence"] >= 0.70

    @pytest.mark.asyncio
    async def test_extract_triplets(self):
        """Verifies scientific triplet extraction produces valid subject-relation-object mappings."""
        text = "The non-Newtonian solver uses the Casson constitutive model to simulate coronary arteries."
        triplets = await gemini_service.extract_triplets(text)

        assert isinstance(triplets, list)
        assert len(triplets) > 0
        for t in triplets:
            assert "subject" in t
            assert "relation" in t
            assert "object" in t
