-- ============================================
-- Script SQL para aplicar manualmente
-- Migração: 20260108130457_add_comentario_prefeitura
-- ============================================
-- 
-- Este script adiciona a coluna comentario_prefeitura nas tabelas:
-- - solicitacoes_abastecimento
-- - abastecimento
--
-- Execute este script diretamente no banco de dados PostgreSQL
-- Exemplo: psql -h localhost -U postgres -d abastece -f apply_manually.sql
-- ============================================

-- Adicionar coluna comentario_prefeitura na tabela solicitacoes_abastecimento
ALTER TABLE "solicitacoes_abastecimento" 
ADD COLUMN IF NOT EXISTS "comentario_prefeitura" TEXT;

-- Adicionar coluna comentario_prefeitura na tabela abastecimento
ALTER TABLE "abastecimento" 
ADD COLUMN IF NOT EXISTS "comentario_prefeitura" TEXT;

-- Verificar se as colunas foram criadas
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE column_name = 'comentario_prefeitura' 
    AND table_name IN ('solicitacoes_abastecimento', 'abastecimento')
ORDER BY table_name, column_name;


