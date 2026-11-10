import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/data";

export async function GET() {
  try {
    await requireRole(["admin", "finance", "sales", "project_manager"]);
    const data = await getDashboardSummary();
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Gagal ngambil ringkasan Beranda");
  }
}
