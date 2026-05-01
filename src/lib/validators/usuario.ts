import { z } from "zod";
import { Role } from "@prisma/client";

export const inviteCreateSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(2).max(120),
  role: z.nativeEnum(Role),
});

export const inviteAcceptSchema = z.object({
  password: z.string().min(8).max(200),
});

export const usuarioUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
});

export type InviteCreateInput = z.infer<typeof inviteCreateSchema>;
