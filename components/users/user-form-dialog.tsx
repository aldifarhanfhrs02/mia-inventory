"use client";

import { ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createUser } from "@/lib/actions/users.actions";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the generated temp password when creation succeeds. */
  onCreated: (result: { fullName: string; tempPassword: string }) => void;
}

/** A labelled form field — mirror of the helper used in part-form-dialog. */
function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const ROLES = [
  { value: "user", label: "User", Icon: User },
  { value: "admin", label: "Admin", Icon: ShieldCheck },
] as const;

/** Add-user dialog — NIK + Nama + Role selector. Generates a temp password. */
export function UserFormDialog({
  open,
  onOpenChange,
  onCreated,
}: UserFormDialogProps) {
  const [nik, setNik] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setNik("");
    setFullName("");
    setRole("user");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    setBusy(true);
    const res = await createUser({ nik, fullName, role });
    setBusy(false);
    if (res.ok) {
      onCreated({ fullName, tempPassword: res.data.tempPassword });
      reset();
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  };

  const canSubmit = !busy && nik.trim().length >= 3 && fullName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            A temporary password will be generated automatically and shown only once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Employee ID" required hint="Minimum 3 characters, unique per user">
            <Input
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              className="tabular-nums"
              placeholder="e.g. EMP1234"
            />
          </Field>

          <Field label="Full Name" required>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aldi Nugroho"
            />
          </Field>

          <Field label="Role" required>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(({ value, label, Icon }) => {
                const active = role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md border py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-accent",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            {busy ? "Saving…" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
