import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.yakindakinobetcieczane.com'),
  title: {
    default: "Nöbetçi Eczane Bulucu | Türkiye Geneli",
    template: "%s | Nöbetçi Eczane Bulucu"
  },
  description: "Türkiye genelinde nöbetçi eczaneleri kolayca bulun. Konumunuza en yakın açık eczaneleri harita üzerinde görün, yol tarifi alın ve hemen arayın.",
  keywords: [
    "nöbetçi eczane",
    "nöbetçi eczane bulucu", 
    "yakınımdaki nöbetçi eczane",
    "bugün nöbetçi eczane",
    "açık eczane",
    "gece açık eczane",
    "7/24 eczane",
    "en yakın eczane",
    "eczane telefon",
    "nöbetçi eczane harita",
    "istanbul nöbetçi eczane",
    "ankara nöbetçi eczane",
    "izmir nöbetçi eczane",
    "eczane nerede",
    "acil eczane",
  ],
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
    url: 'https://www.yakindakinobetcieczane.com',
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
  alternates: {
    canonical: 'https://www.yakindakinobetcieczane.com',
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
        <meta name="theme-color" content="#10b981" />

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
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2447229930465560"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <GoogleAnalytics />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
