"use client";

import { CheckCircle2, ChevronLeft, Circle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/shared/password-input";
import { PasswordStrengthBar } from "@/components/shared/password-strength-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

interface ChangePasswordFormProps {
  /** Forced first-login change — hides old password + back button. */
  forced?: boolean;
  /** Rendered inside an outer Card (Account → Keamanan tab); skips own card chrome. */
  embedded?: boolean;
  onBack?: () => void;
}

/** A checklist item: muted when unmet, chart-2 when satisfied. */
function Requirement({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 text-xs",
        ok ? "text-chart-2" : "text-muted-foreground",
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Circle className="h-3.5 w-3.5" />
      )}
      {label}
    </li>
  );
}

/** Change-password form — reused by Account (embedded) and the forced flow. */
export function ChangePasswordForm({
  forced,
  embedded,
  onBack,
}: ChangePasswordFormProps) {
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
      toast.success("Password changed successfully");
      setOldPwd("");
      setNewPwd("");
      setConfirm("");
      if (forced) router.replace("/dashboard");
      else onBack?.();
    } else {
      toast.error(res.error);
    }
  };

  const body = (
    <>
      {!embedded && (
        <div className="flex items-center gap-2">
          {!forced && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md p-1 hover:bg-accent"
              aria-label="Back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <h2 className="text-lg font-semibold">Change Password</h2>
        </div>
      )}
      {forced && (
        <p className="text-sm text-muted-foreground">
          You must change your password before continuing.
        </p>
      )}

      {!forced && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            Old Password<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <PasswordInput
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            autoComplete="current-password"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          New Password<span className="ml-0.5 text-destructive">*</span>
        </Label>
        <PasswordInput
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
        />
        {newPwd && <PasswordStrengthBar password={newPwd} />}
        <ul className="mt-2 space-y-1">
          <Requirement ok={newPwd.length >= 8} label="Minimum 8 characters" />
          <Requirement
            ok={/[a-zA-Z]/.test(newPwd)}
            label="Contains letters"
          />
          <Requirement ok={/[0-9]/.test(newPwd)} label="Contains numbers" />
        </ul>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          Confirm Password<span className="ml-0.5 text-destructive">*</span>
        </Label>
        <PasswordInput
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          placeholder="Repeat new password"
        />
        {confirm && newPwd !== confirm && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <XCircle className="h-3.5 w-3.5" />
            Passwords don't match
          </p>
        )}
        {confirm && newPwd === confirm && (
          <p className="flex items-center gap-1.5 text-xs text-chart-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Passwords match
          </p>
        )}
      </div>

      <Button
        className="w-full"
        disabled={saving || !newPwd || newPwd !== confirm}
        onClick={submit}
      >
        {saving ? "Saving…" : "Save Password"}
      </Button>
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{body}</div>;
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-4 p-6">{body}</CardContent>
    </Card>
  );
}
