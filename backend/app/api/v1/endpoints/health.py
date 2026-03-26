# Health Check Endpoints

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
import redis.asyncio as redis
import psutil
import os
import time
from typing import Dict, Any

from app.core.observability import HealthCheckMiddleware
from app.db.session import get_db

router = APIRouter()

@router.get("/live")
async def live():
    """Liveness probe - Verifica si la aplicación está corriendo"""
    return JSONResponse(
        content={"status": "live", "timestamp": time.time()},
        status_code=200
    )

@router.get("/ready")
async def ready(request: Request, db: AsyncSession = Depends(get_db)):
    """Readiness probe - Verifica si la aplicación está lista para recibir tráfico"""
    
    health_status = {
        "status": "ready",
        "timestamp": time.time(),
        "checks": {}
    }
    
    # Database check
    try:
        start_time = time.time()
        result = await db.execute(select(text("SELECT 1")))
        db_duration = time.time() - start_time
        
        health_status["checks"]["database"] = {
            "status": "healthy",
            "response_time": db_duration,
            "details": "Database connection successful"
        }
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "not_ready"
    
    # Redis check
    try:
        start_time = time.time()
        redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        result = await redis_client.ping()
        redis_duration = time.time() - start_time
        
        health_status["checks"]["redis"] = {
            "status": "healthy",
            "response_time": redis_duration,
            "details": "Redis connection successful"
        }
    except Exception as e:
        health_status["checks"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "not_ready"
    
    # Disk space check
    try:
        total, used, free = psutil.disk_usage("/")
        free_percentage = (free / total) * 100
        
        health_status["checks"]["disk_space"] = {
            "status": "healthy" if free_percentage > 10 else "warning",
            "total_gb": total / (1024 ** 3),
            "used_gb": used / (1024 ** 3),
            "free_gb": free / (1024 ** 3),
            "free_percentage": free_percentage
        }
        
        if free_percentage < 5:
            health_status["status"] = "not_ready"
    except Exception as e:
        health_status["checks"]["disk_space"] = {
            "status": "error",
            "error": str(e)
        }
        health_status["status"] = "not_ready"
    
    # CPU check
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        health_status["checks"]["cpu"] = {
            "status": "healthy" if cpu_percent < 90 else "warning",
            "usage_percent": cpu_percent
        }
        
        if cpu_percent > 95:
            health_status["status"] = "not_ready"
    except Exception as e:
        health_status["checks"]["cpu"] = {
            "status": "error",
            "error": str(e)
        }
        health_status["status"] = "not_ready"
    
    # Memory check
    try:
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        health_status["checks"]["memory"] = {
            "status": "healthy" if memory_percent < 85 else "warning",
            "usage_percent": memory_percent,
            "available_gb": memory.available / (1024 ** 3)
        }
        
        if memory_percent > 95:
            health_status["status"] = "not_ready"
    except Exception as e:
        health_status["checks"]["memory"] = {
            "status": "error",
            "error": str(e)
        }
        health_status["status"] = "not_ready"
    
    return JSONResponse(content=health_status, status_code=200)

@router.get("/ready/detailed")
async def ready_detailed(request: Request, db: AsyncSession = Depends(get_db)):
    """Readiness probe detallado con métricas adicionales"""
    
    health_status = {
        "status": "ready",
        "timestamp": time.time(),
        "system": {},
        "database": {},
        "redis": {},
        "performance": {}
    }
    
    # System information
    try:
        health_status["system"]["os"] = {
            "platform": os.name,
            "python_version": os.getenv("PYTHON_VERSION", "unknown"),
            "environment": os.getenv("ENVIRONMENT", "development"),
            "hostname": os.getenv("HOSTNAME", "unknown")
        }
        
        # Network interfaces
        health_status["system"]["network"] = {}
        interfaces = psutil.net_if_addrs()
        for interface, addrs in interfaces.items():
            health_status["system"]["network"][interface] = [
                {
                    "family": addr.family.name,
                    "address": addr.address,
                    "netmask": addr.netmask if addr.netmask else None,
                    "broadcast": addr.broadcast if addr.broadcast else None
                }
                for addr in addrs
            ]
    except Exception as e:
        health_status["system"]["error"] = str(e)
    
    # Database metrics
    try:
        start_time = time.time()
        result = await db.execute(select(text("SELECT 
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as recent_users
            FROM users")))
        db_duration = time.time() - start_time
        
        health_status["database"]["metrics"] = {
            "response_time": db_duration,
            "query_time": time.time(),
            "data": result.first()._asdict()
        }
    except Exception as e:
        health_status["database"]["error"] = str(e)
    
    # Redis metrics
    try:
        start_time = time.time()
        redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        info = await redis_client.info()
        redis_duration = time.time() - start_time
        
        health_status["redis"]["metrics"] = {
            "response_time": redis_duration,
            "memory_usage": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0)
        }
    except Exception as e:
        health_status["redis"]["error"] = str(e)
    
    # Performance metrics
    try:
        health_status["performance"]["cpu"] = {
            "cores": psutil.cpu_count(logical=True),
            "usage_percent": psutil.cpu_percent(interval=0.1),
            "per_cpu_usage": psutil.cpu_percent(percpu=True)
        }
        
        memory = psutil.virtual_memory()
        health_status["performance"]["memory"] = {
            "total_gb": memory.total / (1024 ** 3),
            "available_gb": memory.available / (1024 ** 3),
            "used_gb": memory.used / (1024 ** 3),
            "usage_percent": memory.percent
        }
        
        disk = psutil.disk_usage("/")
        health_status["performance"]["disk"] = {
            "total_gb": disk.total / (1024 ** 3),
            "used_gb": disk.used / (1024 ** 3),
            "free_gb": disk.free / (1024 ** 3),
            "usage_percent": disk.percent
        }
    except Exception as e:
        health_status["performance"]["error"] = str(e)
    
    return JSONResponse(content=health_status, status_code=200)

@router.get("/metrics")
async def metrics():
    """Endpoint para métricas de Prometheus"""
    from prometheus_client import generate_latest
    
    try:
        metrics = generate_latest()
        return Response(content=metrics, media_type="text/plain; version=0.0.4; charset=utf-8")
    except Exception as e:
        return JSONResponse(
            content={"error": "Failed to generate metrics", "message": str(e)},
            status_code=500
        )

@router.get("/healthz")
async def healthz():
    """Legacy health check endpoint"""
    return JSONResponse(
        content={"status": "ok", "timestamp": time.time()},
        status_code=200
    )

__all__ = ["router"]
