import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session-auth";

const SAFE_FILENAME = /^[A-Za-z0-9._-]{1,128}$/;

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const { filename } = await params;
  if (!SAFE_FILENAME.test(filename)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
  const filePath = path.resolve(uploadsDir, filename);

  // Path traversal protection.
  if (!filePath.startsWith(uploadsDir + path.sep)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  if (!existsSync(filePath)) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new NextResponse("Unsupported", { status: 415 });
  }

  const buffer = await readFile(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
