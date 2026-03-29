import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { parseMoneyInput } from "@/lib/money";
import { getOpeningBalance, saveOpeningBalance } from "@/lib/opening-balance";

export async function GET() {
  try {
    await requireRole(["admin", "finance"]);
    return NextResponse.json(await getOpeningBalance());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch opening balance" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin", "finance"]);
    const body = await request.json();
    const data = await saveOpeningBalance({
      cashOnHand: parseMoneyInput(body.cashOnHand),
      bankMandiri: parseMoneyInput(body.bankMandiri),
      bankBca: parseMoneyInput(body.bankBca),
      receivables: parseMoneyInput(body.receivables),
      fixedAssets: parseMoneyInput(body.fixedAssets),
      liabilities: parseMoneyInput(body.liabilities),
      equity: parseMoneyInput(body.equity),
    });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save opening balance" }, { status: 500 });
  }
}
