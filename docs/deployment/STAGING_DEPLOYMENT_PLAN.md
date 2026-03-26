# GECRAI 1.2 - Staging Deployment Plan
## FASE 0: Security Foundation - Staging Validation

**Estado:** Pre-deployment  
**Fecha:** 2026-03-02  
**Responsable:** Tech Lead  
**Ambiente:** Staging  
**Duración Estimada:** 2-3 horas (deploy + validación inicial) + 48 horas (monitoreo)

---

## 🎯 OBJETIVO

Validar FASE 0 en ambiente de staging antes de cualquier trabajo de FASE 1. Este despliegue debe confirmar que:

1. ✅ Los 4 controles críticos funcionan correctamente en producción-simulado
2. ✅ No hay regresiones de funcionalidad existente
3. ✅ La arquitectura proxy-backend funciona sin loops
4. ✅ Rate limiting detecta IPs correctamente detrás del proxy
5. ✅ HSTS headers se envían solo en HTTPS real

**NO proceder a FASE 1 hasta que este plan pase todas las validaciones.**

---

## 📋 PRE-REQUISITOS

### Infraestructura Requerida

- [ ] Servidor staging provisionado (Ubuntu 22.04 LTS recomendado)
- [ ] Docker y Docker Compose instalados
- [ ] Reverse proxy configurado (nginx o traefik) con:
  - [ ] HTTPS con certificado válido
  - [ ] HTTP→HTTPS redirect
  - [ ] Headers X-Forwarded-For configurados
  - [ ] Upstream apuntando al backend container

### Archivos Necesarios

- [ ] `docker-compose.staging.yml` en servidor
- [ ] `.env.staging` configurado con valores reales
- [ ] Código actualizado (git pull origin main)

### Variables Críticas Verificadas

| Variable | Valor Requerido | Comando de Verificación |
|----------|-----------------|------------------------|
| `ENVIRONMENT` | `production` | `grep ENVIRONMENT .env.staging` |
| `DEBUG` | `false` | `grep DEBUG .env.staging` |
| `SECRET_KEY` | 32+ caracteres | `grep SECRET_KEY .env.staging \| wc -c` |
| `TRUST_PROXY` | `true` (si hay LB) | `grep TRUST_PROXY .env.staging` |
| `CORS_ORIGINS` | Dominio staging exacto | `grep CORS_ORIGINS .env.staging` |

---

## 🚀 FASE 1: DESPLIEGUE (Duración: 30 minutos)

### Paso 1.1: Preparación (5 min)

```bash
# 1. Conectar a servidor staging
ssh user@staging.gecrai.com

# 2. Ir al directorio del proyecto
cd /opt/gecrai-staging

# 3. Backup de datos existentes (si hay)
docker-compose -f docker-compose.staging.yml exec db pg_dump -U postgres gecrai_staging > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Pull del código actualizado
git pull origin main

# 5. Verificar permisos del .env.staging
chmod 600 .env.staging
ls -la .env.staging
# Debe mostrar: -rw------- 1 user user .env.staging
```

### Paso 1.2: Verificación Pre-Deploy (5 min)

```bash
# 1. Validar SECRET_KEY
grep SECRET_KEY .env.staging
# Debe mostrar: SECRET_KEY=valor_de_32_o_mas_caracteres
# NO debe estar vacío

# 2. Validar ENVIRONMENT
grep ENVIRONMENT .env.staging
# Debe mostrar: ENVIRONMENT=production

# 3. Validar DEBUG
grep DEBUG .env.staging
# Debe mostrar: DEBUG=false

# 4. Validar CORS_ORIGINS
grep CORS_ORIGINS .env.staging
# Debe mostrar: CORS_ORIGINS=["https://staging.gecrai.com"]
# NO debe tener wildcards (*)
```

### Paso 1.3: Deploy (10 min)

```bash
# 1. Detener servicios existentes (si hay)
docker-compose -f docker-compose.staging.yml down

# 2. Limpiar volúmenes antiguos (OPCIONAL - solo si es fresh deploy)
# docker-compose -f docker-compose.staging.yml down -v

# 3. Iniciar servicios
docker-compose -f docker-compose.staging.yml up -d

# 4. Verificar estado
watch docker-compose -f docker-compose.staging.yml ps
# Todos los servicios deben estar "Up" y "healthy"
```

