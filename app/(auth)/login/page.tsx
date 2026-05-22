import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { WarehouseIllustration } from "@/components/auth/warehouse-illustration";

/** Login — split card: warehouse illustration + NIK/password form. */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-md md:grid-cols-[1.15fr_380px]">
        <div className="hidden items-center justify-center bg-muted/50 p-6 md:flex">
          <WarehouseIllustration />
        </div>
        <div className="flex flex-col justify-center gap-6 p-8">
          <Image
            src="/Epson_logo.svg"
            alt="Epson"
            width={96}
            height={28}
            className="dark:brightness-0 dark:invert"
            priority
          />
          <div>
            <h1 className="text-xl font-semibold">MIA Inventory</h1>
            <p className="text-sm text-muted-foreground">
              Departemen Manufacturing Innovation &amp; Automation
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
