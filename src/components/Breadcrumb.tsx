'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  isDarkMode?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '-');
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  const baseUrl = 'https://www.yakindakinobetcieczane.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${baseUrl}${item.href}` : undefined,
    })),
  };
}

export default function Breadcrumb({ items, isDarkMode = false }: BreadcrumbProps) {
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';
  const activeColor = isDarkMode ? '#e2e8f0' : '#1e293b';
  const hoverColor = isDarkMode ? '#cbd5e1' : '#475569';

  return (
    <nav aria-label="Breadcrumb" style={{ padding: '12px 16px' }}>
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          fontSize: '14px',
          flexWrap: 'wrap',
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  style={{
                    color: textColor,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = textColor)}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  style={{
                    color: isLast ? activeColor : textColor,
                    fontWeight: isLast ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
              )}
              
              {!isLast && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={textColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function getBreadcrumbItems(city?: string, district?: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Ana Sayfa', href: '/' },
  ];

  if (city) {
    items.push({
      label: city,
      href: district ? `/${slugify(city)}` : undefined,
    });
  }

  if (district) {
    items.push({
      label: district,
    });
  }

  return items;
}
