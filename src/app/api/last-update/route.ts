import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    // Get the most recent date from the pharmacies table
    const { data, error } = await supabase
      .from('pharmacies')
      .select('date')
      .order('date', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch last update info' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data available' },
        { status: 404 }
      );
    }

    const lastDate = data[0].date;
    
    // Format the date for display
    const dateObj = new Date(lastDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long'
    });

    return NextResponse.json({
      success: true,
      data: {
        lastDate: lastDate,
        formattedDate: formattedDate,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching last update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
