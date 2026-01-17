import { NextRequest } from 'next/server';
import { GET } from '../districts/route';
import { PharmacyService } from '../../../lib/database';

// Mock the dependencies
jest.mock('../../../lib/database');

const mockPharmacyService = PharmacyService as jest.Mocked<typeof PharmacyService>;

describe('/api/districts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDistricts = ['Kadikoy', 'Besiktas', 'Sisli'];

  describe('Valid requests', () => {
    it('should return list of districts for a valid city', async () => {
      mockPharmacyService.getDistrictsForCity.mockResolvedValue(mockDistricts);

      const request = new NextRequest('http://localhost:3000/api/districts?city=Istanbul');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockDistricts);
      expect(mockPharmacyService.getDistrictsForCity).toHaveBeenCalledWith('Istanbul');
    });

    it('should trim whitespace from city parameter', async () => {
      mockPharmacyService.getDistrictsForCity.mockResolvedValue(mockDistricts);

      const request = new NextRequest('http://localhost:3000/api/districts?city=  Istanbul  ');
      await GET(request);

      expect(mockPharmacyService.getDistrictsForCity).toHaveBeenCalledWith('Istanbul');
    });

    it('should handle city names with special characters', async () => {
      mockPharmacyService.getDistrictsForCity.mockResolvedValue(['District 1']);

      const request = new NextRequest('http://localhost:3000/api/districts?city=İstanbul');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPharmacyService.getDistrictsForCity).toHaveBeenCalledWith('İstanbul');
    });
  });

  describe('Invalid requests', () => {
    it('should return 400 when city parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/districts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameter: city is required');
    });

    it('should return 400 when city parameter is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/districts?city=');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameter: city is required');
    });

    it('should return 400 when city parameter is only whitespace', async () => {
      const request = new NextRequest('http://localhost:3000/api/districts?city=   ');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameter: city is required');
    });
  });

  describe('No results scenarios', () => {
    it('should return 404 when no districts found for city', async () => {
      mockPharmacyService.getDistrictsForCity.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/districts?city=NonExistentCity');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No districts with on-duty pharmacies found for city: NonExistentCity');
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database error occurs', async () => {
      const dbError = new Error('Database connection failed');
      dbError.name = 'DatabaseError';
      mockPharmacyService.getDistrictsForCity.mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/districts?city=Istanbul');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error occurred while fetching districts data');
    });

    it('should return 500 for unexpected errors', async () => {
      mockPharmacyService.getDistrictsForCity.mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/districts?city=Istanbul');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});