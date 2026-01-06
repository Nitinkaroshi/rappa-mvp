"""
Rate Limiting Configuration for Rappa.AI

Implements API rate limiting to prevent abuse and ensure fair usage.
Uses slowapi (Flask-Limiter port for FastAPI).
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute", "1000/hour"],  # Global default limits
    storage_uri="redis://192.168.155.5:6379/1",  # Use Redis for distributed rate limiting
    strategy="fixed-window",  # or "moving-window" for more accurate limiting
    headers_enabled=True,  # Add rate limit headers to responses
)

# Rate limit configurations for different endpoint types
RATE_LIMITS = {
    # Authentication endpoints (stricter limits to prevent brute force)
    "auth_login": "5/minute",
    "auth_signup": "3/minute",
    "auth_password_reset": "3/hour",
    "auth_verify_email": "10/hour",
    
    # Upload endpoints (moderate limits)
    "upload_document": "10/minute",
    "upload_batch": "5/minute",
    
    # Processing endpoints (moderate limits)
    "processing_submit": "20/minute",
    "processing_status": "60/minute",
    "processing_results": "60/minute",
    
    # Export endpoints (higher limits)
    "export_csv": "30/minute",
    "export_json": "30/minute",
    "export_excel": "30/minute",
    "export_pdf": "20/minute",
    
    # Fields management (higher limits)
    "fields_get": "100/minute",
    "fields_update": "50/minute",
    "fields_batch_update": "20/minute",
    
    # Custom fields (moderate limits)
    "custom_fields_create": "50/minute",
    "custom_fields_update": "50/minute",
    "custom_fields_delete": "50/minute",
    
    # Templates (higher limits for viewing, lower for creation)
    "templates_list": "100/minute",
    "templates_create": "10/minute",
    "templates_update": "20/minute",
    "templates_delete": "10/minute",
    
    # Dashboard (high limits)
    "dashboard_stats": "60/minute",
    "dashboard_activity": "60/minute",
    
    # Support (moderate limits)
    "support_create_ticket": "5/minute",
    "support_list_tickets": "30/minute",
}

def get_rate_limit(endpoint_type: str) -> str:
    """Get rate limit for specific endpoint type"""
    return RATE_LIMITS.get(endpoint_type, "100/minute")

def setup_rate_limiting(app):
    """
    Setup rate limiting for FastAPI application
    
    Args:
        app: FastAPI application instance
    """
    # Add limiter to app state
    app.state.limiter = limiter
    
    # Add exception handler for rate limit exceeded
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    # Add middleware
    app.add_middleware(SlowAPIMiddleware)
    
    return limiter

# Custom error response for rate limit exceeded
def rate_limit_error_response(request, exc):
    """Custom error response for rate limit exceeded"""
    return {
        "error": "Rate limit exceeded",
        "message": f"Too many requests. Please try again later.",
        "retry_after": exc.retry_after if hasattr(exc, 'retry_after') else None,
        "limit": exc.limit if hasattr(exc, 'limit') else None,
    }
