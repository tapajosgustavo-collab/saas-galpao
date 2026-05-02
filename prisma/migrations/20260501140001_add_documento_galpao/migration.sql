-- CreateEnum
CREATE TYPE "TipoDocumentoGalpao" AS ENUM (
    'AVCB',
    'LICENCA_AMBIENTAL',
    'ALVARA_FUNCIONAMENTO',
    'IPTU',
    'LAUDO_TECNICO',
    'ANALISE_POTABILIDADE',
    'PGRS',
    'OUTROS'
);

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM (
    'VIGENTE',
    'PROXIMO_VENCIMENTO',
    'VENCIDO',
    'EM_RENOVACAO',
    'NAO_APLICA'
);

-- CreateEnum
CREATE TYPE "ResponsavelPagamento" AS ENUM (
    'LOCADOR',
    'LOCATARIA',
    'COMPARTILHADO'
);

-- CreateTable
CREATE TABLE "DocumentoGalpao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "galpaoId" TEXT NOT NULL,
    "tipo" "TipoDocumentoGalpao" NOT NULL,
    "nome" TEXT NOT NULL,
    "numero" TEXT,
    "emissor" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "dataValidade" TIMESTAMP(3) NOT NULL,
    "frequenciaRenovacaoMeses" INTEGER,
    "alertarDiasAntes" INTEGER NOT NULL DEFAULT 60,
    "status" "StatusDocumento" NOT NULL DEFAULT 'VIGENTE',
    "responsavelPagamento" "ResponsavelPagamento",
    "documentoUrl" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoGalpao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentoGalpao_tenantId_dataValidade_idx"
    ON "DocumentoGalpao"("tenantId", "dataValidade");

-- CreateIndex
CREATE INDEX "DocumentoGalpao_tenantId_galpaoId_idx"
    ON "DocumentoGalpao"("tenantId", "galpaoId");

-- CreateIndex
CREATE INDEX "DocumentoGalpao_tenantId_tipo_idx"
    ON "DocumentoGalpao"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "DocumentoGalpao_tenantId_status_idx"
    ON "DocumentoGalpao"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "DocumentoGalpao"
    ADD CONSTRAINT "DocumentoGalpao_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoGalpao"
    ADD CONSTRAINT "DocumentoGalpao_galpaoId_fkey"
    FOREIGN KEY ("galpaoId") REFERENCES "Galpao"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
