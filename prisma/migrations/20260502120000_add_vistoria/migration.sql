-- CreateEnum
CREATE TYPE "TipoVistoria" AS ENUM ('INICIAL', 'FINAL');

CREATE TYPE "StatusVistoria" AS ENUM ('RASCUNHO', 'FINALIZADA');

CREATE TYPE "AreaVistoria" AS ENUM (
    'ESTRUTURA',
    'COBERTURA',
    'PISO',
    'PAREDES',
    'PORTAS_PORTOES',
    'ELETRICA',
    'HIDRAULICA',
    'ILUMINACAO',
    'CLIMATIZACAO',
    'EXTERNO_PATIO',
    'SEGURANCA',
    'OUTROS'
);

CREATE TYPE "CondicaoItem" AS ENUM (
    'BOM',
    'REGULAR',
    'RUIM',
    'CRITICO',
    'NAO_APLICA'
);

-- CreateTable
CREATE TABLE "Vistoria" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "tipo" "TipoVistoria" NOT NULL,
    "dataVistoria" TIMESTAMP(3) NOT NULL,
    "responsavelInterno" TEXT,
    "responsavelLocataria" TEXT,
    "cpfLocataria" TEXT,
    "observacoesGerais" TEXT,
    "fotosGerais" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "StatusVistoria" NOT NULL DEFAULT 'RASCUNHO',
    "documentoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vistoria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItemVistoria" (
    "id" TEXT NOT NULL,
    "vistoriaId" TEXT NOT NULL,
    "area" "AreaVistoria" NOT NULL,
    "descricao" TEXT,
    "condicao" "CondicaoItem" NOT NULL,
    "observacao" TEXT,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ItemVistoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vistoria_contratoId_tipo_key" ON "Vistoria"("contratoId", "tipo");
CREATE INDEX "Vistoria_tenantId_idx" ON "Vistoria"("tenantId");
CREATE INDEX "Vistoria_tenantId_contratoId_idx" ON "Vistoria"("tenantId", "contratoId");
CREATE INDEX "Vistoria_tenantId_status_idx" ON "Vistoria"("tenantId", "status");
CREATE INDEX "ItemVistoria_vistoriaId_idx" ON "ItemVistoria"("vistoriaId");

-- AddForeignKey
ALTER TABLE "Vistoria"
    ADD CONSTRAINT "Vistoria_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Vistoria"
    ADD CONSTRAINT "Vistoria_contratoId_fkey"
    FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ItemVistoria"
    ADD CONSTRAINT "ItemVistoria_vistoriaId_fkey"
    FOREIGN KEY ("vistoriaId") REFERENCES "Vistoria"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
