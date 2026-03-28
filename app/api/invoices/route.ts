import { NextResponse } from "next/server";
import { getInvoices } from "@/lib/data";

export async function GET() {
  try {
    const data = await getInvoices();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}
