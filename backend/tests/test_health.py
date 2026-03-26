"""
GECRAI 1.2 - Health Check Tests (ARCH-002)
Validates all health endpoints: basic, live, ready, and detailed.
"""
import pytest


@pytest.mark.asyncio
async def test_basic_health(client):
    """Basic health endpoint returns healthy status."""
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "version" in data


@pytest.mark.asyncio
async def test_liveness_probe(client):
    """Liveness probe confirms service is alive."""
    resp = await client.get("/api/v1/health/live")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "alive"
    assert data["service"] == "gecrai-backend"


@pytest.mark.asyncio
async def test_readiness_probe(client):
    """Readiness probe confirms DB is accessible."""
    resp = await client.get("/api/v1/health/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["database"] == "ok"


@pytest.mark.asyncio
async def test_detailed_health(client):
    """Detailed health check includes service statuses."""
    resp = await client.get("/api/v1/health/detailed")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "services" in data
    assert "database" in data["services"]
    # DB should be healthy in test environment
    assert data["services"]["database"]["status"] == "healthy"
    assert "latency_ms" in data["services"]["database"]
