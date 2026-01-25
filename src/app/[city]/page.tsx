import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { WebsiteStructuredData } from '@/components/StructuredData';
import { generateBreadcrumbSchema, getBreadcrumbItems } from '@/components/Breadcrumb';

const TURKEY_CITIES: Record<string, string> = {
  'adana': 'Adana',
  'adiyaman': 'Adıyaman',
  'afyonkarahisar': 'Afyonkarahisar',
  'agri': 'Ağrı',
  'aksaray': 'Aksaray',
  'amasya': 'Amasya',
  'ankara': 'Ankara',
  'antalya': 'Antalya',
  'ardahan': 'Ardahan',
  'artvin': 'Artvin',
  'aydin': 'Aydın',
  'balikesir': 'Balıkesir',
  'bartin': 'Bartın',
  'batman': 'Batman',
  'bayburt': 'Bayburt',
  'bilecik': 'Bilecik',
  'bingol': 'Bingöl',
  'bitlis': 'Bitlis',
  'bolu': 'Bolu',
  'burdur': 'Burdur',
  'bursa': 'Bursa',
  'canakkale': 'Çanakkale',
  'cankiri': 'Çankırı',
  'corum': 'Çorum',
  'denizli': 'Denizli',
  'diyarbakir': 'Diyarbakır',
  'duzce': 'Düzce',
  'edirne': 'Edirne',
  'elazig': 'Elazığ',
  'erzincan': 'Erzincan',
  'erzurum': 'Erzurum',
  'eskisehir': 'Eskişehir',
  'gaziantep': 'Gaziantep',
  'giresun': 'Giresun',
  'gumushane': 'Gümüşhane',
  'hakkari': 'Hakkari',
  'hatay': 'Hatay',
  'igdir': 'Iğdır',
  'isparta': 'Isparta',
  'istanbul': 'İstanbul',
  'izmir': 'İzmir',
  'kahramanmaras': 'Kahramanmaraş',
  'karabuk': 'Karabük',
  'karaman': 'Karaman',
  'kars': 'Kars',
  'kastamonu': 'Kastamonu',
  'kayseri': 'Kayseri',
  'kirikkale': 'Kırıkkale',
  'kirklareli': 'Kırklareli',
  'kirsehir': 'Kırşehir',
  'kilis': 'Kilis',
  'kocaeli': 'Kocaeli',
  'konya': 'Konya',
  'kutahya': 'Kütahya',
  'malatya': 'Malatya',
  'manisa': 'Manisa',
  'mardin': 'Mardin',
  'mersin': 'Mersin',
  'mugla': 'Muğla',
  'mus': 'Muş',
  'nevsehir': 'Nevşehir',
  'nigde': 'Niğde',
  'ordu': 'Ordu',
  'osmaniye': 'Osmaniye',
  'rize': 'Rize',
  'sakarya': 'Sakarya',
  'samsun': 'Samsun',
  'sanliurfa': 'Şanlıurfa',
  'siirt': 'Siirt',
  'sinop': 'Sinop',
  'sivas': 'Sivas',
  'sirnak': 'Şırnak',
  'tekirdag': 'Tekirdağ',
  'tokat': 'Tokat',
  'trabzon': 'Trabzon',
  'tunceli': 'Tunceli',
  'usak': 'Uşak',
  'van': 'Van',
  'yalova': 'Yalova',
  'yozgat': 'Yozgat',
  'zonguldak': 'Zonguldak',
};

interface PageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return Object.keys(TURKEY_CITIES).map((city) => ({
    city,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const cityName = TURKEY_CITIES[citySlug.toLowerCase()];
  
  if (!cityName) {
    return {
      title: 'Sayfa Bulunamadı',
    };
  }

  const today = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    title: `${cityName} Nöbetçi Eczane | ${today} Bugün Açık Eczaneler`,
    description: `${cityName} ilinde bugün nöbetçi olan eczanelerin güncel listesi. ${cityName} nöbetçi eczane adresleri, telefon numaraları ve harita üzerinde konumları. 7/24 açık eczaneler.`,
    keywords: [
      `${cityName} nöbetçi eczane`,
      `${cityName} eczane`,
      `${cityName} açık eczane`,
      `${cityName} bugün nöbetçi eczane`,
      `${cityName} gece eczane`,
      `${cityName} 24 saat eczane`,
      'nöbetçi eczane',
      'yakın eczane',
    ],
    openGraph: {
      title: `${cityName} Nöbetçi Eczane | Bugün Açık Eczaneler`,
      description: `${cityName} ilinde bugün nöbetçi olan eczanelerin güncel listesi. Adres, telefon ve harita bilgileri.`,
      url: `https://www.yakindakinobetcieczane.com/${citySlug}`,
      type: 'website',
      locale: 'tr_TR',
    },
    alternates: {
      canonical: `https://www.yakindakinobetcieczane.com/${citySlug}`,
    },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city: citySlug } = await params;
  const cityName = TURKEY_CITIES[citySlug.toLowerCase()];

  if (!cityName) {
    notFound();
  }

  const breadcrumbItems = getBreadcrumbItems(cityName);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <WebsiteStructuredData city={cityName} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MainLayout initialCity={cityName} />
    </>
  );
}
