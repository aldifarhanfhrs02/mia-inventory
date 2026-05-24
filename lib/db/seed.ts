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
import type { PartClass, StorageType, UnitType } from "../types";

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
// [code, name, maker, type, category, partClass, unit, sType,sNum,sBox,sBK,
//  curStock,min,std,max, price, status, updatedByName]
type PartTuple = [
  string,
  string,
  string,
  "Electrical" | "Mechanical" | "Fabrication",
  string,
  PartClass,
  UnitType,
  StorageType | null,
  number | null,
  number | null,
  number | null,
  number,
  number,
  number,
  number,
  number,
  "active" | "unassigned" | "inactive",
  string,
];

const PARTS: PartTuple[] = [
  ["MIA-EL-001", "Fuse 10A 250V", "Bussmann", "Electrical", "Protection", "consumable", "pcs", "A", 1, 1, 1, 0, 10, 15, 20, 15000, "active", "Aldi Nugroho"],
  ["MIA-EL-002", "Kontaktor LC1D18", "Schneider", "Electrical", "Contactor", "existing_project", "pcs", "A", 1, 1, 2, 2, 10, 15, 20, 850000, "active", "Aldi Nugroho"],
  ["MIA-EL-003", "PLC Modul Input 16DI", "Mitsubishi", "Electrical", "PLC", "existing_project", "pcs", "A", 1, 1, 3, 8, 5, 8, 12, 4500000, "active", "Budi Santoso"],
  ["MIA-EL-004", "Relay Omron MY2N", "Omron", "Electrical", "Relay", "consumable", "pcs", "A", 1, 1, 4, 3, 15, 20, 30, 75000, "active", "Aldi Nugroho"],
  ["MIA-EL-005", "Terminal Block 4mm²", "Phoenix Contact", "Electrical", "Terminal", "consumable", "pcs", "A", 1, 2, 1, 5, 20, 30, 50, 25000, "active", "Aldi Nugroho"],
  ["MIA-EL-006", "Sensor Proximity M12", "Keyence", "Electrical", "Sensor", "existing_project", "pcs", "A", 1, 2, 2, 12, 5, 10, 15, 1200000, "active", "Budi Santoso"],
  ["MIA-EL-007", "MCB 16A 1P", "Schneider", "Electrical", "Protection", "consumable", "pcs", "A", 1, 2, 3, 18, 10, 15, 25, 95000, "active", "Aldi Nugroho"],
  ["MIA-EL-008", "Power Supply 24V 5A", "Mean Well", "Electrical", "Power Supply", "existing_project", "pcs", "A", 1, 2, 4, 4, 3, 5, 8, 650000, "active", "Candra Putra"],
  ["MIA-EL-009", "Inverter 1.5kW FR-D720", "Mitsubishi", "Electrical", "Drive", "existing_project", "pcs", "A", 1, 3, 1, 2, 2, 3, 5, 3200000, "active", "Aldi Nugroho"],
  ["MIA-EL-010", "Timer Relay H3CR-A", "Omron", "Electrical", "Timer", "consumable", "pcs", "A", 1, 3, 2, 6, 5, 8, 12, 185000, "active", "Budi Santoso"],
  ["MIA-EL-011", "Photoelectric Sensor PQ-RD21", "Keyence", "Electrical", "Sensor", "existing_project", "pcs", "A", 1, 3, 3, 0, 3, 5, 8, 2800000, "active", "Aldi Nugroho"],
  ["MIA-EL-012", "Cable Duct 40x40", "Panduit", "Electrical", "Wiring", "consumable", "mtr", "A", 1, 3, 4, 25, 10, 20, 40, 45000, "active", "Candra Putra"],
  ["MIA-ME-001", "Bearing SKF 6205", "SKF", "Mechanical", "Bearing", "consumable", "pcs", "B", 1, 1, 1, 15, 10, 20, 30, 120000, "active", "Aldi Nugroho"],
  ["MIA-ME-002", "O-Ring NBR 30mm", "NOK", "Mechanical", "Seal", "consumable", "pcs", "B", 1, 1, 2, 8, 25, 40, 60, 8500, "active", "Budi Santoso"],
  ["MIA-ME-003", "Fitting AS1002F", "SMC", "Mechanical", "Fitting", "consumable", "pcs", "B", 1, 1, 3, 20, 15, 25, 40, 35000, "active", "Aldi Nugroho"],
  ["MIA-ME-004", "Cylinder SC 40x100", "SMC", "Mechanical", "Pneumatic", "existing_project", "pcs", "B", 1, 1, 4, 3, 2, 4, 6, 750000, "active", "Candra Putra"],
  ["MIA-ME-005", "Belt Timing HTD 5M-450", "Gates", "Mechanical", "Belt", "consumable", "pcs", "B", 1, 2, 1, 1, 5, 8, 12, 280000, "active", "Aldi Nugroho"],
  ["MIA-ME-006", "Coupling Jaw L-100", "Lovejoy", "Mechanical", "Coupling", "existing_project", "pcs", "B", 1, 2, 2, 4, 3, 5, 8, 350000, "active", "Budi Santoso"],
  ["MIA-ME-007", "Linear Guide HGH 20CA", "HIWIN", "Mechanical", "Guide", "existing_project", "pcs", "B", 1, 2, 3, 2, 2, 4, 6, 1500000, "active", "Aldi Nugroho"],
  ["MIA-ME-008", "Ball Screw SFU1605-500", "TBI Motion", "Mechanical", "Screw", "existing_project", "pcs", "B", 1, 2, 4, 1, 1, 2, 4, 2200000, "active", "Candra Putra"],
  ["MIA-ME-009", "Spring Compression 20x40", "Misumi", "Mechanical", "Spring", "consumable", "pcs", "B", 1, 3, 1, 30, 20, 30, 50, 12000, "active", "Budi Santoso"],
  ["MIA-ME-010", "Solenoid Valve 5/2 SY3120", "SMC", "Mechanical", "Valve", "existing_project", "pcs", "B", 1, 3, 2, 0, 3, 5, 8, 420000, "active", "Aldi Nugroho"],
  ["MIA-FA-001", "Majun / Lap Bersih", "Local", "Fabrication", "Consumable", "consumable", "kg", "B", 2, 1, 1, 1, 15, 25, 40, 18000, "active", "Aldi Nugroho"],
  ["MIA-FA-002", "Plate Aluminium A5052 3mm", "Local", "Fabrication", "Plate", "existing_project", "lbr", "B", 2, 1, 2, 10, 5, 10, 15, 350000, "active", "Dimas Pratama"],
  ["MIA-FA-003", "Rod Stainless SUS304 Ø10", "Local", "Fabrication", "Rod", "existing_project", "btg", "B", 2, 1, 3, 6, 4, 8, 12, 185000, "active", "Aldi Nugroho"],
  ["MIA-FA-004", "Bracket Custom L-Type", "Custom", "Fabrication", "Bracket", "existing_project", "pcs", "B", 2, 1, 4, 12, 8, 15, 20, 95000, "active", "Candra Putra"],
  ["MIA-FA-005", "Rubber Pad 50x50x10", "Local", "Fabrication", "Pad", "consumable", "pcs", "B", 2, 2, 1, 22, 10, 20, 30, 22000, "active", "Budi Santoso"],
  ["MIA-UN-001", "Limit Switch TZ-8104", "Tend", "Electrical", "Switch", "existing_project", "pcs", null, null, null, null, 0, 5, 8, 12, 65000, "unassigned", "Aldi Nugroho"],
  ["MIA-UN-002", "Hydraulic Seal Kit 40mm", "Parker", "Mechanical", "Seal", "existing_project", "set", null, null, null, null, 0, 3, 5, 8, 450000, "unassigned", "Aldi Nugroho"],
  ["MIA-EL-099", "Relay Module G2R-2 (Discontinued)", "Omron", "Electrical", "Relay", "consumable", "pcs", "A", 1, 4, 1, 0, 0, 0, 0, 0, "inactive", "Aldi Nugroho"],
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
          partClass,
          unit,
          sType,
          sNum,
          sBox,
          sBK,
          ,
          minStock,
          stdStock,
          maxStock,
          price,
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
          partClass,
          unit,
          storageType: sType,
          storageNumber: sNum,
          storageBox: sBox,
          storageBoxKecil: sBK,
          barcode,
          minStock,
          stdStock,
          maxStock,
          price,
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
  // curStock lives at tuple index 11 (after the partClass column was added).
  const initialMovements = PARTS.filter((p) => p[11] > 0).map((p) => {
    const part = partByCode.get(p[0])!;
    return {
      partId: part.id,
      type: "INITIAL" as const,
      quantity: p[11],
      stockBefore: 0,
      stockAfter: p[11],
      requestor: "System Seed",
      inputerNik: "ADM001",
      project: null,
    };
  });
  await db.insert(stockMovements).values(initialMovements);
  console.log(`  ✓ ${initialMovements.length} INITIAL stock movements`);

  // ── Manual IN / OUT movements (demo data for the Stock Movement chart) ────
  // Distributed across the last ~120 days so daily / weekly / monthly all
  // have bars to render. We keep a running stock-per-part map so that
  // stock_before / stock_after stay self-consistent across rows.
  const stockByPart = new Map<string, number>();
  for (const im of initialMovements) {
    stockByPart.set(im.partId, im.stockAfter);
  }
  const userNiks = userRows.filter((u) => u.role === "admin").map((u) => u.nik);
  const daysAgo = (d: number) => {
    const t = new Date();
    t.setHours(9, 0, 0, 0);
    t.setDate(t.getDate() - d);
    // Slight randomization so movements aren't all at exactly 09:00.
    t.setMinutes(Math.floor(Math.random() * 60));
    return t;
  };

  // [partCode, type, qty, daysAgo, requestor, project|null]
  const DEMO_MOVEMENTS: [
    string,
    "IN" | "OUT",
    number,
    number,
    string,
    string | null,
  ][] = [
    // Last 7 days — populates the "Daily" view.
    ["MIA-EL-002", "OUT", 2, 0, "Dimas Pratama", "Line 1 Repair"],
    ["MIA-ME-001", "OUT", 3, 0, "Eko Wibowo", "Line 2 PM"],
    ["MIA-EL-004", "IN", 10, 1, "Fajar Hidayat", null],
    ["MIA-EL-005", "OUT", 5, 1, "Dimas Pratama", "Line 1 Repair"],
    ["MIA-ME-002", "OUT", 4, 2, "Hendra Wijaya", "Line 3 Maintenance"],
    ["MIA-EL-007", "IN", 8, 3, "Fajar Hidayat", null],
    ["MIA-EL-002", "IN", 5, 3, "Dimas Pratama", null],
    ["MIA-EL-010", "OUT", 1, 4, "Eko Wibowo", "Jig Assembly"],
    ["MIA-ME-003", "IN", 12, 5, "Hendra Wijaya", null],
    ["MIA-EL-006", "OUT", 2, 5, "Fajar Hidayat", "Line 1 Setup"],
    ["MIA-EL-001", "IN", 15, 6, "Dimas Pratama", null],
    ["MIA-ME-009", "OUT", 5, 6, "Hendra Wijaya", "Line 2 PM"],

    // 8–28 days ago — populates the "Weekly" view.
    ["MIA-EL-003", "OUT", 1, 8, "Eko Wibowo", "Line 1 Repair"],
    ["MIA-ME-004", "OUT", 1, 10, "Fajar Hidayat", "Line 3 Maintenance"],
    ["MIA-EL-008", "IN", 3, 12, "Dimas Pratama", null],
    ["MIA-ME-005", "IN", 4, 14, "Hendra Wijaya", null],
    ["MIA-EL-005", "OUT", 3, 15, "Eko Wibowo", "Line 1 Setup"],
    ["MIA-EL-012", "OUT", 8, 18, "Fajar Hidayat", "Jig Assembly"],
    ["MIA-ME-006", "OUT", 1, 21, "Dimas Pratama", "Line 2 PM"],
    ["MIA-ME-002", "IN", 20, 24, "Hendra Wijaya", null],
    ["MIA-EL-002", "OUT", 1, 27, "Eko Wibowo", "Line 1 Repair"],

    // 30–150 days ago — populates the "Monthly" view.
    ["MIA-EL-004", "OUT", 5, 32, "Dimas Pratama", "Line 1 Repair"],
    ["MIA-EL-010", "IN", 4, 45, "Fajar Hidayat", null],
    ["MIA-ME-009", "OUT", 8, 55, "Eko Wibowo", "Line 3 Maintenance"],
    ["MIA-EL-007", "OUT", 4, 65, "Hendra Wijaya", "Line 2 PM"],
    ["MIA-ME-003", "OUT", 5, 75, "Dimas Pratama", "Line 1 Setup"],
    ["MIA-EL-006", "IN", 6, 95, "Fajar Hidayat", null],
    ["MIA-EL-005", "OUT", 10, 110, "Eko Wibowo", "Jig Assembly"],
    ["MIA-ME-005", "OUT", 2, 130, "Hendra Wijaya", "Line 1 Repair"],
  ];

  // Sort chronologically (oldest first) so stockBefore/stockAfter stay
  // consistent with earlier movements.
  const movementInserts = DEMO_MOVEMENTS.sort((a, b) => b[3] - a[3]).map(
    ([code, type, qty, ago, requestor, project]) => {
      const part = partByCode.get(code)!;
      const before = stockByPart.get(part.id) ?? 0;
      // Cap OUT so stock never goes negative (constraint check).
      const realQty = type === "OUT" ? Math.min(qty, before) : qty;
      const after = type === "IN" ? before + realQty : before - realQty;
      stockByPart.set(part.id, after);
      return {
        partId: part.id,
        type,
        quantity: realQty || 1,
        stockBefore: before,
        stockAfter: after,
        requestor,
        inputerNik: userNiks[Math.floor(Math.random() * userNiks.length)],
        project,
        createdAt: daysAgo(ago),
      };
    },
  );
  await db.insert(stockMovements).values(movementInserts);
  console.log(`  ✓ ${movementInserts.length} IN/OUT demo movements`);

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
