import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    await requireRole(["admin"]);
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Seed endpoint disabled in production" }, { status: 403 });
    }
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to seed database",
      },
      { status: 500 },
    );
  }
}
