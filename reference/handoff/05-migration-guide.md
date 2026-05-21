# Migration Guide — Prototype → Production

How to translate every prototype pattern into Next.js 14+ / shadcn/ui production code.

---

## 1. Project Structure

### Prototype Structure
```
MIA Inventory.html          ← single HTML entry point
components/
  icons.jsx                 ← hand-drawn Lucide SVGs
  layout.jsx                ← Sidebar + Navbar
  dashboard.jsx             ← Dashboard page
  dashboard-charts.jsx      ← Donut + Bar charts (pure SVG)
  part-data.jsx             ← Mock data + helpers
  master-part.jsx           ← Master Part page (table, forms, filters)
  part-detail.jsx           ← Detail sheet (3 tabs)
  stock-movement.jsx        ← Stock Movement page
  part-search.jsx           ← Part Search page
  stock-taking.jsx          ← Stock Taking page
  user-management.jsx       ← User Management page
  account.jsx               ← Account + Change Password
  login.jsx                 ← Login page
  Epson_logo.svg            ← Brand asset
```

### Production Structure
```
app/
├── (auth)/
│   └── login/
│       └── page.tsx                    ← LoginPage
├── (dashboard)/
│   ├── layout.tsx                      ← Sidebar + Navbar shell
│   ├── dashboard/
│   │   └── page.tsx                    ← Dashboard
│   ├── parts/
│   │   └── page.tsx                    ← MasterPartPage
│   ├── movements/
│   │   └── page.tsx                    ← StockMovementPage
│   ├── search/
│   │   └── page.tsx                    ← PartSearchPage
│   ├── stock-taking/
│   │   └── page.tsx                    ← StockTakingPage
│   ├── users/
│   │   └── page.tsx                    ← UserManagementPage (admin only)
│   └── account/
│       ├── page.tsx                    ← AccountPage
│       └── change-password/
│           └── page.tsx                ← ChangePasswordForm
├── layout.tsx                          ← Root layout (fonts, theme provider)
└── globals.css                         ← Tailwind + CSS variables

components/
├── ui/                                 ← shadcn/ui components (auto-generated)
│   ├── button.tsx
│   ├── input.tsx
│   ├── table.tsx
│   ├── sheet.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── form.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   ├── tooltip.tsx
│   └── ...
├── layout/
│   ├── sidebar.tsx                     ← Sidebar component
│   ├── navbar.tsx                      ← Navbar component
│   ├── theme-toggle.tsx                ← Theme dropdown
│   └── user-dropdown.tsx               ← User menu
├── dashboard/
│   ├── kpi-card.tsx
│   ├── stock-health-chart.tsx          ← Recharts PieChart
│   ├── type-distribution-chart.tsx     ← Recharts BarChart
│   ├── type-breakdown-card.tsx
│   ├── alert-stock-widget.tsx
│   └── transaction-log-feed.tsx
├── parts/
│   ├── parts-table.tsx                 ← TanStack Table
│   ├── parts-toolbar.tsx
│   ├── part-detail-sheet.tsx
│   ├── add-part-sheet.tsx
│   ├── filter-sheet.tsx
│   └── columns.tsx                     ← TanStack column defs
├── movements/
│   ├── movements-table.tsx
│   ├── stock-sheet.tsx
│   ├── export-dialog.tsx
│   └── columns.tsx
├── search/
│   ├── drop-zone.tsx
│   ├── results-table.tsx
│   └── row-detail.tsx
├── stock-taking/
│   ├── stock-taking-table.tsx
│   └── columns.tsx
├── users/
│   ├── users-table.tsx
│   ├── add-user-dialog.tsx
│   └── confirm-dialog.tsx
├── account/
│   ├── profile-card.tsx
│   └── change-password-form.tsx
└── shared/
    ├── status-badge.tsx
    ├── type-badge.tsx
    ├── role-badge.tsx
    ├── pagination.tsx
    └── creatable-select.tsx

lib/
├── db/
│   ├── index.ts                        ← Drizzle client
│   └── schema/
│       ├── parts.ts
│       ├── stock-movements.ts
│       ├── purchase-records.ts
│       ├── users.ts
│       ├── projects.ts
│       ├── activity-logs.ts
│       └── search-logs.ts
├── auth/
│   ├── index.ts                        ← Better Auth config
│   └── session.ts                      ← getServerSession helper
├── actions/
│   ├── parts.actions.ts
│   ├── movements.actions.ts
│   ├── dashboard.actions.ts
│   ├── search.actions.ts
│   ├── users.actions.ts
│   ├── purchase.actions.ts
│   └── projects.actions.ts
├── validations/
│   ├── parts.schema.ts
│   ├── movements.schema.ts
│   ├── users.schema.ts
│   └── search.schema.ts
├── types/
│   └── index.ts                        ← from 02-data-models.ts
├── utils/
│   ├── barcode.ts                      ← generateBarcode, formatStorageAddr
│   ├── stock.ts                        ← computeStockStatus, computeAlertSeverity
│   └── format.ts                       ← formatPrice, formatDate
└── export/
    ├── excel-generator.ts
    └── label-generator.ts

middleware.ts                            ← Auth + role guard
```

