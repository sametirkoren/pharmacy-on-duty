'use client';

interface WebsiteStructuredDataProps {
  city?: string;
}

export function WebsiteStructuredData({ city }: WebsiteStructuredDataProps) {
  const baseUrl = 'https://www.yakindakinobetcieczane.com';
  
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Nöbetçi Eczane Bulucu',
    alternateName: ['Yakınımdaki Nöbetçi Eczane', 'Eczane Bulucu'],
    url: baseUrl,
    description: 'Türkiye genelinde nöbetçi eczaneleri kolayca bulun. Konumunuza en yakın açık eczaneleri harita üzerinde görün.',
    inLanguage: 'tr-TR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nöbetçi Eczane Bulucu',
    url: baseUrl,
    logo: `${baseUrl}/icon-512.svg`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Turkish',
    },
  };

  const localBusinessSchema = city ? {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/${city.toLowerCase()}`,
    name: `${city} Nöbetçi Eczaneler`,
    description: `${city} ilinde bugün nöbetçi olan eczanelerin listesi. En yakın nöbetçi eczaneyi bulun.`,
    url: `${baseUrl}/${city.toLowerCase()}`,
    areaServed: {
      '@type': 'City',
      name: city,
      containedInPlace: {
        '@type': 'Country',
        name: 'Türkiye',
      },
    },
  } : null;

  const breadcrumbSchema = city ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ana Sayfa',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${city} Nöbetçi Eczaneler`,
        item: `${baseUrl}/${city.toLowerCase()}`,
      },
    ],
  } : null;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Nöbetçi eczane nedir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nöbetçi eczane, gece ve hafta sonları dahil olmak üzere belirli saatlerde hizmet veren eczanelerdir. Türkiye\'de her gün belirli eczaneler nöbetçi olarak görev yapar.',
        },
      },
      {
        '@type': 'Question',
        name: 'En yakın nöbetçi eczaneyi nasıl bulurum?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yakınımdaki Nöbetçi Eczane uygulamasını kullanarak konumunuza en yakın nöbetçi eczaneleri harita üzerinde görebilir, yol tarifi alabilir ve iletişim bilgilerine ulaşabilirsiniz.',
        },
      },
      {
        '@type': 'Question',
        name: 'Nöbetçi eczaneler kaça kadar açık?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nöbetçi eczaneler genellikle sabah 09:00\'dan ertesi gün sabah 09:00\'a kadar 24 saat hizmet verir.',
        },
      },
      {
        '@type': 'Question',
        name: 'Nöbetçi eczane ücreti var mı?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nöbetçi eczanelerde ilaç fiyatları normal eczanelerle aynıdır. Ek bir nöbet ücreti alınmaz.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {localBusinessSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
    </>
  );
}
