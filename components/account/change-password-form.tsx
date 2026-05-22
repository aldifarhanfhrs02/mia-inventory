"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/shared/password-input";
import { PasswordStrengthBar } from "@/components/shared/password-strength-bar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

interface ChangePasswordFormProps {
  /** Forced first-login change — hides old password + back button. */
  forced?: boolean;
  onBack?: () => void;
}

const req = (ok: boolean, label: string) => (
  <li className={cn("flex items-center gap-1.5", ok && "text-chart-2")}>
    <span>{ok ? "✓" : "○"}</span>
    {label}
  </li>
);

/** Change-password form — reused by the Account page and the forced flow. */
export function ChangePasswordForm({ forced, onBack }: ChangePasswordFormProps) {
  const router = useRouter();
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const res = await changePassword({
      oldPassword: forced ? undefined : oldPwd,
      newPassword: newPwd,
      confirmPassword: confirm,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Password berhasil diubah");
      if (forced) router.replace("/dashboard");
      else onBack?.();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2">
        {!forced && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Kembali"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <h2 className="text-lg font-semibold">Ganti Password</h2>
      </div>
      {forced && (
        <p className="text-sm text-muted-foreground">
          Anda harus mengganti password sebelum melanjutkan.
        </p>
      )}

      {!forced && (
        <div className="space-y-1.5">
          <Label>
            Password Lama<span className="text-destructive"> *</span>
          </Label>
          <PasswordInput
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>
          Password Baru<span className="text-destructive"> *</span>
        </Label>
        <PasswordInput
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
        />
        {newPwd && <PasswordStrengthBar password={newPwd} />}
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {req(newPwd.length >= 8, "Min 8 karakter")}
          {req(/[a-zA-Z]/.test(newPwd), "Mengandung huruf")}
          {req(/[0-9]/.test(newPwd), "Mengandung angka")}
        </ul>
      </div>

      <div className="space-y-1.5">
        <Label>
          Konfirmasi Password<span className="text-destructive"> *</span>
        </Label>
        <PasswordInput
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {confirm && newPwd !== confirm && (
          <p className="text-xs text-destructive">Password tidak cocok</p>
        )}
        {confirm && newPwd === confirm && (
          <p className="text-xs text-chart-2">✓ Password cocok</p>
        )}
      </div>

      <Button
        className="w-full"
        disabled={saving || !newPwd || newPwd !== confirm}
        onClick={submit}
      >
        {saving ? "Menyimpan…" : "Simpan Password"}
      </Button>
    </div>
  );
}
