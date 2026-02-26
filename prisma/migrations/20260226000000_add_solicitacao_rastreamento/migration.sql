-- CreateEnum
CREATE TYPE "StatusSolicitacaoRastreamento" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- CreateTable
CREATE TABLE "solicitacao_rastreamento" (
    "id" SERIAL NOT NULL,
    "veiculo_id" INTEGER NOT NULL,
    "prefeitura_id" INTEGER NOT NULL,
    "solicitado_por" INTEGER NOT NULL,
    "status" "StatusSolicitacaoRastreamento" NOT NULL DEFAULT 'PENDENTE',
    "motivo" TEXT,
    "observacoes" TEXT,
    "aprovado_por" INTEGER,
    "data_aprovacao" TIMESTAMP(3),
    "data_solicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacao_rastreamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitacao_rastreamento_veiculo_id_idx" ON "solicitacao_rastreamento"("veiculo_id");

-- CreateIndex
CREATE INDEX "solicitacao_rastreamento_prefeitura_id_idx" ON "solicitacao_rastreamento"("prefeitura_id");

-- CreateIndex
CREATE INDEX "solicitacao_rastreamento_status_idx" ON "solicitacao_rastreamento"("status");

-- CreateIndex
CREATE INDEX "solicitacao_rastreamento_data_solicitacao_idx" ON "solicitacao_rastreamento"("data_solicitacao");

-- AddForeignKey
ALTER TABLE "solicitacao_rastreamento" ADD CONSTRAINT "solicitacao_rastreamento_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_rastreamento" ADD CONSTRAINT "solicitacao_rastreamento_prefeitura_id_fkey" FOREIGN KEY ("prefeitura_id") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_rastreamento" ADD CONSTRAINT "solicitacao_rastreamento_solicitado_por_fkey" FOREIGN KEY ("solicitado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_rastreamento" ADD CONSTRAINT "solicitacao_rastreamento_aprovado_por_fkey" FOREIGN KEY ("aprovado_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
