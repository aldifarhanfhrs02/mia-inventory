import { format } from "date-fns";
import { enUS } from "date-fns/locale";

/** Format a number as Indonesian Rupiah (Rp 1.500.000), or "—" when null. */
export function formatPrice(val: number | null): string {
  if (val == null) return "—";
  return "Rp " + val.toLocaleString("id-ID");
}

/** Format a date as "May 21, 2026" (English locale). */
export function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy", { locale: enUS });
}

/** Format a timestamp as "May 21, 2026, 1:35 PM". */
export function formatDateTime(value: Date | string | null): string {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy, h:mm a", { locale: enUS });
}
