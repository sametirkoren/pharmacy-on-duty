import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('pharmacies')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('Connection error:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError
      }, { status: 500 });
    }

    console.log('Connection test result:', connectionTest);

    // Test getting today's data
    const today = new Date().toISOString().split('T')[0];
    console.log('Querying for date:', today);
    
    const { data: todayData, error: todayError } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('date', today);
    
    if (todayError) {
      console.error('Today query error:', todayError);
      return NextResponse.json({
        success: false,
        error: 'Failed to query today\'s data',
        details: todayError
      }, { status: 500 });
    }

    console.log('Today data result:', todayData);

    // Test getting any data (without date filter)
    const { data: anyData, error: anyError } = await supabase
      .from('pharmacies')
      .select('*');
    
    if (anyError) {
      console.error('Any data query error:', anyError);
      return NextResponse.json({
        success: false,
        error: 'Failed to query any data',
        details: anyError
      }, { status: 500 });
    }

    console.log('Any data result:', anyData);

    return NextResponse.json({
      success: true,
      connection: 'OK',
      today: today,
      todayCount: todayData?.length || 0,
      totalCount: anyData?.length || 0,
      sampleData: anyData || []
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // İstanbul'da Bahçelievler ve çevresindeki test eczaneleri
    const istanbulPharmacies = [
      {
        city: 'istanbul',
        district: 'Bahçelievler',
        pharmacy: 'Bahçelievler Merkez Eczanesi',
        address: 'Bahçelievler Merkez Mahallesi, Eski Londra Asfaltı Caddesi No:15/A Bahçelievler / İstanbul',
        phone: '0 (212) 559-12-34',
        date: today,
        latitude: '41.0086',
        longitude: '28.8558'
      },
      {
        city: 'istanbul',
        district: 'Bahçelievler',
        pharmacy: 'Sağlık Eczanesi',
        address: 'Yenibosna Merkez Mahallesi, İncirli Caddesi No:45/B Bahçelievler / İstanbul',
        phone: '0 (212) 551-67-89',
        date: today,
        latitude: '41.0125',
        longitude: '28.8445'
      },
      {
        city: 'istanbul',
        district: 'Bakırköy',
        pharmacy: 'Bakırköy Aile Eczanesi',
        address: 'Ataköy 7-8-9-10. Kısım Mahallesi, E-5 Karayolu Caddesi No:23 Bakırköy / İstanbul',
        phone: '0 (212) 559-98-76',
        date: today,
        latitude: '40.9833',
        longitude: '28.8667'
      },
      {
        city: 'istanbul',
        district: 'Güngören',
        pharmacy: 'Güngören Sağlık Eczanesi',
        address: 'Güneşli Mahallesi, Bağlar Caddesi No:67/C Güngören / İstanbul',
        phone: '0 (212) 542-11-22',
        date: today,
        latitude: '41.0167',
        longitude: '28.8750'
      },
      {
        city: 'istanbul',
        district: 'Zeytinburnu',
        pharmacy: 'Zeytinburnu Merkez Eczanesi',
        address: 'Kazlıçeşme Mahallesi, Kennedy Caddesi No:89/A Zeytinburnu / İstanbul',
        phone: '0 (212) 582-33-44',
        date: today,
        latitude: '41.0042',
        longitude: '28.9083'
      }
    ];

    // Veritabanına ekle
    const { data, error } = await supabase
      .from('pharmacies')
      .insert(istanbulPharmacies)
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert test data',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'İstanbul test eczaneleri başarıyla eklendi',
      insertedCount: data?.length || 0,
      data: data
    });

  } catch (error) {
    console.error('POST API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}