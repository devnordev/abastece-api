-- AlterEnum: Adicionar valor CANCELADA ao enum StatusSolicitacao
DO $$ 
BEGIN
    -- Verifica se o valor CANCELADA já existe no enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'CANCELADA' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'StatusSolicitacao')
    ) THEN
        -- Adiciona o valor CANCELADA ao enum
        ALTER TYPE "StatusSolicitacao" ADD VALUE 'CANCELADA';
    END IF;
END $$;

