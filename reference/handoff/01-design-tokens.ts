// handoff/01-design-tokens.ts
// Tailwind v3 theme configuration extracted from MIA Inventory prototype
// Copy relevant sections into your tailwind.config.ts

// ============================================================================
// TAILWIND CONFIG
// ============================================================================

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // ── Colors ──────────────────────────────────────────────────────────
      // These map to CSS variables set in globals.css (see below)
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",

        // Chart palette (5 colors)
        chart: {
          1: "hsl(var(--chart-1))",  // Blue — Total/Primary
          2: "hsl(var(--chart-2))",  // Green — Available/Success/IN
          3: "hsl(var(--chart-3))",  // Yellow — Low Stock/Warning
          4: "hsl(var(--chart-4))",  // Red — Out of Stock/Error/OUT
          5: "hsl(var(--chart-5))",  // Purple — Unassigned
        },

        // Sidebar (separate from main)
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          border: "hsl(var(--sidebar-border))",
        },
      },

      // ── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Google Sans", "Roboto", "Inter", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "SFMono-Regular", "Consolas", "monospace"],
      },

      // ── Border Radius ───────────────────────────────────────────────────
      borderRadius: {
        lg: "var(--radius)",    // 0.75rem = 12px
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ── Shadows ─────────────────────────────────────────────────────────
      boxShadow: {
        sm: "0 1px 3px oklch(0.25 0.005 260 / 0.08), 0 1px 2px oklch(0.25 0.005 260 / 0.06)",
        DEFAULT: "0 2px 8px oklch(0.25 0.005 260 / 0.10), 0 1px 3px oklch(0.25 0.005 260 / 0.08)",
        md: "0 4px 16px oklch(0.25 0.005 260 / 0.12), 0 2px 6px oklch(0.25 0.005 260 / 0.08)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;


// ============================================================================
// GLOBALS.CSS — CSS Custom Properties
// ============================================================================
// Paste this into your app/globals.css

/*
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background:          0 0% 100%;
    --foreground:          240 10% 3.9%;
    --card:                0 0% 100%;
    --card-foreground:     240 10% 3.9%;
    --muted:               220 14.3% 95.9%;
    --muted-foreground:    220 8.9% 46.1%;
    --primary:             239 84% 67%;
    --primary-foreground:  0 0% 100%;
    --destructive:         0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border:              220 13% 91%;
    --ring:                239 84% 67%;
    --radius:              0.75rem;

    --chart-1:             239 67% 55%;
    --chart-2:             152 60% 48%;
    --chart-3:             43 80% 65%;
    --chart-4:             14 80% 52%;
    --chart-5:             280 60% 55%;

    --sidebar:             220 14% 96%;
    --sidebar-foreground:  220 9% 46%;
    --sidebar-accent:      239 30% 92%;
    --sidebar-accent-foreground: 239 50% 55%;
    --sidebar-primary:     239 84% 67%;
    --sidebar-border:      220 13% 91%;
  }

  .dark {
    --background:          240 6% 10%;
    --foreground:          0 0% 90%;
    --card:                240 5% 14%;
    --card-foreground:     0 0% 90%;
    --muted:               240 4% 20%;
    --muted-foreground:    240 5% 55%;
    --primary:             239 40% 72%;
    --primary-foreground:  239 60% 30%;
    --destructive:         0 63% 41%;
    --destructive-foreground: 0 0% 100%;
    --border:              174 5% 26%;
    --ring:                239 40% 72%;

    --chart-1:             239 35% 62%;
    --chart-2:             152 35% 58%;
    --chart-3:             47 40% 68%;
    --chart-4:             18 45% 55%;
    --chart-5:             280 40% 62%;

    --sidebar:             240 5% 14%;
    --sidebar-foreground:  0 0% 90%;
    --sidebar-accent:      239 25% 30%;
    --sidebar-accent-foreground: 239 15% 85%;
    --sidebar-primary:     239 40% 72%;
    --sidebar-border:      174 5% 26%;
  }
}
*/


// ============================================================================
// TYPE HEADER COLORS (Per-type styling)
// ============================================================================
// Used in Dashboard type breakdown cards and type badges throughout

/*
  Electrical:  bg oklch(0.935 0.030 252)  fg oklch(0.40 0.140 258)
  Mechanical:  bg oklch(0.940 0.025 305)  fg oklch(0.38 0.150 302)
  Fabrication: bg oklch(0.935 0.035 185)  fg oklch(0.38 0.120 187)

  Dark mode:
  Electrical:  bg oklch(0.30 0.035 258)   fg oklch(0.80 0.090 260)
  Mechanical:  bg oklch(0.30 0.030 305)   fg oklch(0.80 0.090 305)
  Fabrication: bg oklch(0.30 0.030 185)   fg oklch(0.80 0.080 185)
*/


// ============================================================================
// ICON MAPPING — Lucide React icons used in prototype
// ============================================================================

export const ICON_MAP = {
  // Navigation
  sidebar: {
    dashboard:    "LayoutDashboard",
    parts:        "Package",
    movements:    "ArrowUpDown",
    search:       "Search",
    stockTaking:  "ClipboardCheck",
    users:        "Users",
    account:      "UserCircle",
  },

  // Actions
  actions: {
    add:          "Plus",
    edit:         "Edit3",   // Pencil
    delete:       "X",
    filter:       "Filter",
    export:       "FileSpreadsheet",
    download:     "Download",
    refresh:      "RefreshCw",
    close:        "X",
    settings:     "Settings",
    logout:       "LogOut",
    bell:         "Bell",
    menu:         "Menu",
    chevronRight: "ChevronRight",
    chevronDown:  "ChevronDown",
    arrowUp:      "ArrowUp",
    arrowDown:    "ArrowDown",
    search:       "Search",
  },

  // Type icons
  partTypes: {
    electrical:   "Zap",
    mechanical:   "Cog",          // or Settings
    fabrication:  "Hammer",
  },

  // Status icons
  status: {
    available:    "CheckCircle2",
    lowStock:     "AlertTriangle",
    outOfStock:   "XCircle",
    unassigned:   "HelpCircle",
    inactive:     "CircleDashed",
  },

  // KPI
  kpi: {
    total:        "Package",
    available:    "CheckCircle2",
    lowStock:     "AlertTriangle",
    outOfStock:   "XCircle",
    unassigned:   "HelpCircle",
    asset:        "Wallet",
  },

  // Theme
  theme: {
    light:        "Sun",
    dark:         "Moon",
    system:       "Monitor",
  },

  // Activity log
  activity: {
    stockIn:      "ArrowUp",
    stockOut:     "ArrowDown",
    edit:         "Edit3",
    create:       "Plus",
  },
} as const;


// ============================================================================
// FONT IMPORTS
// ============================================================================
// Add to app/layout.tsx or next.config.js

/*
  Google Fonts:
  - Google Sans (400, 500, 600) — primary sans
  - Roboto (400, 500, 600) — fallback sans
  - Roboto Mono (400, 500) — monospace for codes/numbers

  Import URL:
  https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600&family=Roboto:wght@400;500;600&family=Roboto+Mono:wght@400;500&display=swap

  Alternative (Next.js local fonts):
  Use next/font/google for Google Sans and Roboto Mono
*/
