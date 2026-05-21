import { PageHeader } from "@/components/shared/page-header";
import { AlertStockWidget } from "@/components/dashboard/alert-stock-widget";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { StockHealthChart } from "@/components/dashboard/stock-health-chart";
import { TransactionLogFeed } from "@/components/dashboard/transaction-log-feed";
import { TypeBreakdownCard } from "@/components/dashboard/type-breakdown-card";
import { TypeDistributionChart } from "@/components/dashboard/type-distribution-chart";
import { getDashboardData } from "@/lib/actions/dashboard.actions";

// Reads computed stock from the database on every request.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader title="Dashboard" subtitle={today} />

      <div className="space-y-6">
        <KpiGrid kpi={data.kpi} />

        <div className="grid gap-4 lg:grid-cols-2">
          <StockHealthChart data={data.stockHealth} />
          <TypeDistributionChart data={data.typeDistribution} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <TypeBreakdownCard data={data.perType.electrical} />
          <TypeBreakdownCard data={data.perType.mechanical} />
          <TypeBreakdownCard data={data.perType.fabrication} />
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <TransactionLogFeed items={data.recentActivity} />
          </div>
          <div className="lg:col-span-5">
            <AlertStockWidget items={data.alertStock} />
          </div>
        </div>
      </div>
    </>
  );
}
