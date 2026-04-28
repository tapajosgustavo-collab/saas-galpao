-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GESTOR', 'FINANCEIRO');

-- CreateEnum
CREATE TYPE "TipoGalpao" AS ENUM ('LOGISTICO', 'INDUSTRIAL', 'ARMAZENAMENTO');

-- CreateEnum
CREATE TYPE "StatusGalpao" AS ENUM ('DISPONIVEL', 'OCUPADO', 'EM_NEGOCIACAO', 'MANUTENCAO');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ATIVO', 'ENCERRADO', 'CANCELADO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('MANUTENCAO', 'IMPOSTOS', 'SEGURO', 'ENERGIA', 'AGUA', 'PESSOAL', 'OUTROS');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('CONTRATO_VENCENDO', 'PAGAMENTO_ATRASADO', 'GALPAO_OCIOSO', 'REAJUSTE_PENDENTE', 'INSIGHT_AI');

-- CreateEnum
CREATE TYPE "SeveridadeAlerta" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GESTOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Galpao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" TEXT NOT NULL,
    "metragemTotal" DECIMAL(12,2) NOT NULL,
    "metragemDisponivel" DECIMAL(12,2) NOT NULL,
    "tipo" "TipoGalpao" NOT NULL,
    "valorPorM2" DECIMAL(12,2) NOT NULL,
    "status" "StatusGalpao" NOT NULL DEFAULT 'DISPONIVEL',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Galpao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "galpaoId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "empresaLocataria" TEXT NOT NULL,
    "cnpjLocataria" TEXT NOT NULL,
    "emailLocataria" TEXT,
    "telefoneLocataria" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "valorMensal" DECIMAL(12,2) NOT NULL,
    "diaVencimento" INTEGER NOT NULL DEFAULT 5,
    "reajusteAnual" DECIMAL(5,2),
    "indiceReajuste" TEXT,
    "status" "StatusContrato" NOT NULL DEFAULT 'ATIVO',
    "documentoUrl" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receita" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "valorPago" DECIMAL(12,2),
    "dataPagamento" TIMESTAMP(3),
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "galpaoId" TEXT,
    "descricao" TEXT NOT NULL,
    "categoria" "CategoriaDespesa" NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "severidade" "SeveridadeAlerta" NOT NULL DEFAULT 'INFO',
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Galpao_tenantId_status_idx" ON "Galpao"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Galpao_tenantId_tipo_idx" ON "Galpao"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "Contrato_tenantId_status_idx" ON "Contrato"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Contrato_tenantId_galpaoId_idx" ON "Contrato"("tenantId", "galpaoId");

-- CreateIndex
CREATE INDEX "Contrato_tenantId_dataFim_idx" ON "Contrato"("tenantId", "dataFim");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_tenantId_numero_key" ON "Contrato"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "Receita_tenantId_status_idx" ON "Receita"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Receita_tenantId_vencimento_idx" ON "Receita"("tenantId", "vencimento");

-- CreateIndex
CREATE INDEX "Receita_tenantId_competencia_idx" ON "Receita"("tenantId", "competencia");

-- CreateIndex
CREATE INDEX "Despesa_tenantId_categoria_idx" ON "Despesa"("tenantId", "categoria");

-- CreateIndex
CREATE INDEX "Despesa_tenantId_vencimento_idx" ON "Despesa"("tenantId", "vencimento");

-- CreateIndex
CREATE INDEX "Alerta_tenantId_lido_idx" ON "Alerta"("tenantId", "lido");

-- CreateIndex
CREATE INDEX "Alerta_tenantId_tipo_idx" ON "Alerta"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entity_idx" ON "AuditLog"("tenantId", "entity");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Galpao" ADD CONSTRAINT "Galpao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_galpaoId_fkey" FOREIGN KEY ("galpaoId") REFERENCES "Galpao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
