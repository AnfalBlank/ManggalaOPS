import { NextRequest, NextResponse } from "next/server";

import { ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { ChatAccessError, getThreadMessages, sendChatMessage } from "@/lib/chat";
import { getCurrentUser } from "@/lib/session-auth";

function chatErrorToResponse(error: unknown) {
  if (error instanceof ChatAccessError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  return toErrorResponse(error, "Failed to handle chat request");
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { threadId } = await params;
    const id = ensurePositiveInt(threadId, "thread id");
    return NextResponse.json(await getThreadMessages(id, user.id));
  } catch (error) {
    return chatErrorToResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { threadId } = await params;
    const id = ensurePositiveInt(threadId, "thread id");
    const body = await request.json();
    const message = trimString(body.body, 5000);
    if (!message) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }
    await sendChatMessage(id, user.id, message);
    return NextResponse.json({ ok: true, data: await getThreadMessages(id, user.id) });
  } catch (error) {
    return chatErrorToResponse(error);
  }
}