### Paso 1.4: Verificación Post-Deploy Inmediata (10 min)

```bash
# 1. Verificar logs del backend
docker-compose -f docker-compose.staging.yml logs backend --tail=50

# Buscar:
# - "Starting GECRAI 1.2 Backend..."
# - "Database initialized"
# - "Redis connected for rate limiting"
# NO debe haber errores de "Redis not available"

# 2. Verificar health check
curl -s https://staging.gecrai.com/health | jq
# Debe retornar: {"status": "healthy", "version": "1.2.0", ...}

# 3. Verificar que el backend no expone puerto directamente
# (Solo debe ser accesible vía proxy HTTPS)
# Intentar desde servidor: curl http://localhost:8000/health
# Debe funcionar (interno)
# Desde fuera: curl http://staging.gecrai.com:8000/health
# Debe fallar (puerto no expuesto)
```

---

## ✅ FASE 2: VALIDACIÓN POST-DEPLOY (Duración: 1-2 horas)

### 2.1 Validación de HSTS y HTTPS (10 min)

```bash
# 1. Verificar HSTS header en HTTPS
curl -I -s https://staging.gecrai.com/health
# Debe mostrar:
# strict-transport-security: max-age=31536000; includeSubDomains

# 2. Verificar redirect HTTP→HTTPS
curl -I -s http://staging.gecrai.com/health
# Debe mostrar:
# HTTP/1.1 308 Permanent Redirect
# Location: https://staging.gecrai.com/health

# 3. Verificar que HSTS NO está en HTTP
curl -I -s http://staging.gecrai.com/health | grep -i strict
# NO debe mostrar nada (header solo en HTTPS)
```

**Criterio de Aceptación:**
- ✅ HSTS presente en HTTPS
- ✅ Redirect 308 de HTTP a HTTPS
- ✅ HSTS ausente en HTTP

### 2.2 Validación de Rate Limiting (20 min)

#### Test 2.2.1: Rate Limit en /login (10 min)

```bash
# Ejecutar 15 peticiones de login fallido rápidamente
for i in {1..15}; do
    echo "Request $i:"
    curl -s -o /dev/null -w "%{http_code}\n" \
         -X POST https://staging.gecrai.com/api/v1/auth/login \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "username=test@test.com&password=wrongpassword"
done
```

**Resultados Esperados:**
- Peticiones 1-10: `401 Unauthorized`
- Peticiones 11+: `429 Too Many Requests`

```bash
# Verificar headers de rate limit
curl -I -X POST https://staging.gecrai.com/api/v1/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=test@test.com&password=wrongpassword" 2>&1 | grep -i rate

# Debe mostrar headers X-RateLimit-*
```

#### Test 2.2.2: Rate Limit en /register (5 min)

```bash
# Ejecutar 5 peticiones de registro
for i in {1..5}; do
    echo "Request $i:"
    curl -s -o /dev/null -w "%{http_code}\n" \
         -X POST https://staging.gecrai.com/api/v1/auth/register \
         -H "Content-Type: application/json" \
         -d "{\"email\":\"test$i@test.com\",\"password\":\"StrongP@ss123\",\"full_name\":\"Test User\",\"organization_name\":\"Test Org $i\"}"
done
```

**Resultados Esperados:**
- Peticiones 1-3: `201 Created` (o `400` si email duplicado)
- Peticiones 4+: `429 Too Many Requests`

#### Test 2.2.3: Detección de IP Real (5 min)

```bash
# Verificar que el backend ve la IP real (no la del proxy)
# Esto requiere endpoint de debug temporal o revisar logs

# En logs del backend, buscar:
docker-compose -f docker-compose.staging.yml logs backend --tail=100 | grep "Client IP"

# La IP debe ser la IP pública del cliente, no 172.x.x.x o 127.0.0.1
```

**Criterio de Aceptación:**
- ✅ Rate limiting funciona (429 después de límite)
- ✅ Headers X-RateLimit presentes
- ✅ Backend detecta IP real del cliente

