import { NextRequest, NextResponse } from 'next/server';
import { PharmacyService, DatabaseError } from '../../../lib/database';
import type { DistrictsResponse } from '../../../types';

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

    // Validate required parameter
    if (!city || city.trim().length === 0) {
      return NextResponse.json<DistrictsResponse>(
        {
          success: false,
          error: 'Gerekli parametre eksik: şehir parametresi gereklidir'
        },
        { status: 400 }
      );
    }

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
    
    // For Cyprus, fetch districts from all Cyprus cities
    let districts: string[] = [];
    if (city.trim().toLowerCase() === 'kibris') {
      const allDistricts: string[] = [];
      for (const cyprusCity of KIBRIS_CITIES) {
        const cityDistricts = await PharmacyService.getDistrictsForCity(cyprusCity, queryDate);
        allDistricts.push(...cityDistricts);
      }
      // Remove duplicates and sort
      districts = [...new Set(allDistricts)].sort((a, b) => a.localeCompare(b, 'tr'));
    } else {
      // Fetch districts for the specified city
      districts = await PharmacyService.getDistrictsForCity(city.trim(), queryDate);
    }

    if (districts.length === 0) {
      return NextResponse.json<DistrictsResponse>(
        {
          success: false,
          error: `${city} şehri için nöbetçi eczanesi olan ilçe bulunamadı`
        },
        { status: 404 }
      );
    }

    return NextResponse.json<DistrictsResponse>(
      {
        success: true,
        data: districts
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in /api/districts:', error);

    if (error instanceof DatabaseError || (error as Error)?.name === 'DatabaseError') {
      return NextResponse.json<DistrictsResponse>(
        {
          success: false,
          error: 'İlçe verilerini alırken veritabanı hatası oluştu'
        },
        { status: 500 }
      );
    }

    return NextResponse.json<DistrictsResponse>(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}