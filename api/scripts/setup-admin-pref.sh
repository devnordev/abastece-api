#!/bin/bash

# 🏛️ Script de Setup Completo para ADMIN_PREFEITURA
# Este script configura o ambiente de gestão municipal

echo "🏛️ =========================================="
echo "🏛️ SETUP COMPLETO PARA ADMIN_PREFEITURA"
echo "🏛️ =========================================="

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
echo "🌱 Executando seed do ADMIN_PREFEITURA..."
npm run seed:admin-pref

echo ""
echo "🎉 =========================================="
echo "🎉 SETUP CONCLUÍDO COM SUCESSO!"
echo "🎉 =========================================="

echo ""
echo "🔐 CREDENCIAIS DE ACESSO:"
echo "📧 Email: admin@campinas.sp.gov.br"
echo "🔑 Senha: 123456"
echo "👑 Tipo: ADMIN_PREFEITURA"
echo "🏛️ Prefeitura: Campinas"

echo ""
echo "👥 COLABORADORES (mesma senha):"
echo "   • colaborador.saude@campinas.sp.gov.br"
echo "   • colaborador.educacao@campinas.sp.gov.br"
echo "   • colaborador.obras@campinas.sp.gov.br"
echo "   • colaborador.assistencia@campinas.sp.gov.br"

echo ""
echo "🌐 URLS DO SISTEMA:"
echo "🚀 API: http://localhost:3000"
echo "📚 Documentação: http://localhost:3000/api/docs"
echo "🔍 Prisma Studio: npx prisma studio"

echo ""
echo "🚀 Para iniciar a aplicação:"
echo "npm run start:dev"

echo ""
echo "✨ Pronto! Faça login como ADMIN_PREFEITURA!"
echo "🏛️ Você pode gerenciar toda a Prefeitura de Campinas!"
