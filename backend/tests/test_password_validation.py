"""
GECRAI 1.2 - Password Validation Tests
"""
import pytest
from pydantic import ValidationError
from app.schemas.auth import UserRegister


class TestPasswordValidation:
    """Tests for password strength validation."""

    def test_valid_password_accepted(self):
        """Test that strong passwords are accepted."""
        data = {
            "email": "test@example.com",
            "password": "Valid1!pass",
            "organization_name": "Test Org"
        }
        user = UserRegister(**data)
        assert user.password == "Valid1!pass"

    def test_password_without_uppercase_fails(self):
        """Test password without uppercase is rejected."""
        data = {
            "email": "test@example.com",
            "password": "valid1!pass",
            "organization_name": "Test Org"
        }
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(**data)
        assert "Password does not meet security requirements" in str(
            exc_info.value)

    def test_password_without_lowercase_fails(self):
        """Test password without lowercase is rejected."""
        data = {
            "email": "test@example.com",
            "password": "VALID1!PASS",
            "organization_name": "Test Org"
        }
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(**data)
        assert "Password does not meet security requirements" in str(
            exc_info.value)

    def test_password_without_digit_fails(self):
        """Test password without digit is rejected."""
        data = {
            "email": "test@example.com",
            "password": "Valid!pass",
            "organization_name": "Test Org"
        }
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(**data)
        assert "Password does not meet security requirements" in str(
            exc_info.value)

    def test_password_without_special_char_fails(self):
        """Test password without special character is rejected."""
        data = {
            "email": "test@example.com",
            "password": "Valid1pass",
            "organization_name": "Test Org"
        }
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(**data)
        assert "Password does not meet security requirements" in str(
            exc_info.value)

    def test_password_too_short_fails(self):
        """Test password shorter than 8 characters is rejected."""
        data = {
            "email": "test@example.com",
            "password": "Short1!",
            "organization_name": "Test Org"
        }
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(**data)
        # Pydantic's min_length validation triggers before custom validator
        assert "String should have at least 8 characters" in str(
            exc_info.value)

    def test_password_too_long_fails(self):
        """Test password longer than 128 characters is rejected."""
        data = {
            "email": "test@example.com",
            "password": "Valid1!" + "a" * 130,
            "organization_name": "Test Org"
        }
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(**data)
        assert "String should have at most 128 characters" in str(
            exc_info.value)

    def test_various_special_characters_accepted(self):
        """Test various special characters are accepted."""
        special_chars = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"]
        for char in special_chars:
            data = {
                "email": "test@example.com",
                "password": f"Valid1{char}pass",
                "organization_name": "Test Org"
            }
            user = UserRegister(**data)
            assert user.password == f"Valid1{char}pass"

    def test_generic_error_message_no_specific_rules(self):
        """Test that error message doesn't reveal specific validation rules."""
        data = {
            "email": "test@example.com",
            "password": "onlylowercase",
            "organization_name": "Test Org"
        }
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(**data)
        error_msg = str(exc_info.value)
        # In Pydantic v2, the error is likely in the 'input' or 'msg' parts.
        # We want to ensure our generic message IS present.
        assert "Password does not meet security requirements" in error_msg
        
        # To strictly check that sub-errors don't contain these words,
        # we can check if the validation error list has only our custom error.
        errors = exc_info.value.errors()
        for error in errors:
            msg = error.get('msg', '').lower()
            # If it's a value_error, it should be ours and NOT contain specific rules
            if error.get('type') == 'value_error':
                assert "Password does not meet security requirements" in error.get('msg')
                assert "uppercase" not in msg
                assert "lowercase" not in msg
                assert "digit" not in msg
                assert "special" not in msg
