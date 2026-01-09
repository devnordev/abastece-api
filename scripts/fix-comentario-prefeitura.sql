-- ============================================
-- Script SQL para corrigir erro: comentario_prefeitura não existe
-- ============================================
-- 
-- Este script adiciona a coluna comentario_prefeitura nas tabelas:
-- - solicitacoes_abastecimento
-- - abastecimento
--
-- Execute este script diretamente no banco de dados PostgreSQL da VPS
-- 
-- Exemplos de uso:
-- 1. Via psql:
--    psql -h localhost -U postgres -d abastece -f fix-comentario-prefeitura.sql
--
-- 2. Via Docker:
--    docker exec -i pg-dev psql -U postgres -d abastece < fix-comentario-prefeitura.sql
--
-- 3. Via pgAdmin ou outro cliente SQL:
--    Copie e cole o conteúdo abaixo
-- ============================================

BEGIN;

-- Verificar se as colunas já existem antes de adicionar
DO $$
BEGIN
    -- Adicionar coluna comentario_prefeitura na tabela solicitacoes_abastecimento
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'solicitacoes_abastecimento' 
        AND column_name = 'comentario_prefeitura'
    ) THEN
        ALTER TABLE "solicitacoes_abastecimento" 
        ADD COLUMN "comentario_prefeitura" TEXT;
        RAISE NOTICE 'Coluna comentario_prefeitura adicionada em solicitacoes_abastecimento';
    ELSE
        RAISE NOTICE 'Coluna comentario_prefeitura já existe em solicitacoes_abastecimento';
    END IF;

    -- Adicionar coluna comentario_prefeitura na tabela abastecimento
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'abastecimento' 
        AND column_name = 'comentario_prefeitura'
    ) THEN
        ALTER TABLE "abastecimento" 
        ADD COLUMN "comentario_prefeitura" TEXT;
        RAISE NOTICE 'Coluna comentario_prefeitura adicionada em abastecimento';
    ELSE
        RAISE NOTICE 'Coluna comentario_prefeitura já existe em abastecimento';
    END IF;
END $$;

-- Verificar se as colunas foram criadas com sucesso
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE column_name = 'comentario_prefeitura' 
    AND table_name IN ('solicitacoes_abastecimento', 'abastecimento')
ORDER BY table_name, column_name;

COMMIT;

-- ============================================
-- Após executar este script, marque a migration como aplicada:
-- ============================================
-- docker exec -it abastece-api sh -c "npx prisma migrate resolve --applied 20260108130457_add_comentario_prefeitura"
-- ============================================


