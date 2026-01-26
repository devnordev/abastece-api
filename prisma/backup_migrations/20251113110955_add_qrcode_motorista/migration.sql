-- CreateEnum
CREATE TYPE "StatusQrCodeMotorista" AS ENUM ('Solicitado', 'Aprovado', 'Em Produção', 'Integração', 'Concluída', 'Inativo', 'Cancelado');

-- CreateTable
CREATE TABLE "qrcode_motorista" (
    "id" SERIAL NOT NULL,
    "idMotorista" INTEGER NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusQrCodeMotorista" NOT NULL DEFAULT 'Solicitado',
    "data_cancelamento" TIMESTAMP(3),
    "motivo_cancelamento" TEXT,
    "cancelamento_solicitado_por" TEXT,
    "cancelamento_efetuado_por" TEXT,
    "prefeitura_id" INTEGER NOT NULL,
    "foto" TEXT,

    CONSTRAINT "qrcode_motorista_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qrcode_motorista_idMotorista_idx" ON "qrcode_motorista"("idMotorista");

-- CreateIndex
CREATE INDEX "qrcode_motorista_prefeitura_id_idx" ON "qrcode_motorista"("prefeitura_id");

-- CreateIndex
CREATE INDEX "qrcode_motorista_status_idx" ON "qrcode_motorista"("status");

-- AddForeignKey
ALTER TABLE "qrcode_motorista" ADD CONSTRAINT "qrcode_motorista_idMotorista_fkey" FOREIGN KEY ("idMotorista") REFERENCES "motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qrcode_motorista" ADD CONSTRAINT "qrcode_motorista_prefeitura_id_fkey" FOREIGN KEY ("prefeitura_id") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

