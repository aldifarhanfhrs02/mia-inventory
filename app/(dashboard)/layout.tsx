import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getServerSession } from "@/lib/auth/session";

/** Authenticated shell. Guards the session and the forced password change. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/change-password");

  return <AppShell user={session.user}>{children}</AppShell>;
}
