import { NextRequest } from 'next/server';
import { GET } from '../closest/route';
import { PharmacyService } from '../../../lib/database';
import * as utils from '../../../utils';

// Mock the dependencies
jest.mock('../../../lib/database');
jest.mock('../../../utils');

const mockPharmacyService = PharmacyService as jest.Mocked<typeof PharmacyService>;
const mockUtils = utils as jest.Mocked<typeof utils>;

describe('/api/closest', () => {
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
      district: 'Besiktas',
      pharmacy: 'Test Pharmacy 2',
      address: 'Test Address 2',
      phone: '987654321',
      date: '2025-01-20',
      lat: 41.0422,
      lng: 29.0094
    }
  ];

  describe('Valid requests', () => {
    it('should return closest pharmacy with valid coordinates', async () => {
      // Mock successful database query
      mockPharmacyService.getOnDutyPharmacies.mockResolvedValue(mockPharmacies);
      
      // Mock coordinate validation (should not throw)
      mockUtils.validateCoordinates.mockImplementation(() => {});
      
      // Mock distance calculations
      mockUtils.calculateDistance
        .mockReturnValueOnce(5.2) // Distance to pharmacy 1
        .mockReturnValueOnce(3.8); // Distance to pharmacy 2

      const request = new NextRequest('http://localhost:3000/api/closest?lat=41.0082&lng=28.9784');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBe('2'); // Closer pharmacy
      expect(data.data.distance).toBe(3.8);
      expect(data.data.pharmacy).toBe('Test Pharmacy 2');
    });

    it('should call validateCoordinates with correct parameters', async () => {
      mockPharmacyService.getOnDutyPharmacies.mockResolvedValue(mockPharmacies);
      mockUtils.validateCoordinates.mockImplementation(() => {});
      mockUtils.calculateDistance.mockReturnValue(1.0);

      const request = new NextRequest('http://localhost:3000/api/closest?lat=41.0082&lng=28.9784');
      await GET(request);

      expect(mockUtils.validateCoordinates).toHaveBeenCalledWith(41.0082, 28.9784);
    });

    it('should call calculateDistance for each pharmacy', async () => {
      mockPharmacyService.getOnDutyPharmacies.mockResolvedValue(mockPharmacies);
      mockUtils.validateCoordinates.mockImplementation(() => {});
      mockUtils.calculateDistance.mockReturnValue(1.0);

      const request = new NextRequest('http://localhost:3000/api/closest?lat=41.0082&lng=28.9784');
      await GET(request);

      expect(mockUtils.calculateDistance).toHaveBeenCalledTimes(2);
      expect(mockUtils.calculateDistance).toHaveBeenCalledWith(41.0082, 28.9784, 40.9833, 29.0167);
      expect(mockUtils.calculateDistance).toHaveBeenCalledWith(41.0082, 28.9784, 41.0422, 29.0094);
    });
  });

  describe('Invalid requests', () => {
    it('should return 400 when lat parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/closest?lng=28.9784');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameters: lat and lng are required');
    });

    it('should return 400 when lng parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/closest?lat=41.0082');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameters: lat and lng are required');
    });

    it('should return 400 when both parameters are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/closest');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameters: lat and lng are required');
    });

    it('should return 400 when coordinates are invalid', async () => {
      mockUtils.validateCoordinates.mockImplementation(() => {
        throw new Error('Invalid coordinates');
      });

      const request = new NextRequest('http://localhost:3000/api/closest?lat=invalid&lng=28.9784');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid coordinates');
    });

    it('should return 400 when latitude is out of range', async () => {
      mockUtils.validateCoordinates.mockImplementation(() => {
        throw new Error('Latitude must be between -90 and 90 degrees');
      });

      const request = new NextRequest('http://localhost:3000/api/closest?lat=91&lng=28.9784');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Latitude must be between -90 and 90 degrees');
    });
  });

  describe('No results scenarios', () => {
    it('should return 404 when no pharmacies are on duty', async () => {
      mockPharmacyService.getOnDutyPharmacies.mockResolvedValue([]);
      mockUtils.validateCoordinates.mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/closest?lat=41.0082&lng=28.9784');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No on-duty pharmacies found for today');
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database error occurs', async () => {
      const dbError = new Error('Database connection failed');
      dbError.name = 'DatabaseError';
      mockPharmacyService.getOnDutyPharmacies.mockRejectedValue(dbError);
      mockUtils.validateCoordinates.mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/closest?lat=41.0082&lng=28.9784');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error occurred while fetching pharmacy data');
    });

    it('should return 500 for unexpected errors', async () => {
      mockPharmacyService.getOnDutyPharmacies.mockRejectedValue(new Error('Unexpected error'));
      mockUtils.validateCoordinates.mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/closest?lat=41.0082&lng=28.9784');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});