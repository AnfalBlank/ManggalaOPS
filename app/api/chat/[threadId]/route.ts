import { NextRequest, NextResponse } from "next/server";

import { getThreadMessages, sendChatMessage } from "@/lib/chat";
import { getCurrentUser } from "@/lib/session-auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { threadId } = await params;
  return NextResponse.json(await getThreadMessages(Number(threadId)));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { threadId } = await params;
    const body = await request.json();
    await sendChatMessage(Number(threadId), user.id, String(body.body ?? "").trim());
    return NextResponse.json({ ok: true, data: await getThreadMessages(Number(threadId)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to send message" }, { status: 500 });
  }
}
