#!/bin/bash

# 🚀 Script de Setup Completo para SUPER_ADMIN
# Este script configura todo o ambiente de desenvolvimento

echo "🌱 =========================================="
echo "🌱 SETUP COMPLETO PARA SUPER_ADMIN"
echo "🌱 =========================================="

echo ""
echo "📋 Verificando pré-requisitos..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar se o NPM está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ NPM não encontrado. Instale o NPM primeiro."
    exit 1
fi

echo "✅ Node.js e NPM encontrados"

echo ""
echo "📦 Instalando dependências..."
npm install

echo ""
echo "🔧 Gerando Prisma Client..."
npx prisma generate

echo ""
echo "🗄️ Configurando banco de dados..."
echo "⚠️  ATENÇÃO: Isso irá resetar todos os dados existentes!"
read -p "Deseja continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operação cancelada pelo usuário."
    exit 1
fi

echo ""
echo "🔄 Resetando banco de dados..."
npx prisma migrate reset --force

echo ""
echo "🌱 Executando seed do SUPER_ADMIN..."
npm run seed:superadmin

echo ""
echo "🎉 =========================================="
echo "🎉 SETUP CONCLUÍDO COM SUCESSO!"
echo "🎉 =========================================="

echo ""
echo "🔐 CREDENCIAIS DE ACESSO:"
echo "📧 Email: superadmin@nordev.com"
echo "🔑 Senha: 123456"
echo "👑 Tipo: SUPER_ADMIN"

echo ""
echo "🌐 URLS DO SISTEMA:"
echo "🚀 API: http://localhost:3000"
echo "📚 Documentação: http://localhost:3000/api/docs"
echo "🔍 Prisma Studio: npx prisma studio"

echo ""
echo "🚀 Para iniciar a aplicação:"
echo "npm run start:dev"

echo ""
echo "✨ Pronto para usar! Faça login como SUPER_ADMIN!"
