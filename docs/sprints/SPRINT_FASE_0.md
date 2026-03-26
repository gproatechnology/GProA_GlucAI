# Sprint: FASE 0 - Bloqueantes Producción

**Sprint Goal:** Sistema seguro para deployment inicial sin regresiones  
**Duración:** 1 Sprint (2 semanas)  
**Fecha Inicio:** 2026-03-02  
**Tech Lead:** Kilo Code

---

## 🎯 Objetivo del Sprint

Cerrar 4 tareas críticas de seguridad en orden específico, garantizando:
- ✅ No introducir regresiones
- ✅ Preservar arquitectura multi-tenant
- ✅ Mantener experiencia frontend
- ✅ No generar deuda técnica nueva

---

## ⚠️ ESTRATEGIA DE EJECUCIÓN

### Orden Obligatorio (Secuencial)

```
SEC-CRIT-001 → SEC-CRIT-002 → SEC-CRIT-003 → SEC-CRIT-004
```

### ¿Por qué este orden?

| Orden | Tarea | Riesgo de paralelo | Por qué va aquí |
|-------|-------|-------------------|-----------------|
| 1° | SEC-CRIT-001 | Bajo | Cambio simple en config, no afecta arquitectura |
| 2° | SEC-CRIT-002 | Bajo | Schema validation, independiente del resto |
| 3° | SEC-CRIT-003 | Medio | Nueva dependencia (slowapi), puede afectar tests |
| 4° | SEC-CRIT-004 | Alto | Afecta proxy/Docker/entornos, mejor al final |

---

## 📋 CHECKLIST DE SPRINT

### Pre-Sprint (Setup)
- [ ] Crear branch `feature/fase-0-security-hardening`
- [ ] Verificar CI/CD pipeline verde
- [ ] Backup de base de datos de staging
- [ ] Notificar al equipo de posibles downtime en staging

---

## TAREA 1: SEC-CRIT-001 — SECRET_KEY Obligatorio ✅

**Estado:** ✅ **COMPLETADO**  
**Story Points:** 3  
**Tiempo Estimado:** 4-6 horas  
**Responsable:** Backend Senior  
**Revisión Auditor:** APROBADO con observación menor no bloqueante  
**Fecha Cierre:** 2026-03-02

### Descripción
Eliminar valor por defecto de SECRET_KEY y hacerlo obligatorio via environment variable.

### Archivos a Modificar
```
backend/app/config.py          (Líneas 32-35)
backend/.env.example           (Línea 18)
backend/tests/conftest.py      (nuevo - setup para tests)
docker-compose.yml             (Líneas 44-45)
```

### Implementación Paso a Paso

#### Paso 1.1: Modificar config.py
```python
from pydantic import Field, ValidationError

# ANTES
SECRET_KEY: str = "your-secret-key-change-in-production"

# DESPUÉS
SECRET_KEY: str = Field(..., min_length=32, description="JWT signing key - generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'")
```

#### Paso 1.2: Actualizar .env.example
```bash
# ANTES
SECRET_KEY=your-secret-key-change-in-production

# DESPUÉS
# REQUIRED: Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=
```

#### Paso 1.3: Crear tests/conftest.py
```python
import os
import pytest

os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only-not-for-production"

@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Ensure SECRET_KEY is set for all tests"""
    assert os.environ.get("SECRET_KEY"), "SECRET_KEY must be set for tests"
```

#### Paso 1.4: Actualizar docker-compose.yml
```yaml
backend:
  environment:
    # ANTES
    - SECRET_KEY=your-secret-key-change-in-production
    
    # DESPUÉS - Usar .env file o secrets
  env_file:
    - backend/.env
```

### Criterios de Aceptación
- [ ] Aplicación falla al startup si `SECRET_KEY` no está definida
- [ ] Mensaje de error claro: "SECRET_KEY environment variable is required"
- [ ] Tests pasan con SECRET_KEY definida
- [ ] Tests fallan sin SECRET_KEY
- [ ] Documentación README actualizada con instrucciones
- [ ] Script de generación incluido: `scripts/generate-secret.sh`

### Definition of Done
- [ ] Code review aprobado
- [ ] Tests unitarios pasan
- [ ] Tests de integración pasan
- [ ] Deploy en staging exitoso
- [ ] Documentación actualizada

### Rollback Plan
```bash
git checkout HEAD~1 -- backend/app/config.py
git checkout HEAD~1 -- backend/.env.example
```

---

## TAREA 2: SEC-CRIT-002 — Password Validation ✅

