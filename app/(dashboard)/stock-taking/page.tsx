import { PageHeader } from "@/components/shared/page-header";
import { StockTakingClient } from "@/components/stock-taking/stock-taking-client";
import { getStockTakingRows } from "@/lib/actions/stock-taking.actions";

export const dynamic = "force-dynamic";

export default async function StockTakingPage() {
  const rows = await getStockTakingRows();
  return (
    <>
      <PageHeader
        title="Stock Taking"
        subtitle="Audit selisih stok fisik vs sistem"
      />
      <StockTakingClient rows={rows} />
    </>
  );
}