---

## 2. Pattern Translations

### 2.1 Component Sharing
```
PROTOTYPE:
  Object.assign(window, { Dashboard, MasterPartPage, ... })
  // Each <script type="text/babel"> shares via window global

PRODUCTION:
  export function Dashboard() { ... }
  import { Dashboard } from "@/components/dashboard"
```

### 2.2 State Management
```
PROTOTYPE:
  const [page, setPage] = useState('dashboard')
  // Single-page app with manual page switching

PRODUCTION:
  // Next.js App Router handles routing
  // app/(dashboard)/dashboard/page.tsx → server component
  // Client state via React hooks + URL search params for filters
```

### 2.3 Mock Data → Server Actions
```
PROTOTYPE:
  const PARTS_DATA = [...];  // hardcoded array in part-data.jsx
  const MOCK_USERS = [...];  // hardcoded array in user-management.jsx

PRODUCTION:
  // Server Component (page.tsx):
  const parts = await getParts({ filters, page, sort });
  return <PartsTable data={parts} />;

  // Server Action (lib/actions/parts.actions.ts):
  export async function getParts(params) {
    const session = await getServerSession();
    if (!session) redirect('/login');
    // ... Drizzle query with computed current_stock
  }
```

### 2.4 Data Tables → TanStack Table
```
PROTOTYPE:
  <table className="mp-table">
    <thead><tr><th onClick={sort}>...</th></tr></thead>
    <tbody>{data.map(row => <tr>...</tr>)}</tbody>
  </table>

PRODUCTION:
  // columns.tsx
  export const columns: ColumnDef<PartWithStock>[] = [
    { accessorKey: "partName", header: "Part Name", cell: ... },
    { accessorKey: "partCode", header: "Part Code", ... },
    ...
  ];

  // parts-table.tsx
  import { DataTable } from "@/components/ui/data-table"
  <DataTable columns={columns} data={parts} />
```

### 2.5 Sheets & Dialogs → shadcn
```
PROTOTYPE:
  <div className="sheet-overlay" onClick={onClose} />
  <div className="sheet sheet--right">...</div>

PRODUCTION:
  import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet"
  <Sheet open={open} onOpenChange={setOpen}>
    <SheetContent side="right" className="w-[420px]">
      <SheetHeader>...</SheetHeader>
      ...
    </SheetContent>
  </Sheet>
```

### 2.6 Badges → shadcn Badge
```
PROTOTYPE:
  <span className="st-badge--avail">Available</span>

PRODUCTION:
  import { Badge } from "@/components/ui/badge"
  <Badge variant="success">Available</Badge>
  // Add custom variants to badge.tsx for: success, warning, destructive, outline-dashed
```

### 2.7 Forms → React Hook Form + shadcn Form
```
PROTOTYPE:
  const [partName, setPartName] = useState('');
  <input value={partName} onChange={e => setPartName(e.target.value)} />

PRODUCTION:
  const form = useForm<CreatePartInput>({
    resolver: zodResolver(CreatePartSchema),
    defaultValues: { partName: "", ... }
  });

  <Form {...form}>
    <FormField control={form.control} name="partName" render={({ field }) => (
      <FormItem>
        <FormLabel>Part Name <span className="text-destructive">*</span></FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  </Form>
```

