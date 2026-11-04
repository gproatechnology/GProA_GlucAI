# start-dev.ps1
# GlucAI 2.0 — Servidor de desarrollo local (sin instalaciones globales)
# Todo se instala y ejecuta dentro de esta carpeta.

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -LiteralPath $scriptDir

Write-Host "GlucAI 2.0 — Servidor de desarrollo" -ForegroundColor Cyan
Write-Host "Carpeta: $scriptDir" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path -LiteralPath "node_modules")) {
    Write-Host "Instalando dependencias locales (npm install)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error al instalar dependencias." -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencias instaladas." -ForegroundColor Green
} else {
    Write-Host "Dependencias ya instaladas." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Iniciando servidor en http://localhost:5173" -ForegroundColor Green
Write-Host "Presiona Ctrl+C para detener." -ForegroundColor Gray
Write-Host ""

npm run dev
