import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/tenant";
import { isSuperAdmin } from "@/lib/subscription";
import { sendEmail, renderTestEmail } from "@/lib/email";
import { apiError } from "@/lib/api";

/**
 * POST /api/test-email
 * Manda um email de teste pro proprio user logado. So super admin.
 * Util pra validar a config do Resend antes de cair em producao.
 */
export async function POST() {
  try {
    const ctx = await requireAuth();
    if (!isSuperAdmin(ctx.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const result = await sendEmail({
      to: ctx.email,
      subject: "[SaaS Galpao] Email de teste",
      html: renderTestEmail(ctx.email.split("@")[0] ?? "voce"),
    });
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
