"""
Role-Based Access Control (RBAC) Utilities
Task 107: Write Role-Based Access Control (RBAC) enforcer
Task 108: Define roles: Fan, Creator, Actor, Brand
"""

from typing import List, Optional, Set
from functools import wraps
from fastapi import Request, HTTPException, status
import logging

from config import settings

logger = logging.getLogger("bigstarz.auth")


class RBACEnforcer:
    """
    Role-Based Access Control Enforcer
    Task 107: Write Role-Based Access Control (RBAC) enforcer
    """
    
    def __init__(self):
        self.roles = settings.ROLES
        self.role_permissions = settings.ROLE_PERMISSIONS
    
    def get_user_permissions(self, role: str) -> Set[str]:
        """Get all permissions for a user role"""
        permissions = set(self.role_permissions.get(role, []))
        
        # If role has wildcard permission, add all permissions
        if "*" in permissions:
            all_permissions = set()
            for role_perms in self.role_permissions.values():
                all_permissions.update(role_perms)
            permissions = all_permissions
        
        return permissions
    
    def has_permission(self, role: str, permission: str) -> bool:
        """Check if a role has a specific permission"""
        permissions = self.get_user_permissions(role)
        return permission in permissions
    
    def has_any_permission(self, role: str, permissions: List[str]) -> bool:
        """Check if a role has any of the specified permissions"""
        user_permissions = self.get_user_permissions(role)
        return any(perm in user_permissions for perm in permissions)
    
    def has_all_permissions(self, role: str, permissions: List[str]) -> bool:
        """Check if a role has all of the specified permissions"""
        user_permissions = self.get_user_permissions(role)
        return all(perm in user_permissions for perm in permissions)


# Global RBAC enforcer instance
rbac_enforcer = RBACEnforcer()


def require_permission(permission: str):
    """
    Decorator to require a specific permission
    Task 107: Write Role-Based Access Control (RBAC) enforcer
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Get user from request
            user = getattr(request.state, "user", None)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )
            
            # Check permission
            if not rbac_enforcer.has_permission(user.role, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions",
                )
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_any_permission(*permissions: str):
    """
    Decorator to require any of the specified permissions
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            user = getattr(request.state, "user", None)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )
            
            if not rbac_enforcer.has_any_permission(user.role, list(permissions)):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions",
                )
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_all_permissions(*permissions: str):
    """
    Decorator to require all of the specified permissions
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            user = getattr(request.state, "user", None)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )
            
            if not rbac_enforcer.has_all_permissions(user.role, list(permissions)):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions",
                )
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_role(*roles: str):
    """
    Decorator to require a specific role
    Task 108: Define roles: Fan, Creator, Actor, Brand
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            user = getattr(request.state, "user", None)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )
            
            if user.role not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Role not authorized",
                )
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_admin():
    """
    Decorator to require admin role
    """
    return require_role("ADMIN")


# Export all
__all__ = [
    "RBACEnforcer",
    "rbac_enforcer",
    "require_permission",
    "require_any_permission",
    "require_all_permissions",
    "require_role",
    "require_admin",
]
