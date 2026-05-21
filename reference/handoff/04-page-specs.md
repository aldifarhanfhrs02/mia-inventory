# Page-by-Page Specs — MIA Inventory

Detailed interaction specs for each page. Reference `screenshots/` for visuals.

---

## Page 1: Login (`/login`)

**Screenshot:** `screenshots/01-pages.png` (if logged out)

### Layout
- Split card: left = warehouse SVG illustration (flex 1.15), right = form (380px fixed)
- Centered vertically and horizontally on page
- Max-width 960px, border-radius 18px, shadow-md
- Responsive: stacks vertically on mobile (< 768px)

### Interactions
| Action | Behavior |
|---|---|
| Submit empty form | Error: "NIK and password are required" |
| Submit wrong credentials | 1s delay → Error: "Invalid NIK or password" (generic, never specific) |
| Submit correct (ADM001/admin123) | 1s loading spinner → redirect to Dashboard |
| Toggle eye icon | Show/hide password |
| Remember me | Checkbox (in production: extends session) |
| `Ctrl+Enter` | Not implemented — submit via button |

### Edge Cases
- `must_change_password = true` → middleware redirects to `/account/change-password` after login
- Rate limit: 5 failed attempts per 15 min per NIK → lockout
- Session timeout: 8 hours idle

---

## Page 2: Dashboard (`/dashboard`)

**Screenshot:** `screenshots/02-pages.png`

### Layout (top to bottom)
1. **Page header:** "Dashboard" h1 + date subtitle
2. **KPI cards:** 6 cards in a grid-6 (3 cols on tablet, 2 on mobile)
3. **Charts:** 2-column grid — Donut (Stock Health) + Bar (Type Distribution)
4. **Type breakdown:** 3-column grid — Electrical / Mechanical / Fabrication
5. **Bottom:** 12-col grid — Transaction Log (col-7) + Alert Stock (col-5)

### Data Flow (Production)
```
getDashboardData() → Promise.all([
  getOverallKpi(),        → 6 KPI cards
  getStockHealth(),       → donut chart
  getTypeDistribution(),  → bar chart
  getPerTypeBreakdown(),  → 3 type cards
  getAlertStock(),        → alert widget
  getRecentActivity(),    → log feed
])
```

