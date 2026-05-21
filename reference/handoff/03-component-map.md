# Component Map — MIA Inventory

Every React component in the prototype, mapped to its production equivalent.

---

## 1. Layout Components

### `Sidebar`
**File:** `components/layout.jsx`
**shadcn equivalent:** Custom sidebar (or shadcn sidebar component)

| Prop | Type | Description |
|---|---|---|
| `collapsed` | `boolean` | Sidebar collapsed state (64px vs 240px) |
| `onToggle` | `() => void` | Toggle collapse |
| `currentPage` | `string` | Active page ID |
| `onNavigate` | `(page: string) => void` | Navigate to page |
| `isAdmin` | `boolean` | Show admin-only nav items |

**Behavior:**
- 5 main nav items: Dashboard, Master Part, Stock Movement, Part Search, Stock Taking
- 2 admin nav items (below separator): User Management, Account
- Non-admin users see Account only
- Active item has left blue border + accent background
- Collapsed state shows icon only + tooltip on hover
- Footer shows brand text "MIA Inventory" + "PT Indonesia Epson Industry"
- Collapse toggle at bottom: `Ctrl+B` keyboard shortcut
- Epson logo SVG at top (dark mode: `filter: brightness(0) invert(1)`)
- Sidebar width persisted in `localStorage('mia-sidebar-collapsed')`

**Nav Items:**
```
dashboard    → LayoutDashboard icon
parts        → Package icon
movements    → ArrowUpDown icon
search       → Search icon
stock-taking → ClipboardCheck icon
--- separator ---
users        → Users icon (admin only)
account      → UserCircle icon
```

---

### `Navbar`
**File:** `components/layout.jsx`
**shadcn equivalent:** Custom header

| Prop | Type | Description |
|---|---|---|
| `collapsed` | `boolean` | For mobile hamburger |
| `onToggleSidebar` | `() => void` | Mobile hamburger click |
| `theme` | `'light' \| 'dark' \| 'system'` | Current theme |
| `onToggleTheme` | `(theme) => void` | Change theme |
| `refreshing` | `boolean` | Spin the refresh icon |
| `onRefresh` | `() => void` | Refresh data |
| `onNavigate` | `(page) => void` | For user dropdown navigation |
| `onLogout` | `() => void` | Logout action |

**Behavior:**
- Greeting changes by time: pagi (5-11), siang (11-15), sore (15-18), malam
- Shows user name "Aldi" with 👋
- Right side: Refresh button (5s cooldown), Bell, Theme dropdown, User dropdown
- Theme dropdown: Light/Dark/System with icons
- User dropdown: Name + role header, "Akun Saya" link, Logout (red)
- Sticky top, blurred background, border-bottom

---

### `ThemeToggle`
**File:** `components/layout.jsx`
**shadcn equivalent:** `next-themes` + shadcn dropdown

**Behavior:**
- Dropdown with 3 options: Light (Sun), Dark (Moon), System (Monitor)
- Active option highlighted
- Theme persisted in `localStorage('mia-theme')`
- On load: reads theme from localStorage, applies `.dark` class to `<html>`

---

### `UserDropdown`
**File:** `components/layout.jsx`
**shadcn equivalent:** shadcn `DropdownMenu`

**Behavior:**
- Shows avatar circle (initial "A"), name, role, chevron
- Dropdown: header with name/NIK, "Akun Saya" button, divider, "Keluar" (red)
- Closes on outside click

---

## 2. Dashboard Page

### `Dashboard`
**File:** `components/dashboard.jsx`
**Route:** `/dashboard`

**Children:**
1. `KpiCard` × 6 (grid-6)
2. `StockHealthChart` + `TypeDistributionChart` (grid-2)
3. `TypeBreakdownCard` × 3 (grid-3)
4. `TransactionLogFeed` (col-7) + `AlertStockWidget` (col-5) (grid-12)

**Data source:** `getDashboardData()` server action → parallel fetch

---

