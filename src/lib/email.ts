import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "SaaS Galpao <onboarding@resend.dev>";

let _client: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (_client) return _client;
  _client = new Resend(key);
  return _client;
}

export interface SendResult {
  sent: boolean;
  id?: string;
  reason?: string;
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const client = getResend();
  if (!client) {
    console.warn("[EMAIL] RESEND_API_KEY nao configurada — skip envio");
    return { sent: false, reason: "no-api-key" };
  }
  try {
    const { data, error } = await client.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });
    if (error) {
      console.error("[EMAIL]", error);
      return { sent: false, reason: error.message };
    }
    return { sent: true, id: data?.id };
  } catch (e) {
    console.error("[EMAIL]", e);
    return { sent: false, reason: e instanceof Error ? e.message : "unknown" };
  }
}

// =========================================================
// TEMPLATES
// =========================================================

const APP_URL =
  process.env.NEXTAUTH_URL ??
  process.env.APP_URL ??
  "https://saas-galpao.vercel.app";

const COLORS = {
  primary: "#2563eb",
  critical: "#dc2626",
  warning: "#d97706",
  info: "#64748b",
  bg: "#f1f5f9",
  card: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
};

function severityColor(sev: string): string {
  if (sev === "CRITICAL") return COLORS.critical;
  if (sev === "WARNING") return COLORS.warning;
  return COLORS.info;
}

function severityLabel(sev: string): string {
  if (sev === "CRITICAL") return "URGENTE";
  if (sev === "WARNING") return "ATENÇÃO";
  return "INFO";
}

function baseTemplate({
  preheader,
  title,
  body,
  cta,
  ctaUrl,
  accent,
}: {
  preheader: string;
  title: string;
  body: string;
  cta?: string;
  ctaUrl?: string;
  accent?: string;
}): string {
  const color = accent ?? COLORS.primary;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.text};">
<span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:${COLORS.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${COLORS.bg};padding:32px 0;">
<tr><td align="center">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:${COLORS.card};border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">
<tr><td style="padding:24px 32px;border-bottom:1px solid ${COLORS.border};">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr><td style="font-size:18px;font-weight:700;color:${COLORS.primary};">SaaS Galpão</td>
<td align="right" style="font-size:12px;color:${COLORS.muted};">Gestão de galpões industriais</td></tr>
</table>
</td></tr>
<tr><td style="padding:0;">
<div style="height:6px;background:${color};"></div>
</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:${COLORS.text};">${escapeHtml(title)}</h1>
<div style="font-size:15px;line-height:1.6;color:${COLORS.text};">${body}</div>
${
  cta && ctaUrl
    ? `<div style="margin-top:24px;"><a href="${ctaUrl}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">${escapeHtml(cta)}</a></div>`
    : ""
}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid ${COLORS.border};font-size:12px;color:${COLORS.muted};">
<p style="margin:0;">Você está recebendo este email porque é admin ou gestor de um tenant no SaaS Galpão.</p>
<p style="margin:8px 0 0 0;"><a href="${APP_URL}" style="color:${COLORS.primary};text-decoration:none;">${APP_URL.replace(/^https?:\/\//, "")}</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderAlertEmail({
  titulo,
  mensagem,
  severidade,
  tipo,
  refType,
  refId,
}: {
  titulo: string;
  mensagem: string;
  severidade: string;
  tipo: string;
  refType?: string | null;
  refId?: string | null;
}): string {
  const accent = severityColor(severidade);
  const sevLabel = severityLabel(severidade);
  let ctaUrl: string | undefined;
  let cta: string | undefined;

  if (refType === "contrato" && refId) {
    ctaUrl = `${APP_URL}/contratos/${refId}`;
    cta = "Ver contrato";
  } else if (refType === "documento" && refId) {
    ctaUrl = `${APP_URL}/galpoes`;
    cta = "Ver documentos";
  } else if (refType === "galpao" && refId) {
    ctaUrl = `${APP_URL}/galpoes/${refId}`;
    cta = "Ver galpão";
  } else {
    ctaUrl = `${APP_URL}/alertas`;
    cta = "Ver alertas";
  }

  const body = `
<div style="display:inline-block;background:${accent};color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;margin-bottom:12px;">${sevLabel}</div>
<p style="margin:0;font-size:15px;line-height:1.6;">${escapeHtml(mensagem)}</p>
<p style="margin:16px 0 0 0;font-size:13px;color:${COLORS.muted};">Tipo: <strong>${escapeHtml(tipo.replace(/_/g, " "))}</strong></p>
`;

  return baseTemplate({
    preheader: titulo,
    title: titulo,
    body,
    cta,
    ctaUrl,
    accent,
  });
}

export function renderTestEmail(toName: string): string {
  return baseTemplate({
    preheader: "Email de teste — configuração OK",
    title: "📧 Email configurado com sucesso",
    body: `
<p style="margin:0;">Olá <strong>${escapeHtml(toName)}</strong>,</p>
<p style="margin:16px 0 0 0;">Este é um email de teste do <strong>SaaS Galpão</strong>. Se você está lendo isso, significa que:</p>
<ul style="margin:12px 0;padding-left:20px;">
<li>O Resend está configurado corretamente</li>
<li>O envio de notificações está funcionando</li>
<li>Seus clientes receberão alertas automaticamente</li>
</ul>
<p style="margin:16px 0 0 0;font-size:13px;color:${COLORS.muted};">Próximos passos: configurar domínio próprio em <em>resend.com/domains</em> pra mandar de <code>notif@saasgalpao.com.br</code> ao invés do domínio de teste.</p>
`,
    cta: "Abrir o app",
    ctaUrl: APP_URL,
    accent: COLORS.primary,
  });
}

// Helper pra buscar emails dos admins/gestores ativos de um tenant
import { prisma } from "@/lib/prisma";

export async function getTenantNotifyEmails(tenantId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: ["ADMIN", "GESTOR"] },
      active: true,
    },
    select: { email: true },
  });
  return users.map((u) => u.email);
}
