import type { Config } from "tailwindcss";

/**
 * MIA Inventory — Tailwind v3 theme.
 * Colors map to CSS variables defined in app/globals.css.
 * Base palette from handoff/01-design-tokens.ts; popover/secondary/accent/input
 * added so shadcn/ui components resolve.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Chart palette
        chart: {
          1: "hsl(var(--chart-1))", // Blue — Total/Primary
          2: "hsl(var(--chart-2))", // Green — Available/Success/IN
          3: "hsl(var(--chart-3))", // Yellow — Low Stock/Warning
          4: "hsl(var(--chart-4))", // Red — Out of Stock/Error/OUT
          5: "hsl(var(--chart-5))", // Purple — Unassigned
        },

        // Sidebar
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          border: "hsl(var(--sidebar-border))",
        },
      },

      fontFamily: {
        sans: ["var(--font-sans)", "Roboto", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "SFMono-Regular", "Consolas", "monospace"],
      },

      borderRadius: {
        lg: "var(--radius)", // 0.75rem = 12px
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      boxShadow: {
        sm: "0 1px 3px oklch(0.25 0.005 260 / 0.08), 0 1px 2px oklch(0.25 0.005 260 / 0.06)",
        DEFAULT:
          "0 2px 8px oklch(0.25 0.005 260 / 0.10), 0 1px 3px oklch(0.25 0.005 260 / 0.08)",
        md: "0 4px 16px oklch(0.25 0.005 260 / 0.12), 0 2px 6px oklch(0.25 0.005 260 / 0.08)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
