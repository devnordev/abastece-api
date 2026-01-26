-- Update existing records that use 'COTA' to 'COM_COTA'
UPDATE "solicitacoes_abastecimento"
SET "tipo_abastecimento" = 'COM_COTA'::"TipoAbastecimentoSolicitacao"
WHERE "tipo_abastecimento" = 'COTA';

-- Create a new enum type without 'COTA'
CREATE TYPE "TipoAbastecimentoSolicitacao_new" AS ENUM ('COM_COTA', 'LIVRE', 'COM_AUTORIZACAO');

-- Update the column to use the new enum type
ALTER TABLE "solicitacoes_abastecimento" 
  ALTER COLUMN "tipo_abastecimento" TYPE "TipoAbastecimentoSolicitacao_new" 
  USING ("tipo_abastecimento"::text::"TipoAbastecimentoSolicitacao_new");

-- Drop the old enum type
DROP TYPE "TipoAbastecimentoSolicitacao";

-- Rename the new enum type to the original name
ALTER TYPE "TipoAbastecimentoSolicitacao_new" RENAME TO "TipoAbastecimentoSolicitacao";

