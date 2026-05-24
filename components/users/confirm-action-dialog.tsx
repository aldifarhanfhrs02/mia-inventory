"use client";

import {
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  UserCheck,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmKind =
  | "change-role-to-admin"
  | "change-role-to-user"
  | "reset-password"
  | "deactivate"
  | "activate";

interface Spec {
  title: string;
  description: (name: string) => string;
  confirmLabel: string;
  destructive: boolean;
  Icon: LucideIcon;
  iconBg: string;
  iconClass: string;
}

const SPECS: Record<ConfirmKind, Spec> = {
  "change-role-to-admin": {
    title: "Promote to Admin?",
    description: (n) =>
      `${n} will get full access including managing other users. Are you sure?`,
    confirmLabel: "Yes, make Admin",
    destructive: false,
    Icon: ShieldCheck,
    iconBg: "bg-primary/15",
    iconClass: "text-primary",
  },
  "change-role-to-user": {
    title: "Demote to User?",
    description: (n) =>
      `${n} will no longer be able to manage users or approve major transactions.`,
    confirmLabel: "Yes, demote to User",
    destructive: false,
    Icon: ShieldCheck,
    iconBg: "bg-chart-3/15",
    iconClass: "text-chart-3",
  },
  "reset-password": {
    title: "Reset password?",
    description: (n) =>
      `${n}'s password will be replaced with a temporary one shown only once. The user must change the password on their next login.`,
    confirmLabel: "Reset Password",
    destructive: false,
    Icon: KeyRound,
    iconBg: "bg-chart-3/15",
    iconClass: "text-chart-3",
  },
  deactivate: {
    title: "Deactivate user?",
    description: (n) =>
      `${n} will not be able to log in. Existing data is preserved and the user can be reactivated at any time.`,
    confirmLabel: "Yes, Deactivate",
    destructive: true,
    Icon: UserX,
    iconBg: "bg-destructive/15",
    iconClass: "text-destructive",
  },
  activate: {
    title: "Activate user?",
    description: (n) => `${n} will be able to log in to the application again.`,
    confirmLabel: "Yes, Activate",
    destructive: false,
    Icon: UserCheck,
    iconBg: "bg-chart-2/15",
    iconClass: "text-chart-2",
  },
};

export interface ConfirmRequest {
  kind: ConfirmKind;
  /** The target user's display name. */
  name: string;
  /** Async server action to run on confirm. */
  onConfirm: () => Promise<void>;
}

interface ConfirmActionDialogProps {
  request: ConfirmRequest | null;
  onClose: () => void;
}

/** Reusable confirmation gate for the destructive actions on the Users page. */
export function ConfirmActionDialog({
  request,
  onClose,
}: ConfirmActionDialogProps) {
  const [busy, setBusy] = useState(false);
  const spec = request ? SPECS[request.kind] : null;

  const handleConfirm = async () => {
    if (!request) return;
    setBusy(true);
    try {
      await request.onConfirm();
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <AlertDialog
      open={!!request}
      onOpenChange={(o) => {
        if (!o && !busy) onClose();
      }}
    >
      <AlertDialogContent className="max-w-md">
        {spec && (
          <>
            <AlertDialogHeader>
              <div className="flex items-start gap-3">
                <div className={cn("rounded-md p-2", spec.iconBg)}>
                  {spec.destructive ? (
                    <AlertTriangle
                      className={cn("h-5 w-5", spec.iconClass)}
                    />
                  ) : (
                    <spec.Icon className={cn("h-5 w-5", spec.iconClass)} />
                  )}
                </div>
                <div className="space-y-1">
                  <AlertDialogTitle>{spec.title}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {spec.description(request!.name)}
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirm();
                }}
                className={cn(
                  spec.destructive &&
                    buttonVariants({ variant: "destructive" }),
                )}
              >
                {busy ? "Processing…" : spec.confirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
