"use client";

import { Eye, EyeOff, Lock, User, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "@/lib/auth/actions";

/** NIK + password login form — matches the design prototype's pill fields. */
export function LoginForm() {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nik.trim() || !password.trim()) {
      setError("NIK dan password wajib diisi");
      return;
    }
    setLoading(true);
    const res = await signIn({ nik, password, remember });
    if (res.ok) {
      router.replace(
        res.data.mustChangePassword ? "/change-password" : "/dashboard",
      );
      router.refresh();
    } else {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[280px]">
      <h2 className="mb-7 text-center text-[15px] font-semibold tracking-[0.12em] text-primary">
        USER LOGIN
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* NIK */}
        <div className="flex items-center overflow-hidden rounded-full border border-input bg-muted transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/15">
          <span className="flex w-[42px] shrink-0 items-center justify-center text-muted-foreground">
            <User className="h-4 w-4" />
          </span>
          <input
            autoFocus
            value={nik}
            onChange={(e) => setNik(e.target.value)}
            placeholder="NIK"
            autoComplete="username"
            className="flex-1 bg-transparent py-3 pr-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Password */}
        <div className="flex items-center overflow-hidden rounded-full border border-input bg-muted transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/15">
          <span className="flex w-[42px] shrink-0 items-center justify-center text-muted-foreground">
            <Lock className="h-4 w-4" />
          </span>
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="flex-1 bg-transparent py-3 pr-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            tabIndex={-1}
            aria-label={showPwd ? "Sembunyikan password" : "Tampilkan password"}
            className="mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-primary"
          >
            {showPwd ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 rounded-lg border border-destructive/15 bg-destructive/[0.06] px-3 py-2 text-[12.5px] font-medium text-destructive">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-primary"
          />
          Remember me
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex h-[42px] w-full items-center justify-center rounded-full bg-primary text-[13px] font-bold tracking-[0.1em] text-primary-foreground shadow-[0_4px_14px_hsl(var(--primary)/0.25)] transition hover:-translate-y-px hover:opacity-95 disabled:translate-y-0 disabled:opacity-60"
        >
          {loading ? (
            <span className="h-[18px] w-[18px] animate-spin rounded-full border-[2.5px] border-white/30 border-t-white" />
          ) : (
            "LOGIN"
          )}
        </button>
      </form>

      <p className="mt-5 rounded-lg bg-muted px-3 py-2 text-center text-[11.5px] text-muted-foreground">
        Demo:{" "}
        <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary">
          ADM001
        </code>{" "}
        /{" "}
        <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary">
          admin123
        </code>
      </p>
    </div>
  );
}
