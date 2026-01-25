'use client';

import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function NotFound() {
  // Enhanced SEO structured data for 404 page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://www.yakindakinobetcieczane.com/404#webpage',
    name: 'Sayfa Bulunamadı - 404 | Nöbetçi Eczane Bulucu',
    description: 'Aradığınız sayfa bulunamadı. Türkiye genelinde 7/24 nöbetçi eczane bulmak için ana sayfamızı ziyaret edin.',
    url: 'https://www.yakindakinobetcieczane.com/404',
    inLanguage: 'tr-TR',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://www.yakindakinobetcieczane.com/#website',
      name: 'Nöbetçi Eczane Bulucu',
      url: 'https://www.yakindakinobetcieczane.com',
      description: 'Türkiye genelinde nöbetçi eczaneleri kolayca bulun',
      publisher: {
        '@type': 'Organization',
        name: 'Nöbetçi Eczane Bulucu',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.yakindakinobetcieczane.com/icon-512.svg'
        }
      }
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Ana Sayfa',
          item: 'https://www.yakindakinobetcieczane.com'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Sayfa Bulunamadı'
        }
      ]
    },
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.yakindakinobetcieczane.com/?search={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      },
      {
        '@type': 'ReadAction',
        target: 'https://www.yakindakinobetcieczane.com'
      }
    ],
    mainEntity: {
      '@type': 'ItemList',
      name: 'Popüler Şehirler',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'İstanbul Nöbetçi Eczane', url: 'https://www.yakindakinobetcieczane.com/istanbul' },
        { '@type': 'ListItem', position: 2, name: 'Ankara Nöbetçi Eczane', url: 'https://www.yakindakinobetcieczane.com/ankara' },
        { '@type': 'ListItem', position: 3, name: 'İzmir Nöbetçi Eczane', url: 'https://www.yakindakinobetcieczane.com/izmir' },
        { '@type': 'ListItem', position: 4, name: 'Bursa Nöbetçi Eczane', url: 'https://www.yakindakinobetcieczane.com/bursa' },
        { '@type': 'ListItem', position: 5, name: 'Antalya Nöbetçi Eczane', url: 'https://www.yakindakinobetcieczane.com/antalya' },
        { '@type': 'ListItem', position: 6, name: 'Adana Nöbetçi Eczane', url: 'https://www.yakindakinobetcieczane.com/adana' }
      ]
    }
  };
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check theme from localStorage - default to light if not set
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else {
      // Default to light theme
      setIsDarkMode(false);
    }
  }, []);

  // Theme colors matching MobileView
  const colors = {
    bg: isDarkMode ? '#111827' : '#ffffff',
    bgGradient: isDarkMode ? 'linear-gradient(180deg, #111827 0%, #1f2937 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
    card: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : '#ffffff',
    cardBorder: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    text: isDarkMode ? '#f9fafb' : '#111827',
    textSecondary: isDarkMode ? '#9ca3af' : '#6b7280',
    accent: isDarkMode ? '#34d399' : '#059669',
    accentBg: isDarkMode ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.bgGradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'Lexend', system-ui, sans-serif"
    }}>
        <div style={{ 
          textAlign: 'center',
          maxWidth: 400,
          width: '100%',
        }}>
          {/* Icon - Search not found */}
          <div style={{
            width: 88,
            height: 88,
            borderRadius: 22,
            background: colors.accentBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Magnifying glass */}
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
              {/* Sad face inside */}
              <circle cx="9" cy="10" r="0.5" fill={colors.accent} stroke="none" />
              <circle cx="13" cy="10" r="0.5" fill={colors.accent} stroke="none" />
              <path d="M9 14c.5-.5 1.5-1 2-1s1.5.5 2 1" />
            </svg>
          </div>

          {/* Text */}
          <div style={{
            background: colors.card,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
          }}>
            <p style={{ color: colors.accent, fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Hata 404</p>
            <h1 style={{ color: colors.text, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sayfa Bulunamadı</h1>
            <p style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
              Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.
            </p>
          </div>

          {/* Button */}
          <Link 
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: 15,
              padding: '14px 28px',
              borderRadius: 12,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ana Sayfaya Dön
          </Link>

          {/* SEO: Popular city links for crawlers */}
          <nav style={{ marginTop: 32 }}>
            <p style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>Popüler Şehirler</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana'].map((city) => (
                <Link 
                  key={city}
                  href={`/${city}`}
                  style={{
                    padding: '8px 14px',
                    background: colors.card,
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: colors.textSecondary,
                    textDecoration: 'none',
                    textTransform: 'capitalize',
                  }}
                >
                  {city === 'istanbul' ? 'İstanbul' : city === 'izmir' ? 'İzmir' : city.charAt(0).toUpperCase() + city.slice(1)}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    </div>
  );
}
