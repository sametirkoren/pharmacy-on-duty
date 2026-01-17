import { NextResponse } from 'next/server';
import { PharmacyService, DatabaseError } from '../../../lib/database';
import type { CitiesResponse } from '../../../types';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country'); // 'turkiye' veya 'kibris'
    // Get current date in Turkey timezone with 9 AM cutoff logic
    const now = new Date();
    const turkeyTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
    
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
    
    // Fetch available cities with on-duty pharmacies for the determined date
    let cities = await PharmacyService.getAvailableCities(queryDate);

    // Filter by country if specified
    if (country === 'kibris') {
      cities = cities.filter(city => KIBRIS_CITIES.includes(city));
    } else if (country === 'turkiye') {
      cities = cities.filter(city => !KIBRIS_CITIES.includes(city));
    }

    if (cities.length === 0) {
      return NextResponse.json<CitiesResponse>(
        {
          success: false,
          error: 'Bugün için nöbetçi eczanesi olan şehir bulunamadı'
        },
        { status: 404 }
      );
    }

    return NextResponse.json<CitiesResponse>(
      {
        success: true,
        data: cities
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in /api/cities:', error);

    if (error instanceof DatabaseError || (error as Error)?.name === 'DatabaseError') {
      return NextResponse.json<CitiesResponse>(
        {
          success: false,
          error: 'Şehir verilerini alırken veritabanı hatası oluştu'
        },
        { status: 500 }
      );
    }

    return NextResponse.json<CitiesResponse>(
      {
        success: false,
        error: 'Sunucu hatası oluştu'
      },
      { status: 500 }
    );
  }
}