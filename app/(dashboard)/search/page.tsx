import { PageHeader } from "@/components/shared/page-header";
import { SearchClient } from "@/components/search/search-client";

export default function PartSearchPage() {
  return (
    <>
      <PageHeader
        title="Part Search"
        subtitle="Upload file Excel untuk mencocokkan part dengan database"
      />
      <SearchClient />
    </>
  );
}
