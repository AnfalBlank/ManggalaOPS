import { NextResponse } from "next/server";

import { ForbiddenError, UnauthorizedError } from "@/lib/auth";

/**
 * Convert any thrown error into a consistent NextResponse.
 * Unauthorized → 401, Forbidden → 403, ValidationError pattern → 400, else 500.
 * Never leaks raw stack traces.
 */
export function toErrorResponse(error: unknown, fallback = "Internal server error") {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
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