### 2.3 Validación de Password Validation (10 min)

```bash
# 1. Intentar registro con contraseña débil
curl -s -X POST https://staging.gecrai.com/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"weak@test.com","password":"123","full_name":"Test","organization_name":"Test"}' \
     | jq

# Debe retornar 400 con error de validación

# 2. Intentar registro con contraseña sin mayúsculas
curl -s -X POST https://staging.gecrai.com/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"weak2@test.com","password":"lowercase1!","full_name":"Test","organization_name":"Test"}' \
     | jq

# Debe retornar 400

# 3. Registro con contraseña fuerte
curl -s -X POST https://staging.gecrai.com/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"strong@test.com","password":"StrongP@ss123","full_name":"Test User","organization_name":"Strong Org"}' \
     | jq

# Debe retornar 201 con tokens
```

**Criterio de Aceptación:**
- ✅ Rechaza contraseñas < 8 caracteres
- ✅ Rechaza contraseñas sin mayúsculas
- ✅ Rechaza contraseñas sin minúsculas
- ✅ Rechaza contraseñas sin dígitos
- ✅ Rechaza contraseñas sin especiales
- ✅ Acepta contraseñas que cumplen todos los requisitos

### 2.4 Validación de SECRET_KEY (5 min)

```bash
# Verificar que JWT tokens son válidos
# 1. Login exitoso
RESPONSE=$(curl -s -X POST https://staging.gecrai.com/api/v1/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=strong@test.com&password=StrongP@ss123")

TOKEN=$(echo $RESPONSE | jq -r '.access_token')

# 2. Usar token para acceder a /me
curl -s https://staging.gecrai.com/api/v1/auth/me \
     -H "Authorization: Bearer $TOKEN" \
     | jq

# Debe retornar información del usuario
```

**Criterio de Aceptación:**
- ✅ Login exitoso genera tokens válidos
- ✅ Tokens funcionan para autenticación
- ✅ No hay errores de "Invalid signature"

### 2.5 Validación de No Redirect Loops (10 min)

```bash
# 1. Verificar que no hay loops entre HTTP y HTTPS
# Desde fuera del servidor:
curl -L -I -s --max-redirs 5 http://staging.gecrai.com/health 2>&1 | head -20

# Debe mostrar solo 1 redirect (308) a HTTPS
# NO debe mostrar múltiples redirects

# 2. Verificar tiempo de respuesta
time curl -s https://staging.gecrai.com/health

# Debe ser < 500ms (sin timeouts por loops)
```

**Criterio de Aceptación:**
- ✅ Solo 1 redirect (HTTP→HTTPS)
- ✅ No hay ciclos de redirect
- ✅ Tiempo de respuesta normal (< 500ms)

---

## 📊 FASE 3: MONITOREO DE 48 HORAS

### Métricas a Observar

#### 3.1 Métricas de Seguridad (Revisar cada 6 horas)

| Métrica | Comando/URL | Valor Esperado | Alerta si |
|---------|-------------|----------------|-----------|
| Rate Limit Triggers | `docker-compose logs backend \| grep "Rate limit" \| wc -l` | < 100/hora | > 500/hora |
| Failed Logins | `docker-compose logs backend \| grep "Incorrect email" \| wc -l` | < 50/hora | > 200/hora |
| 429 Responses | `docker-compose logs backend \| grep "429" \| wc -l` | Normal | Spike repentino |
| HSTS Present | `curl -I https://... \| grep HSTS` | Siempre | Ausente |

#### 3.2 Métricas de Rendimiento (Revisar cada 6 horas)

| Métrica | Comando | Valor Esperado | Alerta si |
|---------|---------|----------------|-----------|
| Response Time (p95) | `curl -w "%{time_total}"` | < 200ms | > 500ms |
| Database Connections | `docker-compose exec db psql -c "SELECT count(*) FROM pg_stat_activity;"` | < 50 | > 80 |
| Redis Memory | `docker-compose exec redis redis-cli INFO memory \| grep used_memory_human` | < 100MB | > 500MB |
| CPU Backend | `docker stats gecrai-staging-backend --no-stream` | < 50% | > 80% |

#### 3.3 Logs Críticos a Revisar (Cada 6 horas)

