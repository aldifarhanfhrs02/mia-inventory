// handoff/02-data-models.ts
// TypeScript interfaces for all MIA Inventory entities
// Copy into lib/types/ in your Next.js project

// ============================================================================
// ENUMS
// ============================================================================

export type PartType = "electrical" | "mechanical" | "fabrication";
export type PartStatus = "active" | "inactive" | "unassigned";
export type StockStatus = "available" | "low_stock" | "out_of_stock" | "unassigned";
export type MovementType = "INITIAL" | "IN" | "OUT";
export type PurchaseStatus = "requested" | "on_order" | "received" | "cancelled";
export type UserRole = "superadmin" | "admin" | "user";
export type UserStatus = "active" | "inactive";
export type AlertSeverity = "empty" | "critical" | "low";

export type ActivityAction =
  | "CREATE" | "UPDATE" | "DELETE" | "DEACTIVATE" | "REACTIVATE"
  | "STOCK_IN" | "STOCK_OUT" | "ASSIGN_LOCATION" | "RELOCATE"
  | "IMPORT" | "CREATE_USER" | "DEACTIVATE_USER" | "RESET_PASSWORD"
  | "CHANGE_ROLE" | "CREATE_PURCHASE" | "UPDATE_PURCHASE";

export type EntityType = "Part" | "User" | "Movement" | "Purchase" | "Project";

// Storage type letters
export type StorageType = "A" | "B" | "C" | "D" | "E";

// Unit types used in the system
export type UnitType = "PCS" | "SET" | "MTR" | "KG" | "LBR" | "BTG" | "ROL" | "PAK";


// ============================================================================
// CORE ENTITIES (match Drizzle schema in PRD)
// ============================================================================

export interface Part {
  id: string;                     // UUID
  partCode: string;               // UNIQUE e.g. "MIA-EL-001"
  partName: string;               // e.g. "Fuse 10A 250V"
  maker: string;                  // e.g. "Bussmann"
  type: PartType;                 // electrical | mechanical | fabrication
  category: string;               // e.g. "Protection", "Bearing", "Consumable"
  unit: UnitType;                 // PCS, SET, MTR, KG, etc.
  description?: string;
  remarks?: string;

  // Storage location (all null if unassigned)
  storageType: StorageType | null;    // 'A', 'B', 'C'
  storageNumber: number | null;       // 1, 2, 3...
  storageBox: number | null;          // 01, 02, 03...
  storageBoxKecil: number | null;     // 001, 002, 003...
  barcode: string | null;            // 7-digit generated e.g. "1101001"

  // Stock thresholds (current_stock is COMPUTED, not stored)
  minStock: number;
  stdStock: number | null;
  maxStock: number | null;

  // Status
  status: PartStatus;
  deletedAt: Date | null;             // soft delete

  // Audit
  createdBy: string | null;          // user.id FK
  updatedBy: string | null;          // user.id FK
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;                     // UUID
  partId: string;                 // FK parts.id
  type: MovementType;             // INITIAL | IN | OUT
  quantity: number;               // always > 0
  stockBefore: number;            // snapshot at transaction time
  stockAfter: number;             // snapshot at transaction time
  requestor: string;              // name of person requesting
  inputerNik: string;             // FK users.nik — auto from session
  project: string | null;         // optional project name
  createdAt: Date;
}

export interface PurchaseRecord {
  id: string;
  partId: string;
  requestDate: Date;
  status: PurchaseStatus;
  supplier: string | null;
  poNumber: string | null;
  qtyOrdered: number;
  expectedArrival: Date | null;
  receivedDate: Date | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  nik: string;                    // UNIQUE e.g. "ADM001" or "24100005"
  fullName: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;                   // UNIQUE
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string | null;
  changes: Record<string, unknown> | null;  // JSONB { before, after }
  createdAt: Date;
}

export interface SearchLog {
  id: string;
  userId: string;
  fileName: string;
  rowCount: number;
  summary: SearchSummary | null;
  createdAt: Date;
}


// ============================================================================
// COMPUTED / VIEW TYPES (used in frontend, not stored)
// ============================================================================

/** Part with computed current_stock and stock_status (from JOIN with stock_movements) */
export interface PartWithStock extends Part {
  currentStock: number;           // COMPUTED: SUM(IN+INITIAL) - SUM(OUT)
  stockStatus: StockStatus;       // COMPUTED: from currentStock vs minStock
  storageAddr: string;            // COMPUTED: formatted "A-1-01-001" or "—"
}

/** Movement row as shown in the Stock Movement table */
export interface MovementTableRow extends StockMovement {
  partName: string;
  partCode: string;
  maker: string;
  partType: PartType;
  unit: UnitType;
  requestorNik: string;
  inputerName: string;
}

/** Dashboard KPI data */
export interface DashboardKpi {
  totalParts: number;
  available: number;
  lowStock: number;
  outOfStock: number;
  unassigned: number;
  totalAsset: number | null;      // placeholder — not yet implemented
}

/** Per-type breakdown for dashboard */
export interface TypeBreakdown {
  type: PartType;
  total: number;
  available: number;
  lowStock: number;
  outOfStock: number;
  unassigned: number;
  totalAsset: number | null;
}

/** Stock health donut chart data */
export interface StockHealthItem {
  name: string;                   // "Available", "Low Stock", etc.
  value: number;
  color: string;
}

