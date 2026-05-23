import type { Metadata } from "next";
import {
  Libre_Barcode_39,
  Plus_Jakarta_Sans,
  Roboto_Mono,
} from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Use Plus Jakarta Sans for premium, modern, and clean typography.
const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Code 39 barcode font — wrap the value in *…* to render a scannable barcode.
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
      className={`${sans.variable} ${mono.variable} ${barcode.variable}`}
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
