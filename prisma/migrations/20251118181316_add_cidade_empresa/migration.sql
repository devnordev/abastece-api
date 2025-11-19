-- AlterTable: Adicionar coluna cidade na tabela empresa
-- Data: 2025-11-18

ALTER TABLE "empresa" ADD COLUMN IF NOT EXISTS "cidade" TEXT;