**Estado:** ✅ **COMPLETADO**
**Fecha Cierre:** 2026-03-02  
**Story Points:** 5  
**Tiempo Estimado:** 6-8 horas  
**Responsable:** Backend Senior
**Dependencia:** SEC-CRIT-001 ✅

### Descripción
Implementar validación de complejidad de contraseñas en registro.

### Archivos a Modificar
```
backend/app/api/v1/endpoints/auth.py    (Líneas 28-33)
backend/app/schemas/                    (nuevo directorio)
├── __init__.py
└── auth.py                             (nuevo)
backend/tests/test_auth.py              (nuevo)
frontend/src/pages/Register.tsx         (Líneas 60-85)
```

### Implementación Paso a Paso

#### Paso 2.1: Crear schemas/auth.py
```python
# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field, validator
import re
from typing import Optional

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)
    organization_name: str = Field(..., min_length=1, max_length=255)
    
    @validator('password')
    def validate_password_strength(cls, v):
        errors = []
        
        if len(v) < 8:
            errors.append("at least 8 characters")
        if not re.search(r'[A-Z]', v):
            errors.append("one uppercase letter")
        if not re.search(r'[a-z]', v):
            errors.append("one lowercase letter")
        if not re.search(r'\d', v):
            errors.append("one digit")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            errors.append("one special character (!@#$%^&*(),.?\":{}|<>)"
        
        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")
        
        return v
    
    @validator('organization_name')
    def validate_org_name(cls, v):
        if not v.strip():
            raise ValueError("Organization name cannot be empty")
        if len(v.strip()) < 2:
            raise ValueError("Organization name must be at least 2 characters")
        return v.strip()
```

#### Paso 2.2: Actualizar endpoint auth.py
```python
# backend/app/api/v1/endpoints/auth.py

# ANTES
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    organization_name: str

# DESPUÉS
from app.schemas.auth import UserRegister

# Eliminar la clase UserRegister del archivo, ya está en schemas
```

#### Paso 2.3: Actualizar frontend Register.tsx
```typescript
// frontend/src/pages/Register.tsx

// Agregar validación en tiempo real
const validatePassword = (password: string): string | null => {
  const requirements = [
    { test: password.length >= 8, message: 'Mínimo 8 caracteres' },
    { test: /[A-Z]/.test(password), message: 'Una mayúscula' },
    { test: /[a-z]/.test(password), message: 'Una minúscula' },
    { test: /\d/.test(password), message: 'Un número' },
    { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), message: 'Un carácter especial' },
  ]
  
  const failed = requirements.filter(r => !r.test)
  return failed.length > 0 
    ? `Falta: ${failed.map(f => f.message).join(', ')}` 
    : null
}
```

#### Paso 2.4: Crear tests/test_auth.py
```python
import pytest
from app.schemas.auth import UserRegister

class TestPasswordValidation:
    def test_valid_password(self):
        data = {
            "email": "test@example.com",
            "password": "Valid1!pass",
            "organization_name": "Test Org"
        }
        user = UserRegister(**data)
        assert user.password == "Valid1!pass"
    
    def test_short_password_fails(self):
        data = {
            "email": "test@example.com",
            "password": "Short1!",
            "organization_name": "Test Org"
        }
        with pytest.raises(ValueError, match="at least 8 characters"):
            UserRegister(**data)
    
    def test_password_without_uppercase_fails(self):
        data = {
            "email": "test@example.com",
            "password": "valid1!pass",
            "organization_name": "Test Org"
        }
        with pytest.raises(ValueError, match="one uppercase letter"):
            UserRegister(**data)
    
    def test_password_without_special_char_fails(self):
        data = {
            "email": "test@example.com",
            "password": "Valid1pass",
            "organization_name": "Test Org"
        }
        with pytest.raises(ValueError, match="one special character"):
            UserRegister(**data)
```

### Criterios de Aceptación
- [x] Contraseñas < 8 caracteres rechazadas
- [x] Contraseñas sin mayúscula rechazadas
- [x] Contraseñas sin minúscula rechazadas
- [x] Contraseñas sin número rechazadas
- [x] Contraseñas sin especial rechazadas (regex: `[^\w\s]`)
- [x] Normalización segura: `v.strip()` aplicada
- [x] Mensaje de error genérico único (no revela reglas)

### Definition of Done
- [x] Todos los tests de password pasan (10 tests)
- [x] Normalización segura implementada
- [x] Code review aprobado
- [x] Sin regresiones en tests existentes

