import { redirect } from "next/navigation";
import Image from "next/image";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Standalone forced password-change page (first login / after reset). */
export default async function ForcedChangePasswordPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!session.user.mustChangePassword) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <Image
        src="/Epson_logo.svg"
        alt="Epson"
        width={110}
        height={32}
        className="dark:brightness-0 dark:invert"
        priority
      />
      <ChangePasswordForm forced />
    </main>
  );
}
