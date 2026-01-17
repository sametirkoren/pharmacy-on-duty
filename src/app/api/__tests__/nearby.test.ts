import { NextRequest } from 'next/server';
import { GET } from '../nearby/route';
import { PharmacyService } from '../../../lib/database';
import * as utils from '../../../utils';

// Mock the dependencies
jest.mock('../../../lib/database');
jest.mock('../../../utils');

const mockPharmacyService = PharmacyService as jest.Mocked<typeof PharmacyService>;
const mockUtils = utils as jest.Mocked<typeof utils>;

describe('/api/nearby', () => {
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
    it('should return nearby pharmacies with valid coordinates', async () => {
      mockPharmacyService.getOnDutyPharmacies.mockResolvedValue(mockPharmacies);
      mockUtils.validateCoordinates.mockImplementation(() => {});
      mockUtils.calculateDistance
        .mockReturnValueOnce(5.2)
        .mockReturnValueOnce(3.8);

      const request = new NextRequest('http://localhost:3000/api/nearby?lat=41.0082&lng=28.9784&limit=5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return 400 when lat parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/nearby?lng=28.9784');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required parameters: lat and lng are required');
    });
  });
});