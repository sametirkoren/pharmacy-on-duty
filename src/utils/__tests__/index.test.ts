import { calculateDistance, validateCoordinates } from '../index';

describe('Distance Calculation Utility', () => {
  describe('validateCoordinates', () => {
    it('should accept valid coordinates', () => {
      expect(() => validateCoordinates(40.7128, -74.0060)).not.toThrow();
      expect(() => validateCoordinates(0, 0)).not.toThrow();
      expect(() => validateCoordinates(90, 180)).not.toThrow();
      expect(() => validateCoordinates(-90, -180)).not.toThrow();
    });

    it('should throw error for invalid latitude', () => {
      expect(() => validateCoordinates(91, 0)).toThrow('Latitude must be between -90 and 90 degrees');
      expect(() => validateCoordinates(-91, 0)).toThrow('Latitude must be between -90 and 90 degrees');
    });

    it('should throw error for invalid longitude', () => {
      expect(() => validateCoordinates(0, 181)).toThrow('Longitude must be between -180 and 180 degrees');
      expect(() => validateCoordinates(0, -181)).toThrow('Longitude must be between -180 and 180 degrees');
    });

    it('should throw error for non-number inputs', () => {
      expect(() => validateCoordinates('40.7128' as unknown as number, -74.0060)).toThrow('Latitude and longitude must be numbers');
      expect(() => validateCoordinates(40.7128, '-74.0060' as unknown as number)).toThrow('Latitude and longitude must be numbers');
    });

    it('should throw error for NaN inputs', () => {
      expect(() => validateCoordinates(NaN, -74.0060)).toThrow('Latitude and longitude cannot be NaN');
      expect(() => validateCoordinates(40.7128, NaN)).toThrow('Latitude and longitude cannot be NaN');
    });
  });

  describe('calculateDistance', () => {
    it('should return 0 for identical coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });

    it('should calculate correct distance between New York and Los Angeles', () => {
      // New York City coordinates
      const nyLat = 40.7128;
      const nyLng = -74.0060;
      
      // Los Angeles coordinates
      const laLat = 34.0522;
      const laLng = -118.2437;
      
      const distance = calculateDistance(nyLat, nyLng, laLat, laLng);
      
      // Expected distance is approximately 3936 km (allowing for small variations)
      expect(distance).toBeCloseTo(3936, -1);
    });

    it('should calculate correct distance between London and Paris', () => {
      // London coordinates
      const londonLat = 51.5074;
      const londonLng = -0.1278;
      
      // Paris coordinates
      const parisLat = 48.8566;
      const parisLng = 2.3522;
      
      const distance = calculateDistance(londonLat, londonLng, parisLat, parisLng);
      
      // Expected distance is approximately 344 km
      expect(distance).toBeCloseTo(344, 0);
    });

    it('should calculate correct distance between Istanbul districts', () => {
      // Kadıköy coordinates (example)
      const kadikoyLat = 40.9833;
      const kadikoyLng = 29.0167;
      
      // Beşiktaş coordinates (example)
      const besiktasLat = 41.0422;
      const besiktasLng = 29.0061;
      
      const distance = calculateDistance(kadikoyLat, kadikoyLng, besiktasLat, besiktasLng);
      
      // Expected distance is approximately 7-8 km
      expect(distance).toBeGreaterThan(5);
      expect(distance).toBeLessThan(10);
    });

    it('should handle coordinates at the equator', () => {
      const distance = calculateDistance(0, 0, 0, 1);
      
      // 1 degree longitude at equator is approximately 111 km
      expect(distance).toBeCloseTo(111, 0);
    });

    it('should handle coordinates at the poles', () => {
      const distance = calculateDistance(89, 0, 90, 0);
      
      // Distance from near north pole to north pole should be approximately 111 km
      expect(distance).toBeCloseTo(111, 0);
    });

    it('should handle crossing the international date line', () => {
      // Point near date line on one side
      const lat1 = 0;
      const lng1 = 179;
      
      // Point near date line on other side
      const lat2 = 0;
      const lng2 = -179;
      
      const distance = calculateDistance(lat1, lng1, lat2, lng2);
      
      // Should be approximately 222 km (2 degrees longitude at equator)
      expect(distance).toBeCloseTo(222, 0);
    });

    it('should return distance rounded to 2 decimal places', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7129, -74.0061);
      
      // Check that result has at most 2 decimal places
      const decimalPlaces = (distance.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it('should throw error for invalid coordinates in first point', () => {
      expect(() => calculateDistance(91, 0, 40, -74)).toThrow('Latitude must be between -90 and 90 degrees');
    });

    it('should throw error for invalid coordinates in second point', () => {
      expect(() => calculateDistance(40, -74, 91, 0)).toThrow('Latitude must be between -90 and 90 degrees');
    });

    it('should handle very small distances accurately', () => {
      // Two points very close together
      const distance = calculateDistance(40.7128, -74.0060, 40.7129, -74.0061);
      
      // Should be a very small positive number
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1);
    });

    it('should handle maximum possible distance (antipodal points)', () => {
      // Two points on opposite sides of Earth
      const distance = calculateDistance(0, 0, 0, 180);
      
      // Maximum distance should be approximately half Earth's circumference (~20,015 km)
      expect(distance).toBeCloseTo(20015, 0);
    });

    it('should handle negative coordinates correctly', () => {
      // Test with negative latitude and longitude
      const distance = calculateDistance(-40.7128, -74.0060, -34.0522, -118.2437);
      
      // Should calculate distance correctly regardless of sign
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(50000); // Should be reasonable distance
    });

    it('should be symmetric (distance A to B equals distance B to A)', () => {
      const lat1 = 40.7128, lng1 = -74.0060;
      const lat2 = 34.0522, lng2 = -118.2437;
      
      const distanceAB = calculateDistance(lat1, lng1, lat2, lng2);
      const distanceBA = calculateDistance(lat2, lng2, lat1, lng1);
      
      expect(distanceAB).toBe(distanceBA);
    });

    it('should handle coordinates near poles correctly', () => {
      // Test near north pole
      const distanceNorth = calculateDistance(89.9, 0, 89.9, 180);
      expect(distanceNorth).toBeGreaterThan(0);
      expect(distanceNorth).toBeLessThan(1000);
      
      // Test near south pole
      const distanceSouth = calculateDistance(-89.9, 0, -89.9, 180);
      expect(distanceSouth).toBeGreaterThan(0);
      expect(distanceSouth).toBeLessThan(1000);
    });

    it('should handle edge case coordinates at boundaries', () => {
      // Test at exact boundaries
      const distance1 = calculateDistance(90, 0, -90, 0); // North to South pole
      const distance2 = calculateDistance(0, 180, 0, -180); // Same point across date line
      
      expect(distance1).toBeCloseTo(20015, 0); // Half circumference
      expect(distance2).toBe(0); // Same point
    });

    it('should maintain precision for very close points', () => {
      // Test points approximately 100 meters apart
      const lat1 = 40.7128;
      const lng1 = -74.0060;
      const lat2 = lat1 + 0.0009; // Approximately 100 meters north
      const lng2 = lng1;
      
      const distance = calculateDistance(lat1, lng1, lat2, lng2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Less than 1 km
    });

    it('should handle floating point precision correctly', () => {
      // Test with coordinates that have meaningful difference
      const distance = calculateDistance(
        40.7128,
        -74.0060,
        40.7129,
        -74.0061
      );
      
      expect(typeof distance).toBe('number');
      expect(isFinite(distance)).toBe(true);
      expect(distance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle rapid successive calculations', () => {
      const coordinates = [
        [40.7128, -74.0060],
        [34.0522, -118.2437],
        [51.5074, -0.1278],
        [48.8566, 2.3522],
        [35.6762, 139.6503],
      ];

      const startTime = Date.now();
      
      // Perform many calculations
      for (let i = 0; i < coordinates.length; i++) {
        for (let j = i + 1; j < coordinates.length; j++) {
          const distance = calculateDistance(
            coordinates[i][0], coordinates[i][1],
            coordinates[j][0], coordinates[j][1]
          );
          expect(distance).toBeGreaterThan(0);
        }
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle extreme coordinate values within valid range', () => {
      // Test extreme but valid coordinates
      const extremeTests = [
        [90, 180, -90, -180],    // Maximum range
        [89.999999, 179.999999, -89.999999, -179.999999], // Near maximum
        [0.000001, 0.000001, -0.000001, -0.000001], // Near zero
      ];

      extremeTests.forEach(([lat1, lng1, lat2, lng2]) => {
        expect(() => {
          const distance = calculateDistance(lat1, lng1, lat2, lng2);
          expect(typeof distance).toBe('number');
          expect(isFinite(distance)).toBe(true);
          expect(distance).toBeGreaterThanOrEqual(0);
        }).not.toThrow();
      });
    });

    it('should maintain consistency across multiple calls with same input', () => {
      const lat1 = 40.7128, lng1 = -74.0060;
      const lat2 = 34.0522, lng2 = -118.2437;
      
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(calculateDistance(lat1, lng1, lat2, lng2));
      }
      
      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toBe(firstResult);
      });
    });
  });
});