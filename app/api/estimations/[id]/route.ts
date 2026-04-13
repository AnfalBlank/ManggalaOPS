import { NextResponse } from "next/server";
import { db } from "@/db";
import { estimations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.delete(estimations).where(eq(estimations.id, Number(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete estimation:", error);
    return NextResponse.json({ error: "Failed to delete estimation" }, { status: 500 });
  }
}
