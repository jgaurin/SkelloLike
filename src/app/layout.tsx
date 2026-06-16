import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Police principale — Poppins (sans-serif arrondie, esprit Skello).
const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ritem — Gestion des plannings",
  description:
    "Planning, pointage et gestion RH pour vos équipes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      {/* suppressHydrationWarning : des extensions navigateur (ColorZilla…)
          ajoutent des attributs au <body> avant l'hydratation. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
