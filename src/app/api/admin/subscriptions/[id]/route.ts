import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { isSuperAdmin } from "@/lib/subscription";
import { apiError } from "@/lib/api";
import { Plan, SubscriptionStatus } from "@prisma/client";

const patchSchema = z.object({
  plan: z.nativeEnum(Plan).optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  trialEndsAt: z.coerce.date().optional(),
  currentPeriodEnd: z.coerce.date().optional(),
  notes: z.string().max(2000).nullable().optional(),
  // Acoes rapidas
  action: z.enum(["activate-month", "activate-year", "extend-trial-30", "cancel"]).optional(),
});

/**
 * PATCH /api/admin/subscriptions/[id]
 * Apenas super admins (env SUPER_ADMIN_EMAILS).
 * Atualiza assinatura de qualquer tenant.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    if (!isSuperAdmin(ctx.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const data = patchSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (data.plan) updates.plan = data.plan;
    if (data.status) updates.status = data.status;
    if (data.trialEndsAt) updates.trialEndsAt = data.trialEndsAt;
    if (data.currentPeriodEnd) updates.currentPeriodEnd = data.currentPeriodEnd;
    if (data.notes !== undefined) updates.notes = data.notes;

    // Acoes rapidas
    if (data.action === "activate-month") {
      updates.status = SubscriptionStatus.ACTIVE;
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      updates.currentPeriodEnd = d;
    } else if (data.action === "activate-year") {
      updates.status = SubscriptionStatus.ACTIVE;
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      updates.currentPeriodEnd = d;
    } else if (data.action === "extend-trial-30") {
      updates.status = SubscriptionStatus.TRIALING;
      const d = new Date();
      d.setDate(d.getDate() + 30);
      updates.trialEndsAt = d;
      updates.currentPeriodEnd = d;
    } else if (data.action === "cancel") {
      updates.status = SubscriptionStatus.CANCELED;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: updates,
      include: { tenant: { select: { name: true, slug: true } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}
