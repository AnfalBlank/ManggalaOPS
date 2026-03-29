import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { requireRole } from "@/lib/auth";

export async function POST() {
  try {
    await requireRole(["admin"]);
    await db.run(sql`DELETE FROM journal_entries;`);
    await db.run(sql`DELETE FROM journals;`);
    await db.run(sql`DELETE FROM opening_balances;`);
    return NextResponse.json({ ok: true, message: "Nominal accounting runtime berhasil direset. Master COA tetap aman." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to reset accounting runtime" }, { status: 500 });
  }
}
