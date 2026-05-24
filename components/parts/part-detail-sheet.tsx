"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  History,
  Info,
  MapPin,
  Package,
  ShoppingCart,
  Tag,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { TypeBadge } from "@/components/shared/type-badge";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils/format";
import type {
  PartClass,
  PartWithStock,
  PurchaseRecord,
  StockMovement,
} from "@/lib/types";

const PART_CLASS_LABEL: Record<PartClass, string> = {
  consumable: "Consumable",
  existing_project: "Existing Project",
};

export interface PartDetail {
  part: PartWithStock;
  purchases: PurchaseRecord[];
  movements: StockMovement[];
  updatedByName: string;
}

/** A section heading with an icon — used inside each card. */
function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

/** A label/value row, optionally rendered as a stacked block on small width. */
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
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right font-medium text-foreground",
          mono && "tabular-nums text-xs",
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

/** Empty-state block for a tab. */
function EmptyState({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
      <Icon className="h-7 w-7 opacity-40" />
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
  const stockColor =
    p && p.currentStock === 0
      ? "text-chart-4"
      : p && p.currentStock < p.minStock
        ? "text-chart-3"
        : "text-chart-2";
  const barColor =
    p && p.currentStock === 0
      ? "bg-chart-4"
      : p && p.currentStock < p.minStock
        ? "bg-chart-3"
        : "bg-chart-2";
  const totalAsset =
    p && p.price != null ? p.price * p.currentStock : null;

  return (
    <Sheet open={!!detail} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[540px]"
      >
        {p && detail && (
          <>
            {/* HEADER */}
            <SheetHeader className="space-y-2 border-b bg-muted/30 px-6 pb-5 pt-6 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-background px-2 py-0.5 tabular-nums text-xs text-muted-foreground">
                  {p.partCode}
                </span>
                <StatusBadge
                  status={
                    p.status === "inactive" ? "inactive" : p.stockStatus
                  }
                />
                <TypeBadge type={p.type} />
              </div>
              <SheetTitle className="pr-8 text-xl font-semibold leading-snug">
                {p.partName}
              </SheetTitle>
              <SheetDescription className="text-sm">
                Maker:{" "}
                <span className="font-medium text-foreground">{p.maker}</span>{" "}
                · Category:{" "}
                <span className="font-medium text-foreground">
                  {p.category}
                </span>
              </SheetDescription>
            </SheetHeader>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="overview" className="w-full">
                <div className="sticky top-0 z-10 border-b bg-background px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="purchase">
                      Purchase
                      <span className="ml-1.5 rounded bg-muted px-1.5 text-[10px] font-medium">
                        {detail.purchases.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      History
                      <span className="ml-1.5 rounded bg-muted px-1.5 text-[10px] font-medium">
                        {detail.movements.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* OVERVIEW */}
                <TabsContent
                  value="overview"
                  className="space-y-4 px-6 pb-6 pt-5"
                >
                  {/* Stock hero card */}
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <SectionTitle icon={TrendingUp}>Current Stock</SectionTitle>
                    <div className="flex items-end justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={cn(
                            "tabular-nums text-4xl font-bold tabular-nums",
                            stockColor,
                          )}
                        >
                          {p.currentStock}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {p.unit}
                        </span>
                      </div>
                      <StatusBadge
                        status={
                          p.status === "inactive" ? "inactive" : p.stockStatus
                        }
                      />
                    </div>
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            barColor,
                          )}
                          style={{ width: `${stockPct}%` }}
                        />
                      </div>
                      <div className="mt-1.5 grid grid-cols-3 gap-2 tabular-nums text-[11px]">
                        <div className="text-chart-4">
                          <span className="block text-[10px] uppercase tracking-wide opacity-70">
                            Min
                          </span>
                          {p.minStock}
                        </div>
                        <div className="text-center text-chart-1">
                          <span className="block text-[10px] uppercase tracking-wide opacity-70">
                            Std
                          </span>
                          {p.stdStock ?? "—"}
                        </div>
                        <div className="text-right text-chart-2">
                          <span className="block text-[10px] uppercase tracking-wide opacity-70">
                            Max
                          </span>
                          {p.maxStock ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Asset card — price × stock */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border bg-card p-4">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        Price / Unit
                      </div>
                      <p className="tabular-nums text-base font-semibold tabular-nums text-foreground">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                        <Wallet className="h-3.5 w-3.5" />
                        Total Asset
                      </div>
                      <p className="tabular-nums text-base font-semibold tabular-nums text-primary">
                        {formatPrice(totalAsset)}
                      </p>
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="rounded-xl border bg-card p-4">
                    <SectionTitle icon={Info}>Part Identity</SectionTitle>
                    <div className="divide-y">
                      <Row label="Maker" value={p.maker} />
                      <Row
                        label="Type"
                        value={<TypeBadge type={p.type} />}
                      />
                      <Row
                        label="Source"
                        value={PART_CLASS_LABEL[p.partClass]}
                      />
                      <Row label="Category" value={p.category} />
                      <Row label="Unit" value={p.unit} />
                    </div>
                  </div>

                  {/* Storage */}
                  <div className="rounded-xl border bg-card p-4">
                    <SectionTitle icon={MapPin}>
                      Storage Location
                    </SectionTitle>
                    {p.storageType ? (
                      <div className="divide-y">
                        <Row label="Address" value={p.storageAddr} mono />
                        <Row label="Barcode" value={p.barcode ?? "—"} mono />
                      </div>
                    ) : (
                      <p className="rounded-md bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                        No location yet — part status is{" "}
                        <span className="font-semibold">unassigned</span>.
                      </p>
                    )}
                  </div>

                  {/* Description / Remarks (only if filled) */}
                  {(p.description || p.remarks) && (
                    <div className="rounded-xl border bg-card p-4">
                      <SectionTitle icon={ClipboardList}>
                        Notes
                      </SectionTitle>
                      {p.description && (
                        <div className="mb-2">
                          <p className="mb-0.5 text-xs text-muted-foreground">
                            Description
                          </p>
                          <p className="text-sm">{p.description}</p>
                        </div>
                      )}
                      {p.remarks && (
                        <div>
                          <p className="mb-0.5 text-xs text-muted-foreground">
                            Remarks
                          </p>
                          <p className="text-sm">{p.remarks}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="rounded-xl border bg-card p-4">
                    <SectionTitle icon={User}>Metadata</SectionTitle>
                    <div className="divide-y">
                      <Row label="Updated By" value={detail.updatedByName} />
                      <Row
                        label="Updated At"
                        value={formatDateTime(p.updatedAt)}
                        mono
                      />
                      <Row
                        label="Part Status"
                        value={
                          <span className="capitalize">{p.status}</span>
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* PURCHASE */}
                <TabsContent value="purchase" className="px-6 pb-6 pt-5">
                  {detail.purchases.length === 0 ? (
                    <EmptyState icon={ShoppingCart}>
                      No purchase data for this part yet.
                    </EmptyState>
                  ) : (
                    <div className="space-y-2">
                      {detail.purchases.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-accent/30"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {r.supplier ?? "—"}
                            </p>
                            <p className="tabular-nums text-xs text-muted-foreground">
                              {formatDate(r.requestDate)} · Qty {r.qtyOrdered}
                            </p>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {r.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* HISTORY */}
                <TabsContent value="history" className="px-6 pb-6 pt-5">
                  {detail.movements.length === 0 ? (
                    <EmptyState icon={History}>
                      No transaction history yet.
                    </EmptyState>
                  ) : (
                    <div className="space-y-2">
                      {detail.movements
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                        )
                        .map((m) => {
                          const isOut = m.type === "OUT";
                          return (
                            <div
                              key={m.id}
                              className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm"
                            >
                              <div
                                className={cn(
                                  "rounded-md p-1.5",
                                  isOut
                                    ? "bg-chart-4/15 text-chart-4"
                                    : "bg-chart-2/15 text-chart-2",
                                )}
                              >
                                {isOut ? (
                                  <ArrowDownRight className="h-4 w-4" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-sm">
                                  <span className="tabular-nums font-semibold">
                                    {m.type}
                                  </span>
                                  <span className="text-muted-foreground">
                                    · {formatDate(m.createdAt)}
                                  </span>
                                </div>
                                <p className="truncate tabular-nums text-[11px] text-muted-foreground">
                                  {m.stockBefore} → {m.stockAfter}
                                  {m.requestor && ` · ${m.requestor}`}
                                </p>
                              </div>
                              <div
                                className={cn(
                                  "tabular-nums text-base font-semibold tabular-nums",
                                  isOut ? "text-chart-4" : "text-chart-2",
                                )}
                              >
                                {isOut ? "−" : "+"}
                                {m.quantity}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* FOOTER STRIP */}
            <div className="flex items-center justify-between border-t bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Part ID
              </span>
              <span className="tabular-nums">{p.partCode}</span>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
