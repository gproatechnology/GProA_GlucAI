"""
GECRAI 1.2 - HTTPS/HSTS Tests
Tests for HSTS headers in production
"""
import pytest
from unittest.mock import patch


class TestHSTSHeaders:
    """Tests for HSTS header middleware."""

    def test_hsts_header_present_in_production(self, client):
        """Test that HSTS header is present in production environment."""
        with patch('app.main.settings.ENVIRONMENT', 'production'):
            response = client.get("/health")
            assert response.status_code == 200
            assert "Strict-Transport-Security" in response.headers
            hsts = response.headers["Strict-Transport-Security"]
            assert "max-age=31536000" in hsts
            assert "includeSubDomains" in hsts

    def test_hsts_header_absent_in_development(self, client):
        """Test that HSTS header is absent in development environment."""
        with patch('app.main.settings.ENVIRONMENT', 'development'):
            response = client.get("/health")
            assert response.status_code == 200
            assert "Strict-Transport-Security" not in response.headers

    def test_hsts_header_on_all_endpoints_production(self, client):
        """Test that HSTS header is present on all endpoints in production."""
        with patch('app.main.settings.ENVIRONMENT', 'production'):
            # Test health endpoint
            response = client.get("/health")
            assert "Strict-Transport-Security" in response.headers

            # Test root endpoint
            response = client.get("/")
            assert "Strict-Transport-Security" in response.headers

            # Test API endpoint (404 but should still have header)
            response = client.get("/api/v1/nonexistent")
            assert "Strict-Transport-Security" in response.headers

    def test_hsts_max_age_value(self, client):
        """Test that HSTS max-age is 1 year (31536000 seconds)."""
        with patch('app.main.settings.ENVIRONMENT', 'production'):
            response = client.get("/health")
            hsts = response.headers.get("Strict-Transport-Security", "")
            assert "max-age=31536000" in hsts

    def test_hsts_includes_subdomains(self, client):
        """Test that HSTS includes includeSubDomains directive."""
        with patch('app.main.settings.ENVIRONMENT', 'production'):
            response = client.get("/health")
            hsts = response.headers.get("Strict-Transport-Security", "")
            assert "includeSubDomains" in hsts


class TestHTTPSConfiguration:
    """Tests for HTTPS configuration documentation."""

    def test_no_https_redirect_middleware_in_backend(self):
        """
        Verify that HTTPSRedirectMiddleware is NOT used in backend.
        HTTPS redirect should be handled by the proxy (nginx/traefik).
        """
        from app import main

        # Check that HTTPSRedirectMiddleware is not imported or used
        import inspect
        source = inspect.getsource(main)

        # Should not contain HTTPSRedirectMiddleware
        assert "HTTPSRedirectMiddleware" not in source, \
            "HTTPSRedirectMiddleware should not be used - redirect is handled by proxy"

    def test_no_proxy_headers_middleware_in_backend(self):
        """
        Verify that ProxyHeadersMiddleware is NOT used in backend.
        This is intentional - proxy handles HTTPS, not backend.
        """
        from app import main
        import inspect
        source = inspect.getsource(main)

        # Should not contain ProxyHeadersMiddleware
        assert "ProxyHeadersMiddleware" not in source, \
            "ProxyHeadersMiddleware should not be used - redirect is handled by proxy"
