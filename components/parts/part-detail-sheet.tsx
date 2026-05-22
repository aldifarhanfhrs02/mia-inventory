"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { TypeBadge } from "@/components/shared/type-badge";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type {
  PartWithStock,
  PurchaseRecord,
  StockMovement,
} from "@/lib/types";

export interface PartDetail {
  part: PartWithStock;
  purchases: PurchaseRecord[];
  movements: StockMovement[];
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right", mono && "font-mono text-xs")}>
        {value ?? "—"}
      </span>
    </div>
  );
}

/** Slide-over part detail with Overview / Purchase / History tabs. */
export function PartDetailSheet({
  detail,
  onOpenChange,
}: {
  detail: PartDetail | null;
  onOpenChange: (open: boolean) => void;
}) {
  const p = detail?.part;
  const stockPct =
    p && p.maxStock && p.maxStock > 0
      ? Math.min((p.currentStock / p.maxStock) * 100, 100)
      : 0;

  return (
    <Sheet open={!!detail} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px]">
        {p && detail && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {p.partCode}
                </span>
                <StatusBadge
                  status={
                    p.status === "inactive" ? "inactive" : p.stockStatus
                  }
                />
              </div>
              <SheetTitle>{p.partName}</SheetTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {p.maker} · <TypeBadge type={p.type} />
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="px-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="purchase">
                  Purchase ({detail.purchases.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  History ({detail.movements.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="rounded-lg border p-3">
                  <p className="mb-1 text-sm font-semibold">Identitas Part</p>
                  <Row label="Maker" value={p.maker} />
                  <Row label="Type" value={<TypeBadge type={p.type} />} />
                  <Row label="Category" value={p.category} />
                  <Row label="Unit" value={p.unit} />
                </div>
                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-semibold">Informasi Stok</p>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Current Stock
                    </span>
                    <span className="font-mono text-lg font-bold">
                      {p.currentStock}
                    </span>
                  </div>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-chart-2"
                      style={{ width: `${stockPct}%` }}
                    />
                  </span>
                  <Row label="Min Stock" value={p.minStock} mono />
                  <Row label="Std Stock" value={p.stdStock ?? "—"} mono />
                  <Row label="Max Stock" value={p.maxStock ?? "—"} mono />
                </div>
                <div className="rounded-lg border p-3">
                  <p className="mb-1 text-sm font-semibold">
                    Lokasi Penyimpanan
                  </p>
                  {p.storageType ? (
                    <>
                      <Row label="Alamat" value={p.storageAddr} mono />
                      <Row label="Barcode" value={p.barcode ?? "—"} mono />
                    </>
                  ) : (
                    <p className="py-2 text-sm text-muted-foreground">
                      Belum ada lokasi — part berstatus unassigned.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="purchase">
                {detail.purchases.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Belum ada data purchase.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.purchases.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-md border p-2.5 text-sm"
                      >
                        <div>
                          <p className="font-medium">{r.supplier ?? "—"}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {formatDate(r.requestDate)} · Qty {r.qtyOrdered}
                          </p>
                        </div>
                        <Badge variant="secondary">{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                {detail.movements.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Belum ada riwayat transaksi.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.movements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-md border p-2.5 text-sm"
                      >
                        <div>
                          <span className="font-mono font-semibold">
                            {m.type}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {formatDate(m.createdAt)}
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span
                            className={cn(
                              "font-semibold",
                              m.type === "OUT"
                                ? "text-chart-4"
                                : "text-chart-2",
                            )}
                          >
                            {m.type === "OUT" ? "-" : "+"}
                            {m.quantity}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {m.stockBefore}→{m.stockAfter}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
