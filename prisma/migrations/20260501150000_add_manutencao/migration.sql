-- CreateEnum
CREATE TYPE "TipoManutencao" AS ENUM (
    'PREVENTIVA',
    'CORRETIVA',
    'EMERGENCIAL'
);

-- CreateEnum
CREATE TYPE "CategoriaManutencao" AS ENUM (
    'ELETRICA',
    'HIDRAULICA',
    'ESTRUTURAL',
    'COBERTURA',
    'PINTURA',
    'PORTAS_PORTOES',
    'PISO',
    'CLIMATIZACAO',
    'SEGURANCA',
    'LIMPEZA',
    'OUTROS'
);

-- CreateEnum
CREATE TYPE "StatusManutencao" AS ENUM (
    'AGENDADA',
    'EM_ANDAMENTO',
    'CONCLUIDA',
    'CANCELADA'
);

-- CreateTable
CREATE TABLE "Manutencao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "galpaoId" TEXT NOT NULL,
    "contratoId" TEXT,
    "tipo" "TipoManutencao" NOT NULL,
    "categoria" "CategoriaManutencao" NOT NULL,
    "descricao" TEXT NOT NULL,
    "prestador" TEXT NOT NULL,
    "prestadorContato" TEXT,
    "prestadorCnpj" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "valor" DECIMAL(12,2) NOT NULL,
    "pagoPor" "ResponsavelPagamento",
    "status" "StatusManutencao" NOT NULL DEFAULT 'AGENDADA',
    "fotosAntes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotosDepois" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notaFiscalUrl" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Manutencao_tenantId_galpaoId_idx" ON "Manutencao"("tenantId", "galpaoId");
CREATE INDEX "Manutencao_tenantId_contratoId_idx" ON "Manutencao"("tenantId", "contratoId");
CREATE INDEX "Manutencao_tenantId_status_idx" ON "Manutencao"("tenantId", "status");
CREATE INDEX "Manutencao_tenantId_dataInicio_idx" ON "Manutencao"("tenantId", "dataInicio");
CREATE INDEX "Manutencao_tenantId_categoria_idx" ON "Manutencao"("tenantId", "categoria");

-- AddForeignKey
ALTER TABLE "Manutencao"
    ADD CONSTRAINT "Manutencao_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Manutencao"
    ADD CONSTRAINT "Manutencao_galpaoId_fkey"
    FOREIGN KEY ("galpaoId") REFERENCES "Galpao"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Manutencao"
    ADD CONSTRAINT "Manutencao_contratoId_fkey"
    FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
