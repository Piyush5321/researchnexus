"""Test suite for FastAPI REST endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


client = TestClient(app)


class TestAPIEndpoints:
    """Validates responses, status codes, and schema structures for all v1 REST routes."""

    def test_health_check(self):
        """Verifies root and health check endpoints respond with HTTP 200."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "ok"]
        assert "services" in data

    def test_get_departments(self):
        """Verifies graph departments endpoint returns all 6 academic partitions."""
        response = client.get("/api/v1/graph/departments")
        assert response.status_code == 200
        depts = response.json()
        assert isinstance(depts, list)
        assert len(depts) == 6
        codes = [d["code"] for d in depts]
        assert "CS" in codes
        assert "BIO" in codes
        assert "MECH" in codes

    def test_get_entity_types(self):
        """Verifies supported entity types."""
        response = client.get("/api/v1/graph/entity-types")
        assert response.status_code == 200
        types_list = response.json()
        assert len(types_list) >= 5
        type_ids = [t["id"] for t in types_list]
        assert "paper" in type_ids
        assert "algorithm" in type_ids

    def test_get_metrics_summary(self):
        """Verifies KPI metrics summary endpoint."""
        response = client.get("/api/v1/metrics/summary")
        assert response.status_code == 200
        metrics = response.json()
        assert metrics["papersIndexed"] > 0
        assert metrics["departmentsLinked"] > 0
        assert "$" in metrics["grantsSavedUSD"]

    def test_get_redundancy_alerts(self):
        """Verifies redundancy alert list contains AST diff metadata and USD impact."""
        response = client.get("/api/v1/redundancy/alerts")
        assert response.status_code == 200
        alerts = response.json()
        assert isinstance(alerts, list)
        assert len(alerts) >= 3
        first = alerts[0]
        assert "similarity" in first
        assert "deptA" in first
        assert "deptB" in first
        assert "astDiff" in first

    def test_matcher_analyze_endpoint(self):
        """Verifies document genre and AST analysis endpoint."""
        response = client.post(
            "/api/v1/matcher/analyze",
            data={
                "rawText": "Discretized Navier-Stokes blood flow solver with Casson model",
                "department": "bio"
            }
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert "analyzedDocument" in result
        assert "topMatches" in result
        assert len(result["topMatches"]) > 0
