"use client";

import { Lock, User, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth/actions";

/** NIK + password login form. */
export function LoginForm() {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
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
      router.replace(res.data.mustChangePassword ? "/change-password" : "/dashboard");
      router.refresh();
    } else {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-center text-lg font-semibold tracking-wide">
        USER LOGIN
      </h2>

      <div className="relative">
        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={nik}
          onChange={(e) => setNik(e.target.value)}
          placeholder="NIK"
          autoComplete="username"
          className="pl-9"
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="pl-9"
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={remember}
          onCheckedChange={(c) => setRemember(c === true)}
        />
        Remember me
      </label>

      <Button type="submit" className="w-full rounded-full" disabled={loading}>
        {loading ? "Memproses…" : "LOGIN"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Demo: <code className="font-mono">ADM001</code> /{" "}
        <code className="font-mono">admin123</code>
      </p>
    </form>
  );
}
