# GECRAI 1.2 - Guía de Testing Local
## FASE 0: Validación Completa de Controles de Seguridad

**Objetivo:** Probar localmente todos los controles implementados en FASE 0 antes de deploy a staging.

**Tiempo Estimado:** 30-45 minutos

---

## 🚀 PREPARACIÓN RÁPIDA (5 min)

### 1. Iniciar Servicios

```bash
# Desde la raíz del proyecto (GECRAI_1.2/)
cd GECRAI_1.2

# Iniciar todos los servicios
docker-compose up -d

# Verificar que están corriendo
docker-compose ps

# Debe mostrar:
# gecrai-db        Up
# gecrai-redis     Up  
# gecrai-backend   Up
# gecrai-frontend  Up
```

### 2. Verificar Health

```bash
# Backend Live check (Simple)
curl http://localhost:8000/api/v1/health/live

# Backend Ready check (Dependencias)
curl -s http://localhost:8000/api/v1/health/ready | jq

# Detailed Health Check (Latencias Redis/DB)
curl -s http://localhost:8000/api/v1/health/detailed | jq
```

---

## ✅ TEST 1: SECRET_KEY Validation (3 min)

### Propósito
Verificar que la aplicación rechaza SECRET_KEYs débiles o ausentes.

### Comandos

```bash
# Test 1.1: Backend funciona con SECRET_KEY válido
docker-compose logs backend --tail=20
# Debe mostrar: "Starting GECRAI 1.2 Backend..." sin errores

# Test 1.2: Simular SECRET_KEY faltante (NO ejecutar en producción)
# Este test es solo para verificar la validación en desarrollo:
docker-compose exec backend bash -c "unset SECRET_KEY && python -c 'from app.config import settings; print(settings.SECRET_KEY)'"
# Esto fallaría en producción - validación Pydantic requiere el campo
```

### Validación Manual

```bash
# Verificar longitud del SECRET_KEY actual
docker-compose exec backend python -c '
from app.config import settings
import os
key = settings.SECRET_KEY
print(f"SECRET_KEY length: {len(key)} chars")
source = "env" if os.environ.get("SECRET_KEY") else "default"
print(f"SECRET_KEY source: {source}")
assert len(key) >= 32, "SECRET_KEY too short!"
print("✅ SECRET_KEY validation passed")
'
```

**✅ PASS:** SECRET_KEY tiene 32+ caracteres

---

## ✅ TEST 2: Password Validation (5 min)

### Propósito
Verificar que el sistema rechaza contraseñas débiles y acepta fuertes.

### Comandos de Prueba

```bash
# Test 2.1: Contraseña demasiado corta (< 8 chars)
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@local.com","password":"Short1!","full_name":"Test","organization_name":"Test"}' \
  | jq

# Esperado: 400 Bad Request
# {"detail":[{"loc":["body","password"],"msg":"Password does not meet security requirements"}]}
```

```bash
# Test 2.2: Sin mayúsculas
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@local.com","password":"lowercase1!","full_name":"Test","organization_name":"Test"}' \
  | jq

# Esperado: 400 Bad Request
```

```bash
# Test 2.3: Sin minúsculas
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test3@local.com","password":"UPPERCASE1!","full_name":"Test","organization_name":"Test"}' \
  | jq

# Esperado: 400 Bad Request
```

```bash
# Test 2.4: Sin números
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test4@local.com","password":"NoNumbers!","full_name":"Test","organization_name":"Test"}' \
  | jq

# Esperado: 400 Bad Request
```

```bash
# Test 2.5: Sin caracteres especiales
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test5@local.com","password":"NoSpecials1","full_name":"Test","organization_name":"Test"}' \
  | jq

# Esperado: 400 Bad Request
```

```bash
# Test 2.6: Contraseña válida (debe funcionar)
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"validuser@local.com","password":"StrongP@ss123","full_name":"Valid User","organization_name":"Valid Org"}' \
  | jq

# Esperado: 201 Created
# {"access_token":"...","refresh_token":"...","user":{"id":"...",...}}
```

