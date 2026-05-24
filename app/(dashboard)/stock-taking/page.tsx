import { PageHeader } from "@/components/shared/page-header";
import { StockTakingClient } from "@/components/stock-taking/stock-taking-client";
import { getStockTakingRows } from "@/lib/actions/stock-taking.actions";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function StockTakingPage() {
  const [rows, session] = await Promise.all([
    getStockTakingRows(),
    getServerSession(),
  ]);
  const auditorLabel = session
    ? `${session.user.fullName} (${session.user.nik})`
    : "—";

  return (
    <>
      <PageHeader
        title="Stock Taking"
        subtitle="Audit fisik part — hitung stok di lokasi, isi kolom Actual Stock, lalu export hasilnya. Draft otomatis tersimpan di browser."
      />
      <StockTakingClient rows={rows} auditorLabel={auditorLabel} />
    </>
  );
}