### `KpiCard`
| Prop | Type | Description |
|---|---|---|
| `title` | `string` | "Total Parts", "Available", etc. |
| `rawValue` | `number \| null` | Null shows "—" |
| `colorVar` | `string` | CSS variable name for accent |
| `Icon` | `Component` | Lucide icon |
| `onNavigate` | `fn` | Click navigates to parts page |

**Behavior:**
- Animated count-up on mount (900ms)
- Left border color = accent
- Icon in rounded square with tinted background
- Clickable → navigates to Master Part (filtered)
- 6 cards: Total Parts, Available, Low Stock, Out of Stock, Unassigned, Total Asset (null)

---

### `StockHealthChart` (Donut)
**File:** `components/dashboard-charts.jsx`
**Production:** Replace with Recharts `PieChart`

**Behavior:**
- 4 segments: Available (green), Low Stock (yellow), Out of Stock (red), Unassigned (purple)
- Center text: total count (or hovered segment name/value/percentage)
- Hover: dims other segments, shows % in center
- Legend grid (2×2) below, also hoverable
- SVG donut — replace with Recharts `<PieChart>` + `<Pie>` in production

---

### `TypeDistributionChart` (Horizontal Bar)
**File:** `components/dashboard-charts.jsx`
**Production:** Replace with Recharts `BarChart` (horizontal)

**Behavior:**
- 3 bars: Electrical, Mechanical, Fabrication
- Each bar is segmented (Available/Low/Out/Unassigned) with hover tooltip
- Animated width on mount (700ms staggered)
- Tooltip shows per-status count and percentage

---

### `TypeBreakdownCard`
**Behavior:**
- Header with type icon + color (Electrical=blue, Mechanical=purple, Fabrication=teal)
- 4 rows: Available, Low Stock, Out of Stock, Unassigned — each with mini progress bar
- Total Asset row (placeholder "—")
- Clickable rows → navigate to Master Part

---

### `AlertStockWidget`
**Behavior:**
- Card with header "⚠ Alert Stok" + item count badge
- Scrollable list (max-height 370px)
- Each item: severity icon + name, part code, stock level bar, severity badge
- Severity: Empty (dashed circle), Critical (red X), Low (yellow triangle)
- Critical items have red-tinted background
- Click → navigates to Master Part

---

### `TransactionLogFeed`
**Behavior:**
- Card with header "Log Transaksi" + subtitle "10 aktivitas terbaru"
- List of activity items with icon, description, timestamp
- 4 types: STOCK_IN (green ↑), STOCK_OUT (red ↓), UPDATE (blue pencil), CREATE (purple +)
- Quantity shown as colored badge (+5 green, -2 red)
- Footer button "Lihat Semua →" → navigates to Stock Movement
- Dividers between items

---

## 3. Master Part Page

### `MasterPartPage`
**File:** `components/master-part.jsx`
**Route:** `/parts`

| Prop | Type | Description |
|---|---|---|
| `onNavigate` | `fn` | Cross-page navigation |
| `isAdmin` | `boolean` | Show add/edit/delete buttons |

**State:**
- `search`, `page`, `pageSize` (15)
- `sortCol`, `sortDir`
- `filters` (type, status, maker, category) via filter sheet
- `selectedPart` (for detail sheet)
- `addPartOpen` (for add form sheet)
- `editPart` (for edit form sheet)

**Toolbar:**
- Search input (filters by name, code, maker, storage, category)
- Filter button (opens slide-over sheet with checkboxes)
- Active filter chips with × remove
- "Tambah Part" primary button (admin only)

**Table columns:**
No | Part Name (link) | Part Code (mono) | Maker | Category | Type (badge) | Storage (mono) | Stock (bold) | Unit | Status (badge) | Actions (⋯ dropdown)

**Row behaviors:**
- Click part name → opens detail sheet
- Unassigned rows: dashed left border + yellow tint
- Inactive rows: dimmed opacity
- Status badges: Available (green), Low Stock (yellow), Out of Stock (red), Unassigned (dashed yellow)
- Type badges: Electrical (blue), Mechanical (purple), Fabrication (teal)

**Action dropdown per row:**
- Lihat Detail, Edit Part, Assign Lokasi (for unassigned), Nonaktifkan/Aktifkan, Hapus (red)

