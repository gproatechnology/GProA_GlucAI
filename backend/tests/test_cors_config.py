import pytest
from app.config import Settings

def test_cors_origins_parsing_plain_string():
    """Test parsing of a simple comma-separated string."""
    settings = Settings(
        SECRET_KEY="test-secret-key-at-least-32-chars-long-now-it-is",
        CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
    )
    assert settings.CORS_ORIGINS == ["http://localhost:3000", "http://localhost:5173"]

def test_cors_origins_parsing_json_list_string():
    """Test parsing of a JSON-like list string with brackets and quotes."""
    settings = Settings(
        SECRET_KEY="test-secret-key-at-least-32-chars-long-now-it-is",
        CORS_ORIGINS='["http://localhost:3000", "http://localhost:5173"]'
    )
    assert settings.CORS_ORIGINS == ["http://localhost:3000", "http://localhost:5173"]

def test_cors_origins_parsing_json_list_string_single_quotes():
    """Test parsing of a JSON-like list string with single quotes."""
    settings = Settings(
        SECRET_KEY="test-secret-key-at-least-32-chars-long-now-it-is",
        CORS_ORIGINS="['http://localhost:3000', 'http://localhost:5173']"
    )
    assert settings.CORS_ORIGINS == ["http://localhost:3000", "http://localhost:5173"]

def test_cors_origins_parsing_dirty_string():
    """Test parsing of a string with whitespace and trailing commas."""
    settings = Settings(
        SECRET_KEY="test-secret-key-at-least-32-chars-long-now-it-is",
        CORS_ORIGINS=" http://localhost:3000 , http://localhost:5173 , "
    )
    assert settings.CORS_ORIGINS == ["http://localhost:3000", "http://localhost:5173"]