### Script Automatizado

```bash
# Ejecutar todos los tests de password
#!/bin/bash
echo "Testing Password Validation..."

# Guardar resultados
RESULTS=""

# Test corta
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"t1@local.com","password":"Short1!","full_name":"Test","organization_name":"Test"}')
[ "$RESP" = "400" ] && echo "✅ Short password rejected" || echo "❌ Short password NOT rejected"

# Test sin mayúsculas
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"t2@local.com","password":"lowercase1!","full_name":"Test","organization_name":"Test"}')
[ "$RESP" = "400" ] && echo "✅ No uppercase rejected" || echo "❌ No uppercase NOT rejected"

# Test sin minúsculas  
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"t3@local.com","password":"UPPERCASE1!","full_name":"Test","organization_name":"Test"}')
[ "$RESP" = "400" ] && echo "✅ No lowercase rejected" || echo "❌ No lowercase NOT rejected"

# Test sin números
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"t4@local.com","password":"NoNumbers!","full_name":"Test","organization_name":"Test"}')
[ "$RESP" = "400" ] && echo "✅ No digits rejected" || echo "❌ No digits NOT rejected"

# Test sin especiales
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"t5@local.com","password":"NoSpecials1","full_name":"Test","organization_name":"Test"}')
[ "$RESP" = "400" ] && echo "✅ No special rejected" || echo "❌ No special NOT rejected"

# Test válida
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"valid$(date +%s)@local.com","password":"StrongP@ss123","full_name":"Test","organization_name":"Test"}')
[ "$RESP" = "201" ] && echo "✅ Valid password accepted" || echo "❌ Valid password NOT accepted"

echo "Password validation tests complete!"
```

**✅ PASS:** Todos los tests de contraseña responden correctamente

---

## ✅ TEST 3: Rate Limiting (10 min)

### Propósito
Verificar que rate limiting funciona correctamente en /login, /register y /refresh.

### Test 3.1: Rate Limit en /login (10 intentos/minuto)

```bash
# Limpiar redis primero (para test limpio)
docker-compose exec redis redis-cli FLUSHALL

echo "Testing /login rate limit (10/min)..."
for i in {1..15}; do
    RESP=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST http://localhost:8000/api/v1/auth/login \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=nonexistent@local.com&password=wrong")
    echo "Request $i: HTTP $RESP"
done

# Esperado:
# Requests 1-10: 401 (Unauthorized)
# Requests 11+: 429 (Too Many Requests)
```

### Test 3.2: Verificar Headers de Rate Limit

```bash
# Primer request (debe tener headers)
curl -I -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@local.com&password=wrong" 2>&1 | grep -i "rate\|retry"

# Debe mostrar headers como:
# X-RateLimit-Limit: 10
# X-RateLimit-Remaining: 9
# X-RateLimit-Reset: 1234567890
```

### Test 3.3: Rate Limit en /register (3/minuto)

```bash
# Limpiar redis
docker-compose exec redis redis-cli FLUSHALL

echo "Testing /register rate limit (3/min)..."
for i in {1..5}; do
    RESP=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST http://localhost:8000/api/v1/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"rltest$i@local.com\",\"password\":\"StrongP@ss123\",\"full_name\":\"Test\",\"organization_name\":\"Test$i\"}")
    echo "Request $i: HTTP $RESP"
done

# Esperado:
# Requests 1-3: 201 (Created)
# Requests 4+: 429 (Too Many Requests)
```

### Test 3.4: Rate Limit en /refresh (20/minuto)

