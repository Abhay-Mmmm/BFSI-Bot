# Security module for PRIMUM AI Sales Orchestration Platform
# Implements role-based access, PII masking, and secure data handling

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import re
import logging
from functools import wraps
from fastapi import HTTPException, status
import os


class SecurityManager:
    """Security Manager for PRIMUM platform"""
    
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY", secrets.token_hex(32))
        self.algorithm = os.getenv("ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
        
        # Configure logging
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        import bcrypt
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        import bcrypt
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create a JWT access token"""
        import jwt
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify a JWT token"""
        import jwt
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.JWTError:
            return None
    
    def mask_pii(self, text: str) -> str:
        """Mask PII (Personally Identifiable Information) in text"""
        # Mask email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        masked_text = re.sub(email_pattern, lambda m: self._mask_email(m.group()), text)
        
        # Mask phone numbers (various formats)
        phone_patterns = [
            r'\b\d{10}\b',  # 10 digit numbers
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # Common phone formats
            r'\+\d{1,3}\s?\d{3,4}\s?\d{3,4}\s?\d{3,4}\b'  # International formats
        ]
        
        for pattern in phone_patterns:
            masked_text = re.sub(pattern, self._mask_phone, masked_text)
        
        # Mask Aadhaar numbers (12 digit)
        aadhaar_pattern = r'\b\d{4}[ -.]\d{4}[ -.]\d{4}\b|\b\d{12}\b'
        masked_text = re.sub(aadhaar_pattern, self._mask_aadhaar, masked_text)
        
        # Mask PAN numbers (format: ABCDE1234F)
        pan_pattern = r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b'
        masked_text = re.sub(pan_pattern, self._mask_pan, masked_text)
        
        return masked_text
    
    def _mask_email(self, email: str) -> str:
        """Mask an email address"""
        local, domain = email.split('@')
        if len(local) > 2:
            masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
        else:
            masked_local = '*' * len(local)
        
        return f"{masked_local}@{domain}"
    
    def _mask_phone(self, phone: str) -> str:
        """Mask a phone number"""
        digits_only = re.sub(r'\D', '', phone)
        if len(digits_only) >= 4:
            visible_part = digits_only[-4:]
            masked_part = '*' * (len(digits_only) - 4)
            return masked_part + visible_part
        return '*' * len(phone)
    
    def _mask_aadhaar(self, aadhaar: str) -> str:
        """Mask an Aadhaar number"""
        digits_only = re.sub(r'\D', '', aadhaar)
        if len(digits_only) == 12:
            return '****' + digits_only[4:8] + '****'
        return '****' + '****' + '****'
    
    def _mask_pan(self, pan: str) -> str:
        """Mask a PAN number"""
        if len(pan) >= 5:
            return pan[:3] + '***' + pan[-2:]
        return '*' * len(pan)
    
    def log_activity(self, user_id: str, action: str, details: Dict[str, Any] = None) -> None:
        """Log user activity securely"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "action": action,
            "details": self.mask_pii(str(details)) if details else None,
            "ip_address": None,  # Would be filled in by middleware
        }
        
        # In a real system, this would go to a secure logging system
        self.logger.info(f"Activity Log: {log_entry}")
    
    def generate_api_key(self) -> str:
        """Generate a secure API key"""
        return secrets.token_urlsafe(32)
    
    def validate_api_key(self, provided_key: str) -> bool:
        """Validate an API key against stored keys"""
        # In a real system, this would validate against a database of stored keys
        # For demo purposes, we'll use an environment variable
        expected_key = os.getenv("DEMO_API_KEY", "demo-key-12345")
        return hmac.compare_digest(provided_key, expected_key)


class RoleManager:
    """Role-based access control manager"""
    
    def __init__(self):
        self.roles = {
            "admin": ["read", "write", "delete", "admin_access"],
            "loan_officer": ["read", "write"],
            "customer_service": ["read", "write_customer_data"],
            "customer": ["read_own_data"],
            "system": ["read_system_data", "write_internal"]
        }
    
    def user_has_permission(self, user_role: str, required_permission: str) -> bool:
        """Check if user has required permission"""
        if user_role in self.roles:
            return required_permission in self.roles[user_role]
        return False
    
    def get_role_permissions(self, user_role: str) -> List[str]:
        """Get all permissions for a user role"""
        return self.roles.get(user_role, [])
    
    def validate_user_role(self, user_role: str) -> bool:
        """Validate if a role exists"""
        return user_role in self.roles


# Decorator for role-based access control
def require_role(roles: list):
    """Decorator to require specific roles"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # This would be implemented in FastAPI route decorators
            # For now, just pass through
            return await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
        return wrapper
    return decorator


# Example usage
if __name__ == "__main__":
    import asyncio
    
    security_manager = SecurityManager()
    
    # Test PII masking
    test_text = "Contact John Doe at john.doe@example.com or call 9876543210. His Aadhaar is 1234 5678 9012 and PAN is ABCDE1234F."
    masked = security_manager.mask_pii(test_text)
    print("Original:", test_text)
    print("Masked:", masked)
    
    # Test role management
    role_manager = RoleManager()
    print("Admin permissions:", role_manager.get_role_permissions("admin"))
    print("Customer can read own data:", role_manager.user_has_permission("customer", "read_own_data"))