import { PageHeader } from "@/components/shared/page-header";
import { MovementsClient } from "@/components/movements/movements-client";
import { getMovements, getProjects } from "@/lib/actions/movements.actions";
import { getServerSession, isAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function SummaryStrip({
  total,
  summary,
}: {
  total: number;
  summary: { countIn: number; countOut: number; qtyIn: number; qtyOut: number };
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card p-3 text-sm">
      <span>
        <span className="text-muted-foreground">Total Transaksi </span>
        <span className="font-mono font-semibold">{total}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-chart-2" />
        <span className="text-muted-foreground">IN</span>
        <span className="font-mono font-semibold text-chart-2">
          {summary.countIn} (+{summary.qtyIn})
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-chart-4" />
        <span className="text-muted-foreground">OUT</span>
        <span className="font-mono font-semibold text-chart-4">
          {summary.countOut} (-{summary.qtyOut})
        </span>
      </span>
    </div>
  );
}

export default async function StockMovementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const session = await getServerSession();
  const [data, projectOptions] = await Promise.all([
    getMovements({
      search: get("search"),
      type: get("type"),
      partType: get("partType"),
      dateFrom: get("dateFrom"),
      dateTo: get("dateTo"),
      page: Number(get("page") ?? "1") || 1,
    }),
    getProjects(),
  ]);

  const inputerLabel = session
    ? `${session.user.fullName} (${session.user.nik})`
    : "—";

  return (
    <>
      <PageHeader
        title="Stock Movement"
        subtitle={`${data.total} transaksi`}
      />
      <SummaryStrip total={data.total} summary={data.summary} />
      <MovementsClient
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        isAdmin={isAdmin(session)}
        projectOptions={projectOptions}
        inputerLabel={inputerLabel}
      />
    </>
  );
}
