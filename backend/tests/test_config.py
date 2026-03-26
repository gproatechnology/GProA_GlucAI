"""
GECRAI 1.2 - Configuration Tests
"""
import os
import pytest


class TestSecretKeyConfiguration:
    """Tests for SECRET_KEY configuration."""

    def test_secret_key_loaded_from_env(self, test_secret_key):
        """Test that SECRET_KEY is loaded from environment."""
        assert test_secret_key is not None
        assert len(test_secret_key) >= 32

    def test_settings_require_secret_key(self):
        """Test that Settings fails without SECRET_KEY."""
        from pydantic import ValidationError
        from app.config import Settings
        
        # Test validation error by creating Settings with empty dict (or missing SECRET_KEY)
        # and bypassing .env loading for this specific test
        with pytest.raises(ValidationError):
            Settings(_env_file=None, SECRET_KEY=None)

    def test_secret_key_minimum_length(self, test_secret_key):
        """Test that SECRET_KEY meets minimum length requirement."""
        assert len(
            test_secret_key) >= 32, "SECRET_KEY must be at least 32 characters"

    def test_secret_key_not_default(self, test_secret_key):
        """Test that SECRET_KEY is not the default insecure value."""
        insecure_defaults = [
            "your-secret-key-change-in-production",
            "change-this-key",
            "secret",
            "123456",
            "",
        ]
        assert test_secret_key not in insecure_defaults, "SECRET_KEY cannot be a default/insecure value"
