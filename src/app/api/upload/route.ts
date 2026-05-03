import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/tenant";
import { getSupabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";
import { apiError } from "@/lib/api";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
]);

const ALLOWED_FOLDERS = new Set([
  "manutencoes",
  "vistorias",
  "documentos",
  "geral",
]);

/**
 * POST /api/upload — multipart/form-data
 *   field: file (binary)
 *   field: folder (manutencoes | vistorias | documentos | geral)
 *
 * Faz upload no Supabase Storage com prefixo {tenantId}/{folder}/{uuid}.ext
 * e retorna a public URL pra ser salva na entidade dona.
 */
export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    const fd = await req.formData();
    const file = fd.get("file");
    const folderRaw = String(fd.get("folder") ?? "geral");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Campo 'file' obrigatorio" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Arquivo passa do limite de ${MAX_BYTES / 1024 / 1024}MB` },
        { status: 413 },
      );
    }
    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipo nao permitido: ${file.type}` },
        { status: 415 },
      );
    }
    const folder = ALLOWED_FOLDERS.has(folderRaw) ? folderRaw : "geral";

    const ext =
      file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
    const id = crypto.randomBytes(16).toString("hex");
    const path = `${ctx.tenantId}/${folder}/${id}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = getSupabaseAdmin();
    const { error: upErr } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });
    if (upErr) {
      console.error("[UPLOAD]", upErr);
      return NextResponse.json(
        { error: `Falha no upload: ${upErr.message}` },
        { status: 500 },
      );
    }

    const { data: pub } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({ url: pub.publicUrl, path });
  } catch (e) {
    return apiError(e);
  }
}
