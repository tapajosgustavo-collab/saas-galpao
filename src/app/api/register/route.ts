import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registroSchema } from "@/lib/validators/financeiro";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registroSchema.parse(body);

    const exists = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 },
      );
    }

    const baseSlug = slugify(data.empresa) || "empresa";
    let slug = baseSlug;
    for (let i = 0; i < 5; i++) {
      const collision = await prisma.tenant.findUnique({ where: { slug } });
      if (!collision) break;
      slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const tenant = await prisma.tenant.create({
      data: {
        name: data.empresa,
        slug,
        users: {
          create: {
            email: data.email.toLowerCase(),
            name: data.nome,
            passwordHash,
            role: Role.ADMIN,
          },
        },
      },
    });

    return NextResponse.json({ tenantId: tenant.id }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
