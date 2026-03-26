# GECRAI 1.2 - Guía de Setup para Windows
## FASE 0: Testing en Windows 10/11

**Problema:** Windows no reconoce `docker-compose`  
**Soluciones:** Usar `docker compose` o correr backend directamente sin Docker

---

## 🔧 OPCIÓN 1: Docker Compose (Recomendado)

### Paso 1: Verificar Docker Desktop

```powershell
# En PowerShell, verificar si Docker está instalado
docker --version

# Si muestra algo como "Docker version 24.0.0", está instalado
# Si da error, instalar Docker Desktop desde: https://www.docker.com/products/docker-desktop
```

### Paso 2: Usar Comando Correcto para Windows

En Windows moderno, el comando es `docker compose` (sin guión):

```powershell
# Desde la carpeta GECRAI_1.2
cd "C:\Users\X1\OneDrive\Documentos\Python_VS Code\GProA\GECRAI_1.2"

# Iniciar servicios (usar docker compose, no docker-compose)
docker compose up -d

# Verificar estado
docker compose ps

# Ver logs
docker compose logs backend
```

### Paso 3: Si Docker Compose No Funciona

```powershell
# Verificar si el plugin de compose está instalado
docker compose version

# Si da error, intentar:
docker-compose-v1 up -d

# O usar Docker Desktop GUI:
# 1. Abrir Docker Desktop
# 2. Ir a "Containers"
# 3. Click "Run" y seleccionar docker-compose.yml
```

---

## 🔧 OPCIÓN 2: Sin Docker (Backend Directo)

Si Docker no está disponible, puedes correr el backend directamente:

### Requisitos
- Python 3.11 instalado
- PostgreSQL instalado y corriendo
- Redis instalado y corriendo

### Paso 1: Instalar PostgreSQL en Windows

1. Descargar: https://www.postgresql.org/download/windows/
2. Instalar con contraseña para usuario `postgres`
3. Crear base de datos `gecrai`:

```powershell
# Usar psql (incluido en PostgreSQL)
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE gecrai;"
```

### Paso 2: Instalar Redis en Windows

Opción A - Usar Memurai (Redis para Windows):
```powershell
# Descargar e instalar desde https://www.memurai.com/
# O usar Chocolatey:
choco install memurai
```

Opción B - Usar Redis via Docker solo para Redis:
```powershell
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

Opción C - Descargar Redis nativo:
```powershell
# Descargar desde https://github.com/tporadowski/redis/releases
# Extraer y correr redis-server.exe
```

### Paso 3: Configurar Backend

```powershell
# Ir al backend
cd "C:\Users\X1\OneDrive\Documentos\Python_VS Code\GProA\GECRAI_1.2\backend"

# Crear virtual environment
python -m venv venv

# Activar venv
.\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env
@"
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your-secret-key-for-local-testing-only-must-be-32-characters-long
DATABASE_URL=postgresql+asyncpg://postgres:TU_PASSWORD@localhost:5432/gecrai
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
"@ | Out-File -FilePath .env -Encoding utf8
```

### Paso 4: Correr Backend

```powershell
# Asegurar que estás en el virtual environment
.\venv\Scripts\Activate.ps1

# Correr el servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará en: http://localhost:8000

---

## 🧪 Testing Rápido (Sin Docker)

Una vez corriendo el backend, probar los controles FASE 0:

### Test 1: Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health"
```

### Test 2: Password Validation
```powershell
# Debe fallar (contraseña débil)
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/register" -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@local.com","password":"weak","full_name":"Test","organization_name":"Test"}'

# Debe funcionar (contraseña fuerte)
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/register" -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test2@local.com","password":"StrongP@ss123","full_name":"Test","organization_name":"Test"}'
```

### Test 3: Rate Limiting
```powershell
# Loop de 15 requests
for ($i=1; $i -le 15; $i++) {
    $resp = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method POST `
      -ContentType "application/x-www-form-urlencoded" `
      -Body "username=test@local.com&password=wrong"
    Write-Host "Request $i`: Status $($resp.StatusCode)"
}
```

---

## 🧪 Pruebas Unitarias y de Integración con Pytest

El sistema de backend incluye una suite completa de validación base:

```powershell
# Instalar dependencias de pruebas
pip install pytest pytest-asyncio httpx

# Moverte al directorio backend
cd "C:\Users\X1\OneDrive\Documentos\Python_VS Code\GProA\GECRAI_1.2\backend"

# Activar ambiente virtual (si no está activo)
.\venv\Scripts\Activate.ps1

# Correr las pruebas
pytest

# Para resultados verbosos
pytest -v

# Para forzar advertencias de asyncio a limitarse
pytest -p no:warnings
```

---

## 📋 Solución de Problemas Windows

### Problema: "No se reconoce docker-compose"

```powershell
# Solución 1: Usar docker compose (sin guión)
docker compose up -d

# Solución 2: Usar ruta completa
& "C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe" up -d

# Solución 3: Agregar al PATH
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\Docker\Docker\resources\bin", "User")
# Reiniciar PowerShell después
```

### Problema: "No se puede cargar el archivo... la ejecución de scripts está deshabilitada"

```powershell
# Ejecutar PowerShell como Administrador y correr:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problema: Puerto 8000 ocupado

```powershell
# Encontrar proceso usando puerto 8000
netstat -ano | findstr :8000

# Matar proceso (reemplazar <PID> con el número mostrado)
taskkill /PID <PID> /F
```

---

## ✅ Checklist Windows

- [ ] Docker Desktop instalado O Python 3.11 instalado
- [ ] PostgreSQL instalado (si sin Docker)
- [ ] Redis instalado/corriendo (si sin Docker)
- [ ] Backend corre sin errores
- [ ] Health check responde
- [ ] Tests de FASE 0 pasan

---

**Nota:** Para staging, Docker es obligatorio. Esta guía es solo para desarrollo local en Windows.
