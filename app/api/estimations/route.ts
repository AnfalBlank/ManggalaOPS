import { NextResponse } from "next/server";
import { db } from "@/db";
import { estimations } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db.select().from(estimations).orderBy(desc(estimations.createdAt));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch estimations:", error);
    return NextResponse.json({ error: "Failed to fetch estimations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, buyPrice, sellPrice, qty, buyIncludePpn, sellIncludePpn, ppnRate } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama estimasi wajib diisi" }, { status: 400 });
    }

    const [newEstimation] = await db.insert(estimations).values({
      name,
      buyPrice: Number(buyPrice) || 0,
      sellPrice: Number(sellPrice) || 0,
      qty: Number(qty) || 1,
      buyIncludePpn: Boolean(buyIncludePpn),
      sellIncludePpn: Boolean(sellIncludePpn),
      ppnRate: Number(ppnRate) || 0,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json(newEstimation, { status: 201 });
  } catch (error) {
    console.error("Failed to save estimation:", error);
    return NextResponse.json({ error: "Failed to save estimation" }, { status: 500 });
  }
}
