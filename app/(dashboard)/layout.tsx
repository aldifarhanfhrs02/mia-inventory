import { AppShell } from "@/components/layout/app-shell";
import type { UserRole } from "@/lib/types";

/**
 * Authenticated shell layout. Phase 3 replaces the placeholder user with the
 * real session from getServerSession() and adds the middleware auth guard.
 */
const PLACEHOLDER_USER: { nik: string; fullName: string; role: UserRole } = {
  nik: "ADM001",
  fullName: "Aldi Nugroho",
  role: "admin",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell user={PLACEHOLDER_USER}>{children}</AppShell>;
}
