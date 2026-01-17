import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL('https://nobetci-eczane.vercel.app'),
  title: {
    default: "Nöbetçi Eczane Bulucu | Türkiye Geneli",
    template: "%s | Nöbetçi Eczane Bulucu"
  },
  description: "Türkiye genelinde nöbetçi eczaneleri kolayca bulun. Konumunuza en yakın açık eczaneleri harita üzerinde görün, yol tarifi alın ve hemen arayın.",
  keywords: ["nöbetçi eczane", "eczane", "açık eczane", "yakın eczane", "nöbetçi", "pharmacy", "türkiye eczane", "gece eczane"],
  authors: [{ name: "Pharmacy Finder" }],
  creator: "Pharmacy Finder",
  publisher: "Pharmacy Finder",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon-192.svg',
    shortcut: '/icon-192.svg',
    apple: '/icon-512.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://nobetci-eczane.vercel.app',
    siteName: 'Nöbetçi Eczane Bulucu',
    title: 'Nöbetçi Eczane Bulucu | Türkiye Geneli',
    description: 'Türkiye genelinde nöbetçi eczaneleri kolayca bulun. Konumunuza en yakın açık eczaneleri harita üzerinde görün.',
    images: [
      {
        url: '/icon-512.svg',
        width: 512,
        height: 512,
        alt: 'Nöbetçi Eczane Bulucu Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nöbetçi Eczane Bulucu | Türkiye Geneli',
    description: 'Türkiye genelinde nöbetçi eczaneleri kolayca bulun. Konumunuza en yakın açık eczaneleri harita üzerinde görün.',
    images: ['/icon-512.svg'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
  alternates: {
    canonical: 'https://nobetci-eczane.vercel.app',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#00ff9d" />

        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Eczane Bulucu" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Eczane Bulucu" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-512.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-512.svg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.svg" />
        <script src="/init.js" defer />
      </head>
      <body className="antialiased">
        <GoogleAnalytics />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
