# Script para aplicar migração manual do sistema de alertas
# Execute: .\aplicar-migracao-alertas.ps1

Write-Host "=== Aplicando Migração do Sistema de Alertas ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "prisma\schema.prisma")) {
    Write-Host "ERRO: Execute este script na pasta abastece-api" -ForegroundColor Red
    exit 1
}

Write-Host "Opcao 1: Aplicar via Prisma Migrate (Recomendado)" -ForegroundColor Yellow
Write-Host "Opcao 2: Aplicar SQL diretamente no banco" -ForegroundColor Yellow
Write-Host ""
Write-Host "Escolha uma opcao (1 ou 2): " -NoNewline
$opcao = Read-Host

if ($opcao -eq "1") {
    Write-Host "`n=== Aplicando migração via Prisma ===" -ForegroundColor Green
    
    # Primeiro, marcar a migração como aplicada (se já foi executada manualmente)
    # Ou aplicar a migração
    Write-Host "Aplicando migração..." -ForegroundColor Cyan
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n=== Regenerando Prisma Client ===" -ForegroundColor Green
        npx prisma generate
        
        Write-Host "`n=== SUCESSO! ===" -ForegroundColor Green
        Write-Host "As tabelas de alertas foram criadas com sucesso." -ForegroundColor Green
        Write-Host "`nVerifique com: npx prisma studio" -ForegroundColor Cyan
    } else {
        Write-Host "`n=== ERRO ===" -ForegroundColor Red
        Write-Host "Tente a Opcao 2 para aplicar o SQL diretamente no banco." -ForegroundColor Yellow
    }
} elseif ($opcao -eq "2") {
    Write-Host "`n=== Instrucoes para aplicar SQL diretamente ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Abra seu cliente SQL (pgAdmin, DBeaver, etc)" -ForegroundColor Cyan
    Write-Host "2. Conecte-se ao banco: abastece" -ForegroundColor Cyan
    Write-Host "3. Abra o arquivo: prisma\migrations\20260127000000_add_sistema_alertas\migration.sql" -ForegroundColor Cyan
    Write-Host "4. Execute o SQL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5. Depois, marque a migração como aplicada:" -ForegroundColor Yellow
    Write-Host "   npx prisma migrate resolve --applied 20260127000000_add_sistema_alertas" -ForegroundColor White
    Write-Host ""
    Write-Host "6. Regenerar o Prisma Client:" -ForegroundColor Yellow
    Write-Host "   npx prisma generate" -ForegroundColor White
    Write-Host ""
    Write-Host "Pressione qualquer tecla para abrir o arquivo SQL..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    $sqlFile = "prisma\migrations\20260127000000_add_sistema_alertas\migration.sql"
    if (Test-Path $sqlFile) {
        notepad $sqlFile
    } else {
        Write-Host "Arquivo não encontrado: $sqlFile" -ForegroundColor Red
    }
} else {
    Write-Host "`nOpcao invalida!" -ForegroundColor Red
    exit 1
}