```bash
# Primero hacer login para obtener refresh token
LOGIN_RESP=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=validuser@local.com&password=StrongP@ss123")
REFRESH_TOKEN=$(echo $LOGIN_RESP | jq -r '.refresh_token')

# Limpiar redis
docker-compose exec redis redis-cli FLUSHALL

# Test rate limit en refresh
echo "Testing /refresh rate limit (20/min)..."
for i in {1..25}; do
    RESP=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "http://localhost:8000/api/v1/auth/refresh?refresh_token=$REFRESH_TOKEN")
    if [ $i -eq 1 ] || [ $i -eq 21 ] || [ $i -eq 25 ]; then
        echo "Request $i: HTTP $RESP"
    fi
done

# Esperado:
# Requests 1-20: 200 (OK)
# Requests 21+: 429 (Too Many Requests)
```

### Test 3.5: Verificar Redis Storage

```bash
# Verificar que Redis tiene las claves de rate limiting
docker-compose exec redis redis-cli KEYS "*"

# Debe mostrar claves como:
# 1) "LIMITER/127.0.0.1/login/10/1"
# 2) "LIMITER/127.0.0.1/register/3/1"

# Verificar TTL de las claves
docker-compose exec redis redis-cli TTL "LIMITER/127.0.0.1/login/10/1"
# Debe retornar número positivo (segundos restantes)
```

**✅ PASS:** Rate limiting devuelve 429 después del límite y usa Redis

---

## ✅ TEST 4: HSTS Headers (5 min)

### Propósito
Verificar que HSTS headers se envían correctamente (o no) según el entorno.

### Test 4.1: HSTS en Desarrollo (local)

```bash
# En desarrollo, NO debe haber HSTS
curl -I http://localhost:8000/health | grep -i "strict-transport"

# Esperado: NADA (no debe mostrar nada)
# ✅ PASS si no hay output
```

### Test 4.2: Simular Producción (test temporal)

```bash
# Para testear HSTS, necesitamos simular ENVIRONMENT=production
# Esto requiere reiniciar el backend con variable modificada:

# 1. Detener backend
docker-compose stop backend

# 2. Iniciar con ENVIRONMENT=production
docker-compose run --rm -e ENVIRONMENT=production -p 8000:8000 backend \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# 3. Verificar HSTS
curl -I http://localhost:8000/health | grep -i "strict-transport"

# Esperado:
# strict-transport-security: max-age=31536000; includeSubDomains

# 4. Restaurar backend normal
docker-compose stop backend
docker-compose up -d backend
```

**✅ PASS:** HSTS presente solo en production

---

## ✅ TEST 5: JWT Token Validation (5 min)

### Propósito
Verificar que tokens JWT funcionan correctamente.

### Comandos

```bash
# 1. Login exitoso
LOGIN_RESP=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=validuser@local.com&password=StrongP@ss123")

ACCESS_TOKEN=$(echo $LOGIN_RESP | jq -r '.access_token')
REFRESH_TOKEN=$(echo $LOGIN_RESP | jq -r '.refresh_token')

echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."

# 2. Acceder a endpoint protegido /me
ME_RESP=$(curl -s http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "User Info: $ME_RESP"

# Esperado: {"id":"...","email":"validuser@local.com",...}

# 3. Refrescar token
REFRESH_RESP=$(curl -s -X POST "http://localhost:8000/api/v1/auth/refresh?refresh_token=$REFRESH_TOKEN")

echo "New tokens: $REFRESH_RESP"

# 4. Token inválido debe fallar
curl -s http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token_here"

# Esperado: 401 Unauthorized

# 5. Probar JWT Blacklist en Logout
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 6. Intentar usar el token tras el logout completo
curl -s http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Esperado: 401 Unauthorized (Token is blacklisted)
```

**✅ PASS:** Tokens válidos funcionan, inválidos y revocados son rechazados

---

## ✅ TEST 6: Paginación Consistente (5 min)

### Propósito
Verificar el formato estructurado de las respuestas paginadas.

```bash
# Verificar endpoint de proyectos paginado
curl -s http://localhost:8000/api/v1/projects?page=1&page_size=5 \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# Esperado: Estructura conteniendo items, total, page, page_size, total_pages, has_next, has_prev
```

