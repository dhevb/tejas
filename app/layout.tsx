import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { TejasNavbar } from "@/components/layout/TejasNavbar";
import { TejasFooter } from "@/components/layout/TejasFooter";
import { FloatingCTA } from "@/components/shared/FloatingCTA";
import { I18nProvider } from "@/lib/i18n/context";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { createMetadata } from "@/config/seo";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const metadata: Metadata = createMetadata({});

export const viewport: Viewport = {
  themeColor: "#172B67",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${notoDevanagari.variable}`}>
      <body className="min-h-screen flex flex-col font-sans">
        <GoogleAnalytics />
        <I18nProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-4 focus:rounded-lg focus:bg-tejas-saffron focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          <TejasNavbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <TejasFooter />
          <FloatingCTA label="Register for TEJAS" href="/schools/register" />
        </I18nProvider>
      </body>
    </html>
  );
}
