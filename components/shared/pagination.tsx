"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  /** Search-param key to write the page into (default "page"). */
  paramKey?: string;
}

/** Build a compact page list: 1 … p-1 p p+1 … last. */
function pageList(current: number, last: number): (number | "…")[] {
  if (last <= 7)
    return Array.from({ length: last }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  if (current > 3) out.push("…");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(last - 1, current + 1);
    p++
  )
    out.push(p);
  if (current < last - 2) out.push("…");
  out.push(last);
  return out;
}

/**
 * Server-side pagination bar. Writes the page number into the URL so filtered
 * views stay bookmarkable. "Menampilkan X–Y dari Z" + numbered buttons.
 */
export function Pagination({
  page,
  pageSize,
  total,
  paramKey = "page",
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <p className="text-sm text-muted-foreground">
        Menampilkan {from}–{to} dari {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pageList(page, lastPage).map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-2 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => goTo(p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= lastPage}
          onClick={() => goTo(page + 1)}
          aria-label="Berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
