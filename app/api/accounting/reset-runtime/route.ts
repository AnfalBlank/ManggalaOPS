import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { toErrorResponse } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

export async function POST() {
  try {
    const { user } = await requireRole(["admin"]);
    if (process.env.NODE_ENV === "production" && process.env.MANGGALA_ALLOW_RESET !== "true") {
      return NextResponse.json(
        { error: "Endpoint reset runtime dinonaktifkan di production. Set MANGGALA_ALLOW_RESET=true untuk mengaktifkan sementara." },
        { status: 403 },
      );
    }
    await db.run(sql`DELETE FROM journal_entries;`);
    await db.run(sql`DELETE FROM journals;`);
    await db.run(sql`DELETE FROM opening_balances;`);
    await audit({ userId: user.id, action: "accounting.reset", entity: "accounting" });
    return NextResponse.json({ ok: true, message: "Nominal accounting runtime berhasil direset. Master COA tetap aman." });
  } catch (error) {
    return toErrorResponse(error, "Failed to reset accounting runtime");
  }
}
