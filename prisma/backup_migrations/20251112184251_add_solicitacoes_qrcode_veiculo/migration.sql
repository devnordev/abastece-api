-- CreateEnum
CREATE TYPE "StatusSolicitacaoQrCodeVeiculo" AS ENUM ('Solicitado', 'Aprovado', 'Em Produção', 'Integração', 'Concluída');

-- CreateTable
CREATE TABLE "solicitacoes_qrcode_veiculo" (
    "id" SERIAL NOT NULL,
    "idVeiculo" INTEGER NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusSolicitacaoQrCodeVeiculo" NOT NULL DEFAULT 'Solicitado',
    "data_cancelamento" TIMESTAMP(3),
    "motivo_cancelamento" TEXT,
    "cancelamento_solicitado_por" TEXT,
    "cancelamento_efetuado_por" TEXT,
    "prefeitura_id" INTEGER NOT NULL,
    "foto" TEXT,

    CONSTRAINT "solicitacoes_qrcode_veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitacoes_qrcode_veiculo_idVeiculo_idx" ON "solicitacoes_qrcode_veiculo"("idVeiculo");

-- CreateIndex
CREATE INDEX "solicitacoes_qrcode_veiculo_prefeitura_id_idx" ON "solicitacoes_qrcode_veiculo"("prefeitura_id");

-- CreateIndex
CREATE INDEX "solicitacoes_qrcode_veiculo_status_idx" ON "solicitacoes_qrcode_veiculo"("status");

-- AddForeignKey
ALTER TABLE "solicitacoes_qrcode_veiculo" ADD CONSTRAINT "solicitacoes_qrcode_veiculo_idVeiculo_fkey" FOREIGN KEY ("idVeiculo") REFERENCES "veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_qrcode_veiculo" ADD CONSTRAINT "solicitacoes_qrcode_veiculo_prefeitura_id_fkey" FOREIGN KEY ("prefeitura_id") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

