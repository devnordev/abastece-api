# Script para aplicar migrations em produção (PowerShell)
# Uso: .\scripts\apply-migration-prod.ps1

Write-Host "🚀 Aplicando migrations em produção..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o npx está disponível
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npx não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Aplicar migrations
Write-Host "📦 Aplicando migrations do Prisma..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations aplicadas com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Regenerando Prisma Client..." -ForegroundColor Yellow
    npx prisma generate
    Write-Host "✅ Prisma Client regenerado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao aplicar migrations!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Processo concluído com sucesso!" -ForegroundColor Green

