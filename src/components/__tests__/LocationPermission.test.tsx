import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationPermission from '../LocationPermission';
// import { UserLocation } from '@/types';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('LocationPermission', () => {
  const mockOnLocationGranted = jest.fn();
  const mockOnLocationDenied = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset geolocation mock
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
  });

  const renderComponent = () => {
    return render(
      <LocationPermission
        onLocationGranted={mockOnLocationGranted}
        onLocationDenied={mockOnLocationDenied}
      />
    );
  };

  describe('Initial Render', () => {
    it('should render the location permission request UI', () => {
      renderComponent();
      
      expect(screen.getByText('Find Nearby Pharmacies')).toBeInTheDocument();
      expect(screen.getByText(/We need your location to find the closest on-duty pharmacy/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Use My Location/i })).toBeInTheDocument();
    });

    it('should show privacy message', () => {
      renderComponent();
      
      expect(screen.getByText(/Your privacy is protected. Location data is not stored./)).toBeInTheDocument();
    });

    it('should disable button and show error when geolocation is unavailable', () => {
      // Remove geolocation from navigator
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      renderComponent();
      
      expect(screen.getByRole('button', { name: /Use My Location/i })).toBeDisabled();
      expect(screen.getByText('Geolocation is not supported by this browser')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select Location Manually/i })).toBeInTheDocument();
    });
  });

  describe('Location Request Success', () => {
    it('should call onLocationGranted with correct data when location is successfully obtained', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      renderComponent();
      
      const locationButton = screen.getByRole('button', { name: /Use My Location/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(mockOnLocationGranted).toHaveBeenCalledWith({
          lat: 40.7128,
          lng: -74.0060,
          accuracy: 10,
          timestamp: expect.any(Number),
        });
      });
    });

    it('should show success state after location is granted', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      renderComponent();
      
      const locationButton = screen.getByRole('button', { name: /Use My Location/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText('Location access granted')).toBeInTheDocument();
      });
    });
  });

  describe('Location Request Errors', () => {
    it('should handle permission denied error', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      renderComponent();
      
      const locationButton = screen.getByRole('button', { name: /Use My Location/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText(/Location access denied/)).toBeInTheDocument();
        expect(mockOnLocationDenied).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /Select Location Manually/i })).toBeInTheDocument();
      });
    });

    it('should handle position unavailable error', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      renderComponent();
      
      const locationButton = screen.getByRole('button', { name: /Use My Location/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText(/Location information is unavailable/)).toBeInTheDocument();
        expect(mockOnLocationDenied).toHaveBeenCalled();
      });
    });

    it('should handle timeout error', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      renderComponent();
      
      const locationButton = screen.getByRole('button', { name: /Use My Location/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText(/Location request timed out/)).toBeInTheDocument();
        expect(mockOnLocationDenied).toHaveBeenCalled();
      });
    });

    it('should handle unknown error', async () => {
      const mockError = {
        code: 999, // Unknown error
        message: 'Unknown error',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      renderComponent();
      
      const locationButton = screen.getByRole('button', { name: /Use My Location/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText(/An unknown error occurred/)).toBeInTheDocument();
        expect(mockOnLocationDenied).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while requesting location', async () => {
      let resolveLocation: (position: GeolocationPosition) => void;
      const locationPromise = new Promise((resolve) => {
        resolveLocation = resolve;
      });

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        locationPromise.then(success);
      });

      renderComponent();
      
      const locationButton = screen.getByRole('button', { name: /Use My Location/i });
      fireEvent.click(locationButton);

      // Should show loading state
      expect(screen.getByText('Getting your location...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Getting your location.../i })).toBeDisabled();

      // Resolve the location request
      resolveLocation!({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });

      await waitFor(() => {
        expect(screen.getByText('Location access granted')).toBeInTheDocument();
      });
    });
  });

  describe('Manual Location Selection', () => {
    it('should call onLocationDenied when manual selection button is clicked', () => {
      // Simulate geolocation unavailable
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      renderComponent();
      
      const manualButton = screen.getByRole('button', { name: /Select Location Manually/i });
      fireEvent.click(manualButton);

      expect(mockOnLocationDenied).toHaveBeenCalled();
    });

    it('should show manual selection button after permission denied', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      renderComponent();
      
      const locationButton = screen.getByRole('button', { name: /Use My Location/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Select Location Manually/i })).toBeInTheDocument();
      });

      const manualButton = screen.getByRole('button', { name: /Select Location Manually/i });
      fireEvent.click(manualButton);

      expect(mockOnLocationDenied).toHaveBeenCalledTimes(2); // Once from error, once from button click
    });
  });

  describe('Geolocation Options', () => {
    it('should use correct geolocation options', () => {
      renderComponent();
      
      const locationButton = screen.getByRole('button', { name: /Use My Location/i });
      fireEvent.click(locationButton);

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  });
});