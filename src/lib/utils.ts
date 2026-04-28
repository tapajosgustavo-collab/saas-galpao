import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  const n = typeof value === "string" ? Number(value) : value;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}
