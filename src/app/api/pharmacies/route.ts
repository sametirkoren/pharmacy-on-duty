import { NextRequest, NextResponse } from 'next/server';
import { PharmacyService, DatabaseError } from '../../../lib/database';
import type { PharmaciesResponse, Pharmacy } from '../../../types';

// Convert ASCII slug to Turkish characters for database search
function convertToTurkish(text: string): string {
  // Common Turkish character patterns in district/city names
  const patterns: [RegExp, string][] = [
    // Specific word replacements (most common districts)
    [/\bbahcelievler\b/gi, 'Bahçelievler'],
    [/\bbesiktas\b/gi, 'Beşiktaş'],
    [/\bbeyoglu\b/gi, 'Beyoğlu'],
    [/\bbuyukcekmece\b/gi, 'Büyükçekmece'],
    [/\bcekmekoy\b/gi, 'Çekmeköy'],
    [/\bgungoren\b/gi, 'Güngören'],
    [/\bkagithane\b/gi, 'Kağıthane'],
    [/\bkadikoy\b/gi, 'Kadıköy'],
    [/\bkucukcekmece\b/gi, 'Küçükçekmece'],
    [/\bsariyer\b/gi, 'Sarıyer'],
    [/\bsile\b/gi, 'Şile'],
    [/\bsisli\b/gi, 'Şişli'],
    [/\bumraniye\b/gi, 'Ümraniye'],
    [/\buskudar\b/gi, 'Üsküdar'],
    [/\beyupsultan\b/gi, 'Eyüpsultan'],
    [/\bbakirkoy\b/gi, 'Bakırköy'],
    [/\bavcilar\b/gi, 'Avcılar'],
    [/\bbasaksehir\b/gi, 'Başakşehir'],
    [/\barnavutkoy\b/gi, 'Arnavutköy'],
    [/\bcatalca\b/gi, 'Çatalca'],
    [/\bbeylikduzu\b/gi, 'Beylikdüzü'],
    [/\bbayrampasa\b/gi, 'Bayrampaşa'],
    [/\bgaziosmanpasa\b/gi, 'Gaziosmanpaşa'],
    [/\batasehir\b/gi, 'Ataşehir'],
    [/\bcankaya\b/gi, 'Çankaya'],
    [/\bkecioren\b/gi, 'Keçiören'],
    [/\byenimahalle\b/gi, 'Yenimahalle'],
    [/\betimesgut\b/gi, 'Etimesgut'],
    [/\bsincan\b/gi, 'Sincan'],
    [/\bmamak\b/gi, 'Mamak'],
    [/\bpolatli\b/gi, 'Polatlı'],
    [/\bpursaklar\b/gi, 'Pursaklar'],
    [/\bkarsiyaka\b/gi, 'Karşıyaka'],
    [/\bbornova\b/gi, 'Bornova'],
    [/\bbuca\b/gi, 'Buca'],
    [/\bkonak\b/gi, 'Konak'],
    [/\bcigli\b/gi, 'Çiğli'],
    [/\bgaziemir\b/gi, 'Gaziemir'],
    [/\bbayrakli\b/gi, 'Bayraklı'],
    [/\bnilüfer\b/gi, 'Nilüfer'],
    [/\bosmangazı\b/gi, 'Osmangazi'],
    [/\byildirim\b/gi, 'Yıldırım'],
    [/\bmudanya\b/gi, 'Mudanya'],
    [/\bgemlik\b/gi, 'Gemlik'],
    [/\bmuratpasa\b/gi, 'Muratpaşa'],
    [/\bkepez\b/gi, 'Kepez'],
    [/\bkonyaalti\b/gi, 'Konyaaltı'],
    [/\baksu\b/gi, 'Aksu'],
    [/\bdosemealti\b/gi, 'Döşemealtı'],
    [/\bseyhan\b/gi, 'Seyhan'],
    [/\byuregir\b/gi, 'Yüreğir'],
    [/\bcukurova\b/gi, 'Çukurova'],
    [/\bsaricam\b/gi, 'Sarıçam'],
  ];
  
  let result = text;
  for (const [pattern, replacement] of patterns) {
    result = result.replace(pattern, replacement);
  }
  
  return result;
}