---

## ✅ TEST 7: Redis Cache Latencia (5 min)

### Propósito
Asegurar que cálculos repetitivos se sirven desde memoria usando Redis Cache.

```bash
# Primer cálculo (Va a la DB / Lógica pesada, demora más tiempo)
time curl -s -X POST http://localhost:8000/api/v1/calculations/voltage-drop \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conductor_material":"copper","conductor_size":"1/0 AWG","length":100,"current":150,"power_factor":0.9,"voltage":480,"phases":3}' > /dev/null

# Segundo cálculo (Idéntico, debe servirse desde Redis, demora <10ms tipicamente)
time curl -s -X POST http://localhost:8000/api/v1/calculations/voltage-drop \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conductor_material":"copper","conductor_size":"1/0 AWG","length":100,"current":150,"power_factor":0.9,"voltage":480,"phases":3}' > /dev/null
```

---

## ✅ TEST 8: Exportación PDF Memoria de Cálculo (3 min)

### Propósito
Verificar la capacidad del servidor de ensamblar y enviar un binario PDF usando ReportLab.

```bash
# Se requiere el ID de un proyecto existente
PROJECT_ID="tu-project-id-aqui"

# Realizar GET a la ruta de reporte
curl -i -X GET http://localhost:8000/api/v1/projects/$PROJECT_ID/report \
  -H "Authorization: Bearer $ACCESS_TOKEN" --output memoria.pdf

# Esperado: HTTP 200, Content-Type: application/pdf, Content-Disposition: attachment
```

---

### Test 6.1: Database

```bash
# Verificar conexión PostgreSQL
docker-compose exec db psql -U postgres -d gecrai -c "SELECT count(*) FROM users;"

# Debe retornar número de usuarios (sin error)
```

### Test 6.2: Redis

```bash
# Verificar Redis funciona
docker-compose exec redis redis-cli ping
# Debe retornar: PONG

# Verificar rate limiting usa Redis
docker-compose exec redis redis-cli INFO keyspace
# Debe mostrar cantidad de keys
```

### Test 6.3: Logs de Backend

```bash
# Verificar logs sin errores de conexión
docker-compose logs backend --tail=50 | grep -i "error\|critical\|failed"

# Debe estar vacío o solo mostrar logs esperados
```

**✅ PASS:** Sin errores de conectividad

---

## 📊 TEST SUITE COMPLETO (Automatizado)

### Script de Testing Completo

Guardar como `test_fase0_local.sh`:

```bash
#!/bin/bash
set -e

echo "=========================================="
echo "GECRAI 1.2 - FASE 0 Local Testing Suite"
echo "=========================================="
echo ""

BASE_URL="http://localhost:8000"
PASS=0
FAIL=0

test_pass() {
    echo "✅ $1"
    ((PASS++))
}

test_fail() {
    echo "❌ $1"
    ((FAIL++))
}

# Health Check
echo "1. Health Check..."
RESP=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
[ "$RESP" = "200" ] && test_pass "Health endpoint" || test_fail "Health endpoint"

# Password Validation
echo ""
echo "2. Password Validation..."
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"t1@local.com","password":"weak","full_name":"Test","organization_name":"Test"}')
[ "$RESP" = "400" ] && test_pass "Reject weak password" || test_fail "Reject weak password"

TIMESTAMP=$(date +%s)
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"valid$TIMESTAMP@local.com\",\"password\":\"StrongP@ss123\",\"full_name\":\"Test\",\"organization_name\":\"Test\"}")
[ "$RESP" = "201" ] && test_pass "Accept strong password" || test_fail "Accept strong password"

# Rate Limiting
echo ""
echo "3. Rate Limiting..."
docker-compose exec -T redis redis-cli FLUSHALL > /dev/null 2>&1
sleep 1

# Test login rate limit
for i in {1..12}; do
    RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/v1/auth/login \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "username=test@local.com&password=wrong")
    if [ $i -eq 11 ]; then
        [ "$RESP" = "429" ] && test_pass "Login rate limit (request 11)" || test_fail "Login rate limit (request 11)"
    fi
done

# HSTS (local should NOT have it)
echo ""
echo "4. HSTS Headers..."
HSTS=$(curl -I -s $BASE_URL/health | grep -i "strict-transport" || true)
[ -z "$HSTS" ] && test_pass "No HSTS in development" || test_fail "No HSTS in development"

# Database connectivity
echo ""
echo "5. Database Connectivity..."
DB_RESP=$(docker-compose exec -T db psql -U postgres -d gecrai -c "SELECT 1;" 2>/dev/null | grep -c "1")
[ "$DB_RESP" -eq 1 ] && test_pass "Database connection" || test_fail "Database connection"

# Redis connectivity
echo ""
echo "6. Redis Connectivity..."
REDIS_RESP=$(docker-compose exec -T redis redis-cli ping 2>/dev/null)
[ "$REDIS_RESP" = "PONG" ] && test_pass "Redis connection" || test_fail "Redis connection"

# Summary
echo ""
echo "=========================================="
echo "RESULTS: $PASS passed, $FAIL failed"
echo "=========================================="

[ $FAIL -eq 0 ] && exit 0 || exit 1
```

