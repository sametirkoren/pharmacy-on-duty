import { MetadataRoute } from 'next';

const TURKEY_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 
  'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 
  'Rize', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Sivas', 'Şırnak', 
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
];

// Popular districts for major cities (SEO optimization)
const CITY_DISTRICTS: Record<string, string[]> = {
  'İstanbul': [
    'Bahçelievler', 'Beşiktaş', 'Beyoğlu', 'Büyükçekmece', 'Çekmeköy', 'Güngören', 
    'Kağıthane', 'Kadıköy', 'Küçükçekmece', 'Sarıyer', 'Şile', 'Şişli', 'Ümraniye', 
    'Üsküdar', 'Eyüpsultan', 'Fatih', 'Zeytinburnu', 'Bakırköy', 'Avcılar', 'Esenyurt',
    'Başakşehir', 'Arnavutköy', 'Beylikdüzü', 'Esenler', 'Bayrampaşa', 'Gaziosmanpaşa',
    'Sultanbeyli', 'Pendik', 'Tuzla', 'Kartal', 'Maltepe', 'Ataşehir', 'Sancaktepe', 'Beykoz', 'Adalar'
  ],
  'Ankara': [
    'Çankaya', 'Keçiören', 'Yenimahalle', 'Etimesgut', 'Sincan', 'Mamak', 'Polatlı', 
    'Pursaklar', 'Altındağ', 'Gölbaşı', 'Kahramankazan', 'Beypazarı'
  ],
  'İzmir': [
    'Karşıyaka', 'Bornova', 'Buca', 'Konak', 'Çiğli', 'Gaziemir', 'Bayraklı', 
    'Karabağlar', 'Menemen', 'Torbalı', 'Aliağa', 'Balçova', 'Narlıdere'
  ],
  'Bursa': [
    'Nilüfer', 'Osmangazi', 'Yıldırım', 'Mudanya', 'Gemlik', 'İnegöl', 'Gürsu', 'Kestel'
  ],
  'Antalya': [
    'Muratpaşa', 'Kepez', 'Konyaaltı', 'Aksu', 'Döşemealtı', 'Alanya', 'Manavgat', 'Serik'
  ],
  'Adana': [
    'Seyhan', 'Yüreğir', 'Çukurova', 'Sarıçam', 'Ceyhan', 'Kozan'
  ],
  'Konya': [
    'Selçuklu', 'Meram', 'Karatay', 'Ereğli', 'Akşehir', 'Beyşehir'
  ],
  'Gaziantep': [
    'Şahinbey', 'Şehitkamil', 'Nizip', 'İslahiye'
  ],
  'Mersin': [
    'Mezitli', 'Yenişehir', 'Akdeniz', 'Toroslar', 'Tarsus', 'Erdemli'
  ],
  'Kayseri': [
    'Melikgazi', 'Kocasinan', 'Talas', 'Develi', 'İncesu'
  ],
  'Eskişehir': [
    'Odunpazarı', 'Tepebaşı'
  ],
  'Diyarbakır': [
    'Bağlar', 'Kayapınar', 'Yenişehir', 'Sur'
  ],
  'Samsun': [
    'Atakum', 'İlkadım', 'Canik', 'Tekkeköy', 'Bafra', 'Çarşamba'
  ],
  'Denizli': [
    'Pamukkale', 'Merkezefendi'
  ],
  'Kocaeli': [
    'İzmit', 'Gebze', 'Darıca', 'Körfez', 'Gölcük', 'Derince'
  ],
  'Sakarya': [
    'Adapazarı', 'Serdivan', 'Erenler', 'Arifiye'
  ],
  'Tekirdağ': [
    'Süleymanpaşa', 'Çorlu', 'Çerkezköy', 'Ergene'
  ],
  'Balıkesir': [
    'Altıeylül', 'Karesi', 'Bandırma', 'Edremit', 'Ayvalık'
  ],
  'Manisa': [
    'Yunusemre', 'Şehzadeler', 'Akhisar', 'Turgutlu', 'Salihli'
  ],
  'Kahramanmaraş': [
    'Dulkadiroğlu', 'Onikişubat', 'Elbistan', 'Afşin'
  ],
  'Hatay': [
    'Antakya', 'İskenderun', 'Defne', 'Samandağ'
  ],
  'Malatya': [
    'Battalgazi', 'Yeşilyurt'
  ],
  'Trabzon': [
    'Ortahisar', 'Akçaabat', 'Yomra', 'Arsin'
  ],
  'Erzurum': [
    'Yakutiye', 'Palandöken', 'Aziziye'
  ],
  'Şanlıurfa': [
    'Haliliye', 'Eyyübiye', 'Karaköprü', 'Siverek', 'Viranşehir'
  ],
  'Van': [
    'İpekyolu', 'Tuşba', 'Edremit'
  ],
  'Aydın': [
    'Efeler', 'Nazilli', 'Kuşadası', 'Söke', 'Didim'
  ],
  'Muğla': [
    'Menteşe', 'Bodrum', 'Fethiye', 'Marmaris', 'Milas', 'Dalaman'
  ],
};

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

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.yakindakinobetcieczane.com';
  
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // City pages
  const cityPages: MetadataRoute.Sitemap = TURKEY_CITIES.map((city) => ({
    url: `${baseUrl}/${slugify(city)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // District pages for major cities
  const districtPages: MetadataRoute.Sitemap = [];
  for (const [city, districts] of Object.entries(CITY_DISTRICTS)) {
    for (const district of districts) {
      districtPages.push({
        url: `${baseUrl}/${slugify(city)}/${slugify(district)}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      });
    }
  }

  return [...staticPages, ...cityPages, ...districtPages];
}
