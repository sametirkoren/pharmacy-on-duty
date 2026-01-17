import { NextRequest, NextResponse } from 'next/server';
import { PharmacyService, DatabaseError } from '../../../lib/database';
import { calculateDistance, validateCoordinates } from '../../../utils';
import type { NearbyPharmaciesResponse, PharmacyWithDistance } from '../../../types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const limitParam = searchParams.get('limit') || '5'; // Default to 5 pharmacies

    // Validate required parameters
    if (!latParam || !lngParam) {
      return NextResponse.json<NearbyPharmaciesResponse>(
        {
          success: false,
          error: 'Gerekli parametreler eksik: lat ve lng parametreleri gereklidir'
        },
        { status: 400 }
      );
    }

    // Parse coordinates and limit
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    const limit = parseInt(limitParam, 10);

    // Validate coordinates
    try {
      validateCoordinates(lat, lng);
    } catch (error) {
      return NextResponse.json<NearbyPharmaciesResponse>(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid coordinates'
        },
        { status: 400 }
      );
    }

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 20) {
      return NextResponse.json<NearbyPharmaciesResponse>(
        {
          success: false,
          error: 'Geçersiz limit: 1 ile 20 arasında olmalıdır'
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
    
    console.log('Querying pharmacies for date:', queryDate);
    const pharmacies = await PharmacyService.getOnDutyPharmacies(queryDate);
    console.log('Found pharmacies count:', pharmacies.length);

    if (pharmacies.length === 0) {
      return NextResponse.json<NearbyPharmaciesResponse>(
        {
          success: false,
          error: 'Bugün için nöbetçi eczane bulunamadı'
        },
        { status: 404 }
      );
    }

    // Filter out pharmacies without coordinates and calculate distances
    const pharmaciesWithCoordinates = pharmacies.filter(pharmacy =>
      pharmacy.lat !== 0 && pharmacy.lng !== 0 &&
      !isNaN(pharmacy.lat) && !isNaN(pharmacy.lng)
    );

    if (pharmaciesWithCoordinates.length === 0) {
      return NextResponse.json<NearbyPharmaciesResponse>(
        {
          success: false,
          error: 'Bugün için geçerli koordinatlara sahip nöbetçi eczane bulunamadı'
        },
        { status: 404 }
      );
    }

    const pharmaciesWithDistance: PharmacyWithDistance[] = pharmaciesWithCoordinates.map(pharmacy => ({
      ...pharmacy,
      distance: calculateDistance(lat, lng, pharmacy.lat, pharmacy.lng)
    }));

    // Sort by distance and get the closest ones
    pharmaciesWithDistance.sort((a, b) => a.distance - b.distance);
    const nearbyPharmacies = pharmaciesWithDistance.slice(0, limit);

    return NextResponse.json<NearbyPharmaciesResponse>(
      {
        success: true,
        data: nearbyPharmacies
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in /api/nearby:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof DatabaseError || (error as Error)?.name === 'DatabaseError') {
      return NextResponse.json<NearbyPharmaciesResponse>(
        {
          success: false,
          error: 'Database error occurred while fetching pharmacy data'
        },
        { status: 500 }
      );
    }

    return NextResponse.json<NearbyPharmaciesResponse>(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}