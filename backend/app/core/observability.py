# Observability and Monitoring Components

import time
import logging
from typing import Callable, Any, Dict, Optional
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.exporter.prometheus import PrometheusExporter
from prometheus_client import Summary, Counter, Histogram, Gauge
import redis

logger = logging.getLogger(__name__)

# Prometheus Metrics
REQUEST_DURATION = Summary(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint', 'status']
)
REQUEST_COUNT = Counter(
    'http_request_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)
ERROR_COUNT = Counter(
    'http_error_total',
    'Total HTTP errors',
    ['method', 'endpoint', 'status']
)
LATENCY_HISTOGRAM = Histogram(
    'http_request_latency_seconds',
    'HTTP request latency',
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0)
)
ACTIVE_REQUESTS = Gauge(
    'http_active_requests',
    'Number of active HTTP requests'
)

class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Middleware para observabilidad y monitoreo"""
    
    def __init__(self, app):
        super().__init__(app)
        self.tracer = trace.get_tracer(__name__)
        
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        ACTIVE_REQUESTS.inc()
        
        # Iniciar tracing
        span_name = f"{request.method} {request.url.path}"
        with self.tracer.start_as_current_span(span_name) as span:
            span.set_attribute("http.method", request.method)
            span.set_attribute("http.url", str(request.url))
            span.set_attribute("user_agent", request.headers.get("user-agent", "unknown"))
            
            try:
                response = await call_next(request)
                
                # Registrar métricas
                duration = time.time() - start_time
                status_code = response.status_code
                
                REQUEST_DURATION.observe(duration, request.method, request.url.path, str(status_code))
                REQUEST_COUNT.inc(1, request.method, request.url.path, str(status_code))
                LATENCY_HISTOGRAM.observe(duration)
                
                # Agregar atributos al span
                span.set_attribute("http.status_code", status_code)
                span.set_attribute("response.time", duration)
                
                if status_code >= 400:
                    ERROR_COUNT.inc(1, request.method, request.url.path, str(status_code))
                    span.set_attribute("error", True)
                    
                return response
                
            except Exception as e:
                duration = time.time() - start_time
                status_code = 500
                
                REQUEST_DURATION.observe(duration, request.method, request.url.path, str(status_code))
                ERROR_COUNT.inc(1, request.method, request.path, str(status_code))
                LATENCY_HISTOGRAM.observe(duration)
                
                # Agregar error al span
                span.set_attribute("error", True)
                span.set_attribute("error.message", str(e))
                
                raise
                
            finally:
                ACTIVE_REQUESTS.dec()

class HealthCheckMiddleware(BaseHTTPMiddleware):
    """Middleware para health checks"""
    
    def __init__(self, app, db_session, redis_client):
        super().__init__(app)
        self.db_session = db_session
        self.redis_client = redis_client
    
    async def dispatch(self, request: Request, call_next):
        if request.method == "GET" and request.url.path.startswith("/health"):
            # Health check endpoint
            start_time = time.time()
            
            health_status = {
                "status": "healthy",
                "timestamp": time.time(),
                "checks": {}
            }
            
            # Database check
            try:
                db_healthy = await self.check_database()
                health_status["checks"]["database"] = {
                    "status": "healthy" if db_healthy else "unhealthy",
                    "response_time": time.time() - start_time
                }
                if not db_healthy:
                    health_status["status"] = "degraded"
            except Exception as e:
                health_status["checks"]["database"] = {
                    "status": "error",
                    "error": str(e)
                }
                health_status["status"] = "unhealthy"
            
            # Redis check
            try:
                redis_healthy = await self.check_redis()
                health_status["checks"]["redis"] = {
                    "status": "healthy" if redis_healthy else "unhealthy",
                    "response_time": time.time() - start_time
                }
                if not redis_healthy:
                    health_status["status"] = "degraded"
            except Exception as e:
                health_status["checks"]["redis"] = {
                    "status": "error",
                    "error": str(e)
                }
                health_status["status"] = "unhealthy"
            
            # Disk space check
            try:
                disk_healthy = await self.check_disk_space()
                health_status["checks"]["disk_space"] = {
                    "status": "healthy" if disk_healthy else "warning",
                    "response_time": time.time() - start_time
                }
                if not disk_healthy:
                    health_status["status"] = "degraded"
            except Exception as e:
                health_status["checks"]["disk_space"] = {
                    "status": "error",
                    "error": str(e)
                }
                health_status["status"] = "unhealthy"
            
            # Latency check
            health_status["checks"]["latency"] = {
                "status": "healthy",
                "response_time": time.time() - start_time
            }
            
            return JSONResponse(content=health_status, status_code=200)
        
        return await call_next(request)
    
    async def check_database(self) -> bool:
        """Verificar conexión a la base de datos"""
        try:
            # Ejecutar una consulta simple
            result = await self.db_session.execute("SELECT 1")
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def check_redis(self) -> bool:
        """Verificar conexión a Redis"""
        try:
            # Ejecutar un comando simple
            result = await self.redis_client.ping()
            return result
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False
    
    async def check_disk_space(self) -> bool:
        """Verificar espacio en disco"""
        try:
            # Verificar espacio disponible (ejemplo para Linux, adaptar para Windows)
            import shutil
            total, used, free = shutil.disk_usage("/")
            free_percentage = (free / total) * 100
            return free_percentage > 10  # Más del 10% libre
        except Exception as e:
            logger.error(f"Disk space check failed: {e}")
            return False

class CacheManager:
    """Gestor de cache avanzado"""
    
    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.cache_ttl = 300  # 5 minutos por defecto
    
    async def get(self, key: str) -> Optional[Any]:
        """Obtener valor del cache"""
        try:
            value = await self.redis_client.get(key)
            if value:
                return value
            return None
        except Exception as e:
            logger.error(f"Error al obtener cache: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Guardar valor en cache"""
        try:
            if ttl is None:
                ttl = self.cache_ttl
            await self.redis_client.setex(key, ttl, value)
        except Exception as e:
            logger.error(f"Error al guardar cache: {e}")
    
    async def delete(self, key: str):
        """Eliminar valor del cache"""
        try:
            await self.redis_client.delete(key)
        except Exception as e:
            logger.error(f"Error al eliminar cache: {e}")
    
    async def invalidate_pattern(self, pattern: str):
        """Invalidar cache por patrón"""
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                await self.redis_client.delete(*keys)
        except Exception as e:
            logger.error(f"Error al invalidar cache por patrón: {e}")

# Configurar OpenTelemetry
def configure_observability():
    """Configurar observabilidad con OpenTelemetry"""
    
    # Configurar tracer provider
    provider = TracerProvider()
    trace.set_tracer_provider(provider)
    
    # Configurar exporter a Jaeger
    jaeger_exporter = JaegerExporter(
        agent_host_name="localhost",
        agent_port=6831,
    )
    
    # Configurar exporter a Prometheus
    prometheus_exporter = PrometheusExporter()
    
    # Agregar span processors
    provider.add_span_processor(BatchSpanProcessor(jaeger_exporter))
    provider.add_span_processor(BatchSpanProcessor(prometheus_exporter))
    
    logger.info("Observability configured with OpenTelemetry")

# Inicializar métricas de Prometheus
def init_prometheus_metrics():
    """Inicializar métricas de Prometheus"""
    from prometheus_client import multiprocess
    
    # Configurar collector para multiproceso
    multiprocess.MultiProcessCollector()
    
    logger.info("Prometheus metrics initialized")

__all__ = [
    "ObservabilityMiddleware",
    "HealthCheckMiddleware",
    "CacheManager",
    "configure_observability",
    "init_prometheus_metrics"
]