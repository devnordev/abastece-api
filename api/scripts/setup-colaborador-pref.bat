@echo off
chcp 65001 >nul
title Setup Completo para COLABORADOR_PREFEITURA

echo 👤 ==========================================
echo 👤 SETUP COMPLETO PARA COLABORADOR_PREFEITURA
echo 👤 ==========================================
echo.

echo 📋 Verificando pré-requisitos...

:: Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

:: Verificar se o NPM está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ NPM não encontrado. Instale o NPM primeiro.
    pause
    exit /b 1
)

echo ✅ Node.js e NPM encontrados
echo.

echo 📦 Instalando dependências...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências.
    pause
    exit /b 1
)

echo.
echo 🔧 Gerando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Erro ao gerar Prisma Client.
    pause
    exit /b 1
)

echo.
echo 🗄️ Configurando banco de dados...
echo ⚠️  ATENÇÃO: Isso irá resetar todos os dados existentes!
set /p "confirm=Deseja continuar? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Operação cancelada pelo usuário.
    pause
    exit /b 1
)

echo.
echo 🔄 Resetando banco de dados...
call npx prisma migrate reset --force
if %errorlevel% neq 0 (
    echo ❌ Erro ao resetar banco de dados.
    pause
    exit /b 1
)

echo.
echo 🌱 Executando seed do COLABORADOR_PREFEITURA...
call npm run seed:colaborador-pref
if %errorlevel% neq 0 (
    echo ❌ Erro ao executar seed.
    pause
    exit /b 1
)

echo.
echo 🎉 ==========================================
echo 🎉 SETUP CONCLUÍDO COM SUCESSO!
echo 🎉 ==========================================
echo.

echo 🔐 CREDENCIAIS DE ACESSO:
echo 📧 Email: fernanda.santos@ribeiraopreto.sp.gov.br
echo 🔑 Senha: 123456
echo 👤 Tipo: COLABORADOR_PREFEITURA
echo 🏛️ Prefeitura: Ribeirão Preto
echo 🏢 Órgãos: SMS (Saúde) + SME (Educação)
echo.

echo 👥 OUTROS COLABORADORES (mesma senha):
echo    • marcos.lima@ribeiraopreto.sp.gov.br (SME)
echo    • patricia.alves@ribeiraopreto.sp.gov.br (SMT)
echo    • admin@ribeiraopreto.sp.gov.br (ADMIN)
echo.

echo 🌐 URLS DO SISTEMA:
echo 🚀 API: http://localhost:3000
echo 📚 Documentação: http://localhost:3000/api/docs
echo 🔍 Prisma Studio: npx prisma studio
echo.

echo 🚀 Para iniciar a aplicação:
echo npm run start:dev
echo.

echo ✨ Pronto! Faça login como COLABORADOR!
echo 👤 Você pode gerenciar operações municipais!
echo 📂 Módulos: Categorias, Motoristas, Veículos, Solicitações
echo.
pause
