"use client";

import { AlertTriangle, Copy, Eye, EyeOff } from "lucide-react";
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

export interface TempPasswordPayload {
  title: string;
  password: string;
}

interface TempPasswordDialogProps {
  payload: TempPasswordPayload | null;
  onClose: () => void;
}

const MASK = "••••••••••";

/** Inner content — keyed by payload.password so each reveal session resets state. */
function RevealContent({
  payload,
  onClose,
}: {
  payload: TempPasswordPayload;
  onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload.password);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy password");
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-chart-3/15 p-2 text-chart-3">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <DialogTitle>{payload.title}</DialogTitle>
            <DialogDescription>
              This password will only be shown once. Record it now or copy and
              give it to the user.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="flex items-center gap-2">
        <p className="flex-1 rounded-md border border-dashed bg-muted/50 px-4 py-3 text-center font-mono text-xl font-semibold tracking-wider tabular-nums">
          {revealed ? payload.password : MASK}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "Hide password" : "Show password"}
          className="h-12 w-12"
        >
          {revealed ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          aria-label="Copy password"
          className="h-12 w-12"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {copied
          ? "✓ Copied to clipboard"
          : revealed
            ? "The user will be required to change the password on first login."
            : "Click the eye icon to reveal the password."}
      </p>

      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </>
  );
}

/** One-shot reveal dialog for the generated temp password (create / reset). */
export function TempPasswordDialog({ payload, onClose }: TempPasswordDialogProps) {
  return (
    <Dialog open={!!payload} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {payload && (
          <RevealContent
            key={payload.password}
            payload={payload}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
