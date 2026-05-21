import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

/** Format a number as Indonesian Rupiah, or "—" when null. */
export function formatPrice(val: number | null): string {
  if (val == null) return "—";
  return "Rp " + val.toLocaleString("id-ID");
}

/** Format a date as "21 Mei 2026" (Indonesian locale). */
export function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return format(new Date(value), "dd MMM yyyy", { locale: localeId });
}

/** Format a timestamp as "21 Mei 2026, 13:35". */
export function formatDateTime(value: Date | string | null): string {
  if (!value) return "—";
  return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: localeId });
}
