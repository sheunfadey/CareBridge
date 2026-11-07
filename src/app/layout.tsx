import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

import { brand } from "@/config/brand";
import { AppProviders } from "@/app/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.shortDescription,
  applicationName: brand.name,
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.shortDescription,
    siteName: brand.name,
    images: [{ url: "/brand/social-share.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.shortDescription,
    images: ["/brand/social-share.png"],
  },
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
    apple: [
      {
        url: "/brand/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brand.colors.navy },
    { media: "(prefers-color-scheme: dark)", color: brand.colors.deepNavy },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
