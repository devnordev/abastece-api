-- CreateTable
CREATE TABLE IF NOT EXISTS "termo_aceite" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "versao" TEXT NOT NULL DEFAULT '1.0',
    "aceito" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "plataforma" TEXT,
    "data_aceite" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "termo_aceite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "termo_aceite_usuarioId_versao_key" ON "termo_aceite"("usuarioId", "versao");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "termo_aceite_usuarioId_idx" ON "termo_aceite"("usuarioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "termo_aceite_versao_idx" ON "termo_aceite"("versao");

-- AddForeignKey
ALTER TABLE "termo_aceite" ADD CONSTRAINT "termo_aceite_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
