import { NextResponse } from "next/server";

import { ForbiddenError, UnauthorizedError } from "@/lib/auth";

/**
 * Convert any thrown error into a consistent NextResponse.
 * Unauthorized → 401, Forbidden → 403, ValidationError pattern → 400, else 500.
 * Never leaks raw stack traces.
 */
export function toErrorResponse(error: unknown, fallback = "Ada masalah di server") {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const raw = error instanceof Error ? error.message : "";
  return NextResponse.json({ error: pesanError(raw, fallback) }, { status: 500 });
}

// Error database/teknis jangan bocor mentah (bahasa Inggris & detail SQL) ke layar.
function pesanError(raw: string, fallback: string) {
  if (/FOREIGN KEY/i.test(raw)) return "Data ini masih dipakai di data lain, jadi gak bisa dihapus/diubah.";
  if (/UNIQUE constraint/i.test(raw)) return "Data yang sama udah ada.";
  if (!raw || /SQLITE|libsql|Failed query|constraint|fetch failed|ECONN|TypeError|undefined|null/i.test(raw)) {
    console.error("[api]", raw);
    return /\b(gagal|tidak|belum|gak)\b/i.test(fallback) ? fallback : "Ada masalah di server. Coba lagi, kalau masih gagal kabari admin.";
  }
  return raw;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ValidationError(message);
}

export function ensurePositiveInt(value: unknown, label: string): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
    throw new ValidationError(`${label} harus bilangan bulat positif`);
  }
  return num;
}

export function trimString(value: unknown, max = 5000): string {
  return String(value ?? "").trim().slice(0, max);
}

export function nullableTrim(value: unknown, max = 5000): string | null {
  const trimmed = trimString(value, max);
  return trimmed.length === 0 ? null : trimmed;
}
