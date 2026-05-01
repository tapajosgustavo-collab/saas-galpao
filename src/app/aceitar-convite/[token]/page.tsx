import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { AcceptInviteForm } from "./form";

interface InviteData {
  email: string;
  name: string;
  role: string;
  empresa: string;
}

interface InviteError {
  error: string;
}

async function fetchInvite(
  token: string,
): Promise<{ ok: true; data: InviteData } | { ok: false; error: string }> {
  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/invite/${token}`, {
    cache: "no-store",
  });
  if (res.ok) {
    return { ok: true, data: (await res.json()) as InviteData };
  }
  const j = (await res.json().catch(() => ({}))) as InviteError;
  return { ok: false, error: j.error ?? "Convite invalido" };
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  FINANCEIRO: "Financeiro",
};

export default async function AceitarConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await fetchInvite(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building2 className="mx-auto mb-2 h-8 w-8 text-primary" />
          <CardTitle>Aceitar convite</CardTitle>
          {result.ok && (
            <CardDescription>
              Voce foi convidado para entrar em{" "}
              <strong>{result.data.empresa}</strong> como{" "}
              <strong>{ROLE_LABEL[result.data.role] ?? result.data.role}</strong>.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {!result.ok ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {result.error}
            </div>
          ) : (
            <AcceptInviteForm
              token={token}
              email={result.data.email}
              name={result.data.name}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
