import { RoleGuard } from "@/components/auth/guard";
import { ChatCenter } from "@/components/chat/chat-center";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ErrorState } from "@/components/ui/state";
import { db } from "@/db";
import { projects, users } from "@/db/schema";

export default async function ChatPage() {
  try {
    const [userRows, projectRows] = await Promise.all([
      db.select({ id: users.id, name: users.name }).from(users),
      db.select({ id: projects.id, name: projects.name }).from(projects),
    ]);

    return (
      <PageWrapper>
        <RoleGuard allow={["admin", "sales", "finance", "project_manager"]}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Internal Chat</h1>
            <p className="text-muted-foreground mt-1">Chat antar user, broadcast internal, dan grup obrolan per project.</p>
          </div>
          <ChatCenter users={userRows} projects={projectRows} />
        </RoleGuard>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat chat" description={error instanceof Error ? error.message : "Terjadi error saat memuat chat center."} />
      </PageWrapper>
    );
  }
}
