import { NextRequest, NextResponse } from 'next/server';
import { PharmacyService, DatabaseError } from '../../../lib/database';
import { calculateDistance, validateCoordinates } from '../../../utils';
import type { PharmacyResponse, PharmacyWithDistance } from '../../../types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    // Validate required parameters
    if (!latParam || !lngParam) {
      return NextResponse.json<PharmacyResponse>(
        {
          success: false,
          error: 'Missing required parameters: lat and lng are required'
        },
        { status: 400 }
      );
    }

    // Parse coordinates
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    // Validate coordinates
    try {
      validateCoordinates(lat, lng);
    } catch (error) {
      return NextResponse.json<PharmacyResponse>(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid coordinates'
        },
        { status: 400 }
      );
    }

    // Fetch today's on-duty pharmacies
    const pharmacies = await PharmacyService.getOnDutyPharmacies();

    if (pharmacies.length === 0) {
      return NextResponse.json<PharmacyResponse>(
        {
          success: false,
          error: 'No on-duty pharmacies found for today'
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
      return NextResponse.json<PharmacyResponse>(
        {
          success: false,
          error: 'No on-duty pharmacies with valid coordinates found for today'
        },
        { status: 404 }
      );
    }

    const pharmaciesWithDistance: PharmacyWithDistance[] = pharmaciesWithCoordinates.map(pharmacy => ({
      ...pharmacy,
      distance: calculateDistance(lat, lng, pharmacy.lat, pharmacy.lng)
    }));



    // Sort by distance and get the closest one
    pharmaciesWithDistance.sort((a, b) => a.distance - b.distance);
    const closestPharmacy = pharmaciesWithDistance[0];

    return NextResponse.json<PharmacyResponse>(
      {
        success: true,
        data: {
          id: closestPharmacy.id,
          pharmacy: closestPharmacy.pharmacy,
          address: closestPharmacy.address,
          phone: closestPharmacy.phone,
          city: closestPharmacy.city,
          district: closestPharmacy.district,
          distance: closestPharmacy.distance,
          lat: closestPharmacy.lat,
          lng: closestPharmacy.lng
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in /api/closest:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof DatabaseError || (error as Error)?.name === 'DatabaseError') {
      return NextResponse.json<PharmacyResponse>(
        {
          success: false,
          error: 'Database error occurred while fetching pharmacy data'
        },
        { status: 500 }
      );
    }

    return NextResponse.json<PharmacyResponse>(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}