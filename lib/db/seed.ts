/**
 * Seed script — populates the database with the prototype's demo data.
 * Run with: npm run db:seed  (requires DATABASE_URL in .env)
 *
 * Source data: reference/prototype/components/part-data.jsx + user-management.jsx.
 * `current_stock` is never stored — each part gets an INITIAL stock_movement
 * whose quantity equals the prototype's curStock, so the computed stock matches.
 */
import { existsSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "./index";
import {
  activityLogs,
  parts,
  projects,
  purchaseRecords,
  searchLogs,
  stockMovements,
  users,
} from "./schema";
import { hashPassword } from "../auth/password";
import { generateBarcode } from "../utils/barcode";
import type { StorageType, UnitType } from "../types";

if (existsSync(".env")) process.loadEnvFile(".env");

// ── Users ────────────────────────────────────────────────────────────────────
// [nik, fullName, role, status, lastLogin, mustChangePassword]
const USERS: [
  string,
  string,
  "admin" | "user",
  "active" | "inactive",
  string | null,
  boolean,
][] = [
  ["ADM001", "Aldi Nugroho", "admin", "active", "2026-05-14T08:00:00Z", false],
  ["ADM002", "Budi Santoso", "admin", "active", "2026-05-14T07:45:00Z", false],
  ["ADM003", "Candra Putra", "admin", "active", "2026-05-12T09:30:00Z", false],
  ["24100005", "Dimas Pratama", "user", "active", "2026-05-13T10:15:00Z", false],
  ["24100006", "Eko Wibowo", "user", "active", "2026-05-13T13:55:00Z", false],
  ["24100007", "Fajar Hidayat", "user", "active", "2026-05-10T11:20:00Z", false],
  ["24100008", "Gilang Ramadhan", "user", "inactive", "2026-04-01T08:00:00Z", false],
  ["24100009", "Hendra Wijaya", "user", "active", "2026-05-11T14:10:00Z", false],
  ["24100010", "Irfan Maulana", "user", "active", null, true],
];

// ── Parts ──────────────────────────────────────────────────────────────────────
// [code, name, maker, type, category, unit, sType,sNum,sBox,sBK, curStock,min,std,max, status, updatedByName]
type PartTuple = [
  string,
  string,
  string,
  "electrical" | "mechanical" | "fabrication",
  string,
  UnitType,
  StorageType | null,
  number | null,
  number | null,
  number | null,
  number,
  number,
  number,
  number,
  "active" | "unassigned" | "inactive",
  string,
];

const PARTS: PartTuple[] = [
  ["MIA-EL-001", "Fuse 10A 250V", "Bussmann", "electrical", "Protection", "PCS", "A", 1, 1, 1, 0, 10, 15, 20, "active", "Aldi Nugroho"],
  ["MIA-EL-002", "Kontaktor LC1D18", "Schneider", "electrical", "Contactor", "PCS", "A", 1, 1, 2, 2, 10, 15, 20, "active", "Aldi Nugroho"],
  ["MIA-EL-003", "PLC Modul Input 16DI", "Mitsubishi", "electrical", "PLC", "PCS", "A", 1, 1, 3, 8, 5, 8, 12, "active", "Budi Santoso"],
  ["MIA-EL-004", "Relay Omron MY2N", "Omron", "electrical", "Relay", "PCS", "A", 1, 1, 4, 3, 15, 20, 30, "active", "Aldi Nugroho"],
  ["MIA-EL-005", "Terminal Block 4mm²", "Phoenix Contact", "electrical", "Terminal", "PCS", "A", 1, 2, 1, 5, 20, 30, 50, "active", "Aldi Nugroho"],
  ["MIA-EL-006", "Sensor Proximity M12", "Keyence", "electrical", "Sensor", "PCS", "A", 1, 2, 2, 12, 5, 10, 15, "active", "Budi Santoso"],
  ["MIA-EL-007", "MCB 16A 1P", "Schneider", "electrical", "Protection", "PCS", "A", 1, 2, 3, 18, 10, 15, 25, "active", "Aldi Nugroho"],
  ["MIA-EL-008", "Power Supply 24V 5A", "Mean Well", "electrical", "Power Supply", "PCS", "A", 1, 2, 4, 4, 3, 5, 8, "active", "Candra Putra"],
  ["MIA-EL-009", "Inverter 1.5kW FR-D720", "Mitsubishi", "electrical", "Drive", "PCS", "A", 1, 3, 1, 2, 2, 3, 5, "active", "Aldi Nugroho"],
  ["MIA-EL-010", "Timer Relay H3CR-A", "Omron", "electrical", "Timer", "PCS", "A", 1, 3, 2, 6, 5, 8, 12, "active", "Budi Santoso"],
  ["MIA-EL-011", "Photoelectric Sensor PQ-RD21", "Keyence", "electrical", "Sensor", "PCS", "A", 1, 3, 3, 0, 3, 5, 8, "active", "Aldi Nugroho"],
  ["MIA-EL-012", "Cable Duct 40x40", "Panduit", "electrical", "Wiring", "MTR", "A", 1, 3, 4, 25, 10, 20, 40, "active", "Candra Putra"],
  ["MIA-ME-001", "Bearing SKF 6205", "SKF", "mechanical", "Bearing", "PCS", "B", 1, 1, 1, 15, 10, 20, 30, "active", "Aldi Nugroho"],
  ["MIA-ME-002", "O-Ring NBR 30mm", "NOK", "mechanical", "Seal", "PCS", "B", 1, 1, 2, 8, 25, 40, 60, "active", "Budi Santoso"],
  ["MIA-ME-003", "Fitting AS1002F", "SMC", "mechanical", "Fitting", "PCS", "B", 1, 1, 3, 20, 15, 25, 40, "active", "Aldi Nugroho"],
  ["MIA-ME-004", "Cylinder SC 40x100", "SMC", "mechanical", "Pneumatic", "PCS", "B", 1, 1, 4, 3, 2, 4, 6, "active", "Candra Putra"],
  ["MIA-ME-005", "Belt Timing HTD 5M-450", "Gates", "mechanical", "Belt", "PCS", "B", 1, 2, 1, 1, 5, 8, 12, "active", "Aldi Nugroho"],
  ["MIA-ME-006", "Coupling Jaw L-100", "Lovejoy", "mechanical", "Coupling", "PCS", "B", 1, 2, 2, 4, 3, 5, 8, "active", "Budi Santoso"],
  ["MIA-ME-007", "Linear Guide HGH 20CA", "HIWIN", "mechanical", "Guide", "PCS", "B", 1, 2, 3, 2, 2, 4, 6, "active", "Aldi Nugroho"],
  ["MIA-ME-008", "Ball Screw SFU1605-500", "TBI Motion", "mechanical", "Screw", "PCS", "B", 1, 2, 4, 1, 1, 2, 4, "active", "Candra Putra"],
  ["MIA-ME-009", "Spring Compression 20x40", "Misumi", "mechanical", "Spring", "PCS", "B", 1, 3, 1, 30, 20, 30, 50, "active", "Budi Santoso"],
  ["MIA-ME-010", "Solenoid Valve 5/2 SY3120", "SMC", "mechanical", "Valve", "PCS", "B", 1, 3, 2, 0, 3, 5, 8, "active", "Aldi Nugroho"],
  ["MIA-FA-001", "Majun / Lap Bersih", "Local", "fabrication", "Consumable", "KG", "C", 1, 1, 1, 1, 15, 25, 40, "active", "Aldi Nugroho"],
  ["MIA-FA-002", "Plate Aluminium A5052 3mm", "Local", "fabrication", "Plate", "LBR", "C", 1, 1, 2, 10, 5, 10, 15, "active", "Dimas Pratama"],
  ["MIA-FA-003", "Rod Stainless SUS304 Ø10", "Local", "fabrication", "Rod", "BTG", "C", 1, 1, 3, 6, 4, 8, 12, "active", "Aldi Nugroho"],
  ["MIA-FA-004", "Bracket Custom L-Type", "Custom", "fabrication", "Bracket", "PCS", "C", 1, 1, 4, 12, 8, 15, 20, "active", "Candra Putra"],
  ["MIA-FA-005", "Rubber Pad 50x50x10", "Local", "fabrication", "Pad", "PCS", "C", 1, 2, 1, 22, 10, 20, 30, "active", "Budi Santoso"],
  ["MIA-UN-001", "Limit Switch TZ-8104", "Tend", "electrical", "Switch", "PCS", null, null, null, null, 0, 5, 8, 12, "unassigned", "Aldi Nugroho"],
  ["MIA-UN-002", "Hydraulic Seal Kit 40mm", "Parker", "mechanical", "Seal", "SET", null, null, null, null, 0, 3, 5, 8, "unassigned", "Aldi Nugroho"],
  ["MIA-EL-099", "Relay Module G2R-2 (Discontinued)", "Omron", "electrical", "Relay", "PCS", "A", 1, 4, 1, 0, 0, 0, 0, "inactive", "Aldi Nugroho"],
];

// ── Projects ───────────────────────────────────────────────────────────────────
const PROJECTS = [
  "Line 1 Repair",
  "Line 2 PM",
  "Line 3 Maintenance",
  "Jig Assembly",
  "Line 1 Setup",
];

// ── Purchase records ───────────────────────────────────────────────────────────
// [partCode, requestDate, status, supplier, po, qty, eta, received, notes]
const PURCHASES: [
  string,
  string,
  "requested" | "on_order" | "received" | "cancelled",
  string | null,
  string | null,
  number,
  string | null,
  string | null,
  string | null,
][] = [
  ["MIA-EL-002", "2026-04-01", "received", "PT Schneider Electric", "PO-2026-0412", 10, "2026-04-15", "2026-04-14", "Regular restock"],
  ["MIA-EL-002", "2026-03-01", "received", "PT Schneider Electric", "PO-2026-0298", 5, "2026-03-20", "2026-03-18", null],
  ["MIA-EL-001", "2026-05-10", "on_order", "PT Fuse Indonesia", "PO-2026-0501", 20, "2026-05-25", null, "Urgent restock"],
  ["MIA-EL-005", "2026-05-12", "requested", null, null, 50, null, null, "Low stock alert"],
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");
  }
  console.log("Seeding MIA Inventory database…");

  // Wipe in FK-safe order.
  await db.execute(
    sql`TRUNCATE TABLE ${activityLogs}, ${searchLogs}, ${stockMovements}, ${purchaseRecords}, ${parts}, ${projects}, ${users} RESTART IDENTITY CASCADE`,
  );

  // Users.
  const adminPwd = await hashPassword("admin123");
  const userPwd = await hashPassword("user123");
  const userRows = await db
    .insert(users)
    .values(
      USERS.map(([nik, fullName, role, status, lastLogin, mustChange]) => ({
        nik,
        fullName,
        passwordHash: role === "admin" ? adminPwd : userPwd,
        role,
        status,
        mustChangePassword: mustChange,
        lastLoginAt: lastLogin ? new Date(lastLogin) : null,
      })),
    )
    .returning();
  const userByName = new Map(userRows.map((u) => [u.fullName, u]));
  const adminId = userByName.get("Aldi Nugroho")!.id;
  console.log(`  ✓ ${userRows.length} users`);

  // Projects.
  await db.insert(projects).values(PROJECTS.map((name) => ({ name })));
  console.log(`  ✓ ${PROJECTS.length} projects`);

  // Parts.
  const partRows = await db
    .insert(parts)
    .values(
      PARTS.map((p) => {
        const [
          partCode,
          partName,
          maker,
          type,
          category,
          unit,
          sType,
          sNum,
          sBox,
          sBK,
          ,
          minStock,
          stdStock,
          maxStock,
          status,
          updatedByName,
        ] = p;
        const barcode =
          sType && sNum && sBox && sBK
            ? generateBarcode(sType, sNum, sBox, sBK)
            : null;
        return {
          partCode,
          partName,
          maker,
          type,
          category,
          unit,
          storageType: sType,
          storageNumber: sNum,
          storageBox: sBox,
          storageBoxKecil: sBK,
          barcode,
          minStock,
          stdStock,
          maxStock,
          status,
          createdBy: adminId,
          updatedBy: userByName.get(updatedByName)?.id ?? adminId,
        };
      }),
    )
    .returning();
  const partByCode = new Map(partRows.map((p) => [p.partCode, p]));
  console.log(`  ✓ ${partRows.length} parts`);

  // INITIAL stock movements — establish each part's computed current stock.
  const initialMovements = PARTS.filter((p) => p[10] > 0).map((p) => {
    const part = partByCode.get(p[0])!;
    return {
      partId: part.id,
      type: "INITIAL" as const,
      quantity: p[10],
      stockBefore: 0,
      stockAfter: p[10],
      requestor: "System Seed",
      inputerNik: "ADM001",
      project: null,
    };
  });
  await db.insert(stockMovements).values(initialMovements);
  console.log(`  ✓ ${initialMovements.length} INITIAL stock movements`);

  // Purchase records.
  await db.insert(purchaseRecords).values(
    PURCHASES.map((pr) => ({
      partId: partByCode.get(pr[0])!.id,
      requestDate: new Date(pr[1]),
      status: pr[2],
      supplier: pr[3],
      poNumber: pr[4],
      qtyOrdered: pr[5],
      expectedArrival: pr[6] ? new Date(pr[6]) : null,
      receivedDate: pr[7] ? new Date(pr[7]) : null,
      notes: pr[8],
      createdBy: adminId,
    })),
  );
  console.log(`  ✓ ${PURCHASES.length} purchase records`);

  // A few activity-log entries so the dashboard feed has data.
  await db.insert(activityLogs).values(
    partRows.slice(0, 8).map((p) => ({
      userId: adminId,
      action: "CREATE" as const,
      entityType: "Part" as const,
      entityId: p.id,
      changes: { after: { partCode: p.partCode, partName: p.partName } },
    })),
  );
  console.log("  ✓ 8 activity logs");

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
