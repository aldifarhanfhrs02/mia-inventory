import Image from "next/image";

/** Login stub — the full split-card form + warehouse art arrive in Phase 10. */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8 shadow-md">
        <Image
          src="/Epson_logo.svg"
          alt="Epson"
          width={96}
          height={28}
          className="dark:brightness-0 dark:invert"
          priority
        />
        <h1 className="text-xl font-semibold">MIA Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Login form arrives in Phase 10.
        </p>
      </div>
    </main>
  );
}