### 2.8 Icons → Lucide React
```
PROTOTYPE:
  const Zap = (p) => <Ic {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></Ic>;

PRODUCTION:
  import { Zap } from "lucide-react"
  <Zap className="h-4 w-4" />
```

### 2.9 Charts → Recharts
```
PROTOTYPE:
  // Hand-drawn SVG donut in dashboard-charts.jsx

PRODUCTION:
  import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
  <ResponsiveContainer width="100%" height={220}>
    <PieChart>
      <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value">
        {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
```

### 2.10 Toasts → Sonner
```
PROTOTYPE:
  // Success shown as inline state change in sheets/dialogs

PRODUCTION:
  import { toast } from "sonner"
  toast.success("Part berhasil ditambahkan")
  toast.error("Part Code sudah ada di database")
```

### 2.11 Theme → next-themes
```
PROTOTYPE:
  localStorage.setItem('mia-theme', t);
  document.documentElement.classList.toggle('dark', isDark);

PRODUCTION:
  import { ThemeProvider } from "next-themes"
  // In layout.tsx:
  <ThemeProvider attribute="class" defaultTheme="system">
    {children}
  </ThemeProvider>
```

### 2.12 Auth → Better Auth
```
PROTOTYPE:
  const [loggedIn, setLoggedIn] = useState(false);
  localStorage.setItem('mia-logged-in', 'true');

PRODUCTION:
  // middleware.ts handles auth guard
  // lib/auth/session.ts provides getServerSession()
  // Login form calls server action with credentials
```

### 2.13 CSS → Tailwind
```
PROTOTYPE:
  .kpi-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-left-width: 4px;
    border-radius: var(--radius);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

PRODUCTION:
  <div className="flex items-center gap-3 rounded-lg border border-l-4 bg-card p-4 shadow-sm">
```

---

## 3. shadcn/ui Components to Install

Run these to get the needed components:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card badge table sheet dialog
npx shadcn-ui@latest add dropdown-menu select tabs tooltip separator
npx shadcn-ui@latest add form label textarea checkbox
npx shadcn-ui@latest add sonner
```

**Custom components to build (not in shadcn):**
- `StatusBadge` — stock status pill with color variants
- `TypeBadge` — part type pill
- `RoleBadge` — user role pill
- `KpiCard` — dashboard metric card
- `CreatableSelect` — dropdown with "add new" option
- `PasswordInput` — input with eye toggle
- `PasswordStrengthBar` — 4-segment meter

---

## 4. Key Technical Decisions

### current_stock is NEVER stored
Every query that needs current stock must JOIN with stock_movements and SUM. Use a CTE or subquery for bulk operations (Part List, Dashboard).

### Stock movements are IMMUTABLE
No update, no delete. Corrections are new REVERSAL transactions. The `stock_before`/`stock_after` fields are snapshots.

### Pagination is server-side
All tables use server-side pagination via search params. TanStack Table manages client-side sorting/filtering UI, but data comes paginated from server actions.

### Filters persist in URL
Use `useSearchParams` to persist filter/sort/page state in the URL so users can bookmark or share filtered views.

---

## 5. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mia_inventory

# Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Superadmin (hardcoded, not in DB)
SUPERADMIN_NIK=ADM000
SUPERADMIN_PASSWORD=hashed-value
```

---

## 6. Seed Data

The prototype contains realistic seed data that should be used for development:
- **30 parts** across 3 types (12 electrical, 10 mechanical, 5 fabrication, 2 unassigned, 1 inactive)
- **25 stock movements** with realistic timestamps and quantities
- **9 users** (3 admin, 5 active user, 1 inactive)
- **6 purchase records** across different statuses

Copy the arrays from `components/part-data.jsx` and `components/stock-movement.jsx` into your seed script, transforming them into Drizzle insert statements.