### Resumen Técnico
**Implementación:**
- Schema `UserRegister` en `backend/app/schemas/auth.py`
- Validación Pydantic v2 con `@field_validator`
- Regex especial: `[^\w\s]` (no palabra, no espacio)
- Normalización: `v.strip()` antes de validación
- Mensaje genérico: "Password does not meet security requirements"

**Archivos Modificados/Creados:**
- `backend/app/schemas/auth.py` (creado)
- `backend/app/schemas/__init__.py` (creado)
- `backend/app/api/v1/endpoints/auth.py` (modificado)
- `backend/tests/test_password_validation.py` (creado)
- `backend/tests/test_config.py` (modificado)

**Observaciones Menores:** Aceptadas (no bloqueantes)
- Frontend validación en tiempo real: Fase futura

### Rollback Plan
```bash
git checkout HEAD~1 -- backend/app/api/v1/endpoints/auth.py
rm -rf backend/app/schemas/
```

---

## TAREA 3: SEC-CRIT-003 — Rate Limiting ✅ **CLOSED**

**Estado:** ✅ **CLOSED** - Definitivo  
**Fecha Cierre:** 2026-03-02  
**Story Points:** 5  
**Tiempo Estimado:** 8-10 horas  
**Responsable:** Backend Senior  
**Dependencia:** SEC-CRIT-002 ✅

### Resumen de Implementación
✅ Rate limiting por IP únicamente (10/min login, 3/min register)  
✅ slowapi + Redis storage  
✅ Fail-closed en producción  
✅ TRUST_PROXY seguro (False por defecto)  

### Nota Importante
**Email-based rate limiting movido a FASE 1 (Hardening)**  
Razón: Complejidad técnica requiere diseño dedicado. La protección por IP es suficiente para FASE 0.

### Descripción
Implementar rate limiting por IP en endpoints de autenticación usando Redis.

### Archivos a Modificar
```
backend/requirements.txt                     (nueva dependencia)
backend/app/main.py                          (Líneas 38-50)
backend/app/core/rate_limit.py               (nuevo)
backend/app/api/v1/endpoints/auth.py         (decoradores)
backend/tests/test_rate_limit.py             (nuevo)
```

### Implementación Paso a Paso

#### Paso 3.1: Agregar dependencia
```bash
# backend/requirements.txt
slowapi==0.1.9
```

#### Paso 3.2: Crear core/rate_limit.py
```python
# backend/app/core/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse

limiter = Limiter(key_func=get_remote_address)

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests",
            "retry_after": exc.retry_after
        },
        headers={"Retry-After": str(exc.retry_after)}
    )

# Rate limits config
AUTH_LIMITS = {
    "login": "5/minute",
    "register": "3/minute",
    "password_reset": "3/hour"
}
```

#### Paso 3.3: Actualizar main.py
```python
# backend/app/main.py

from app.core.rate_limit import limiter, rate_limit_exceeded_handler

# Crear app
app = FastAPI(...)

# Agregar limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Resto del código...
```

#### Paso 3.4: Aplicar rate limits en auth.py
```python
# backend/app/api/v1/endpoints/auth.py

from app.core.rate_limit import limiter, AUTH_LIMITS

@router.post("/login")
@limiter.limit(AUTH_LIMITS["login"])
async def login(
    request: Request,  # slowapi requiere Request
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    ...

@router.post("/register", response_model=LoginResponse)
@limiter.limit(AUTH_LIMITS["register"])
async def register(
    request: Request,
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    ...
```

#### Paso 3.5: Actualizar docker-compose para Redis
```yaml
# docker-compose.yml ya tiene Redis, verificar que backend pueda conectarse
backend:
  environment:
    - REDIS_URL=redis://redis:6379/0
```

### Criterios de Aceptación
- [x] Máximo 10 logins/minuto por IP
- [x] Máximo 3 registros/minuto por IP
- [x] Verificación Redis en startup (fail-closed en producción)
- [x] TRUST_PROXY configuración segura (False por defecto)
- [x] Header `X-RateLimit-*` presente en respuestas
- [x] Status 429 retornado cuando se excede límite
- [x] Handler 429 preservando headers Retry-After

### Nota Técnica
**Simplificación aplicada:** Rate limiting por email (capa 2) se pospone a FASE 1 (Hardening) debido a complejidad técnica con extracción de email en decorators. La protección por IP (capa 1) es suficiente para FASE 0.

### Definition of Done
- [x] slowapi configurado con Redis storage
- [x] Decoradores aplicados en /login y /register
- [x] Fail-closed: Startup falla en producción sin Redis
- [x] TRUST_PROXY setting implementado
- [x] Tests de rate limiting creados
- [x] Sin regresiones en endpoints existentes

