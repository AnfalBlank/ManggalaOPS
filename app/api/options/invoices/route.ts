import { NextResponse } from "next/server";
import { getInvoiceOptions } from "@/lib/options";

export async function GET() {
  try {
    const data = await getInvoiceOptions();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch invoice options" },
      { status: 500 },
    );
  }
}
