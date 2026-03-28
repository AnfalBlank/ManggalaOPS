import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/data";

export async function GET() {
  try {
    const data = await getDashboardSummary();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch dashboard summary" },
      { status: 500 },
    );
  }
}
