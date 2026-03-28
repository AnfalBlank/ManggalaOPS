import { NextResponse } from "next/server";
import { getPayments } from "@/lib/data";

export async function GET() {
  try {
    const data = await getPayments();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch payments" },
      { status: 500 },
    );
  }
}