// Kuzey Kıbrıs şehirleri (hem Türkçe karakterli hem karaktersiz versiyonlar)
const KIBRIS_CITIES = [
  'Kıbrıs', 'Kibris',
  'Lefkoşa', 'Lefkosa',
  'Girne',
  'Gazimağusa', 'Gazimagusa',
  'Güzelyurt', 'Guzelyurt',
  'İskele', 'Iskele',
  'Lefke',
  'KKTC', 'Kuzey Kıbrıs'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const district = searchParams.get('district');

    // Validate required parameters - city is required, district is optional
    if (!city || city.trim().length === 0) {
      return NextResponse.json<PharmaciesResponse>(
        {
          success: false,
          error: 'Missing required parameter: city is required'
        },
        { status: 400 }
      );
    }

    // Get current date in Turkey timezone with 9 AM cutoff logic
    const now = new Date();
    const turkeyTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));

    // Format date as YYYY-MM-DD using Turkey timezone components
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // If it's before 9 AM Turkey time, use previous day's data
    let queryDate: string;
    if (turkeyTime.getHours() < 9) {
      const yesterday = new Date(turkeyTime);
      yesterday.setDate(yesterday.getDate() - 1);
      queryDate = formatDate(yesterday);
    } else {
      queryDate = formatDate(turkeyTime);
    }

    // For Cyprus, search in all Cyprus cities
    let pharmacies: Pharmacy[] = [];
    const hasDistrict = district && district.trim().length > 0;
    // Convert district to Turkish characters if needed
    const turkishDistrict = hasDistrict ? convertToTurkish(district.trim()) : '';
    
    if (city.trim().toLowerCase() === 'kibris') {
      for (const cyprusCity of KIBRIS_CITIES) {
        if (hasDistrict) {
          const cityPharmacies = await PharmacyService.getPharmaciesForArea(
            cyprusCity,
            turkishDistrict,
            queryDate
          );
          pharmacies.push(...cityPharmacies);
        } else {
          // Get all pharmacies for this Cyprus city
          const cityPharmacies = await PharmacyService.getPharmaciesForCity(
            cyprusCity,
            queryDate
          );
          pharmacies.push(...cityPharmacies);
        }
      }
    } else {
      // Fetch pharmacies for the specified city (and optionally district)
      if (hasDistrict) {
        pharmacies = await PharmacyService.getPharmaciesForArea(
          city.trim(),
          turkishDistrict,
          queryDate
        );
      } else {
        // Get all pharmacies for the city
        pharmacies = await PharmacyService.getPharmaciesForCity(
          city.trim(),
          queryDate
        );
      }
    }

    if (pharmacies.length === 0) {
      // Try to suggest nearby districts with available pharmacies
      try {
        let availableDistricts: string[] = [];
        const displayCity = city.trim().toLowerCase() === 'kibris' ? 'Kıbrıs' : city;
        
        if (city.trim().toLowerCase() === 'kibris') {
          // Get districts from all Cyprus cities
          for (const cyprusCity of KIBRIS_CITIES) {
            const cityDistricts = await PharmacyService.getDistrictsForCity(cyprusCity, queryDate);
            availableDistricts.push(...cityDistricts);
          }
          availableDistricts = [...new Set(availableDistricts)].sort((a, b) => a.localeCompare(b, 'tr'));
        } else {
          availableDistricts = await PharmacyService.getDistrictsForCity(city.trim(), queryDate);
        }

        if (availableDistricts.length > 0) {
          return NextResponse.json<PharmaciesResponse>(
            {
              success: false,
              error: `${district}, ${displayCity} için nöbetçi eczane bulunamadı. ${displayCity} için mevcut ilçeler: ${availableDistricts.join(', ')}`
            },
            { status: 404 }
          );
        } else {
          return NextResponse.json<PharmaciesResponse>(
            {
              success: false,
              error: `${district}, ${displayCity} için nöbetçi eczane bulunamadı. Bugün için ${displayCity} içinde başka ilçe mevcut değil.`
            },
            { status: 404 }
          );
        }
      } catch {
        // If we can't get suggestions, just return the basic error
        const displayCity = city.trim().toLowerCase() === 'kibris' ? 'Kıbrıs' : city;
        return NextResponse.json<PharmaciesResponse>(
          {
            success: false,
            error: `${district}, ${displayCity} için nöbetçi eczane bulunamadı`
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json<PharmaciesResponse>(
      {
        success: true,
        data: pharmacies
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in /api/pharmacies:', error);

    if (error instanceof DatabaseError || (error as Error)?.name === 'DatabaseError') {
      return NextResponse.json<PharmaciesResponse>(
        {
          success: false,
          error: 'Database error occurred while fetching pharmacies data'
        },
        { status: 500 }
      );
    }

    return NextResponse.json<PharmaciesResponse>(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}