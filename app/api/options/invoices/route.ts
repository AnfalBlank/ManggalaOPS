import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { getClientOptions, getInvoiceOptions } from "@/lib/options";

export async function GET() {
  try {
    await requireRole(["admin", "finance", "sales"]);
    const data = await getInvoiceOptions();
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch invoice options");
  }
}
