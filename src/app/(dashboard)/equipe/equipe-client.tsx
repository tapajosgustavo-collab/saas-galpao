"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, UserPlus, Check } from "lucide-react";

interface UsuarioRow {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "GESTOR" | "FINANCEIRO";
  active: boolean;
  pending: boolean;
  inviteExpires: string | null;
  createdAt: string;
}

interface InviteResult {
  email: string;
  acceptUrl: string;
  expiresAt: string;
}

export function EquipeClient({
  currentUserId,
  usuarios,
}: {
  currentUserId: string;
  usuarios: UsuarioRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [lastInvite, setLastInvite] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function onInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLastInvite(null);
    setInviting(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/usuarios/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        name: fd.get("name"),
        role: fd.get("role"),
      }),
    });
    setInviting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao convidar");
      return;
    }
    const data = (await res.json()) as InviteResult;
    setLastInvite(data);
    (e.currentTarget as HTMLFormElement).reset();
    router.refresh();
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function toggleActive(u: UsuarioRow) {
    if (u.id === currentUserId) {
      alert("Voce nao pode desativar a propria conta.");
      return;
    }
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erro ao atualizar");
      return;
    }
    router.refresh();
  }

  async function changeRole(u: UsuarioRow, role: string) {
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erro ao mudar papel");
      return;
    }
    router.refresh();
  }

  async function remove(u: UsuarioRow) {
    if (u.id === currentUserId) {
      alert("Voce nao pode remover a propria conta.");
      return;
    }
    if (!confirm(`Remover ${u.email}? Esta acao nao pode ser desfeita.`)) {
      return;
    }
    const res = await fetch(`/api/usuarios/${u.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erro ao remover");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-5 w-5 text-primary" />
            Convidar novo membro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onInvite} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="email@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" required maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Papel</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue="GESTOR"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="GESTOR">Gestor</option>
                  <option value="FINANCEIRO">Financeiro</option>
                </select>
              </div>
            </div>
            {error && (
              <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>
            )}
            <Button type="submit" disabled={inviting}>
              {inviting ? "Gerando..." : "Gerar convite"}
            </Button>
          </form>

          {lastInvite && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm">
              <p className="font-medium text-green-900">
                Convite gerado para {lastInvite.email}
              </p>
              <p className="mt-1 text-xs text-green-700">
                Expira em{" "}
                {new Date(lastInvite.expiresAt).toLocaleDateString("pt-BR")}.
                Compartilhe o link abaixo com a pessoa.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs">
                  {lastInvite.acceptUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyLink(lastInvite.acceptUrl)}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membros do tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Papel</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const isMe = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3">
                        {u.email}
                        {isMe && (
                          <span className="ml-1 text-xs text-slate-400">
                            (voce)
                          </span>
                        )}
                      </td>
                      <td className="py-3">{u.name}</td>
                      <td className="py-3">
                        <select
                          value={u.role}
                          disabled={isMe}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="GESTOR">Gestor</option>
                          <option value="FINANCEIRO">Financeiro</option>
                        </select>
                      </td>
                      <td className="py-3">
                        {u.pending ? (
                          <Badge variant="warning">Convite pendente</Badge>
                        ) : u.active ? (
                          <Badge variant="success">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Desativado</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {!u.pending && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isMe}
                              onClick={() => toggleActive(u)}
                            >
                              {u.active ? "Desativar" : "Ativar"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isMe}
                            onClick={() => remove(u)}
                            title={isMe ? "Voce nao pode remover a propria conta" : ""}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
