"use client";

import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importParts, type ImportRow } from "@/lib/actions/parts.actions";

function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const k of Object.keys(row)) {
    if (keys.some((c) => k.toLowerCase().replace(/[\s_]/g, "").includes(c)))
      return String(row[k] ?? "").trim();
  }
  return "";
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Import parts from an Excel/CSV file — upload → preview → result. */
export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [result, setResult] = useState({ created: 0, skipped: 0 });
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setRows([]);
  };
  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        wb.Sheets[wb.SheetNames[0]],
      );
      const parsed: ImportRow[] = json.slice(0, 500).map((r) => ({
        partCode: pick(r, ["partcode", "code", "kode"]),
        partName: pick(r, ["partname", "name", "nama"]),
        maker: pick(r, ["maker", "merk", "brand"]),
        type: pick(r, ["type", "tipe"]),
        category: pick(r, ["category", "kategori"]),
        unit: pick(r, ["unit", "satuan"]),
      }));
      if (parsed.length === 0) {
        toast.error("File kosong atau format kolom tidak dikenali");
        return;
      }
      setFileName(file.name);
      setRows(parsed);
      setStep("preview");
    } catch {
      toast.error("Gagal membaca file");
    }
  };

  const runImport = async () => {
    setBusy(true);
    const res = await importParts(rows);
    setBusy(false);
    if (res.ok) {
      setResult(res.data);
      setStep("result");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : close())}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import Part dari Excel"}
            {step === "preview" && "Preview Data Import"}
            {step === "result" && "Hasil Import"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Kolom dikenali: Part Code, Part Name, Maker, Type, Category, Unit."}
            {step === "preview" && `${fileName} — ${rows.length} baris`}
            {step === "result" && "Import selesai."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed py-14 hover:bg-accent/40"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <FileUp className="h-9 w-9 text-muted-foreground" />
            <p className="text-sm font-medium">Drop file atau klik browse</p>
            <p className="text-xs text-muted-foreground">.xlsx / .xls / .csv</p>
          </div>
        )}

        {step === "preview" && (
          <div className="max-h-72 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Part Code</TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Maker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.partCode || "—"}
                    </TableCell>
                    <TableCell>{r.partName || "—"}</TableCell>
                    <TableCell>{r.maker || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {step === "result" && (
          <div className="py-6 text-center">
            <div className="mb-2 text-5xl">✅</div>
            <p className="text-sm">
              <strong className="text-chart-2">{result.created}</strong> part
              ditambahkan,{" "}
              <strong>{result.skipped}</strong> di-skip (duplikat / tidak
              valid).
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={close}>
              Batal
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>
                Ganti File
              </Button>
              <Button disabled={busy} onClick={runImport}>
                {busy ? "Mengimpor…" : `Import ${rows.length} Part`}
              </Button>
            </>
          )}
          {step === "result" && <Button onClick={close}>Selesai</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
