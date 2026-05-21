import "server-only";
import type { UserRole } from "@/lib/types";

/** The authenticated user as exposed to server components and actions. */
export interface SessionUser {
  id: string;
  nik: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export interface Session {
  user: SessionUser;
}

/**
 * Resolve the current session.
 *
 * TODO(phase-3): replace this placeholder with the real Better Auth lookup
 * (`auth.api.getSession({ headers })`). Until then it returns the seeded
 * superadmin so server actions and pages can be built and type-checked.
 */
export async function getServerSession(): Promise<Session | null> {
  return {
    user: {
      id: "placeholder-admin",
      nik: "ADM001",
      fullName: "Aldi Nugroho",
      role: "admin",
      mustChangePassword: false,
    },
  };
}

/** True when the session user may perform admin-only mutations. */
export function isAdmin(session: Session | null): boolean {
  return session?.user.role === "admin" || session?.user.role === "superadmin";
}
