import { RoleGuard } from "@/components/auth/guard";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { UserManagement } from "@/components/users/user-management";
import { getUsersData } from "@/lib/admin-data";

export default async function UsersPage() {
  try {
    const users = await getUsersData();

    return (
      <PageWrapper>
        <RoleGuard allow={["admin"]}>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Pengguna</h1>
            <p className="text-muted-foreground mt-1">Atur akun tim, jabatan, dan ganti password.</p>
          </div>
          {users.length === 0 ? (
            <div className="space-y-4">
              <EmptyState title="Belum ada pengguna" description="Tambah akun tim pertama dari halaman ini." />
              <UserManagement users={users} />
            </div>
          ) : (
            <UserManagement users={users} />
          )}
        </RoleGuard>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat pengguna" description={error instanceof Error ? error.message : "Ada masalah pas ngambil data pengguna."} />
      </PageWrapper>
    );
  }
}
