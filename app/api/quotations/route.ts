import { NextResponse } from "next/server";
import { getQuotations } from "@/lib/data";

export async function GET() {
  try {
    const data = await getQuotations();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch quotations" },
      { status: 500 },
    );
  }
}
