"use client";

import { Building2, Info, Package, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** App-wide release info. Update on each release. */
export const APP_VERSION = "v1.0";
export const APP_PIC = "Aldi Farhan F.";
export const APP_NAME = "MIA Inventory";
export const APP_DEPARTMENT = "PT Indonesia Epson Industry · Departemen MIA";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RowProps {
  Icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconClass: string;
  label: string;
  children: React.ReactNode;
}

function Row({ Icon, iconBg, iconClass, label, children }: RowProps) {
  return (
    <div className="flex items-center gap-3 border-b py-3 last:border-0">
      <div className={`rounded-md p-2 ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );
}

/** Reusable About / Tentang Aplikasi dialog — release info & contact. */
export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/15 p-2 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle>Tentang {APP_NAME}</DialogTitle>
              <DialogDescription>
                Aplikasi manajemen inventaris untuk Departemen MIA.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-1">
          <Row
            Icon={Info}
            iconBg="bg-chart-1/15"
            iconClass="text-chart-1"
            label="Versi"
          >
            <span className="inline-flex items-center gap-2">
              <span className="tabular-nums">{APP_VERSION}</span>
              <Badge variant="info">Production</Badge>
            </span>
          </Row>
          <Row
            Icon={UserCircle}
            iconBg="bg-chart-2/15"
            iconClass="text-chart-2"
            label="PIC"
          >
            {APP_PIC}
          </Row>
          <Row
            Icon={Building2}
            iconBg="bg-chart-3/15"
            iconClass="text-chart-3"
            label="Departemen"
          >
            <span className="text-sm">{APP_DEPARTMENT}</span>
          </Row>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {APP_DEPARTMENT}
        </p>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
