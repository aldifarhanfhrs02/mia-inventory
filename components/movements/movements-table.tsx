import Link from "next/link";
import { TypeBadge } from "@/components/shared/type-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils/format";
import type { MovementRow } from "@/lib/actions/movements.actions";

/** Read-only Stock Movement table. */
export function MovementsTable({
  rows,
  startIndex,
}: {
  rows: MovementRow[];
  startIndex: number;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Part Name</TableHead>
            <TableHead>Part Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">IN</TableHead>
            <TableHead className="text-right">OUT</TableHead>
            <TableHead className="text-right">Final Stock</TableHead>
            <TableHead>Requestor</TableHead>
            <TableHead>Inputer</TableHead>
            <TableHead>Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={12}
                className="h-24 text-center text-muted-foreground"
              >
                Tidak ada transaksi yang cocok.
              </TableCell>
            </TableRow>
          )}
          {rows.map((m, i) => {
            const d = new Date(m.createdAt);
            const isOut = m.type === "OUT";
            return (
              <TableRow key={m.id}>
                <TableCell className="text-muted-foreground">
                  {startIndex + i + 1}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {formatDate(d)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {d.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <Link
                    href="/parts"
                    className="font-medium text-primary hover:underline"
                  >
                    {m.partName}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {m.partCode}
                </TableCell>
                <TableCell>
                  <TypeBadge type={m.partType} />
                </TableCell>
                <TableCell className="text-right font-mono">
                  {!isOut && (
                    <span className="font-semibold text-chart-2">
                      +{m.quantity}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {isOut && (
                    <span className="font-semibold text-chart-4">
                      -{m.quantity}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {m.stockAfter}
                </TableCell>
                <TableCell>{m.requestor}</TableCell>
                <TableCell>{m.inputerName.split(" ")[0]}</TableCell>
                <TableCell className="text-muted-foreground">
                  {m.project ?? "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
