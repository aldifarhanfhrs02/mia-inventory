import { PageHeader } from "@/components/shared/page-header";
import { MovementsClient } from "@/components/movements/movements-client";
import { getMovements, getProjects } from "@/lib/actions/movements.actions";
import { getServerSession, isAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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
        subtitle="Riwayat pergerakan stok dari System, Stock IN manual, dan Stock OUT."
      />

      <MovementsClient
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        isAdmin={isAdmin(session)}
        projectOptions={projectOptions}
        inputerLabel={inputerLabel}
        summary={data.summary}
      />
    </>
  );
}
