// Server-side breadcrumb utilities

export interface BreadcrumbItem {
  label: string;
  href?: string;
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
