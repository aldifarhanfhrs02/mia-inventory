import type { Metadata } from "next";
import { Inter, Libre_Barcode_39 } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Inter — single sans-serif used across the entire UI. Numeric alignment is
// handled via the CSS `tabular-nums` utility, not a separate mono typeface.
// Libre Barcode 39 — strictly scoped to the barcode preview in the storage
// detail dialog (the only place we actually render a scannable barcode).
const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barcode = Libre_Barcode_39({
  variable: "--font-barcode",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "MIA Inventory",
  description:
    "Sistem manajemen inventaris part — Departemen MIA, PT Epson Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${sans.variable} ${barcode.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
