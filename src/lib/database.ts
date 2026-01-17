import { supabase } from './supabase';
import type { Pharmacy } from '../types';

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Database service for pharmacy-related queries
 */
export class PharmacyService {
  /**
   * Query on-duty pharmacies filtered by current date
   * @param date - Date string in YYYY-MM-DD format (defaults to today)
   * @returns Promise<Pharmacy[]> - Array of on-duty pharmacies
   * @throws DatabaseError - When database query fails
   */
  static async getOnDutyPharmacies(date?: string): Promise<Pharmacy[]> {
    try {
      // Use provided date or default to today
      const queryDate = date || new Date().toISOString().split('T')[0];

      console.log('Querying for date:', queryDate);
      
      const { data, error, count } = await supabase
        .from('pharmacies')
        .select('*', { count: 'exact' })
        .eq('date', queryDate)
        .range(0, 4999)
      
      console.log('Total records for this date:', count);
      console.log('Fetched records:', data?.length);

      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw new DatabaseError(
          `Failed to fetch on-duty pharmacies for date ${queryDate}: ${error.message}`,
          error
        );
      }

      // Map database fields to interface fields
      const mappedData = (data || []).map(item => ({
        id: item.id,
        city: item.city,
        district: item.district,
        pharmacy: item.pharmacy,
        address: item.address,
        phone: item.phone,
        date: item.date,
        lat: item.latitude ? parseFloat(item.latitude) : 0,
        lng: item.longitude ? parseFloat(item.longitude) : 0
      }));

      return mappedData;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        'Unexpected error while fetching pharmacy data',
        error
      );
    }
  }

  /**
   * Get distinct cities that have on-duty pharmacies for a specific date
   * @param date - Date string in YYYY-MM-DD format (defaults to today)
   * @returns Promise<string[]> - Array of city names
   * @throws DatabaseError - When database query fails
   */
  static async getAvailableCities(date?: string): Promise<string[]> {
    try {
      const queryDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('pharmacies')
        .select('city')
        .eq('date', queryDate)
        .order('city');

      if (error) {
        console.error('Supabase cities error:', JSON.stringify(error, null, 2));
        throw new DatabaseError(
          `Failed to fetch available cities for date ${queryDate}: ${error.message}`,
          error
        );
      }

      // Extract unique cities
      const cities = [...new Set(data?.map(item => item.city) || [])];
      return cities;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        'Unexpected error while fetching available cities',
        error
      );
    }
  }

  /**
   * Get districts for a specific city that have on-duty pharmacies
   * @param city - City name
   * @param date - Date string in YYYY-MM-DD format (defaults to today)
   * @returns Promise<string[]> - Array of district names
   * @throws DatabaseError - When database query fails
   */
  static async getDistrictsForCity(city: string, date?: string): Promise<string[]> {
    try {
      const queryDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('pharmacies')
        .select('district')
        .ilike('city', city)
        .eq('date', queryDate)
        .order('district');

      if (error) {
        throw new DatabaseError(
          `Failed to fetch districts for city ${city} on date ${queryDate}`,
          error
        );
      }

      // Extract unique districts
      const districts = [...new Set(data?.map(item => item.district) || [])];
      return districts;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        'Unexpected error while fetching districts',
        error
      );
    }
  }

  /**
   * Get pharmacies for a specific city and district
   * @param city - City name
   * @param district - District name
   * @param date - Date string in YYYY-MM-DD format (defaults to today)
   * @returns Promise<Pharmacy[]> - Array of pharmacies in the specified area
   * @throws DatabaseError - When database query fails
   */
  static async getPharmaciesForArea(
    city: string,
    district: string,
    date?: string
  ): Promise<Pharmacy[]> {
    try {
      const queryDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .ilike('city', city)
        .ilike('district', district)
        .eq('date', queryDate)
        .order('pharmacy');

      if (error) {
        throw new DatabaseError(
          `Failed to fetch pharmacies for ${city}, ${district} on date ${queryDate}`,
          error
        );
      }

      // Map database fields to interface fields
      const mappedData = (data || []).map(item => ({
        id: item.id,
        city: item.city,
        district: item.district,
        pharmacy: item.pharmacy,
        address: item.address,
        phone: item.phone,
        date: item.date,
        lat: item.latitude ? parseFloat(item.latitude) : 0,
        lng: item.longitude ? parseFloat(item.longitude) : 0
      }));

      return mappedData;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError(
        'Unexpected error while fetching pharmacies for area',
        error
      );
    }
  }
}