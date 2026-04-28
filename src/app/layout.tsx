import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaaS Galpão — Gestão de Galpões Industriais",
  description:
    "Plataforma SaaS para gestão de galpões industriais: contratos, financeiro, ocupação e automações com IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
