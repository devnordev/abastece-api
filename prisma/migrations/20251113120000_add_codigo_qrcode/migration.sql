-- AlterTable: Adicionar coluna codigo_qrcode na tabela solicitacoes_qrcode_veiculo
ALTER TABLE "solicitacoes_qrcode_veiculo" ADD COLUMN "codigo_qrcode" VARCHAR(8);

-- CreateIndex: Criar índice único para codigo_qrcode na tabela solicitacoes_qrcode_veiculo
CREATE UNIQUE INDEX "solicitacoes_qrcode_veiculo_codigo_qrcode_key" ON "solicitacoes_qrcode_veiculo"("codigo_qrcode") WHERE "codigo_qrcode" IS NOT NULL;

-- AlterTable: Adicionar coluna codigo_qrcode na tabela qrcode_motorista
ALTER TABLE "qrcode_motorista" ADD COLUMN "codigo_qrcode" VARCHAR(8);

-- CreateIndex: Criar índice único para codigo_qrcode na tabela qrcode_motorista
CREATE UNIQUE INDEX "qrcode_motorista_codigo_qrcode_key" ON "qrcode_motorista"("codigo_qrcode") WHERE "codigo_qrcode" IS NOT NULL;

