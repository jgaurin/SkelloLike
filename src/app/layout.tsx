import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
} from "@/lib/seo";

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
  metadataBase: new URL(SITE_URL),
  title: {
    // Chaque page fournit son titre ; les autres reçoivent « … · Ritem ».
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "business",
  alternates: { canonical: "/" },
  // Laisser Google indexer et suivre, avec des aperçus riches.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  verification: {
    // Vérification de propriété Google Search Console.
    google: "KG_u-LeISGA_7-vBaxqiq_q_llp0RjihqmJy6sVCGaY",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#0b2e1f" },
  ],
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
        {/* Analytics Umami (auto-hébergé). Chargé en production uniquement.
            S'active dès que stats.ritem.pro est en HTTPS. */}
        {process.env.NODE_ENV === "production" && (
          <Script
            src="https://stats.ritem.pro/script.js"
            data-website-id="4b61458e-7fb9-40d6-b2ac-4be021a7d1d8"
            strategy="afterInteractive"
            defer
          />
        )}
      </body>
    </html>
  );
}
