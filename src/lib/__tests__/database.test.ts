import { PharmacyService, DatabaseError } from '../database';
import { supabase } from '../supabase';
import type { Pharmacy } from '../../types';

// Mock Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('PharmacyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOnDutyPharmacies', () => {
    const mockPharmacyData: Pharmacy[] = [
      {
        id: '1',
        city: 'Istanbul',
        district: 'Kadikoy',
        pharmacy: 'Test Pharmacy 1',
        address: '123 Test St',
        phone: '+90 555 123 4567',
        date: '2024-01-15',
        lat: 40.9833,
        lng: 29.0167,
      },
      {
        id: '2',
        city: 'Istanbul',
        district: 'Besiktas',
        pharmacy: 'Test Pharmacy 2',
        address: '456 Test Ave',
        phone: '+90 555 987 6543',
        date: '2024-01-15',
        lat: 41.0422,
        lng: 29.0094,
      },
    ];

    it('should return on-duty pharmacies for today when no date provided', async () => {
      const today = new Date().toISOString().split('T')[0];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPharmacyData, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      const result = await PharmacyService.getOnDutyPharmacies();

      expect(mockSupabase.from).toHaveBeenCalledWith('pharmacies');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('date', today);
      expect(result).toEqual(mockPharmacyData);
    });

    it('should return on-duty pharmacies for specific date', async () => {
      const testDate = '2024-01-15';
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPharmacyData, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      const result = await PharmacyService.getOnDutyPharmacies(testDate);

      expect(mockQuery.eq).toHaveBeenCalledWith('date', testDate);
      expect(result).toEqual(mockPharmacyData);
    });

    it('should return empty array when no data found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      const result = await PharmacyService.getOnDutyPharmacies();

      expect(result).toEqual([]);
    });

    it('should throw DatabaseError when Supabase returns error', async () => {
      const mockError = { message: 'Database connection failed' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      await expect(PharmacyService.getOnDutyPharmacies()).rejects.toThrow(DatabaseError);
      await expect(PharmacyService.getOnDutyPharmacies()).rejects.toThrow(
        'Failed to fetch on-duty pharmacies'
      );
    });

    it('should throw DatabaseError when unexpected error occurs', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      await expect(PharmacyService.getOnDutyPharmacies()).rejects.toThrow(DatabaseError);
      await expect(PharmacyService.getOnDutyPharmacies()).rejects.toThrow(
        'Unexpected error while fetching pharmacy data'
      );
    });
  });

  describe('getAvailableCities', () => {
    const mockCityData = [
      { city: 'Istanbul' },
      { city: 'Ankara' },
      { city: 'Istanbul' }, // Duplicate to test uniqueness
      { city: 'Izmir' },
    ];

    it('should return unique cities for today when no date provided', async () => {
      const today = new Date().toISOString().split('T')[0];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockCityData, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      const result = await PharmacyService.getAvailableCities();

      expect(mockSupabase.from).toHaveBeenCalledWith('pharmacies');
      expect(mockQuery.select).toHaveBeenCalledWith('city');
      expect(mockQuery.eq).toHaveBeenCalledWith('date', today);
      expect(mockQuery.order).toHaveBeenCalledWith('city');
      expect(result).toEqual(['Istanbul', 'Ankara', 'Izmir']);
    });

    it('should return unique cities for specific date', async () => {
      const testDate = '2024-01-15';
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockCityData, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      const result = await PharmacyService.getAvailableCities(testDate);

      expect(mockQuery.eq).toHaveBeenCalledWith('date', testDate);
      expect(result).toEqual(['Istanbul', 'Ankara', 'Izmir']);
    });

    it('should throw DatabaseError when Supabase returns error', async () => {
      const mockError = { message: 'Database connection failed' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      await expect(PharmacyService.getAvailableCities()).rejects.toThrow(DatabaseError);
    });
  });

  describe('getDistrictsForCity', () => {
    const mockDistrictData = [
      { district: 'Kadikoy' },
      { district: 'Besiktas' },
      { district: 'Kadikoy' }, // Duplicate to test uniqueness
    ];

    it('should return unique districts for city and today when no date provided', async () => {
      const today = new Date().toISOString().split('T')[0];
      const testCity = 'Istanbul';
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockDistrictData, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      const result = await PharmacyService.getDistrictsForCity(testCity);

      expect(mockSupabase.from).toHaveBeenCalledWith('pharmacies');
      expect(mockQuery.select).toHaveBeenCalledWith('district');
      expect(mockQuery.eq).toHaveBeenCalledWith('city', testCity);
      expect(mockQuery.eq).toHaveBeenCalledWith('date', today);
      expect(mockQuery.order).toHaveBeenCalledWith('district');
      expect(result).toEqual(['Kadikoy', 'Besiktas']);
    });

    it('should return unique districts for city and specific date', async () => {
      const testDate = '2024-01-15';
      const testCity = 'Istanbul';
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockDistrictData, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      const result = await PharmacyService.getDistrictsForCity(testCity, testDate);

      expect(mockQuery.eq).toHaveBeenCalledWith('city', testCity);
      expect(mockQuery.eq).toHaveBeenCalledWith('date', testDate);
      expect(result).toEqual(['Kadikoy', 'Besiktas']);
    });

    it('should throw DatabaseError when Supabase returns error', async () => {
      const mockError = { message: 'Database connection failed' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      await expect(PharmacyService.getDistrictsForCity('Istanbul')).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('getPharmaciesForArea', () => {
    const mockAreaPharmacies: Pharmacy[] = [
      {
        id: '1',
        city: 'Istanbul',
        district: 'Kadikoy',
        pharmacy: 'Area Pharmacy 1',
        address: '123 Area St',
        phone: '+90 555 111 2222',
        date: '2024-01-15',
        lat: 40.9833,
        lng: 29.0167,
      },
      {
        id: '2',
        city: 'Istanbul',
        district: 'Kadikoy',
        pharmacy: 'Area Pharmacy 2',
        address: '456 Area Ave',
        phone: '+90 555 333 4444',
        date: '2024-01-15',
        lat: 40.9844,
        lng: 29.0178,
      },
    ];

    it('should return pharmacies for specific area and today when no date provided', async () => {
      const today = new Date().toISOString().split('T')[0];
      const testCity = 'Istanbul';
      const testDistrict = 'Kadikoy';
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockAreaPharmacies, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      const result = await PharmacyService.getPharmaciesForArea(testCity, testDistrict);

      expect(mockSupabase.from).toHaveBeenCalledWith('pharmacies');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('city', testCity);
      expect(mockQuery.eq).toHaveBeenCalledWith('district', testDistrict);
      expect(mockQuery.eq).toHaveBeenCalledWith('date', today);
      expect(mockQuery.order).toHaveBeenCalledWith('pharmacy');
      expect(result).toEqual(mockAreaPharmacies);
    });

    it('should return pharmacies for specific area and date', async () => {
      const testDate = '2024-01-15';
      const testCity = 'Istanbul';
      const testDistrict = 'Kadikoy';
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockAreaPharmacies, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      const result = await PharmacyService.getPharmaciesForArea(
        testCity,
        testDistrict,
        testDate
      );

      expect(mockQuery.eq).toHaveBeenCalledWith('city', testCity);
      expect(mockQuery.eq).toHaveBeenCalledWith('district', testDistrict);
      expect(mockQuery.eq).toHaveBeenCalledWith('date', testDate);
      expect(result).toEqual(mockAreaPharmacies);
    });

    it('should return empty array when no pharmacies found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      const result = await PharmacyService.getPharmaciesForArea('Istanbul', 'Kadikoy');

      expect(result).toEqual([]);
    });

    it('should throw DatabaseError when Supabase returns error', async () => {
      const mockError = { message: 'Database connection failed' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as unknown);

      await expect(
        PharmacyService.getPharmaciesForArea('Istanbul', 'Kadikoy')
      ).rejects.toThrow(DatabaseError);
    });
  });
});