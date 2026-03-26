"""
GECRAI 1.2 - Authentication Baseline Tests (CODE-001)
Tests for registration, login flow, and auth validation.
"""
import pytest


VALID_USER = {
    "email": "test_user@gecrai.test",
    "password": "SecureP@ss1",
    "full_name": "Test User",
    "organization_name": "Test Org"
}

INVALID_USER_WEAK_PASSWORD = {
    "email": "test2@gecrai.test",
    "password": "weak",
    "full_name": "Test User 2",
    "organization_name": "Test Org 2"
}


@pytest.mark.asyncio
async def test_register_success(client):
    """User can register with valid data."""
    resp = await client.post("/api/v1/auth/register", json=VALID_USER)
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == VALID_USER["email"]


@pytest.mark.asyncio
async def test_register_weak_password_rejected(client):
    """Registration with weak password is rejected."""
    resp = await client.post("/api/v1/auth/register", json=INVALID_USER_WEAK_PASSWORD)
    assert resp.status_code == 422  # Pydantic validation error


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    """Registering with an existing email returns a clear error."""
    # First registration
    await client.post("/api/v1/auth/register", json=VALID_USER)
    # Duplicate
    resp = await client.post("/api/v1/auth/register", json=VALID_USER)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client):
    """Accessing /me without a token returns 401."""
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client):
    """Accessing /me with a valid token returns user data."""
    # Register and get token
    reg_resp = await client.post("/api/v1/auth/register", json={
        **VALID_USER,
        "email": "me_test@gecrai.test",
        "organization_name": "Me Test Org"
    })
    assert reg_resp.status_code == 201
    token = reg_resp.json()["access_token"]

    # Use token to access /me
    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "me_test@gecrai.test"
