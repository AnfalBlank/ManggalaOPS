import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const ALLOWED_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales", "project_manager"]);
    const data = await req.formData();
    const file = data.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: `Ukuran file melebihi ${MAX_BYTES / 1024 / 1024} MB` }, { status: 413 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Tipe file tidak diizinkan. Hanya jpg, png, webp, atau pdf." }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = ALLOWED_EXT[file.type] ?? ".bin";
    const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const uploadPath = path.join(uploadsDir, filename);
    // Defense in depth: ensure final path is within uploadsDir.
    if (!uploadPath.startsWith(uploadsDir + path.sep)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    await writeFile(uploadPath, buffer);

    await audit({ userId: user.id, action: "upload.create", entity: "upload", entityId: filename, payload: { mime: file.type, size: file.size } });
    return NextResponse.json({ url: `/api/uploads/${filename}`, filename, size: file.size });
  } catch (error) {
    return toErrorResponse(error, "Upload failed");
  }
}
