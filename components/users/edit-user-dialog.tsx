"use client";

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
import { updateUser } from "@/lib/actions/users.actions";

interface UserTarget {
  id: string;
  nik: string;
  fullName: string;
}

interface EditUserDialogProps {
  user: UserTarget | null;
  onClose: () => void;
}

/** Form field — mirror of the helper used in user-form-dialog. */
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

/** Inner form — keyed by user.id so React remounts (and resets state) per target. */
function EditUserForm({
  user,
  onClose,
}: {
  user: UserTarget;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState(user.fullName);
  const [busy, setBusy] = useState(false);

  const trimmed = fullName.trim();
  const dirty = trimmed.length > 0 && trimmed !== user.fullName;

  const handleSubmit = async () => {
    setBusy(true);
    const res = await updateUser(user.id, { fullName: trimmed });
    setBusy(false);
    if (res.ok) {
      toast.success("Name updated successfully");
      onClose();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit User Name</DialogTitle>
        <DialogDescription>
          Employee ID cannot be changed. To change role or status, use the
          action menu in the table.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <Field label="Employee ID" hint="Employee ID cannot be changed">
          <Input
            value={user.nik}
            disabled
            className="tabular-nums opacity-70"
          />
        </Field>

        <Field label="Full Name" required>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoFocus
            placeholder="e.g. Aldi Nugroho"
          />
        </Field>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!dirty || busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </>
  );
}

/** Edit-user dialog — only fullName is editable; NIK & role have their own controls. */
export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {user && <EditUserForm key={user.id} user={user} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