### Ejecutar Script

```bash
chmod +x test_fase0_local.sh
./test_fase0_local.sh
```

---

## 🔧 COMANDOS ÚTILES PARA DEBUG

### Ver Logs en Tiempo Real

```bash
# Backend
docker-compose logs -f backend

# Database
docker-compose logs -f db

# Redis
docker-compose logs -f redis
```

### Limpiar Datos para Tests Limpios

```bash
# Limpiar Redis (rate limits)
docker-compose exec redis redis-cli FLUSHALL

# Reiniciar base de datos (⚠️ PIERDE DATOS)
docker-compose down -v
docker-compose up -d

# O solo recrear schema
# docker-compose exec backend python -c "from app.db.session import init_db; import asyncio; asyncio.run(init_db())"
```

### Acceder a Contenedores

```bash
# Backend shell
docker-compose exec backend bash

# PostgreSQL
docker-compose exec db psql -U postgres -d gecrai

# Redis CLI
docker-compose exec redis redis-cli
```

### Ver Variables de Entorno

```bash
# Ver config actual del backend
docker-compose exec backend python -c "
from app.config import settings
import json
print(json.dumps({
    'ENVIRONMENT': settings.ENVIRONMENT,
    'DEBUG': settings.DEBUG,
    'SECRET_KEY_LENGTH': len(settings.SECRET_KEY),
    'CORS_ORIGINS': settings.CORS_ORIGINS,
    'REDIS_URL': settings.REDIS_URL
}, indent=2))
"
```

---

## 🎯 CHECKLIST FINAL

Antes de declarar listo para staging:

- [ ] Health check responde 200
- [ ] Password validation rechaza contraseñas débiles
- [ ] Password validation acepta contraseñas fuertes
- [ ] Rate limiting en /login funciona (10/min)
- [ ] Rate limiting en /register funciona (3/min)
- [ ] Rate limiting en /refresh funciona (20/min)
- [ ] Redis almacena rate limits
- [ ] HSTS NO presente en desarrollo
- [ ] JWT tokens funcionan
- [ ] Database conecta sin errores
- [ ] Redis conecta sin errores
- [ ] Sin errores críticos en logs

---

## 🚀 SIGUIENTE PASO

Una vez pasados todos los tests localmente:

1. Revisar [`STAGING_DEPLOYMENT_PLAN.md`](../deployment/STAGING_DEPLOYMENT_PLAN.md)
2. Preparar `.env.staging` con valores reales
3. Ejecutar deploy a staging
4. Seguir validación post-deploy en staging

**NO proceder a staging si hay tests fallando localmente.**
