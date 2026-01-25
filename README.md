# 💊 Nöbetçi Eczane Bulucu (Pharmacy On-Duty Finder)

Türkiye genelinde nöbetçi eczaneleri kolayca bulmanızı sağlayan modern bir web uygulaması. Konumunuza en yakın nöbetçi eczaneleri harita üzerinde görüntüleyin, yol tarifi alın ve iletişim bilgilerine ulaşın.

🔗 **Live Demo:** [https://www.yakindakinobetcieczane.com](https://www.yakindakinobetcieczane.com)

![Screenshot](https://github.com/user-attachments/assets/ce08cc79-9a60-408a-8ee7-73f357b40d7f)


## ✨ Özellikler

### 🔍 Arama & Filtreleme
- 📍 **Konum Tabanlı Arama** - GPS ile en yakın nöbetçi eczaneleri bulun
- 🔍 **İl/İlçe Filtreleme** - Şehir ve ilçe bazında arama (ilçe opsiyonel)
- 🗺️ **İnteraktif Harita** - Leaflet haritası üzerinde eczaneleri görüntüleyin
- ⭐ **Favoriler** - Sık kullandığınız eczaneleri kaydedin (24 saat)

### 🎨 Kullanıcı Deneyimi
- 🌙 **Dark/Light Mode** - Göz yormayan tema desteği (otomatik sistem teması)
- 📱 **Responsive Tasarım** - Mobil ve masaüstü uyumlu
- 📞 **Tek Tıkla Arama** - Eczaneyi doğrudan arayın
- 🧭 **Yol Tarifi** - Google Maps ile navigasyon
- 📤 **Paylaşım** - WhatsApp, SMS ile eczane bilgisi paylaşın
- 🔔 **PWA Desteği** - Ana ekrana ekleyin, offline kullanın

### 🚀 SEO & Performance
- 🔗 **SEO-Friendly URL'ler** - `/istanbul/bahcelievler` gibi şehir/ilçe sayfaları
- 🍞 **Breadcrumb Navigation** - Ana Sayfa > İstanbul > Bahçelievler
- 📊 **JSON-LD Structured Data** - Google zengin sonuçlar için schema.org
- 🗺️ **Dynamic Sitemap** - 250+ sayfa (81 il + popüler ilçeler)
- 🤖 **Robots.txt** - Arama motoru optimizasyonu
- ⚡ **Fast Loading** - Next.js App Router ile optimum performans

## 🛠️ Teknolojiler

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **UI:** [React 19](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Harita:** [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/)
- **Veritabanı:** [Supabase](https://supabase.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/)
- **Deployment:** [Vercel](https://vercel.com/)

## 🚀 Kurulum

### Gereksinimler

- Node.js 20+
- npm veya yarn

### Adımlar

1. **Repoyu klonlayın:**
```bash
git clone https://github.com/sametirkoren/pharmacy-on-duty.git
cd pharmacy-on-duty
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install --legacy-peer-deps
```

3. **Environment değişkenlerini ayarlayın:**
```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

5. **Tarayıcıda açın:** [http://localhost:3000](http://localhost:3000)

## 📁 Proje Yapısı

```
pharmacy-finder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   ├── [city]/             # Dinamik şehir sayfaları
│   │   │   ├── page.tsx        # /istanbul
│   │   │   └── [district]/     # Dinamik ilçe sayfaları
│   │   │       └── page.tsx    # /istanbul/bahcelievler
│   │   ├── sitemap.ts          # Dynamic sitemap
│   │   ├── robots.ts           # Robots.txt
│   │   ├── not-found.tsx       # 404 sayfası
│   │   └── page.tsx            # Ana sayfa
│   ├── components/             # React bileşenleri
│   │   ├── MainLayout.tsx      # Ana layout
│   │   ├── MobileView.tsx      # Mobil görünüm
│   │   ├── Sidebar.tsx         # Desktop sidebar
│   │   ├── MapView.tsx         # Harita bileşeni
│   │   ├── Breadcrumb.tsx      # Breadcrumb navigation
│   │   └── StructuredData.tsx  # JSON-LD schemas
│   └── lib/                    # Utility fonksiyonlar
│       ├── supabase.ts         # Supabase client
│       ├── database.ts         # Database queries
│       └── breadcrumb-utils.ts # Breadcrumb utilities
├── public/                     # Statik dosyalar
└── package.json
```

## 🔗 URL Yapısı

| URL | Açıklama |
|-----|----------|
| `/` | Ana sayfa (konum bazlı) |
| `/istanbul` | İstanbul tüm nöbetçi eczaneler |
| `/istanbul/bahcelievler` | Bahçelievler nöbetçi eczaneler |
| `/ankara/cankaya` | Çankaya nöbetçi eczaneler |
| `/sitemap.xml` | SEO sitemap |

## 🔧 Scripts

```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Production build
npm run start    # Production sunucusu
npm run lint     # ESLint kontrolü
npm run test     # Jest testleri
```

## 📝 API Endpoints

| Endpoint | Açıklama |
|----------|----------|
| `GET /api/nearby` | Konuma yakın eczaneler |
| `GET /api/cities` | Mevcut şehirler |
| `GET /api/districts` | İlçe listesi |
| `GET /api/pharmacies` | Eczane listesi |
| `GET /api/all-pharmacies` | Tüm eczaneler |

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

**Samet İrkören**

- GitHub: [@sametirkoren](https://github.com/sametirkoren)

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
