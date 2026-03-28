import { NextResponse } from "next/server";
import { getLeads } from "@/lib/data";

export async function GET() {
  try {
    const data = await getLeads();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch leads" },
      { status: 500 },
    );
  }
}
