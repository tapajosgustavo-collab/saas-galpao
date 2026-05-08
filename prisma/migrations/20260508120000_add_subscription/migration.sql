-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE');

CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_trialEndsAt_idx" ON "Subscription"("trialEndsAt");
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- AddForeignKey
ALTER TABLE "Subscription"
    ADD CONSTRAINT "Subscription_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: tenants existentes ja viram ACTIVE PRO ate 1 ano (sao seus de teste).
INSERT INTO "Subscription" (id, "tenantId", plan, status, "trialEndsAt", "currentPeriodEnd", "updatedAt")
SELECT
    'sub_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24),
    id,
    'PRO'::"Plan",
    'ACTIVE'::"SubscriptionStatus",
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '1 year',
    NOW()
FROM "Tenant";
