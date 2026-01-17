import { NextResponse } from 'next/server';
import { PharmacyService, DatabaseError } from '../../../lib/database';
import type { PharmacyWithDistance } from '../../../types';

export async function GET() {
  try {
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
    
    console.log('Fetching all pharmacies for date:', queryDate);
    const pharmacies = await PharmacyService.getOnDutyPharmacies(queryDate);
    console.log('Found total pharmacies:', pharmacies.length);

    if (pharmacies.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bugün için nöbetçi eczane bulunamadı'
        },
        { status: 404 }
      );
    }

    // Filter out pharmacies without valid coordinates
    const pharmaciesWithCoordinates: PharmacyWithDistance[] = pharmacies
      .filter(pharmacy =>
        pharmacy.lat !== 0 && pharmacy.lng !== 0 &&
        !isNaN(pharmacy.lat) && !isNaN(pharmacy.lng)
      )
      .map(pharmacy => ({
        ...pharmacy,
        distance: undefined as unknown as number // No distance for all pharmacies view
      }));

    console.log('Pharmacies with valid coordinates:', pharmaciesWithCoordinates.length);

    return NextResponse.json(
      {
        success: true,
        data: pharmaciesWithCoordinates,
        total: pharmaciesWithCoordinates.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in /api/all-pharmacies:', error);

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Veritabanı hatası oluştu'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Sunucu hatası'
      },
      { status: 500 }
    );
  }
}
