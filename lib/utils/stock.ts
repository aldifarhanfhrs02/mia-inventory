import type { AlertSeverity, PartStatus, StockStatus } from "@/lib/types";

/**
 * Derive stock status from a part's computed current stock and its min threshold.
 * `current_stock` is never stored — it is always summed from stock_movements.
 */
export function computeStockStatus(
  partStatus: PartStatus,
  currentStock: number,
  minStock: number,
): StockStatus {
  if (partStatus === "unassigned") return "unassigned";
  if (currentStock === 0) return "out_of_stock";
  if (currentStock < minStock) return "low_stock";
  return "available";
}

/** Severity bucket for the dashboard alert-stock widget. */
export function computeAlertSeverity(
  currentStock: number,
  minStock: number,
): AlertSeverity {
  if (currentStock === 0) return "empty";
  if (currentStock <= Math.ceil(minStock * 0.3)) return "critical";
  return "low";
}
