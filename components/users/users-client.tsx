"use client";

import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/shared/role-badge";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import {
  createUser,
  resetPassword,
  setUserActive,
  updateUserRole,
} from "@/lib/actions/users.actions";
import type { UserListRow } from "@/lib/actions/users.actions";

interface UsersClientProps {
  rows: UserListRow[];
  summary: { total: number; active: number; admin: number; inactive: number };
}

export function UsersClient({ rows, summary }: UsersClientProps) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [tempResult, setTempResult] = useState<{
    title: string;
    password: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  // Add-user form state.
  const [nik, setNik] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((u) =>
      `${u.nik} ${u.fullName}`.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const resetForm = () => {
    setNik("");
    setFullName("");
    setRole("user");
  };

  const handleAdd = async () => {
    setBusy(true);
    const res = await createUser({ nik, fullName, role });
    setBusy(false);
    if (res.ok) {
      setAddOpen(false);
      resetForm();
      setTempResult({
        title: "User berhasil dibuat",
        password: res.data.tempPassword,
      });
    } else {
      toast.error(res.error);
    }
  };

  const handleReset = async (u: UserListRow) => {
    setBusy(true);
    const res = await resetPassword(u.id);
    setBusy(false);
    if (res.ok)
      setTempResult({
        title: `Password ${u.fullName} di-reset`,
        password: res.data.tempPassword,
      });
    else toast.error(res.error);
  };

  const handleToggle = async (u: UserListRow) => {
    const res = await setUserActive(u.id, u.status !== "active");
    if (res.ok)
      toast.success(
        u.status === "active" ? "User dinonaktifkan" : "User diaktifkan",
      );
    else toast.error(res.error);
  };

  const handleRole = async (u: UserListRow) => {
    const next = u.role === "admin" ? "user" : "admin";
    const res = await updateUserRole(u.id, next);
    if (res.ok) toast.success(`Role diubah menjadi ${next}`);
    else toast.error(res.error);
  };

  const stat = (label: string, value: number) => (
    <span>
      <span className="text-muted-foreground">{label} </span>
      <span className="font-mono font-semibold">{value}</span>
    </span>
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIK atau nama…"
            className="pl-8"
          />
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card p-3 text-sm">
        {stat("Total User", summary.total)}
        {stat("Active", summary.active)}
        {stat("Admin", summary.admin)}
        {stat("Inactive", summary.inactive)}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Login Terakhir</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada user.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u, i) => (
              <TableRow
                key={u.id}
                className={cn(u.status === "inactive" && "opacity-55")}
              >
                <TableCell className="text-muted-foreground">
                  {i + 1}
                </TableCell>
                <TableCell className="font-mono text-xs">{u.nik}</TableCell>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell>
                  <RoleBadge role={u.role} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.status === "active" ? "success" : "secondary"}
                  >
                    {u.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {formatDateTime(u.lastLoginAt)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {formatDate(u.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="rounded-md p-1 hover:bg-accent"
                      aria-label="Aksi"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {u.role !== "superadmin" && (
                        <DropdownMenuItem onClick={() => handleRole(u)}>
                          Ubah Role (
                          {u.role === "admin" ? "→ User" : "→ Admin"})
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleReset(u)}>
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={cn(
                          u.status === "active" &&
                            "text-destructive focus:text-destructive",
                        )}
                        onClick={() => handleToggle(u)}
                      >
                        {u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add User dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah User</DialogTitle>
            <DialogDescription>
              Password sementara akan dibuat otomatis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>
                NIK<span className="text-destructive"> *</span>
              </Label>
              <Input
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Nama Lengkap<span className="text-destructive"> *</span>
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <div className="flex gap-2">
                {(["user", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-sm capitalize",
                      role === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-accent",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={busy || nik.trim().length < 3 || !fullName.trim()}
              onClick={handleAdd}
            >
              {busy ? "Menyimpan…" : "Buat User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Temp-password result dialog */}
      <Dialog
        open={!!tempResult}
        onOpenChange={(o) => !o && setTempResult(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tempResult?.title}</DialogTitle>
            <DialogDescription>
              Password ini hanya ditampilkan sekali. Catat dan berikan ke
              pengguna.
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-md border bg-muted/40 py-3 text-center font-mono text-lg font-semibold">
            {tempResult?.password}
          </p>
          <DialogFooter>
            <Button onClick={() => setTempResult(null)}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
