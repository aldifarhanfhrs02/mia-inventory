import { LoginForm } from "@/components/auth/login-form";
import { WarehouseIllustration } from "@/components/auth/warehouse-illustration";

/** Login — split card: animated warehouse illustration + NIK/password form. */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[18px] border shadow-md md:grid-cols-[1.15fr_380px]">
        {/* Left — warehouse illustration */}
        <div className="hidden items-center justify-center bg-muted p-10 md:flex">
          <WarehouseIllustration />
        </div>
        {/* Right — login form */}
        <div className="flex items-center justify-center bg-card px-10 py-12">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
