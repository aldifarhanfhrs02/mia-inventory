# MIA Inventory — Developer Handoff Package

**Project:** MIA Inventory Dashboard
**Owner:** Departemen Manufacturing Innovation & Automation (MIA), PT Epson Indonesia
**Date:** 21 Mei 2026
**Source:** HTML/React prototype → Next.js 14+ production app

---

## Package Contents

| # | File | Description |
|---|---|---|
| 1 | `01-design-tokens.ts` | Tailwind v3 theme config — all colors, fonts, spacing, shadows |
| 2 | `02-data-models.ts` | TypeScript interfaces for all entities + computed types |
| 3 | `03-component-map.md` | Every component, its props, state, children, and behavior |
| 4 | `04-page-specs.md` | Page-by-page interaction specs with screenshots |
| 5 | `05-migration-guide.md` | Prototype → Production translation patterns |
| 6 | `screenshots/` | Reference screenshots of every page |

---

## Tech Stack (Final)

```
── FRONTEND ──────────────────────────────────────────
Next.js 14+          App Router, Server Components, TypeScript strict
shadcn/ui            UI components — install via CLI
Tailwind CSS v3      Styling
Lucide React         Icons (sole icon library)
TanStack Table       Data tables (Master Part, Stock Movement, Stock Taking, Part Search, User Management)
React Hook Form      Form state — always via shadcn <Form>
Zod                  Client-side validation — schemas in lib/validations/
next-themes          Light/dark mode toggle
Recharts             Dashboard charts
Sonner               Toast notifications
date-fns             Date formatting

── BACKEND ───────────────────────────────────────────
Next.js 14+          Server Actions (not API routes)
TypeScript strict    no `any`, no `@ts-ignore`
Drizzle ORM          Database client — schema in lib/db/schema/
Better Auth          Auth provider — session, password hashing, middleware
Zod                  Server-side validation — schemas in lib/validations/
PostgreSQL           Database (via Drizzle)
```

---

## Suggested Build Order (Phases)

### Phase 1: Foundation (Day 1-2)
1. Scaffold Next.js project with App Router
2. Install shadcn/ui, configure Tailwind theme from `01-design-tokens.ts`
3. Set up Drizzle + PostgreSQL schema
4. Implement Better Auth with NIK-based credential login
5. Build Layout shell: Sidebar + Navbar + theme toggle

### Phase 2: Core Pages (Day 3-5)
6. Dashboard page (KPI cards, charts, alerts, activity feed)
7. Master Part page (CRUD table, filter sheet, detail sheet, add/edit forms)
8. Stock Movement page (table, Stock IN/OUT sheets, export dialog)

### Phase 3: Supporting Pages (Day 6-7)
9. Part Search page (file upload, matching algorithm, results table)
10. Stock Taking page (audit table, editable actual stock, export CSV)
11. User Management page (CRUD, role badges, add/reset/deactivate dialogs)
12. Account page (profile view, change password form)

### Phase 4: Polish (Day 8)
13. Login page (warehouse illustration, auth flow)
14. Middleware guards (auth, role-based, force change-password)
15. Activity logging for all mutations
16. Export functionality (Excel/CSV)

---

## Critical Rules (from PRD)

1. **`current_stock` is NEVER stored** — always computed from `SUM(stock_movements)`
2. **Stock movements are IMMUTABLE** — no update, no delete
3. **Soft delete only** — all queries must include `WHERE deleted_at IS NULL`
4. **Every mutation logs to `activity_logs`** — inside the same transaction
5. **Admin terakhir tidak bisa deactivate** — guard against last-admin deactivation
6. **Barcode unique only among active parts** — partial unique index
7. **Session timeout: 8 hours** — auto-expire idle sessions

---

## How to Use This Package

1. Read `05-migration-guide.md` first — it explains how prototype patterns map to production
2. Reference `01-design-tokens.ts` when configuring Tailwind theme
3. Copy interfaces from `02-data-models.ts` into your `lib/types/` folder
4. Use `03-component-map.md` when building each component — it lists exact props and behavior
5. Follow `04-page-specs.md` for page-level interactions and edge cases
6. Cross-reference `screenshots/` for visual reference

**For Claude Code:** Feed this README + the relevant section file when working on each phase. Don't feed everything at once.
