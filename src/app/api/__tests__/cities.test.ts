import { GET } from '../cities/route';
import { PharmacyService } from '../../../lib/database';

// Mock the dependencies
jest.mock('../../../lib/database');

const mockPharmacyService = PharmacyService as jest.Mocked<typeof PharmacyService>;

describe('/api/cities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCities = ['Istanbul', 'Ankara', 'Izmir'];

  describe('Valid requests', () => {
    it('should return list of cities with on-duty pharmacies', async () => {
      mockPharmacyService.getAvailableCities.mockResolvedValue(mockCities);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCities);
      expect(mockPharmacyService.getAvailableCities).toHaveBeenCalledWith();
    });

    it('should call getAvailableCities without parameters', async () => {
      mockPharmacyService.getAvailableCities.mockResolvedValue(mockCities);

      await GET();

      expect(mockPharmacyService.getAvailableCities).toHaveBeenCalledTimes(1);
      expect(mockPharmacyService.getAvailableCities).toHaveBeenCalledWith();
    });
  });

  describe('No results scenarios', () => {
    it('should return 404 when no cities have on-duty pharmacies', async () => {
      mockPharmacyService.getAvailableCities.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No cities with on-duty pharmacies found for today');
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database error occurs', async () => {
      const dbError = new Error('Database connection failed');
      dbError.name = 'DatabaseError';
      mockPharmacyService.getAvailableCities.mockRejectedValue(dbError);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error occurred while fetching cities data');
    });

    it('should return 500 for unexpected errors', async () => {
      mockPharmacyService.getAvailableCities.mockRejectedValue(new Error('Unexpected error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});