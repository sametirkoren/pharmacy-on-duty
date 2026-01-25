import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { WebsiteStructuredData } from '@/components/StructuredData';
import { generateBreadcrumbSchema, getBreadcrumbItems } from '@/lib/breadcrumb-utils';

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

// Turkish character mapping for URL slugs
const TURKISH_CHAR_MAP: Record<string, string> = {
  'c': 'ç', 'g': 'ğ', 'i': 'ı', 'o': 'ö', 's': 'ş', 'u': 'ü',
  'C': 'Ç', 'G': 'Ğ', 'I': 'İ', 'O': 'Ö', 'S': 'Ş', 'U': 'Ü',
};

// Convert slug to proper district name with Turkish character support
function slugToDistrictName(slug: string): string {
  // First capitalize
  const name = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Common Turkish district name corrections
  const corrections: Record<string, string> = {
    'Bahcelievler': 'Bahçelievler',
    'Besiktas': 'Beşiktaş',
    'Beyoglu': 'Beyoğlu',
    'Buyukcekmece': 'Büyükçekmece',
    'Cekmekoy': 'Çekmeköy',
    'Gungoren': 'Güngören',
    'Kagithane': 'Kağıthane',
    'Kadikoy': 'Kadıköy',
    'Kucukcekmece': 'Küçükçekmece',
    'Sariyer': 'Sarıyer',
    'Sile': 'Şile',
    'Sisli': 'Şişli',
    'Umraniye': 'Ümraniye',
    'Uskudar': 'Üsküdar',
    'Sultangazi': 'Sultangazi',
    'Eyupsultan': 'Eyüpsultan',
    'Fatih': 'Fatih',
    'Zeytinburnu': 'Zeytinburnu',
    'Bakirkoy': 'Bakırköy',
    'Avcilar': 'Avcılar',
    'Esenyurt': 'Esenyurt',
    'Basaksehir': 'Başakşehir',
    'Arnavutkoy': 'Arnavutköy',
    'Catalca': 'Çatalca',
    'Silivri': 'Silivri',
    'Beylikduzu': 'Beylikdüzü',
    'Esenler': 'Esenler',
    'Bayrampasa': 'Bayrampaşa',
    'Gaziosmanpasa': 'Gaziosmanpaşa',
    'Sultanbeyil': 'Sultanbeyli',
    'Sultanbeyli': 'Sultanbeyli',
    'Pendik': 'Pendik',
    'Tuzla': 'Tuzla',
    'Kartal': 'Kartal',
    'Maltepe': 'Maltepe',
    'Atasehir': 'Ataşehir',
    'Sancaktepe': 'Sancaktepe',
    'Beykoz': 'Beykoz',
    'Adalar': 'Adalar',
  };
  
  return corrections[name] || name;
}

interface PageProps {
  params: Promise<{ city: string; district: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug, district: districtSlug } = await params;
  const cityName = TURKEY_CITIES[citySlug.toLowerCase()];
  const districtName = slugToDistrictName(districtSlug);
  
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
    title: `${districtName}, ${cityName} Nöbetçi Eczane | ${today}`,
    description: `${districtName}, ${cityName} ilçesinde bugün nöbetçi olan eczanelerin güncel listesi. ${districtName} nöbetçi eczane adresleri, telefon numaraları ve harita üzerinde konumları.`,
    keywords: [
      `${districtName} nöbetçi eczane`,
      `${districtName} ${cityName} eczane`,
      `${cityName} ${districtName} nöbetçi`,
      `${districtName} açık eczane`,
      `${districtName} gece eczane`,
      'nöbetçi eczane',
      'yakın eczane',
    ],
    openGraph: {
      title: `${districtName}, ${cityName} Nöbetçi Eczane | Bugün Açık Eczaneler`,
      description: `${districtName}, ${cityName} ilçesinde bugün nöbetçi olan eczanelerin güncel listesi.`,
      url: `https://www.yakindakinobetcieczane.com/${citySlug}/${districtSlug}`,
      type: 'website',
      locale: 'tr_TR',
    },
    alternates: {
      canonical: `https://www.yakindakinobetcieczane.com/${citySlug}/${districtSlug}`,
    },
  };
}

export default async function CityDistrictPage({ params }: PageProps) {
  const { city: citySlug, district: districtSlug } = await params;
  const cityName = TURKEY_CITIES[citySlug.toLowerCase()];
  const districtName = slugToDistrictName(districtSlug);

  if (!cityName) {
    notFound();
  }

  const breadcrumbItems = getBreadcrumbItems(cityName, districtName);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <WebsiteStructuredData city={cityName} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <MainLayout initialCity={cityName} initialDistrict={districtName} />
    </>
  );
}
