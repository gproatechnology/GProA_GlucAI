# SEC-CRIT-004: HTTPS Redirect - Plan Arquitectónico

**Estado:** Planificación Completa - Listo para Implementación  
**Fecha:** 2026-03-02  
**Tarea:** Forzar HTTPS en producción

---

## 1. Estrategia Propuesta

### Enfoque: FastAPI HTTPSRedirectMiddleware + Headers de Seguridad

**Decisiones Clave:**
- Usar `HTTPSRedirectMiddleware` de FastAPI (nativo, probado)
- Activar SOLO en producción (`ENVIRONMENT=production`)
- No afectar desarrollo local (`ENVIRONMENT=development`)
- Agregar headers HSTS para prevención de downgrade
- Configurar cookies `secure=True` en producción

---

## 2. Implementación en FastAPI

### 2.1 Middleware HTTPS (main.py)

```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# En producción: forzar HTTPS
if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
    
    # Headers HSTS (HTTP Strict Transport Security)
    @app.middleware("http")
    async def add_hsts_header(request: Request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
```

### 2.2 Configuración (config.py)

```python
# Ya existe ENVIRONMENT, se usa para condicionar middleware
ENVIRONMENT: str = "development"  # development | production
```

### 2.3 Cookies Seguras (endpoints auth.py)

```python
# Cuando se implementen cookies para refresh tokens:
response.set_cookie(
    key="refresh_token",
    value=refresh_token,
    httponly=True,
    secure=settings.ENVIRONMENT == "production",  # Solo HTTPS en prod
    samesite="lax"
)
```

---

## 3. Manejo: Desarrollo vs Producción

| Entorno | HTTPS Redirect | HSTS | Secure Cookies |
|---------|----------------|------|----------------|
| **Development** | ❌ No | ❌ No | ❌ No |
| **Production** | ✅ Sí | ✅ Sí | ✅ Sí |

**Detección:** Variable `ENVIRONMENT` en `.env`

```bash
# .env.development
ENVIRONMENT=development

# .env.production
ENVIRONMENT=production
```

---

## 4. Interacción con Proxies (nginx/traefik)

### 4.1 Configuración nginx

```nginx
server {
    listen 80;
    server_name gecrai.com;
    
    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gecrai.com;
    
    # Headers para backend
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
    
    location / {
        proxy_pass http://backend:8000;
    }
}
```

### 4.2 Configuración Traefik

```yaml
# docker-compose.yml labels
traefik.http.routers.backend.rule=Host(`gecrai.com`)
traefik.http.routers.backend.tls=true
traefik.http.routers.backend.tls.certresolver=letsencrypt

# Middleware: redirect HTTP to HTTPS
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
```

### 4.3 Importante: X-Forwarded-Proto

FastAPI HTTPSRedirectMiddleware respeta `X-Forwarded-Proto`:
- Si `X-Forwarded-Proto: https` → no redirige
- Si `X-Forwarded-Proto: http` → redirige a HTTPS

Esto permite que el proxy (nginx/traefik) maneje SSL y el backend detecte HTTPS vía header.

---

## 5. Impacto en Tests

### Tests a Modificar/Crear

| Test | Descripción | Estado |
|------|-------------|--------|
| `test_no_redirect_in_development` | Verificar que no hay redirect en dev | Nuevo |
| `test_redirect_in_production` | Verificar 308 redirect en prod | Nuevo |
| `test_hsts_header_in_production` | Verificar HSTS header | Nuevo |
| `test_no_hsts_in_development` | Verificar sin HSTS en dev | Nuevo |
| `test_cookies_secure_in_production` | Verificar secure=True en cookies | Futuro (cuando haya cookies) |

### Estrategia de Testing

```python
# tests/test_https.py
from fastapi.testclient import TestClient

class TestHTTPSRedirect:
    def test_no_redirect_when_development(self, client):
        """No redirect in development mode."""
        with patch('app.main.settings.ENVIRONMENT', 'development'):
            response = client.get("/health", headers={"X-Forwarded-Proto": "http"})
            assert response.status_code == 200  # No redirect
    
    def test_redirect_when_production_http(self, client):
        """Redirect 308 in production with HTTP."""
        with patch('app.main.settings.ENVIRONMENT', 'production'):
            response = client.get("/health", headers={"X-Forwarded-Proto": "http"})
            assert response.status_code == 308
            assert "https" in response.headers["Location"]
    
    def test_no_redirect_when_production_https(self, client):
        """No redirect when X-Forwarded-Proto is https."""
        with patch('app.main.settings.ENVIRONMENT', 'production'):
            response = client.get("/health", headers={"X-Forwarded-Proto": "https"})
            assert response.status_code == 200
```

---

## 6. Estrategia de Rollback

### Rollback Rápido (sin downtime)

```bash
# Opción 1: Cambiar variable de entorno (inmediato)
ENVIRONMENT=development  # Desactiva HTTPS redirect

# Opción 2: Revertir código
git checkout HEAD~1 -- backend/app/main.py
docker-compose restart backend
```

### Rollback de Emergencia

```bash
# Si hay loops de redirect o problemas graves
# 1. Desactivar middleware inmediatamente
# 2. Restart del contenedor
docker-compose exec backend bash
cd /app
# Editar main.py para remover middleware
docker-compose restart backend
```

---

## 7. Riesgos Identificados

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| **Loops de redirect** | Alto | Verificar `X-Forwarded-Proto` correctamente configurado en proxy |
| **Bloqueo desarrollo local** | Medio | Condicionar estrictamente a `ENVIRONMENT=production` |
| **Tests fallan en CI** | Medio | Configurar CI para simular entorno de producción correctamente |
| **HSTS bloquea rollback** | Medio | HSTS max-age=31536000 (1 año), usar `includeSubDomains` con precaución |
| **Cookies no funcionan** | Bajo | Verificar `secure=True` solo en HTTPS |

### Precauciones HSTS

HSTS una vez activado es difícil de desactivar:
- Navegadores recuerdan el header por `max-age` segundos
- Usar `max-age=31536000` (1 año) es estándar pero permanente
- Para testing: usar `max-age=300` (5 minutos) inicialmente

---

## 8. Checklist Pre-Implementación

- [ ] Verificar `ENVIRONMENT` variable configurada en producción
- [ ] Configurar proxy (nginx/traefik) con `X-Forwarded-Proto`
- [ ] Certificados SSL válidos configurados
- [ ] Tests de HTTPS escritos
- [ ] Plan de rollback documentado
- [ ] Monitoreo de errores 308/redirect loops configurado

---

## 9. Archivos a Modificar

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `backend/app/main.py` | ~50 | Agregar HTTPSRedirectMiddleware condicional |
| `backend/app/main.py` | ~70 | Agregar HSTS header middleware |
| `backend/tests/test_https.py` | Nuevo | Tests de HTTPS redirect |
| `backend/.env.example` | +1 | Documentar ENVIRONMENT |

---

## 10. Estimación

- **Story Points:** 3
- **Tiempo Estimado:** 4-6 horas
- **Complejidad:** Media (interacción con infraestructura/proxy)

---

## 11. Dependencias

- **SEC-CRIT-003:** Rate limiting (DONE) - para mantener orden de FASE 0
- **Infraestructura:** Proxy (nginx/traefik) configurado con SSL

---

**Plan Aprobado Para:** SEC-CRIT-004 HTTPS Redirect  
**Próximo Paso:** Implementación tras aprobación
