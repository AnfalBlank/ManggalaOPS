import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { leads } from "@/db/schema";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId = Number(body.clientId);
    const serviceName = String(body.serviceName ?? "").trim();
    const estimatedValue = Number(body.estimatedValue ?? 0);
    const status = String(body.status ?? "New").trim() || "New";

    if (!clientId || !serviceName) {
      return NextResponse.json(
        { error: "clientId and serviceName are required" },
        { status: 400 },
      );
    }

    await db.insert(leads).values({
      clientId,
      serviceName,
      estimatedValue,
      status,
      createdAt: new Date(),
    });

    const data = await getLeads();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create lead" },
      { status: 500 },
    );
  }
}
