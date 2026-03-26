"""
GECRAI 1.2 - Rate Limiting Tests
"""
import pytest
import time
from unittest.mock import patch, MagicMock

from app.core.rate_limit import get_client_ip, RateLimitConfig


class TestRateLimitConfiguration:
    """Tests for rate limiting configuration."""

    def test_rate_limit_config_values(self):
        """Test rate limit configuration values."""
        assert RateLimitConfig.LOGIN_IP == "10/minute"
        assert RateLimitConfig.REGISTER_IP == "3/minute"
        # Note: LOGIN_EMAIL removed for FASE 0, will be in FASE 1


class TestGetClientIp:
    """Tests for client IP extraction."""

    def test_get_client_ip_direct_connection(self):
        """Test IP extraction without proxy (direct connection)."""
        mock_request = MagicMock()
        mock_request.client.host = "192.168.1.1"
        mock_request.headers = {}

        # With TRUST_PROXY=False (default)
        with patch('app.core.rate_limit.settings.TRUST_PROXY', False):
            ip = get_client_ip(mock_request)
            assert ip == "192.168.1.1"

    def test_get_client_ip_with_trusted_proxy_x_forwarded_for(self):
        """Test IP extraction with X-Forwarded-For header."""
        mock_request = MagicMock()
        mock_request.client.host = "10.0.0.1"
        mock_request.headers = {
            "X-Forwarded-For": "203.0.113.1, 70.41.3.18, 150.172.238.178"
        }

        with patch('app.core.rate_limit.settings.TRUST_PROXY', True):
            ip = get_client_ip(mock_request)
            assert ip == "203.0.113.1"  # First IP is the client

    def test_get_client_ip_with_cf_connecting_ip(self):
        """Test IP extraction with CloudFlare header."""
        mock_request = MagicMock()
        mock_request.client.host = "10.0.0.1"
        mock_request.headers = {
            "CF-Connecting-IP": "198.51.100.1",
            "X-Forwarded-For": "203.0.113.1"
        }

        with patch('app.core.rate_limit.settings.TRUST_PROXY', True):
            ip = get_client_ip(mock_request)
            assert ip == "198.51.100.1"  # CloudFlare header takes priority

    def test_get_client_ip_with_x_real_ip(self):
        """Test IP extraction with X-Real-Ip header."""
        mock_request = MagicMock()
        mock_request.client.host = "10.0.0.1"
        mock_request.headers = {
            "X-Real-Ip": "192.0.2.1"
        }

        with patch('app.core.rate_limit.settings.TRUST_PROXY', True):
            ip = get_client_ip(mock_request)
            assert ip == "192.0.2.1"

    def test_get_client_ip_ignores_headers_when_trust_proxy_false(self):
        """Test that headers are ignored when TRUST_PROXY is False."""
        mock_request = MagicMock()
        mock_request.client.host = "192.168.1.1"
        mock_request.headers = {
            "X-Forwarded-For": "1.2.3.4"  # Should be ignored
        }

        with patch('app.core.rate_limit.settings.TRUST_PROXY', False):
            ip = get_client_ip(mock_request)
            assert ip == "192.168.1.1"  # Direct IP, not header


class TestRateLimitHeaders:
    """Tests for rate limit headers in responses."""

    def test_rate_limit_headers_present(self, client):
        """Test that rate limit headers are present in auth endpoints."""
        # This test would require a real Redis connection
        # For now, just verify the endpoint structure
        pass


class TestFailClosedBehavior:
    """Tests for fail-closed behavior when Redis is unavailable."""

    def test_startup_fails_when_redis_unavailable_in_production(self):
        """Test that startup fails in production when Redis is down."""
        # This would be tested in integration tests
        pass

    def test_startup_continues_when_redis_unavailable_in_development(self):
        """Test that startup continues in development when Redis is down."""
        # This would be tested in integration tests
        pass
