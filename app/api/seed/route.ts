import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production" && process.env.MANGGALA_ALLOW_SEED !== "true") {
      return NextResponse.json({ error: "Isi data contoh dimatiin" }, { status: 403 });
    }
    const { user } = await requireRole(["admin"]);
    const result = await seedDatabase();
    await audit({ userId: user.id, action: "database.seed", entity: "database" });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error, "Gagal isi data contoh");
  }
}
