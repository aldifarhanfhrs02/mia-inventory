/**
 * Placeholder dashboard — confirms the Tailwind v3 theme and dark mode work.
 * Phase 4 replaces this with the real layout shell + route groups.
 */
export default function DashboardPlaceholder() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold text-foreground">MIA Inventory</h1>
      <p className="text-sm text-muted-foreground">
        Foundation ready — Phase 1 complete.
      </p>
      <div className="flex gap-2">
        <span className="rounded-md bg-chart-2/15 px-2.5 py-0.5 text-xs font-semibold text-chart-2">
          Available
        </span>
        <span className="rounded-md bg-chart-3/20 px-2.5 py-0.5 text-xs font-semibold text-chart-3">
          Low Stock
        </span>
        <span className="rounded-md bg-chart-4/15 px-2.5 py-0.5 text-xs font-semibold text-chart-4">
          Out of Stock
        </span>
      </div>
    </main>
  );
}