### Interactions
| Action | Behavior |
|---|---|
| Click any KPI card | Navigate to Master Part (with relevant filter pre-applied) |
| Hover donut segment | Other segments dim to 45%, center shows segment name/value/% |
| Hover bar chart row | Tooltip with per-status breakdown (count + %) |
| Click type breakdown row | Navigate to Master Part (filtered by type + status) |
| Click alert item | Navigate to Master Part (opens that part's detail) |
| Click log item | Navigate to Stock Movement |
| Click "Lihat Semua →" | Navigate to Stock Movement |
| Click Refresh (navbar) | 5s cooldown, spinning icon during refresh |

### KPI Cards
| Card | Value | Color | Icon |
|---|---|---|---|
| Total Parts | 315 | Blue (chart-1) | Package |
| Available | 198 | Green (chart-2) | CheckCircle2 |
| Low Stock | 67 | Yellow (chart-3) | AlertTriangle |
| Out of Stock | 28 | Red (chart-4) | XCircle |
| Unassigned | 22 | Purple (chart-5) | HelpCircle |
| Total Asset | — (null) | Primary | Wallet |

---

## Page 3: Master Part (`/parts`)

**Screenshot:** `screenshots/03-pages.png`

### Layout
1. Page header: "Master Part" + active part count
2. Toolbar: Search + Filter button + "Tambah Part" button
3. Filter chips (when filters active)
4. Data table with pagination

### Table Specifications
- Default sort: Part Name ascending
- Page size: 15
- Columns: No, Part Name, Part Code, Maker, Category, Type, Storage, Stock, Unit, Status, Actions
- Part Name is a clickable link (opens detail sheet)

### Filter Sheet (Slide-over, right, 340px)
- 4 filter groups with checkboxes: Type (3), Status (5), Maker (dynamic), Category (dynamic)
- Active filters shown as chips in toolbar
- "Clear all" link to reset

### Add Part Form (Sheet, right)
**3-step wizard:**
- Step 1: Identity fields (Part Name*, Part Code*, Maker*, Type*, Category*, Unit*)
- Step 2: Stock (Min*, Std, Max, Initial) + Location (Type, Number, Box, BoxKecil — all or none)
- Step 3: Review summary with all data

**Validation at each step:**
- Part Code uniqueness check (on blur or submit)
- Storage location availability check
- min ≤ std ≤ max validation
- Barcode preview auto-generated from storage fields

### Detail Sheet (Slide-over, right, 500px)
**3 tabs:**
- Overview: 4 info cards (Identity, Stock with bar, Storage, Metadata)
- Purchase: mini table of purchase records
- History: mini table of stock movements for this part

### Row Actions Dropdown
- Lihat Detail → opens detail sheet
- Edit Part → opens edit form (pre-populated)
- Assign Lokasi → only for unassigned parts
- Nonaktifkan / Aktifkan → confirm dialog
- Hapus → confirm dialog (soft delete)

---

## Page 4: Stock Movement (`/movements`)

**Screenshot:** `screenshots/04-pages.png`

### Layout
1. Page header: "Stock Movement" + transaction count
2. Toolbar: Search + Type dropdown + Part Type dropdown + Export + Stock IN/OUT buttons
3. Date range: two date inputs with "s/d" separator
4. Summary strip: Total | IN count (+qty) | OUT count (-qty)
5. Data table with pagination

### Stock IN/OUT Sheet (right, 420px)
**Flow:**
1. Scan field → enter barcode (number) or part code (text)
2. Click Search or press Enter
3. If found: Part info card appears (name, code, maker, unit, current stock)
4. Enter Quantity → live preview shows "current → new (±qty)"
5. Enter NIK Requestor → auto-lookup resolves to name + dept
6. Inputer field auto-filled from session (disabled)
7. Project dropdown (optional, CreatableSelect)
8. Confirm button → success state

**Validation:**
- OUT qty > current stock → error "Quantity exceeds available stock (X PCS)"
- NIK not found (after 4+ chars) → error "NIK tidak ditemukan"
- Part not found → red error box below search

### Export Dialog
- Shows transaction count + date range
- Format toggle: .xlsx or .csv
- Export button → success state

### Key Visual Details
- IN quantities: green badge with `+` prefix
- OUT quantities: red badge with `-` prefix
- Stock IN button: green outline, green text
- Stock OUT button: red outline, red text

---

## Page 5: Part Search (`/search`)

**Screenshot:** `screenshots/05-pages.png`

### 3 States

**State 1: Empty (no file)**
- Drop zone: dashed border, upload icon, "Drop file Excel atau klik untuk browse"
- Accepted formats: .xlsx, .xls, .csv — max 500 rows, 5 MB
- "Download Template" button below

**State 2: Processing**
- Centered spinner with "Memproses file..." and "Mencocokkan part dengan database"

**State 3: Results**
- File info bar: filename + row count + "Ganti File" button
- Summary badges (clickable, toggle filter): Total, ✅ Exact, 🟡 Possible, ❌ Not Found, 🔵 Shortage
- Results table with expandable rows
- "Export Hasil (.xlsx)" button at bottom

### Row Expansion
- Click any row → toggles detail panel below
- Exact/Shortage: shows matched part info (name, code, maker, type, storage, stock, qty needed, shortage amount)
- Possible: shows up to 3 candidate parts with name, code, maker, stock
- Not Found: "Tidak ada part yang cocok di database"

### Color Coding
- Exact Match: green row tint
- Possible Match: yellow row tint
- Not Found: red row tint
- Stock Shortage: blue row tint

---

## Page 6: Stock Taking (`/stock-taking`)

**Screenshot:** `screenshots/06-pages.png`

### Layout
1. Page header: "Stock Taking" + subtitle
2. Summary strip: Total Part | Sudah Diaudit | OK | NG | Belum Diaudit
3. Toolbar: Search + Storage filter dropdown + Export Excel button
4. Filter chips (when storage filter active)
5. Data table with pagination (15 per page)

### Table Behavior
- Only active parts with assigned storage location are shown
- Only the **Actual Stock** column is editable (number input)
- Discrepancy = Actual Stock − Current Stock (auto-calculated)
- Status = OK when discrepancy is 0, NG when ≠ 0
- Rows color-coded: OK = green tint, NG = red tint
- All columns sortable (click header)
- Default sort: Storage Address ascending

### Storage Filter Dropdown
- "Semua Lokasi" (default)
- Section "Tipe Storage": Rak A, Rak B, Rak C — with part count
- Section "Storage Address": A-1, B-1, C-1 — with part count

### Export
- Exports CSV with BOM (`\uFEFF`) for Excel compatibility
- Filename: `Stock_Taking_YYYYMMDD.csv`
- Includes all filtered rows with actual stock and discrepancy data

---

## Page 7: User Management (`/users`)

**Screenshot:** `screenshots/07-pages.png`

### Layout
1. Page header: "User Management"
2. Toolbar: Search + "Tambah User" button
3. Summary strip: Total User | Active | Admin | Inactive
4. Data table (no pagination — typically < 20 users)

### Add User Dialog (centered modal, 420px)
**Fields:**
- NIK* (mono input)
- Nama Lengkap*
- Role: 2-button select (User / Admin)

**Success state:** Shows temp password "Epson@XXXX" with warning "Password ini hanya ditampilkan sekali"

### Row Actions
- Ubah Role → confirm dialog
- Reset Password → generates new temp password, shows once
- Nonaktifkan → confirm dialog (red)
- Aktifkan → for inactive users

### Business Rules
- Last active admin cannot be deactivated → shows info dialog "Promosikan admin lain terlebih dahulu"
- Temp password format: `Epson@` + 4 random alphanumeric chars

---

## Page 8: Account (`/account`)

**Screenshot:** `screenshots/08-pages.png`

### Profile View (max-width 520px)
- Avatar circle with initial
- Name + role badge
- Info grid: NIK, Name, Role, Status, Last Login, Registered Since
- "Ganti Password" button → switches to password form

### Change Password Form (max-width 460px)
- Back button (chevron left)
- Old Password field (with eye toggle)
- New Password field (with eye toggle + strength meter + requirements checklist)
- Confirm Password field (with eye toggle + match indicator)
- Save button

**Strength meter:** 4 segments
- 1 = Lemah (red)
- 2 = Sedang (yellow)
- 3 = Kuat (green)
- 4 = Sangat Kuat (green)

**Requirements checklist:**
- ○/✓ Min 8 karakter
- ○/✓ Mengandung huruf
- ○/✓ Mengandung angka

---

## Global Interactions

### Theme
- 3 modes: Light, Dark, System
- Persisted in `localStorage('mia-theme')`
- Dark mode: all colors swap via CSS variables, Epson logo inverted

### Sidebar
- Toggle with button or `Ctrl+B`
- Collapsed width: 64px, expanded: 240px
- Transition: 220ms cubic-bezier
- Persisted in `localStorage('mia-sidebar-collapsed')`

### Navigation
- All navigation is via sidebar clicks
- Page title and subtitle update per page
- Back navigation within pages via in-page state (e.g., Account profile ↔ change-password)
