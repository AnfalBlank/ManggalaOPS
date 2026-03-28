import { RoleGuard } from "@/components/auth/guard";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { UserManagement } from "@/components/users/user-management";

async function getUsers() {
  const response = await fetch("http://localhost:3000/api/users", { cache: "no-store" });
  return response.json();
}

export default async function UsersPage() {
  try {
    const users = await getUsers();

    return (
      <PageWrapper>
        <RoleGuard allow={["admin"]}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-primary">User Management</h1>
            <p className="text-muted-foreground mt-1">Kelola akun, role, dan reset password user operasional.</p>
          </div>
          {users.length === 0 ? (
            <EmptyState title="Belum ada user" description="Tambahkan user operasional pertama dari halaman ini." />
          ) : (
            <UserManagement users={users} />
          )}
        </RoleGuard>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat users" description={error instanceof Error ? error.message : "Terjadi error saat memuat user management."} />
      </PageWrapper>
    );
  }
}
