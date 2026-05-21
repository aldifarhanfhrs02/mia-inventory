import { PageHeader } from "@/components/shared/page-header";

export default function StockMovementPage() {
  return (
    <>
      <PageHeader title="Stock Movement" subtitle="Riwayat transaksi stok" />
      <p className="text-sm text-muted-foreground">
        Movement table and Stock IN/OUT arrive in Phase 8.
      </p>
    </>
  );
}
