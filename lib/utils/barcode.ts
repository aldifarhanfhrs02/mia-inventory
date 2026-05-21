// Barcode + storage-address helpers. See reference/handoff/02-data-models.ts.

/**
 * Generate a 7-digit barcode from a storage location.
 * Type letter maps A→1, B→2, C→3 …; box and box-kecil are zero-padded.
 * Example: ("A", 2, 2, 3) → "1202003".
 */
export function generateBarcode(
  storageType: string,
  storageNumber: number,
  box: number,
  boxKecil: number,
): string {
  const typeNum = storageType.toUpperCase().charCodeAt(0) - 64;
  return `${typeNum}${storageNumber}${String(box).padStart(2, "0")}${String(
    boxKecil,
  ).padStart(3, "0")}`;
}

/**
 * Format a human-readable storage address, e.g. "A-1-02-003".
 * Returns "—" when the part has no assigned location.
 */
export function formatStorageAddr(
  storageType: string | null,
  storageNumber: number | null,
  storageBox: number | null,
  storageBoxKecil: number | null,
): string {
  if (!storageType) return "—";
  return `${storageType}-${storageNumber}-${String(storageBox).padStart(
    2,
    "0",
  )}-${String(storageBoxKecil).padStart(3, "0")}`;
}
