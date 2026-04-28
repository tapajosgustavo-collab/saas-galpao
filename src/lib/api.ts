import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ForbiddenError, UnauthorizedError } from "@/lib/tenant";

export function apiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation error", issues: error.flatten() },
      { status: 400 },
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Registro duplicado" }, { status: 409 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
    }
  }
  console.error("[API ERROR]", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