/** Type distribution bar chart data */
export interface TypeDistributionItem {
  type: string;                   // "Electrical", "Mechanical", "Fabrication"
  count: number;
  color: string;
  segments: Array<{ pct: number; color: string }>;
}

/** Alert stock item */
export interface AlertStockItem {
  id: string;
  partName: string;
  partCode: string;
  type: PartType;
  currentStock: number;
  minStock: number;
  severity: AlertSeverity;        // empty (0), critical (≤30% of min), low
}

/** Activity feed item (dashboard) */
export interface ActivityFeedItem {
  id: string;
  type: "STOCK_IN" | "STOCK_OUT" | "UPDATE" | "CREATE";
  userName: string;
  partName: string;
  partCode: string;
  quantity: number;               // 0 for non-stock actions
  time: string;
  date: string;
}

/** Full dashboard data bundle */
export interface DashboardData {
  kpi: DashboardKpi;
  stockHealth: StockHealthItem[];
  typeDistribution: TypeDistributionItem[];
  perType: Record<PartType, TypeBreakdown>;
  alertStock: AlertStockItem[];
  recentActivity: ActivityFeedItem[];
}


// ============================================================================
// PART SEARCH TYPES
// ============================================================================

export type SearchMatchStatus = "exact" | "possible" | "not_found" | "shortage";

export interface SearchInputRow {
  row: number;
  partCode: string;
  partName: string;
  maker: string;
  qtyNeeded: number;
}

export interface SearchResult extends SearchInputRow {
  status: SearchMatchStatus;
  matchedPart: PartWithStock | null;
  candidates: PartWithStock[];
  note: string;
}

export interface SearchSummary {
  exact: number;
  possible: number;
  notFound: number;
  shortage: number;
  total: number;
}


// ============================================================================
// STOCK TAKING TYPES
// ============================================================================

export interface StockTakingRow {
  part: PartWithStock;
  actualStock: number | null;     // user-entered
  discrepancy: number | null;     // actualStock - currentStock
  status: "OK" | "NG" | null;    // null if not yet audited
}

export interface StockTakingSummary {
  total: number;
  filled: number;
  ok: number;
  ng: number;
  remaining: number;
}


// ============================================================================
// SERVER ACTION RETURN TYPE
// ============================================================================

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };


// ============================================================================
// FORM INPUT TYPES (for React Hook Form)
// ============================================================================

export interface CreatePartInput {
  partName: string;
  partCode: string;
  maker: string;
  type: PartType;
  category: string;
  unit: UnitType;
  description?: string;
  remarks?: string;
  minStock: number;
  stdStock?: number;
  maxStock?: number;
  initialStock: number;
  storageType?: StorageType;
  storageNumber?: number;
  storageBox?: number;
  storageBoxKecil?: number;
}

export interface UpdatePartInput extends Omit<CreatePartInput, "initialStock"> {}

export interface CreateMovementInput {
  partIdentifier: string;         // barcode (7-digit) or partCode
  type: "IN" | "OUT";
  quantity: number;
  requestor: string;
  project?: string;
}

export interface CreateUserInput {
  nik: string;
  fullName: string;
  role: "admin" | "user";
}

export interface ChangePasswordInput {
  oldPassword?: string;           // optional on first login
  newPassword: string;
  confirmPassword: string;
}

export interface LoginInput {
  nik: string;
  password: string;
  remember?: boolean;
}


// ============================================================================
// FILTER / SORT TYPES
// ============================================================================

export interface PartFilters {
  search: string;
  type: PartType | "all";
  status: StockStatus | "all";
  maker: string | "all";
  category: string | "all";
  storageType: StorageType | "all";
}

export interface MovementFilters {
  search: string;
  type: MovementType | "all";
  partType: PartType | "all";
  dateFrom: string;               // YYYY-MM-DD
  dateTo: string;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  column: string;
  direction: SortDirection;
}


// ============================================================================
// HELPER FUNCTIONS (pure, no side effects)
// ============================================================================

/** Generate 7-digit barcode from storage location */
export function generateBarcode(
  storageType: string,
  storageNumber: number,
  box: number,
  boxKecil: number
): string {
  const typeNum = storageType.charCodeAt(0) - 64; // A→1, B→2, C→3
  return `${typeNum}${storageNumber}${String(box).padStart(2, "0")}${String(boxKecil).padStart(3, "0")}`;
}

/** Format storage address from parts */
export function formatStorageAddr(
  storageType: string | null,
  storageNumber: number | null,
  storageBox: number | null,
  storageBoxKecil: number | null
): string {
  if (!storageType) return "—";
  return `${storageType}-${storageNumber}-${String(storageBox).padStart(2, "0")}-${String(storageBoxKecil).padStart(3, "0")}`;
}

/** Compute stock status from currentStock and part thresholds */
export function computeStockStatus(
  partStatus: PartStatus,
  currentStock: number,
  minStock: number
): StockStatus {
  if (partStatus === "unassigned") return "unassigned";
  if (currentStock === 0) return "out_of_stock";
  if (currentStock < minStock) return "low_stock";
  return "available";
}

/** Compute alert severity */
export function computeAlertSeverity(
  currentStock: number,
  minStock: number
): AlertSeverity {
  if (currentStock === 0) return "empty";
  if (currentStock <= Math.ceil(minStock * 0.3)) return "critical";
  return "low";
}

/** Format price in Indonesian Rupiah */
export function formatPrice(val: number | null): string {
  if (val == null) return "—";
  return "Rp " + val.toLocaleString("id-ID");
}
