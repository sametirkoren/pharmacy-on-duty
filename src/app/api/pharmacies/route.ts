import { NextRequest, NextResponse } from 'next/server';
import { PharmacyService, DatabaseError } from '../../../lib/database';
import type { PharmaciesResponse, Pharmacy } from '../../../types';

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

    // Validate required parameters
    if (!city || !district || city.trim().length === 0 || district.trim().length === 0) {
      return NextResponse.json<PharmaciesResponse>(
        {
          success: false,
          error: 'Missing required parameters: city and district are required'
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

    // For Cyprus, search in all Cyprus cities for the district
    let pharmacies: Pharmacy[] = [];
    if (city.trim().toLowerCase() === 'kibris') {
      for (const cyprusCity of KIBRIS_CITIES) {
        const cityPharmacies = await PharmacyService.getPharmaciesForArea(
          cyprusCity,
          district.trim(),
          queryDate
        );
        pharmacies.push(...cityPharmacies);
      }
    } else {
      // Fetch pharmacies for the specified city and district
      pharmacies = await PharmacyService.getPharmaciesForArea(
        city.trim(),
        district.trim(),
        queryDate
      );
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