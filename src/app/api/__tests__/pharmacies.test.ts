import { NextRequest } from 'next/server';
import { GET } from '../pharmacies/route';
import { PharmacyService } from '../../../lib/database';

// Mock the dependencies
jest.mock('../../../lib/database');

const mockPharmacyService = PharmacyService as jest.Mocked<typeof PharmacyService>;

describe('/api/pharmacies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPharmacies = [
    {
      id: '1',
      city: 'Istanbul',
      district: 'Kadikoy',
      pharmacy: 'Test Pharmacy 1',
      address: 'Test Address 1',
      phone: '123456789',
      date: '2025-01-20',
      lat: 40.9833,
      lng: 29.0167
    },
    {
      id: '2',
      city: 'Istanbul',
      district: 'Kadikoy',
      pharmacy: 'Test Pharmacy 2',
      address: 'Test Address 2',
      phone: '987654321',
      date: '2025-01-20',
      lat: 40.9844,
      lng: 29.0178
    }
  ];

  describe('Valid requests', () => {
    it('should return pharmacies for valid city and district', async () => {
      mockPharmacyService.getPharmaciesForArea.mockResolvedValue(mockPharmacies);

      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPharmacies);
      expect(mockPharmacyService.getPharmaciesForArea).toHaveBeenCalledWith('Istanbul', 'Kadikoy');
    });

    it('should trim whitespace from parameters', async () => {
      mockPharmacyService.getPharmaciesForArea.mockResolvedValue(mockPharmacies);

      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=  Istanbul  &district=  Kadikoy  ');
      await GET(request);

      expect(mockPharmacyService.getPharmaciesForArea).toHaveBeenCalledWith('Istanbul', 'Kadikoy');
    });

    it('should handle special characters in city and district names', async () => {
      mockPharmacyService.getPharmaciesForArea.mockResolvedValue(mockPharmacies);

      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=İstanbul&district=Kadıköy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPharmacyService.getPharmaciesForArea).toHaveBeenCalledWith('İstanbul', 'Kadıköy');
    });
  });

  describe('Invalid requests', () => {
    it('should return 400 when city parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/pharmacies?district=Kadikoy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameters: city and district are required');
    });

    it('should return 400 when district parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=Istanbul');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameters: city and district are required');
    });

    it('should return 400 when both parameters are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/pharmacies');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameters: city and district are required');
    });

    it('should return 400 when city parameter is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=&district=Kadikoy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameters: city and district are required');
    });

    it('should return 400 when district parameter is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=Istanbul&district=');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameters: city and district are required');
    });

    it('should return 400 when parameters are only whitespace', async () => {
      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=   &district=   ');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameters: city and district are required');
    });
  });

  describe('No results scenarios', () => {
    it('should return 404 with suggestions when no pharmacies found but other districts available', async () => {
      mockPharmacyService.getPharmaciesForArea.mockResolvedValue([]);
      mockPharmacyService.getDistrictsForCity.mockResolvedValue(['Besiktas', 'Sisli']);

      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No on-duty pharmacies found in Kadikoy, Istanbul. Available districts in Istanbul: Besiktas, Sisli');
      expect(mockPharmacyService.getDistrictsForCity).toHaveBeenCalledWith('Istanbul');
    });

    it('should return 404 without suggestions when no districts available in city', async () => {
      mockPharmacyService.getPharmaciesForArea.mockResolvedValue([]);
      mockPharmacyService.getDistrictsForCity.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No on-duty pharmacies found in Kadikoy, Istanbul. No other districts available in Istanbul for today.');
    });

    it('should return basic error when suggestion query fails', async () => {
      mockPharmacyService.getPharmaciesForArea.mockResolvedValue([]);
      mockPharmacyService.getDistrictsForCity.mockRejectedValue(new Error('Suggestion query failed'));

      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No on-duty pharmacies found in Kadikoy, Istanbul');
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database error occurs', async () => {
      const dbError = new Error('Database connection failed');
      dbError.name = 'DatabaseError';
      mockPharmacyService.getPharmaciesForArea.mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error occurred while fetching pharmacies data');
    });

    it('should return 500 for unexpected errors', async () => {
      mockPharmacyService.getPharmaciesForArea.mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});