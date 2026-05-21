import { PageHeader } from "@/components/shared/page-header";

export default function StockTakingPage() {
  return (
    <>
      <PageHeader title="Stock Taking" subtitle="Audit selisih stok fisik" />
      <p className="text-sm text-muted-foreground">
        Audit table arrives in Phase 9.
      </p>
    </>
  );
}
