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
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils/format";
import type {
  PartWithStock,
  PurchaseRecord,
  StockMovement,
} from "@/lib/types";

export interface PartDetail {
  part: PartWithStock;
  purchases: PurchaseRecord[];
  movements: StockMovement[];
  updatedByName: string;
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

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-1 text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

/** Slide-over part detail — Overview / Purchase / History tabs. */
export function PartDetailSheet({
  detail,
  onOpenChange,
}: {
  detail: PartDetail | null;
  onOpenChange: (open: boolean) => void;
}) {
  const p = detail?.part;
  const max = p?.maxStock && p.maxStock > 0 ? p.maxStock : null;
  const stockPct = p && max ? Math.min((p.currentStock / max) * 100, 100) : 0;
  const barColor =
    p && p.currentStock === 0
      ? "bg-chart-4"
      : p && p.currentStock < p.minStock
        ? "bg-chart-3"
        : "bg-chart-2";

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

              <TabsContent value="overview" className="space-y-3">
                <Card title="Identitas Part">
                  <Row label="Maker" value={p.maker} />
                  <Row label="Type" value={<TypeBadge type={p.type} />} />
                  <Row label="Category" value={p.category} />
                  <Row label="Unit" value={p.unit} />
                  <Row
                    label="Price per Unit"
                    value={formatPrice(p.price)}
                    mono
                  />
                </Card>

                <Card title="Informasi Stok">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Current Stock
                    </span>
                    <span className="font-mono text-lg font-bold">
                      {p.currentStock}
                    </span>
                  </div>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn("block h-full rounded-full", barColor)}
                      style={{ width: `${stockPct}%` }}
                    />
                  </span>
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                    <span>0</span>
                    <span className="text-chart-4">Min {p.minStock}</span>
                    <span className="text-chart-1">
                      Std {p.stdStock ?? "—"}
                    </span>
                    <span className="text-chart-2">
                      Max {p.maxStock ?? "—"}
                    </span>
                  </div>
                </Card>

                <Card title="Lokasi Penyimpanan">
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
                </Card>

                <Card title="Metadata">
                  <Row label="Updated By" value={detail.updatedByName} />
                  <Row
                    label="Updated At"
                    value={formatDateTime(p.updatedAt)}
                    mono
                  />
                  <Row
                    label="Part Status"
                    value={<span className="capitalize">{p.status}</span>}
                  />
                </Card>
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
