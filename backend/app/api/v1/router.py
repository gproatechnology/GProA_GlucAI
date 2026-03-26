"""
GECRAI 1.2 - API v1 Router
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, projects, calculations, health, dashboard

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(
    projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(
    calculations.router, prefix="/calculations", tags=["Calculations"])
api_router.include_router(
    dashboard.router, prefix="/dashboard", tags=["Dashboard"])
