import { PageHeader } from "@/components/shared/page-header";
import { SearchClient } from "@/components/search/search-client";

export default function PartSearchPage() {
  return (
    <>
      <PageHeader
        title="Part Search"
        subtitle="Bandingkan daftar pembelian dengan inventory — pakai stok yang sudah ada sebelum membeli baru."
      />
      <SearchClient />
    </>
  );
}
