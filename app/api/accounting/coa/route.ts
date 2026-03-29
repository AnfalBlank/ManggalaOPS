import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { getCoaList, initializeDefaultCoa, updateAccount } from "@/lib/accounting";

export async function GET() {
  try {
    await requireRole(["admin", "finance"]);
    return NextResponse.json(await getCoaList());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch COA" }, { status: 500 });
  }
}

export async function POST() {
  try {
    await requireRole(["admin"]);
    return NextResponse.json({ ok: true, data: await initializeDefaultCoa() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to initialize COA" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(["admin"]);
    const body = await request.json();
    return NextResponse.json({ ok: true, data: await updateAccount({ code: String(body.code ?? "").trim(), name: String(body.name ?? "").trim(), type: String(body.type ?? "Asset").trim(), normalBalance: String(body.normalBalance ?? "Debit").trim() }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update account" }, { status: 500 });
  }
}
