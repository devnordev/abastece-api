-- CreateEnum
CREATE TYPE "TipoEntidadeExportacao" AS ENUM ('SOLICITACOES', 'ABASTECIMENTOS', 'VEICULOS', 'MOTORISTAS', 'USUARIOS', 'ORGAOS', 'PROCESSOS');

-- CreateEnum
CREATE TYPE "FormatoExportacao" AS ENUM ('PDF', 'CSV', 'XLSX');

-- CreateEnum
CREATE TYPE "VisibilidadeModelo" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "modelo_exportacao" (
    "id" SERIAL NOT NULL,
    "prefeituraId" INTEGER NOT NULL,
    "criadoPorId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "entityType" "TipoEntidadeExportacao" NOT NULL,
    "format" "FormatoExportacao" NOT NULL,
    "visibility" "VisibilidadeModelo" NOT NULL DEFAULT 'PRIVATE',
    "columns" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelo_exportacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "modelo_exportacao" ADD CONSTRAINT "modelo_exportacao_prefeituraId_fkey" FOREIGN KEY ("prefeituraId") REFERENCES "prefeitura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelo_exportacao" ADD CONSTRAINT "modelo_exportacao_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