**Pagination:** Bottom bar with "Menampilkan X–Y dari Z" + page buttons

---

### `PartDetailSheet`
**File:** `components/part-detail.jsx`
**shadcn equivalent:** `Sheet` (right side, 500px wide)

**3 tabs:**
1. **Overview** — Identity card, Stock card (with progress bar min→max), Storage card, Metadata card
2. **Purchase** — Mini table: Date, Status, Supplier, PO#, Qty, ETA
3. **History** — Mini table: Date, Type (IN/OUT badge), Qty (colored), Before, After, Requestor, Project

---

### `TambahPartSheet` (Add/Edit Part Form)
**File:** `components/master-part.jsx`
**shadcn equivalent:** `Sheet` with multi-step form

**3 steps:**
1. **Identitas** — Part Name, Part Code, Maker, Type (3-button select), Category, Unit, Description, Remarks
2. **Stok & Lokasi** — Min/Std/Max stock, Initial stock, Storage Type/Number/Box/BoxKecil (with barcode preview)
3. **Review** — Summary preview of all entered data

**Validation:**
- Part Code unique check (shows error if duplicate)
- Storage location availability check
- min ≤ std ≤ max stock validation
- All 4 storage fields required together or none

---

### `FilterSheet`
**File:** `components/master-part.jsx`
**shadcn equivalent:** `Sheet` with checkbox groups

**Filter groups:**
- Type: Electrical, Mechanical, Fabrication
- Status: Available, Low Stock, Out of Stock, Unassigned, Inactive
- Maker: dynamic from data
- Category: dynamic from data

---

## 4. Stock Movement Page

### `StockMovementPage`
**File:** `components/stock-movement.jsx`
**Route:** `/movements`

**Toolbar:**
- Search input
- Type filter dropdown (All / IN / OUT)
- Part Type filter dropdown (All / Electrical / Mechanical / Fabrication)
- Export button, Stock IN button (green), Stock OUT button (red)

**Date range:** Two date inputs with "s/d" label + reset button

**Summary strip:** Total Transactions | IN count (+total) | OUT count (-total)

**Table columns:**
Date (mono) | Time (mono) | Part Name (link) | Part Code (mono) | Type (badge) | IN (green) | OUT (red) | Final Stock | Requestor (name + NIK) | Inputer | Project

---

### `StockSheet` (Stock IN/OUT Form)
**File:** `components/stock-movement.jsx`
**shadcn equivalent:** `Sheet` (right side, 420px)

**Flow:**
1. Scan/search field (barcode = number, part code = alphanumeric)
2. Part info card appears with current stock
3. Quantity input + live preview (current → new)
4. NIK Requestor input (auto-lookup from NIK database)
5. Inputer field (disabled, auto from session)
6. Project dropdown (CreatableSelect — can add new)
7. Confirm button (colored: green for IN, red for OUT)
8. Success state with summary

**Validation:**
- OUT quantity cannot exceed current stock
- NIK must resolve to a valid employee
- Part must be active (not unassigned/inactive)

---

### `SmExportDialog`
**shadcn equivalent:** `Dialog`

**Behavior:**
- Shows data count and date range
- Format toggle: .xlsx / .csv
- Export button → success state with download

---

## 5. Part Search Page

### `PartSearchPage`
**File:** `components/part-search.jsx`
**Route:** `/search`

**3 states:**
1. **Empty** — DropZone (drag & drop or click to upload)
2. **Processing** — Spinner with "Memproses file..."
3. **Results** — File bar + summary badges + results table + export button

**Summary badges (clickable filter):**
- Total, ✅ Exact Match, 🟡 Possible, ❌ Not Found, 🔵 Shortage

**Matching algorithm (runs on server in production):**
1. Part Code exact match → check stock → exact or shortage
2. Name + Maker fuzzy match → possible (up to 3 candidates)
3. Not found

**Results table:**
No | Expand icon | Part Code | Part Name (Input) | Maker | Qty | Status (badge) | Matched Part | Stock

