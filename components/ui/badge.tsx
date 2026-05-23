import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // MIA Inventory status/type pills — see handoff/05-migration-guide.md §2.6
        success:
          "border-transparent bg-chart-2/15 text-chart-2",
        warning:
          "border-transparent bg-chart-3/20 text-chart-3",
        info:
          "border-transparent bg-chart-1/15 text-chart-1",
        purple:
          "border-transparent bg-chart-5/15 text-chart-5",
        // Solid variants — used by the stock-status pill so Available / Low /
        // Out of Stock all read with the same visual weight.
        successSolid:
          "border-transparent bg-chart-2 text-white shadow-sm",
        warningSolid:
          "border-transparent bg-chart-3 text-zinc-900 shadow-sm dark:text-zinc-950",
        outlineDashed:
          "border-dashed border-slate-400 bg-slate-100 text-slate-600 dark:border-slate-500 dark:bg-slate-800/40 dark:text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