```bash
# Errores críticos
docker-compose -f docker-compose.staging.yml logs backend --since=6h | grep -i "error\|critical\|fatal"

# Debe estar VACÍO (no errores)

# Warnings de seguridad
docker-compose -f docker-compose.staging.yml logs backend --since=6h | grep -i "warning\|suspicious"

# Redis connection issues
docker-compose -f docker-compose.staging.yml logs backend --since=6h | grep -i "redis"

# Debe mostrar solo: "Redis connected for rate limiting"
# NO debe mostrar: "Redis connection failed"
```

### Checkpoints de Validación

#### Checkpoint 6 Horas (T+6h)
- [ ] Sin errores críticos en logs
- [ ] Rate limiting funcionando normalmente
- [ ] HSTS headers presentes
- [ ] Response times normales

#### Checkpoint 24 Horas (T+24h)
- [ ] Sin degradación de performance
- [ ] Sin acumulación de errores
- [ ] Rate limits respetados por atacantes potenciales
- [ ] Database connections estable

#### Checkpoint 48 Horas (T+48h) - FINAL
- [ ] Sistema estable por 48 horas
- [ ] Sin incidentes de seguridad
- [ ] Performance consistente
- [ ] Logs limpios

---

## 🚨 CONDICIONES DE ROLLBACK

**Rollback INMEDIATO si:**

1. 🔴 Backend no inicia (logs de error crítico)
2. 🔴 HTTP→HTTPS redirect causa loops (timeouts en todas las peticiones)
3. 🔴 Rate limiting bloquea TODAS las peticiones (incluyendo válidas)
4. 🔴 Database connection errors persistentes
5. 🔴 Redis errors persistentes
6. 🔴 Memory leaks (uso de memoria incrementa continuamente)

**Rollback si no se resuelve en 2 horas:**

1. 🟡 Performance degradada (> 1s response time)
2. 🟡 Errores 500 intermitentes
3. 🟡 Rate limiting muy agresivo (falsos positivos)

### Procedimiento de Rollback

```bash
# 1. Detener servicios
docker-compose -f docker-compose.staging.yml down

# 2. Restaurar backup de DB (si es necesario)
docker-compose -f docker-compose.staging.yml up -d db
cat backup_YYYYMMDD_HHMMSS.sql | docker-compose -f docker-compose.staging.yml exec -T db psql -U postgres

# 3. Revertir código (si es necesario)
git checkout <commit-anterior>

# 4. Iniciar versión anterior
docker-compose -f docker-compose.staging.yml up -d
```

---

## ✅ CHECKLIST FINAL DE APROBACIÓN

Antes de declarar FASE 0 completada en staging:

### Validaciones Técnicas
- [ ] HSTS headers presentes en HTTPS
- [ ] HTTP→HTTPS redirect funciona
- [ ] Rate limiting funciona correctamente
- [ ] Password validation funciona
- [ ] SECRET_KEY válido (tokens funcionan)
- [ ] No hay redirect loops
- [ ] IP real detectada correctamente

### Monitoreo 48h
- [ ] 0 errores críticos
- [ ] Response time estable
- [ ] Sin memory leaks
- [ ] Rate limiting comportamiento normal

### Documentación
- [ ] Logs de despliegue guardados
- [ ] Métricas de baseline registradas
- [ ] Problemas encontrados documentados
- [ ] Rollback plan validado

---

## 📝 DECISIÓN GO/NO-GO

**Fecha de Decisión:** ___________

**Stakeholders:** ___________

| Criterio | Estado | Comentarios |
|----------|--------|-------------|
| Validaciones técnicas pasan | ⬜ / ✅ | |
| 48h de monitoreo sin incidentes | ⬜ / ✅ | |
| Performance aceptable | ⬜ / ✅ | |
| Seguridad validada | ⬜ / ✅ | |

**Decisión:**
- [ ] **GO** - Aprobar FASE 0, proceder a FASE 1
- [ ] **NO-GO** - Requiere fixes antes de proceder

**Comentarios:**

---

**Documento Version:** 1.0  
**Last Updated:** 2026-03-02  
**Next Review:** Post-48h Monitoreo