**Expandable rows:**
- Exact/Shortage: shows matched part details + stock info
- Possible: shows candidate list (up to 3)
- Not Found: empty state message

---

## 6. Stock Taking Page

### `StockTakingPage`
**File:** `components/stock-taking.jsx`
**Route:** `/stock-taking`

**Summary strip:** Total Part | Sudah Diaudit | OK | NG | Belum Diaudit

**Toolbar:**
- Search input (part name, code, maker)
- Storage filter dropdown (Semua Lokasi / Rak A,B,C / Group A-1, B-1, etc.)
- Export Excel button (CSV export)

**Table columns:**
No | Part Name | Maker | Part Code (mono) | Storage Address (mono) | Type (badge) | Current Stock | Unit | **Actual Stock (editable input)** | Discrepancy (badge) | Status (OK/NG badge)

**Key behaviors:**
- Only `Actual Stock` column is editable (number input, center-aligned, mono font)
- Discrepancy auto-calculated: `actualStock - currentStock`
- Discrepancy badges: 0 = green, positive = blue, negative = red
- Status: OK (green check) when discrepancy = 0, NG (red X) when ≠ 0
- NG rows highlighted with red tint, OK rows with green tint
- Default sort by Storage Address ascending
- Only active parts with assigned storage are shown
- Storage filter shows part count per group

---

## 7. User Management Page

### `UserManagementPage`
**File:** `components/user-management.jsx`
**Route:** `/users` (admin only)

**Summary strip:** Total User | Active | Admin | Inactive

**Table columns:**
No | NIK (mono) | Nama Lengkap | Role (badge) | Status (badge) | Login Terakhir (mono) | Dibuat (mono) | Actions (⋯)

**Action dropdown:**
- Ubah Role, Reset Password, Nonaktifkan (red) / Aktifkan

**Dialogs:**
1. `AddUserDialog` — NIK + Name + Role select → generates temp password "Epson@XXXX"
2. `ConfirmDialog` — Generic confirm with danger mode
3. Reset password result — shows temp password once

**Business rule:** Last active admin cannot be deactivated (shows info dialog instead)

---

## 8. Account Page

### `AccountPage`
**File:** `components/account.jsx`
**Route:** `/account`

**2 views:**
1. **Profile** — Avatar (initial), name, role badge, info grid (NIK, name, role, status, last login, registered since), "Ganti Password" button
2. **Change Password** — Old password, new password (with strength meter + requirements), confirm password, save button

**Password strength:** 4-segment bar (Lemah/Sedang/Kuat/Sangat Kuat)
**Requirements:** Min 8 chars, contains letter, contains number

---

## 9. Login Page

### `LoginPage`
**File:** `components/login.jsx`
**Route:** `/login`

| Prop | Type | Description |
|---|---|---|
| `onLogin` | `() => void` | Called on successful login |

**Layout:** Split — left (warehouse SVG illustration), right (login form)

**Form fields:**
- NIK input (with user icon)
- Password input (with lock icon + eye toggle)
- Remember me checkbox
- LOGIN button (rounded pill, primary color)
- Demo hint: "ADM001 / admin123"

**Behavior:**
- Loading state: spinner in button, disabled
- Error state: red box with message "NIK atau password salah"
- Auto-focus NIK input on mount
- Warehouse illustration: animated forklift, floating particles, scan line

---

## 10. Shared Components

### `StatusBadge` — Stock status pill
- `available`: green "Available"
- `low_stock`: yellow "Low Stock"
- `out_of_stock`: red "Out of Stock"
- `unassigned`: dashed yellow "Unassigned"
- `inactive`: gray "Inactive"

### `TypeBadge` — Part type pill
- `electrical`: blue "Electrical"
- `mechanical`: purple "Mechanical"
- `fabrication`: teal "Fabrication"

### `Pagination` — Page navigation
- "Menampilkan X–Y dari Z" + page number buttons + prev/next arrows

### `CreatableSelect` — Dropdown with "add new" option
- Used for Unit and Project selectors
- Shows dropdown with existing options + "Tambah baru" with inline input