### Resumen Técnico
```
/login:   10/min por IP (slowapi decorator)
/register: 3/min por IP (slowapi decorator)
Storage:   Redis (único mecanismo)
IP Extract: TRUST_PROXY aware (default: False)
```

### Rollback Plan
```bash
git checkout HEAD~1 -- backend/requirements.txt
git checkout HEAD~1 -- backend/app/main.py
git checkout HEAD~1 -- backend/app/api/v1/endpoints/auth.py
rm backend/app/core/rate_limit.py
rm backend/tests/test_rate_limit.py
```

---

## TAREA 4: SEC-CRIT-004 — HTTPS/HSTS ✅ **CLOSED**

**Estado:** ✅ **CLOSED** - Definitivo  
**Fecha Cierre:** 2026-03-02  
**Story Points:** 3  
**Tiempo Estimado:** 4-6 horas  
**Responsable:** Backend + DevOps  
**Dependencia:** SEC-CRIT-003 ✅

### Descripción
Forzar redirección HTTPS en ambiente de producción.

### Archivos a Modificar
```
backend/app/main.py                          (Líneas 48-56)
backend/app/config.py                        (verificar ENVIRONMENT)
docker-compose.yml                           (verificar proxies)
backend/tests/test_https.py                  (nuevo)
```

### Implementación Paso a Paso

#### Paso 4.1: Agregar middleware HTTPS
```python
# backend/app/main.py

from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Después de crear app

# Trusted Hosts (protección adicional)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["gecrai.com", "*.gecrai.com", "localhost"]
)

# HTTPS Redirect (solo en producción)
if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

#### Paso 4.2: Asegurar cookies seguras
```python
# backend/app/api/v1/endpoints/auth.py

# En endpoint de login, cuando se implementen cookies:
response.set_cookie(
    key="refresh_token",
    value=refresh_token,
    httponly=True,
    secure=settings.ENVIRONMENT == "production",  # Solo HTTPS en prod
    samesite="lax",
    max_age=7 * 24 * 60 * 60
)
```

#### Paso 4.3: Headers HSTS
```python
# backend/app/main.py

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    if settings.ENVIRONMENT == "production":
        # HSTS - HTTP Strict Transport Security
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response
```

#### Paso 4.4: Verificar configuración proxy/Docker
```yaml
# docker-compose.yml
# Si hay reverse proxy (nginx/traefik), verificar headers X-Forwarded-Proto

backend:
  environment:
    - ENVIRONMENT=production
  # Asegurar que FastAPI confíe en proxies
```

### Nota de Arquitectura
**Redirect HTTP→HTTPS:** Ocurre EXCLUSIVAMENTE en el proxy (nginx/traefik).  
**Backend (FastAPI):** Solo agrega HSTS headers para prevención de downgrade.  
**Razón:** Evita redirect loops y complejidad de ProxyHeadersMiddleware.

### Criterios de Aceptación
- [x] HSTS header presente en producción (max-age=31536000; includeSubDomains)
- [x] HSTS header ausente en desarrollo
- [x] Sin HTTPSRedirectMiddleware en backend (redirect solo en proxy)
- [x] Documentación clara de arquitectura proxy-only

### Definition of Done
- [x] Tests HSTS pasan en producción simulada
- [x] Tests HSTS ausente en desarrollo
- [x] Middleware HSTS implementado en main.py
- [x] Tests validan ausencia de HTTPSRedirectMiddleware

### Resumen Técnico
```
Proxy (nginx/traefik): HTTP:80 → HTTPS:443 redirect
Backend (FastAPI):     HSTS header (production only)
                       Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Rollback Plan
```bash
git checkout HEAD~1 -- backend/app/main.py
rm backend/tests/test_https.py
```

---

## 🧪 PLAN DE TESTING DEL SPRINT

### Tests Unitarios
- [ ] `test_config_secret_key_required`
- [ ] `test_password_validation_rules`
- [ ] `test_rate_limit_headers_present`
- [ ] `test_rate_limit_429_returned`

### Tests de Integración
- [ ] `test_register_with_weak_password_fails`
- [ ] `test_login_rate_limit_blocks_after_5_attempts`
- [ ] `test_https_redirect_in_production`
- [ ] `test_no_https_redirect_in_development`

### Tests E2E
- [ ] Frontend muestra error de contraseña débil
- [ ] Usuario bloqueado después de 5 intentos fallidos
- [ ] Cookie secure flag en producción

---

## 📊 MÉTRICAS DEL SPRINT

