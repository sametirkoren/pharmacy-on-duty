import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PharmacyFinder from '../components/PharmacyFinder';
import { mockPharmacyData, testCoordinates, getTestCities, getTestDistrictsForCity } from './test-data';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('Integration Tests - Complete User Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Reset geolocation mock
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
  });

  describe('GPS-based pharmacy finding flow', () => {
    it('should complete full GPS flow: permission → location → API call → display results', async () => {
      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: testCoordinates.istanbul.lat,
          longitude: testCoordinates.istanbul.lng,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => success(mockPosition), 100);
      });

      // Mock successful API response
      const closestPharmacy = {
        ...mockPharmacyData[1], // Besiktas pharmacy
        distance: 3.8,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: closestPharmacy,
        }),
      });

      render(<PharmacyFinder />);

      // Step 1: Initial state should show location permission request
      expect(screen.getByText('Nöbetçi Eczane Bulucu')).toBeInTheDocument();
      expect(screen.getByText('Yakınınızdaki nöbetçi eczaneleri bulun')).toBeInTheDocument();

      // Step 2: Grant location permission
      const locationButton = screen.getByRole('button', { name: /konumumu kullan/i });
      fireEvent.click(locationButton);

      // Step 3: Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/konum alınıyor/i)).toBeInTheDocument();
      });

      // Step 4: Should show searching state
      await waitFor(() => {
        expect(screen.getByText(/en yakın eczane aranıyor/i)).toBeInTheDocument();
      });

      // Step 5: Should call API with correct coordinates
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/closest?lat=${testCoordinates.istanbul.lat}&lng=${testCoordinates.istanbul.lng}`
        );
      });

      // Step 6: Should display results
      await waitFor(() => {
        expect(screen.getByText('En Yakın Eczane')).toBeInTheDocument();
        expect(screen.getByText(closestPharmacy.pharmacy)).toBeInTheDocument();
        expect(screen.getByText(closestPharmacy.address)).toBeInTheDocument();
        expect(screen.getByText('3.8km')).toBeInTheDocument();
      });

      // Step 7: Should have start over option
      expect(screen.getByText('Baştan Başla')).toBeInTheDocument();
    });

    it('should handle GPS permission denied and switch to manual mode', async () => {
      // Mock permission denied
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        setTimeout(() => error(mockError), 100);
      });

      // Mock cities API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: getTestCities(),
        }),
      });

      render(<PharmacyFinder />);

      // Grant location permission (which will fail)
      const locationButton = screen.getByRole('button', { name: /konumumu kullan/i });
      fireEvent.click(locationButton);

      // Should show error and switch to manual mode
      await waitFor(() => {
        expect(screen.getByText(/konum erişimi reddedildi/i)).toBeInTheDocument();
      });

      // Should show manual selection
      await waitFor(() => {
        expect(screen.getByText('Konumunuzu Seçin')).toBeInTheDocument();
        expect(mockFetch).toHaveBeenCalledWith('/api/cities');
      });
    });

    it('should handle API errors gracefully in GPS mode', async () => {
      // Mock successful geolocation
      const mockPosition = {
        coords: {
          latitude: testCoordinates.istanbul.lat,
          longitude: testCoordinates.istanbul.lng,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => success(mockPosition), 100);
      });

      // Mock API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'No pharmacies found',
        }),
      });

      render(<PharmacyFinder />);

      const locationButton = screen.getByRole('button', { name: /konumumu kullan/i });
      fireEvent.click(locationButton);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Konum Arama Hatası')).toBeInTheDocument();
        expect(screen.getByText('No pharmacies found')).toBeInTheDocument();
      });

      // Should have retry and manual options
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
      expect(screen.getByText('Konumu Manuel Seç')).toBeInTheDocument();
    });
  });

  describe('Manual location selection flow', () => {
    it('should complete full manual flow: cities → districts → pharmacies → display results', async () => {
      // Mock geolocation unavailable
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: getTestCities(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: getTestDistrictsForCity('Istanbul'),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [mockPharmacyData[0], mockPharmacyData[1]], // Istanbul pharmacies
          }),
        });

      render(<PharmacyFinder />);

      // Should start with manual selection due to no geolocation
      await waitFor(() => {
        expect(screen.getByText('Konumunuzu Seçin')).toBeInTheDocument();
      });

      // Step 1: Select city
      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      const citySelect = screen.getByLabelText('Şehir');
      fireEvent.change(citySelect, { target: { value: 'Istanbul' } });

      // Step 2: Districts should load
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/districts?city=Istanbul');
        expect(screen.getByText('Kadikoy')).toBeInTheDocument();
      });

      // Step 3: Select district
      const districtSelect = screen.getByLabelText('İlçe');
      fireEvent.change(districtSelect, { target: { value: 'Kadikoy' } });

      // Step 4: Submit form
      const submitButton = screen.getByRole('button', { name: /eczaneleri bul/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.click(submitButton);

      // Step 5: Should call pharmacies API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/pharmacies?city=Istanbul&district=Kadikoy');
      });

      // Step 6: Should display results
      await waitFor(() => {
        expect(screen.getByText('Nöbetçi Eczaneler')).toBeInTheDocument();
        expect(screen.getByText(mockPharmacyData[0].pharmacy)).toBeInTheDocument();
        expect(screen.getByText(mockPharmacyData[1].pharmacy)).toBeInTheDocument();
      });
    });

    it('should handle no results with suggestions in manual mode', async () => {
      // Mock geolocation unavailable
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: getTestCities(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: getTestDistrictsForCity('Istanbul'),
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: 'No on-duty pharmacies found in Kadikoy, Istanbul. Available districts in Istanbul: Besiktas, Sisli',
          }),
        });

      render(<PharmacyFinder />);

      // Complete manual selection flow
      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      const citySelect = screen.getByLabelText('Şehir');
      fireEvent.change(citySelect, { target: { value: 'Istanbul' } });

      await waitFor(() => {
        expect(screen.getByText('Kadikoy')).toBeInTheDocument();
      });

      const districtSelect = screen.getByLabelText('İlçe');
      fireEvent.change(districtSelect, { target: { value: 'Kadikoy' } });

      const submitButton = screen.getByRole('button', { name: /eczaneleri bul/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.click(submitButton);

      // Should show error with suggestions
      await waitFor(() => {
        expect(screen.getByText('Manuel Arama Hatası')).toBeInTheDocument();
        expect(screen.getByText(/Available districts in Istanbul: Besiktas, Sisli/)).toBeInTheDocument();
      });
    });
  });

  describe('Mode switching', () => {
    it('should allow switching from GPS to manual mode', async () => {
      // Mock successful geolocation initially
      const mockPosition = {
        coords: {
          latitude: testCoordinates.istanbul.lat,
          longitude: testCoordinates.istanbul.lng,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => success(mockPosition), 100);
      });

      // Mock API error to trigger switch option
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'No pharmacies found',
        }),
      });

      // Mock cities API for manual mode
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: getTestCities(),
        }),
      });

      render(<PharmacyFinder />);

      // Start with GPS
      const locationButton = screen.getByRole('button', { name: /konumumu kullan/i });
      fireEvent.click(locationButton);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Konum Arama Hatası')).toBeInTheDocument();
      });

      // Switch to manual mode
      const manualButton = screen.getByText('Konumu Manuel Seç');
      fireEvent.click(manualButton);

      // Should show manual selection
      await waitFor(() => {
        expect(screen.getByText('Konumunuzu Seçin')).toBeInTheDocument();
        expect(mockFetch).toHaveBeenCalledWith('/api/cities');
      });
    });

    it('should allow switching from manual to GPS mode', async () => {
      // Mock geolocation unavailable initially
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      // Mock cities API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: getTestCities(),
        }),
      });

      render(<PharmacyFinder />);

      // Should start with manual selection
      await waitFor(() => {
        expect(screen.getByText('Konumunuzu Seçin')).toBeInTheDocument();
      });

      // Enable geolocation for switch
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      // Switch to GPS mode
      const gpsButton = screen.getByText('Bunun yerine GPS konumu kullan');
      fireEvent.click(gpsButton);

      // Should show GPS permission request
      expect(screen.getByRole('button', { name: /konumumu kullan/i })).toBeInTheDocument();
    });
  });

  describe('Error recovery', () => {
    it('should allow retry after GPS error', async () => {
      // Mock geolocation failure then success
      let callCount = 0;
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        callCount++;
        if (callCount === 1) {
          setTimeout(() => error({
            code: 3, // TIMEOUT
            message: 'Timeout',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          }), 100);
        } else {
          setTimeout(() => success({
            coords: {
              latitude: testCoordinates.istanbul.lat,
              longitude: testCoordinates.istanbul.lng,
              accuracy: 10,
            },
            timestamp: Date.now(),
          }), 100);
        }
      });

      // Mock successful API response for retry
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockPharmacyData[0], distance: 2.5 },
        }),
      });

      render(<PharmacyFinder />);

      // First attempt
      const locationButton = screen.getByRole('button', { name: /konumumu kullan/i });
      fireEvent.click(locationButton);

      // Should show timeout error
      await waitFor(() => {
        expect(screen.getByText(/konum isteği zaman aşımına uğradı/i)).toBeInTheDocument();
      });

      // Retry
      const retryButton = screen.getByText('Tekrar Dene');
      fireEvent.click(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText('En Yakın Eczane')).toBeInTheDocument();
        expect(screen.getByText(mockPharmacyData[0].pharmacy)).toBeInTheDocument();
      });
    });

    it('should allow starting over from results', async () => {
      // Mock successful flow
      const mockPosition = {
        coords: {
          latitude: testCoordinates.istanbul.lat,
          longitude: testCoordinates.istanbul.lng,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => success(mockPosition), 100);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockPharmacyData[0], distance: 2.5 },
        }),
      });

      render(<PharmacyFinder />);

      // Complete successful flow
      const locationButton = screen.getByRole('button', { name: /konumumu kullan/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText('En Yakın Eczane')).toBeInTheDocument();
      });

      // Start over
      const startOverButton = screen.getByText('Baştan Başla');
      fireEvent.click(startOverButton);

      // Should be back to initial state
      expect(screen.getByText('Nöbetçi Eczane Bulucu')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /konumumu kullan/i })).toBeInTheDocument();
    });
  });

  describe('Privacy and data handling', () => {
    it('should not store location data after successful search', async () => {
      const mockPosition = {
        coords: {
          latitude: testCoordinates.istanbul.lat,
          longitude: testCoordinates.istanbul.lng,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => success(mockPosition), 100);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockPharmacyData[0], distance: 2.5 },
        }),
      });

      render(<PharmacyFinder />);

      const locationButton = screen.getByRole('button', { name: /konumumu kullan/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText('En Yakın Eczane')).toBeInTheDocument();
      });

      // Privacy notice should be visible
      expect(screen.getByText(/Gizliliğiniz korunmaktadır/)).toBeInTheDocument();

      // Location should only be used for API call, not stored
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/closest?lat=${testCoordinates.istanbul.lat}&lng=${testCoordinates.istanbul.lng}`
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});