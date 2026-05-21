import { PageHeader } from "@/components/shared/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Ringkasan inventaris part MIA" />
      <p className="text-sm text-muted-foreground">
        KPI cards, charts, and alerts arrive in Phase 6.
      </p>
    </>
  );
}
