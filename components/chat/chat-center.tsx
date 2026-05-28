"use client";

import { CheckCircle2, MessageSquareText, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ThreadRow = { id: number; title: string; kind: string; latestMessage: string; latestAt?: string | null };
type MessageRow = { id: number; body: string; createdAt?: string | null; senderUserId: number; senderName: string };

type UserOption = { id: number; name: string };
type ProjectOption = { id: number; name: string; clientName?: string };

export function ChatCenter({ users, projects }: { users: UserOption[]; projects: ProjectOption[] }) {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatType, setChatType] = useState("direct");
  const [title, setTitle] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [groupParticipants, setGroupParticipants] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedThread = useMemo(() => threads.find((thread) => thread.id === selectedThreadId) ?? null, [selectedThreadId, threads]);
  const selectedProjectName = projects.find((project) => String(project.id) === projectId)?.name;

  const loadThreads = async () => {
    const response = await fetch("/api/chat");
    const payload = await response.json();
    if (response.ok) {
      setThreads(payload);
      if (!selectedThreadId && payload[0]?.id) setSelectedThreadId(payload[0].id);
    } else {
      toast.error(payload.error ?? "Gagal memuat thread");
    }
  };

  const loadMessages = async (threadId: number) => {
    const response = await fetch(`/api/chat/${threadId}`);
    const payload = await response.json();
    if (response.ok) {
      setMessages(payload);
    } else {
      toast.error(payload.error ?? "Gagal memuat pesan");
      setMessages([]);
    }
  };

  useEffect(() => { loadThreads(); }, []);
  useEffect(() => { if (selectedThreadId) loadMessages(selectedThreadId); }, [selectedThreadId]);

  // Refresh messages every 8 seconds while a thread is selected (lightweight polling).
  useEffect(() => {
    if (!selectedThreadId) return;
    const interval = setInterval(() => loadMessages(selectedThreadId), 8000);
    return () => clearInterval(interval);
  }, [selectedThreadId]);

  const toggleParticipant = (id: number) =>
    setGroupParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const handleCreate = async () => {
    try {
      setCreating(true);
      let body: Record<string, unknown>;
      if (chatType === "direct") {
        if (!targetUserId) {
          toast.error("Pilih user tujuan");
          return;
        }
        body = { action: "create-direct", title: title || "Direct Chat", userIds: [Number(targetUserId)] };
      } else if (chatType === "project") {
        if (!projectId) {
          toast.error("Pilih project");
          return;
        }
        const memberIds = groupParticipants.length > 0 ? groupParticipants : users.map((u) => u.id);
        body = { action: "create-project-group", title: title || "Project Group", projectId: Number(projectId), userIds: memberIds };
      } else {
        body = { action: "create-broadcast", title: title || "Broadcast Internal" };
      }

      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.error ?? "Gagal membuat chat");
        return;
      }
      toast.success("Chat thread berhasil dibuat");
      setTitle("");
      setTargetUserId("");
      setProjectId("");
      setGroupParticipants([]);
      await loadThreads();
      if (payload.threadId) setSelectedThreadId(payload.threadId);
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async () => {
    if (!selectedThreadId || !newMessage.trim()) return;
    try {
      setSending(true);
      const response = await fetch(`/api/chat/${selectedThreadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMessage }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.error ?? "Gagal kirim pesan");
        return;
      }
      setMessages(payload.data ?? []);
      setNewMessage("");
      await loadThreads();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
      <Card>
        <CardHeader><CardTitle>Chat Center</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipe Chat</Label>
            <Select value={chatType} onValueChange={(value) => setChatType(value ?? "direct")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Direct Message</SelectItem>
                <SelectItem value="broadcast">Broadcast (semua user)</SelectItem>
                <SelectItem value="project">Project Group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Judul Chat</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Broadcast Tim Sales" />
          </div>

          {chatType === "direct" ? (
            <div className="space-y-2">
              <Label>Pilih User</Label>
              <Select value={targetUserId} onValueChange={(value) => setTargetUserId(value ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih user" /></SelectTrigger>
                <SelectContent>
                  {users.map((user) => <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {chatType === "project" ? (
            <>
              <div className="space-y-2">
                <Label>Pilih Project</Label>
                <Select value={projectId} onValueChange={(value) => setProjectId(value ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih project">{selectedProjectName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.name}{project.clientName ? ` — ${project.clientName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Anggota (kosongkan = semua user)</Label>
                <div className="rounded-lg border max-h-40 overflow-y-auto p-2 space-y-1">
                  {users.map((user) => {
                    const checked = groupParticipants.includes(user.id);
                    return (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => toggleParticipant(user.id)}
                        className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-left transition-colors ${
                          checked ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        }`}
                      >
                        <span>{user.name}</span>
                        {checked ? <CheckCircle2 className="size-4" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          <Button className="w-full" disabled={creating} onClick={handleCreate}>
            {creating ? "Membuat..." : "Buat Chat"}
          </Button>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm font-medium">Daftar Thread</div>
            <Button variant="outline" size="sm" onClick={loadThreads}><RefreshCcw className="size-4" /></Button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Belum ada thread. Buat direct chat, broadcast, atau grup project dulu.
              </div>
            ) : threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  selectedThreadId === thread.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="font-medium">{thread.title}</div>
                <div className="text-xs text-muted-foreground uppercase">{thread.kind}</div>
                <div className="text-sm text-muted-foreground truncate mt-1">{thread.latestMessage}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedThread?.title ?? "Pilih thread chat"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/20 p-4 min-h-[420px] max-h-[520px] overflow-y-auto space-y-3">
            {!selectedThreadId ? (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquareText className="size-10 mb-3" />
                <div className="font-medium">Belum ada thread dipilih</div>
                <div className="text-sm mt-1">Pilih thread dari panel kiri atau buat chat baru.</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada pesan di thread ini.</div>
            ) : messages.map((message) => (
              <div key={message.id} className="rounded-lg bg-white border p-3">
                <div className="text-sm font-semibold">{message.senderName}</div>
                <div className="text-sm mt-1 whitespace-pre-wrap">{message.body}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tulis pesan..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button disabled={sending || !selectedThreadId || !newMessage.trim()} onClick={handleSend}>
              {sending ? "..." : "Kirim"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
