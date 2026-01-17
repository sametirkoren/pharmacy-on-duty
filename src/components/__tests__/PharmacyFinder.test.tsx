import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PharmacyFinder from '../PharmacyFinder';

// Mock the child components
jest.mock('../LocationPermission', () => {
  return function MockLocationPermission({ onLocationGranted, onLocationDenied }: { onLocationGranted: (location: { lat: number; lng: number }) => void; onLocationDenied: () => void }) {
    return (
      <div data-testid="location-permission">
        <button onClick={() => onLocationGranted({ lat: 41.0082, lng: 28.9784, timestamp: Date.now() })}>
          Grant Location
        </button>
        <button onClick={onLocationDenied}>
          Deny Location
        </button>
      </div>
    );
  };
});

jest.mock('../CityDistrictSelector', () => {
  return function MockCityDistrictSelector({ onSelectionComplete }: { onSelectionComplete: (city: string, district: string) => void }) {
    return (
      <div data-testid="city-district-selector">
        <button onClick={() => onSelectionComplete('Istanbul', 'Kadikoy')}>
          Select Location
        </button>
      </div>
    );
  };
});

jest.mock('../PharmacyCard', () => {
  return function MockPharmacyCard({ pharmacy }: { pharmacy: { pharmacy: string; address: string; distance: number } }) {
    return (
      <div data-testid="pharmacy-card">
        <h3>{pharmacy.pharmacy}</h3>
        <p>{pharmacy.address}</p>
        <p>{pharmacy.distance}km</p>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('PharmacyFinder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial location permission request', () => {
    render(<PharmacyFinder />);
    
    expect(screen.getByText('Nöbetçi Eczane Bulucu')).toBeInTheDocument();
    expect(screen.getByText('Yakınınızdaki nöbetçi eczaneleri bulun')).toBeInTheDocument();
    expect(screen.getByTestId('location-permission')).toBeInTheDocument();
  });

  it('handles successful location permission and finds nearest pharmacy', async () => {
    const mockPharmacyResponse = {
      success: true,
      data: {
        id: '1',
        pharmacy: 'Test Pharmacy',
        address: 'Test Address',
        phone: '123456789',
        city: 'Istanbul',
        district: 'Kadikoy',
        lat: 41.0082,
        lng: 28.9784,
        distance: 0.5
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPharmacyResponse
    });

    render(<PharmacyFinder />);
    
    const grantLocationButton = screen.getByText('Grant Location');
    fireEvent.click(grantLocationButton);

    await waitFor(() => {
      expect(screen.getByText('En Yakın Eczane')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pharmacy-card')).toBeInTheDocument();
    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/closest?lat=41.0082&lng=28.9784');
  });

  it('handles location permission denied and shows manual selection', () => {
    render(<PharmacyFinder />);
    
    const denyLocationButton = screen.getByText('Deny Location');
    fireEvent.click(denyLocationButton);

    expect(screen.getByTestId('city-district-selector')).toBeInTheDocument();
  });

  it('handles manual location selection and finds pharmacies', async () => {
    const mockPharmaciesResponse = {
      success: true,
      data: [
        {
          id: '1',
          pharmacy: 'Manual Pharmacy 1',
          address: 'Manual Address 1',
          phone: '123456789',
          city: 'Istanbul',
          district: 'Kadikoy',
          lat: 41.0082,
          lng: 28.9784,
          date: '2024-01-01'
        },
        {
          id: '2',
          pharmacy: 'Manual Pharmacy 2',
          address: 'Manual Address 2',
          phone: '987654321',
          city: 'Istanbul',
          district: 'Kadikoy',
          lat: 41.0082,
          lng: 28.9784,
          date: '2024-01-01'
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPharmaciesResponse
    });

    render(<PharmacyFinder />);
    
    // First deny location to get to manual selection
    const denyLocationButton = screen.getByText('Deny Location');
    fireEvent.click(denyLocationButton);

    // Then select location manually
    const selectLocationButton = screen.getByText('Select Location');
    fireEvent.click(selectLocationButton);

    await waitFor(() => {
      expect(screen.getByText('Nöbetçi Eczaneler')).toBeInTheDocument();
    });

    expect(screen.getAllByTestId('pharmacy-card')).toHaveLength(2);
    expect(screen.getByText('Manual Pharmacy 1')).toBeInTheDocument();
    expect(screen.getByText('Manual Pharmacy 2')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/pharmacies?city=Istanbul&district=Kadikoy');
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'No pharmacies found' })
    });

    render(<PharmacyFinder />);
    
    const grantLocationButton = screen.getByText('Grant Location');
    fireEvent.click(grantLocationButton);

    await waitFor(() => {
      expect(screen.getByText('Konum Arama Hatası')).toBeInTheDocument();
    });

    expect(screen.getByText('No pharmacies found')).toBeInTheDocument();
    expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
    expect(screen.getByText('Konumu Manuel Seç')).toBeInTheDocument();
  });

  it('allows switching between GPS and manual modes', async () => {
    render(<PharmacyFinder />);
    
    // Start with location permission denied
    const denyLocationButton = screen.getByText('Deny Location');
    fireEvent.click(denyLocationButton);

    expect(screen.getByTestId('city-district-selector')).toBeInTheDocument();
    expect(screen.getByText('Bunun yerine GPS konumu kullan')).toBeInTheDocument();

    // Switch back to GPS mode
    const useGpsButton = screen.getByText('Bunun yerine GPS konumu kullan');
    fireEvent.click(useGpsButton);

    expect(screen.getByTestId('location-permission')).toBeInTheDocument();
  });

  it('shows loading state during API calls', async () => {
    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: { id: '1', pharmacy: 'Test', address: 'Test', phone: '123', city: 'Test', district: 'Test', lat: 0, lng: 0, distance: 0 } })
      }), 100))
    );

    render(<PharmacyFinder />);
    
    const grantLocationButton = screen.getByText('Grant Location');
    fireEvent.click(grantLocationButton);

    // Should show loading state
    expect(screen.getByText('En yakın eczane aranıyor...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('En Yakın Eczane')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('displays privacy notice', () => {
    render(<PharmacyFinder />);
    
    expect(screen.getByText(/Gizliliğiniz korunmaktadır/)).toBeInTheDocument();
  });

  it('allows starting over from results', async () => {
    const mockPharmacyResponse = {
      success: true,
      data: {
        id: '1',
        pharmacy: 'Test Pharmacy',
        address: 'Test Address',
        phone: '123456789',
        city: 'Istanbul',
        district: 'Kadikoy',
        lat: 41.0082,
        lng: 28.9784,
        distance: 0.5
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPharmacyResponse
    });

    render(<PharmacyFinder />);
    
    const grantLocationButton = screen.getByText('Grant Location');
    fireEvent.click(grantLocationButton);

    await waitFor(() => {
      expect(screen.getByText('En Yakın Eczane')).toBeInTheDocument();
    });

    // Click start over
    const startOverButton = screen.getByText('Baştan Başla');
    fireEvent.click(startOverButton);

    // Should be back to initial state
    expect(screen.getByTestId('location-permission')).toBeInTheDocument();
  });
});