| Métrica | Inicio | Objetivo |
|---------|--------|----------|
| Security Score | 6/10 | 8/10 |
| Critical Vulnerabilities | 4 | 0 |
| High Vulnerabilities | 3 | 3 (sin cambio) |
| Test Coverage | 0% | 20% |
| Deploy Frequency | N/A | Weekly |

---

## 🚨 RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| SEC-CRIT-003 rompe tests existentes | Media | Alto | Ejecutar tests antes y después |
| SEC-CRIT-004 afecta local dev | Media | Medio | Condicional solo en production |
| Redis no disponible en tests | Baja | Alto | Mock de rate limiting en tests |
| Frontend no maneja 429 | Media | Medio | Agregar handler antes de backend |

---

## 📋 CHECKLIST FINAL DEL SPRINT

### Pre-Deploy Staging
- [ ] Todas las tareas completadas
- [ ] Code review aprobado para cada tarea
- [ ] Tests unitarios: 100% pasan
- [ ] Tests de integración: 100% pasan
- [ ] Tests e2e críticos: 100% pasan
- [ ] Pentest básico sin findings críticos

### Deploy Staging
- [ ] Deploy exitoso en staging
- [ ] Smoke tests pasan
- [ ] Rate limiting verificado con curl
- [ ] HTTPS redirect verificado (si ENV=production)
- [ ] Registro de usuario con contraseña fuerte funciona

### Pre-Deploy Producción
- [ ] Aprobación de Security Team
- [ ] SECRET_KEY configurado en producción
- [ ] Redis operativo en producción
- [ ] Certificados HTTPS válidos
- [ ] Rollback plan documentado y probado

### Post-Deploy Producción
- [ ] Monitoreo de errores por 24h
- [ ] Métricas de rate limiting revisadas
- [ ] Sin alertas de seguridad
- [ ] Documentación actualizada

---

## 📝 NOTAS PARA EL EQUIPO

### Comandos Útiles
```bash
# Generar SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Test rate limiting
for i in {1..6}; do curl -X POST http://localhost:8000/api/v1/auth/login; done

# Ver headers de seguridad
curl -I https://staging.gecrai.com/health

# Check HTTPS redirect
curl -I http://staging.gecrai.com/health  # Debe retornar 308
```

### Decisiones Técnicas Registradas
1. **Rate limiting storage:** Redis (no in-memory) para soportar múltiples workers
2. **Password requirements:** Basado en NIST 800-63B (no complejidad excesiva)
3. **HTTPS redirect:** Solo en producción para no afectar desarrollo local
4. **SECRET_KEY validation:** 32 chars mínimo para suficiente entropía

---

## 🔗 REFERENCIAS

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [SlowAPI Documentation](https://slowapi.readthedocs.io/)

---

## 🔒 AUDITORÍA FINAL DEL SPRINT

**Fecha Auditoría:** 2026-03-02  
**Auditor:** Claude Code  
**Reporte Completo:** [`AUDIT_FASE_0_FINAL.md`](../../AUDIT_FASE_0_FINAL.md)

### Resultado de Auditoría

| Control | Estado | Hallazgos | Acción |
|---------|--------|-----------|--------|
| SEC-CRIT-001 | ✅ CLOSED | Ninguno | N/A |
| SEC-CRIT-002 | ✅ CLOSED | Ninguno | N/A |
| SEC-CRIT-003 | ✅ CLOSED | Ninguno | N/A |
| SEC-CRIT-004 | ✅ CLOSED | Ninguno | N/A |

### Hallazgos de Calidad Corregidos

| Hallazgo | Severidad | Archivo | Estado |
|----------|-----------|---------|--------|
| uuid import inline | MEDIUM | [`auth.py`](../../backend/app/api/v1/endpoints/auth.py:1) | ✅ Corregido |
| Líneas vacías residuales | MINOR | [`main.py`](../../backend/app/main.py:42) | ✅ Corregido |
| SECRET_KEY test corto | MEDIUM | [`conftest.py`](../../backend/tests/conftest.py:6) | ✅ Corregido |

### Estadísticas de Tests

```
Total Tests:     20/20 passing ✅
Coverage Crítico: 100%
Tests Unitarios:  20 (password, config, rate limit, https)
Tests Integración: 0 (planificado FASE 1)
```

### Aprobación para Staging

**Estado:** ✅ **APROBADO PARA STAGING**  
**Calificación:** 8.5/10  
**Condiciones:** Configurar SECRET_KEY y Redis en environment de staging

---

**Sprint Status:** ✅ **COMPLETADO**  
**Last Updated:** 2026-03-02  
**Next Review:** Deploy a staging
