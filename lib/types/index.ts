// Shared domain types for MIA Inventory.
// Source of truth: reference/handoff/02-data-models.ts.
// Pure helper functions live in lib/utils/ (barcode.ts, stock.ts, format.ts).

// ============================================================================
// ENUMS
// ============================================================================

export type PartType = "electrical" | "mechanical" | "fabrication";
export type PartStatus = "active" | "inactive" | "unassigned";
export type StockStatus =
  | "available"
  | "low_stock"
  | "out_of_stock"
  | "unassigned";
export type MovementType = "INITIAL" | "IN" | "OUT";
export type PurchaseStatus =
  | "requested"
  | "on_order"
  | "received"
  | "cancelled";
export type UserRole = "superadmin" | "admin" | "user";
export type UserStatus = "active" | "inactive";
export type AlertSeverity = "empty" | "critical" | "low";

export type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "DEACTIVATE"
  | "REACTIVATE"
  | "STOCK_IN"
  | "STOCK_OUT"
  | "ASSIGN_LOCATION"
  | "RELOCATE"
  | "IMPORT"
  | "CREATE_USER"
  | "DEACTIVATE_USER"
  | "RESET_PASSWORD"
  | "CHANGE_ROLE"
  | "CREATE_PURCHASE"
  | "UPDATE_PURCHASE";

export type EntityType = "Part" | "User" | "Movement" | "Purchase" | "Project";

export type StorageType = "A" | "B" | "C" | "D" | "E";

export type UnitType =
  | "PCS"
  | "SET"
  | "MTR"
  | "KG"
  | "LBR"
  | "BTG"
  | "ROL"
  | "PAK";

// ============================================================================
// CORE ENTITIES (match Drizzle schema in lib/db/schema/)
// ============================================================================

export interface Part {
  id: string;
  partCode: string;
  partName: string;
  maker: string;
  type: PartType;
  category: string;
  unit: UnitType;
  description?: string | null;
  remarks?: string | null;

  storageType: StorageType | null;
  storageNumber: number | null;
  storageBox: number | null;
  storageBoxKecil: number | null;
  barcode: string | null;

  minStock: number;
  stdStock: number | null;
  maxStock: number | null;

  status: PartStatus;
  deletedAt: Date | null;

  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  partId: string;
  type: MovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  requestor: string;
  inputerNik: string;
  project: string | null;
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
  nik: string;
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
  name: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string | null;
  changes: Record<string, unknown> | null;
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

/** Part with computed current_stock and stock_status. */
export interface PartWithStock extends Part {
  currentStock: number;
  stockStatus: StockStatus;
  storageAddr: string;
}

/** Movement row as shown in the Stock Movement table. */
export interface MovementTableRow extends StockMovement {
  partName: string;
  partCode: string;
  maker: string;
  partType: PartType;
  unit: UnitType;
  requestorNik: string;
  inputerName: string;
}

export interface DashboardKpi {
  totalParts: number;
  available: number;
  lowStock: number;
  outOfStock: number;
  unassigned: number;
  totalAsset: number | null;
}

export interface TypeBreakdown {
  type: PartType;
  total: number;
  available: number;
  lowStock: number;
  outOfStock: number;
  unassigned: number;
  totalAsset: number | null;
}

export interface StockHealthItem {
  name: string;
  value: number;
  color: string;
}

export interface TypeDistributionItem {
  type: string;
  count: number;
  color: string;
  segments: Array<{ pct: number; color: string }>;
}

export interface AlertStockItem {
  id: string;
  partName: string;
  partCode: string;
  type: PartType;
  currentStock: number;
  minStock: number;
  severity: AlertSeverity;
}

export interface ActivityFeedItem {
  id: string;
  type: "STOCK_IN" | "STOCK_OUT" | "UPDATE" | "CREATE";
  userName: string;
  partName: string;
  partCode: string;
  quantity: number;
  time: string;
  date: string;
}

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

export type SearchMatchStatus =
  | "exact"
  | "possible"
  | "not_found"
  | "shortage";

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
  actualStock: number | null;
  discrepancy: number | null;
  status: "OK" | "NG" | null;
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

export type UpdatePartInput = Omit<CreatePartInput, "initialStock">;

export interface CreateMovementInput {
  partIdentifier: string;
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
  oldPassword?: string;
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
  dateFrom: string;
  dateTo: string;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  column: string;
  direction: SortDirection;
}
