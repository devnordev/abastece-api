#!/bin/bash

# Script para aplicar migrations em produção
# Uso: ./scripts/apply-migration-prod.sh

echo "🚀 Aplicando migrations em produção..."
echo ""

# Verificar se o Prisma está instalado
if ! command -v npx &> /dev/null; then
    echo "❌ npx não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Aplicar migrations
echo "📦 Aplicando migrations do Prisma..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations aplicadas com sucesso!"
    echo ""
    echo "🔄 Regenerando Prisma Client..."
    npx prisma generate
    echo "✅ Prisma Client regenerado com sucesso!"
else
    echo "❌ Erro ao aplicar migrations!"
    exit 1
fi

echo ""
echo "🎉 Processo concluído com sucesso!"

