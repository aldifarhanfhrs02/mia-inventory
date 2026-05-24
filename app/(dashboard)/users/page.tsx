import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { UsersClient } from "@/components/users/users-client";
import { getUsers } from "@/lib/actions/users.actions";
import { getServerSession, isAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!isAdmin(session)) redirect("/dashboard");

  const { rows, summary } = await getUsers();

  return (
    <>
      <PageHeader title="User Management" subtitle="Manage user accounts" />
      <UsersClient rows={rows} summary={summary} />
    </>
  );
}
