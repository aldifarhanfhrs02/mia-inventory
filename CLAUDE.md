@AGENTS.md

# MIA Inventory — Production Build

Internal warehouse / parts-inventory app for the MIA department, PT Epson Indonesia.
Rebuilt from an HTML/JSX prototype (see `reference/`) into a production Next.js app.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) — TypeScript strict
- **Tailwind CSS v3** (not v4) — `tailwind.config.ts` + CSS variables in `app/globals.css`
- **shadcn/ui** (new-york style) — `components/ui/`
- **Drizzle ORM** + **PostgreSQL** — schema in `lib/db/schema/`
- **Better Auth** — NIK-based credential login, 8h sessions
- TanStack Table · React Hook Form + Zod · Recharts · Sonner · next-themes · date-fns · Lucide

## Build is phased — read the plan before resuming

The phased build plan lives at
`../.claude/plans/fetch-this-design-file-playful-globe.md`. Each phase ends with a
passing `npm run build` and a git commit. To resume: read that plan, run
`git log --oneline`, and start the first unchecked phase.

## Critical business rules (enforce everywhere)

1. `current_stock` is **never stored** — compute it: `SUM(INITIAL+IN) − SUM(OUT)` from `stock_movements`.
2. Stock movements are **immutable** — no update, no delete; corrections are reversal rows.
3. **Soft delete only** — every query filters `WHERE deleted_at IS NULL`.
4. **Every mutation logs to `activity_logs`** inside the same DB transaction.
5. The **last active admin cannot be deactivated**.
6. Barcode is unique only among active parts (partial unique index).
7. Sessions expire after **8 hours** idle.

## Conventions

- TypeScript strict — no `any`, no `@ts-ignore`.
- Mutations are **Server Actions** (`lib/actions/`), not API routes.
- Zod schemas in `lib/validations/` — shared by client forms and server actions.
- Match the prototype's visuals exactly — read `reference/prototype/` and
  `reference/screenshots/` for ground truth; `reference/handoff/` for specs.
- Folder layout follows `reference/handoff/05-migration-guide.md` §1.
