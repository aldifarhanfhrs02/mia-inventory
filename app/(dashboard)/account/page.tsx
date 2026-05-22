import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AccountClient } from "@/components/account/account-client";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader title="Account" subtitle="Profil dan keamanan akun" />
      <AccountClient
        nik={user.nik}
        fullName={user.fullName}
        role={user.role}
        status={user.status}
        lastLoginAt={user.lastLoginAt}
        createdAt={user.createdAt}
      />
    </>
  );
}
