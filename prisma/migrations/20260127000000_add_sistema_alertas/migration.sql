-- CreateEnum
CREATE TYPE "TipoRegraAlerta" AS ENUM ('MULTIPLOS_ABASTECIMENTOS_DIA', 'QUANTIDADE_LITROS_ACIMA_MEDIA', 'VALOR_ACIMA_MEDIA', 'AUMENTO_PERCENTUAL_GASTO', 'ABASTECIMENTO_FORA_PADRAO');

-- CreateEnum
CREATE TYPE "StatusAlerta" AS ENUM ('ATIVO', 'RESOLVIDO', 'IGNORADO');

-- CreateTable
CREATE TABLE "regra_alerta" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoRegraAlerta" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regra_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracao_alerta" (
    "id" SERIAL NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "regraAlertaId" INTEGER NOT NULL,
    "valorLimite" DECIMAL(10,2),
    "percentualLimite" DECIMAL(5,2),
    "periodoDias" INTEGER DEFAULT 7,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracao_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerta" (
    "id" SERIAL NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "configuracaoAlertaId" INTEGER,
    "regraAlertaId" INTEGER NOT NULL,
    "veiculoId" INTEGER,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" "StatusAlerta" NOT NULL DEFAULT 'ATIVO',
    "dadosContexto" JSONB,
    "dataOcorrencia" TIMESTAMP(3) NOT NULL,
    "dataResolucao" TIMESTAMP(3),
    "resolvidoPor" INTEGER,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alerta_prefeituraId_idx" ON "alerta"("prefeituraId");

-- CreateIndex
CREATE INDEX "alerta_status_idx" ON "alerta"("status");

-- CreateIndex
CREATE INDEX "alerta_dataOcorrencia_idx" ON "alerta"("dataOcorrencia");

-- CreateIndex
CREATE INDEX "alerta_veiculoId_idx" ON "alerta"("veiculoId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracao_alerta_prefeituraId_regraAlertaId_key" ON "configuracao_alerta"("prefeituraId", "regraAlertaId");

-- AddForeignKey
ALTER TABLE "configuracao_alerta" ADD CONSTRAINT "configuracao_alerta_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracao_alerta" ADD CONSTRAINT "configuracao_alerta_regraAlertaId_fkey" FOREIGN KEY ("regraAlertaId") REFERENCES "regra_alerta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_configuracaoAlertaId_fkey" FOREIGN KEY ("configuracaoAlertaId") REFERENCES "configuracao_alerta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_regraAlertaId_fkey" FOREIGN KEY ("regraAlertaId") REFERENCES "regra_alerta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_resolvidoPor_fkey" FOREIGN KEY ("resolvidoPor") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

