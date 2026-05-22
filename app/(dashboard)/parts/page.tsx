import { PageHeader } from "@/components/shared/page-header";
import { PartsClient } from "@/components/parts/parts-client";
import { getFilterOptions, getParts } from "@/lib/actions/parts.actions";
import { getServerSession, isAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function MasterPartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const list = (k: string) => {
    const v = get(k);
    return v ? v.split(",").filter(Boolean) : [];
  };

  const session = await getServerSession();
  const [data, options] = await Promise.all([
    getParts({
      search: get("search"),
      type: list("type"),
      status: list("status"),
      maker: list("maker"),
      category: list("category"),
      page: Number(get("page") ?? "1") || 1,
      sort: get("sort"),
      dir: get("dir") === "desc" ? "desc" : "asc",
    }),
    getFilterOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Master Part"
        subtitle={`${data.total} part terdaftar`}
      />
      <PartsClient
        rows={data.rows}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        isAdmin={isAdmin(session)}
        makers={options.makers}
        categories={options.categories}
        usedBarcodes={options.usedBarcodes}
        usedAddresses={options.usedAddresses}
      />
    </>
  );
}
