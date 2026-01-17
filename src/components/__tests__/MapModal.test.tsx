import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapModal from '../MapModal';
import { UserLocation, PharmacyWithDistance } from '@/types';

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: (props: Record<string, unknown>) => <div data-testid="tile-layer" {...props} />,
  Marker: ({ children, position, icon }: { children: React.ReactNode; position: [number, number]; icon?: { options?: { iconUrl?: string } } }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)} data-icon={icon?.options?.iconUrl || 'default'}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    fitBounds: jest.fn(),
    setView: jest.fn(),
  }),
}));

// Mock leaflet
jest.mock('leaflet', () => {
  const mockIcon = jest.fn().mockImplementation(() => ({
    options: {
      iconUrl: 'mocked-icon-url'
    }
  }));
  
  mockIcon.Default = {
    prototype: {
      _getIconUrl: jest.fn()
    },
    mergeOptions: jest.fn(),
  };
  
  return {
    Icon: mockIcon,
    latLngBounds: jest.fn(() => ({
      extend: jest.fn(),
    })),
  };
});

describe('MapModal', () => {
  const mockUserLocation: UserLocation = {
    lat: 41.0082,
    lng: 28.9784,
    accuracy: 10,
    timestamp: Date.now(),
  };

  const mockPharmacy: PharmacyWithDistance = {
    id: '1',
    pharmacy: 'Test Eczanesi',
    address: 'Test Mahallesi, Test Sokak No:1',
    phone: '0212 123 45 67',
    city: 'İstanbul',
    district: 'Beşiktaş',
    lat: 41.0425,
    lng: 29.0094,
    date: '2024-01-15',
    distance: 2.5,
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    userLocation: mockUserLocation,
    pharmacy: mockPharmacy,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock body style
    Object.defineProperty(document.body, 'style', {
      value: { overflow: '' },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<MapModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<MapModal {...defaultProps} />);
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('should display pharmacy information in header', () => {
      render(<MapModal {...defaultProps} />);
      expect(screen.getAllByText('Test Eczanesi')).toHaveLength(2); // Header and popup
      expect(screen.getAllByText('Beşiktaş, İstanbul')).toHaveLength(2); // Header and popup
    });

    it('should display pharmacy information in footer', () => {
      render(<MapModal {...defaultProps} />);
      expect(screen.getByText('📍 Test Mahallesi, Test Sokak No:1')).toBeInTheDocument();
      expect(screen.getAllByText('📞 0212 123 45 67')).toHaveLength(2); // Footer and popup
    });

    it('should display distance when user location is available', () => {
      render(<MapModal {...defaultProps} />);
      expect(screen.getByText('2.5 km uzaklıkta')).toBeInTheDocument();
    });

    it('should not display distance when user location is null', () => {
      render(<MapModal {...defaultProps} userLocation={null} />);
      expect(screen.queryByText('2.5 km uzaklıkta')).not.toBeInTheDocument();
    });
  });

  describe('Map Components', () => {
    it('should render map container with correct props', () => {
      render(<MapModal {...defaultProps} />);
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toHaveAttribute('zoom', '13');
      // Note: React-leaflet props are passed but may not appear as DOM attributes in mocked components
      expect(mapContainer).toBeInTheDocument();
    });

    it('should render tile layer', () => {
      render(<MapModal {...defaultProps} />);
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    });

    it('should render user location marker when user location is provided', () => {
      render(<MapModal {...defaultProps} />);
      const markers = screen.getAllByTestId('marker');
      const userMarker = markers.find(marker => 
        marker.getAttribute('data-position') === JSON.stringify([mockUserLocation.lat, mockUserLocation.lng])
      );
      expect(userMarker).toBeInTheDocument();
    });

    it('should not render user location marker when user location is null', () => {
      render(<MapModal {...defaultProps} userLocation={null} />);
      const markers = screen.getAllByTestId('marker');
      const userMarker = markers.find(marker => 
        marker.getAttribute('data-position') === JSON.stringify([mockUserLocation.lat, mockUserLocation.lng])
      );
      expect(userMarker).toBeUndefined();
    });

    it('should render pharmacy marker', () => {
      render(<MapModal {...defaultProps} />);
      const markers = screen.getAllByTestId('marker');
      const pharmacyMarker = markers.find(marker => 
        marker.getAttribute('data-position') === JSON.stringify([mockPharmacy.lat, mockPharmacy.lng])
      );
      expect(pharmacyMarker).toBeInTheDocument();
    });

    it('should render pharmacy popup with complete information', () => {
      render(<MapModal {...defaultProps} />);
      const popups = screen.getAllByTestId('popup');
      
      // Find pharmacy popup (should contain pharmacy name)
      const pharmacyPopup = popups.find(popup => 
        popup.textContent?.includes('Test Eczanesi')
      );
      
      expect(pharmacyPopup).toBeInTheDocument();
      expect(pharmacyPopup).toHaveTextContent('Test Eczanesi');
      expect(pharmacyPopup).toHaveTextContent('Test Mahallesi, Test Sokak No:1');
      expect(pharmacyPopup).toHaveTextContent('Beşiktaş, İstanbul');
      expect(pharmacyPopup).toHaveTextContent('📞 0212 123 45 67');
      expect(pharmacyPopup).toHaveTextContent('📍 2.5 km uzaklıkta');
    });

    it('should render user location popup', () => {
      render(<MapModal {...defaultProps} />);
      const popups = screen.getAllByTestId('popup');
      
      // Find user location popup
      const userPopup = popups.find(popup => 
        popup.textContent?.includes('Konumunuz')
      );
      
      expect(userPopup).toBeInTheDocument();
      expect(userPopup).toHaveTextContent('Konumunuz');
      expect(userPopup).toHaveTextContent('Mevcut konum');
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<MapModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Haritayı kapat');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when escape key is pressed', async () => {
      const onClose = jest.fn();
      render(<MapModal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onClose when clicking outside modal', async () => {
      const onClose = jest.fn();
      render(<MapModal {...defaultProps} onClose={onClose} />);
      
      // Click on backdrop
      const backdrop = document.querySelector('.bg-black.bg-opacity-50');
      if (backdrop) {
        fireEvent.mouseDown(backdrop);
      }
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onClose when clicking inside modal', async () => {
      const onClose = jest.fn();
      render(<MapModal {...defaultProps} onClose={onClose} />);
      
      // Click inside modal
      const modal = screen.getByTestId('map-container').closest('.relative');
      if (modal) {
        fireEvent.mouseDown(modal);
      }
      
      // Wait a bit to ensure no call is made
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should set body overflow to hidden when modal is open', () => {
      render(<MapModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body overflow when modal is closed', () => {
      const { rerender } = render(<MapModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<MapModal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive modal classes', () => {
      render(<MapModal {...defaultProps} />);
      const modal = screen.getByTestId('map-container').closest('.relative');
      
      expect(modal).toHaveClass('w-full', 'h-full');
      expect(modal).toHaveClass('sm:w-11/12', 'sm:h-5/6');
      expect(modal).toHaveClass('sm:max-w-4xl', 'sm:rounded-lg');
    });

    it('should have responsive header layout', () => {
      render(<MapModal {...defaultProps} />);
      // Get the header element by finding the first occurrence in the header section
      const headers = screen.getAllByText('Test Eczanesi');
      const headerElement = headers[0]; // First one should be in the header
      const header = headerElement.closest('.flex');
      
      expect(header).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('should have responsive footer layout', () => {
      render(<MapModal {...defaultProps} />);
      const footer = screen.getByText('📍 Test Mahallesi, Test Sokak No:1').closest('.flex');
      
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('flex-col', 'sm:flex-row');
      expect(footer).toHaveClass('sm:items-center', 'sm:justify-between');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label for close button', () => {
      render(<MapModal {...defaultProps} />);
      const closeButton = screen.getByLabelText('Haritayı kapat');
      expect(closeButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const onClose = jest.fn();
      render(<MapModal {...defaultProps} onClose={onClose} />);
      
      // Test escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should have proper focus management', () => {
      render(<MapModal {...defaultProps} />);
      const closeButton = screen.getByLabelText('Haritayı kapat');
      
      // Close button should be focusable
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing pharmacy data gracefully', () => {
      const incompletePharmacy = {
        ...mockPharmacy,
        pharmacy: '',
        address: '',
      };
      
      expect(() => {
        render(<MapModal {...defaultProps} pharmacy={incompletePharmacy} />);
      }).not.toThrow();
    });

    it('should handle invalid coordinates gracefully', () => {
      const invalidPharmacy = {
        ...mockPharmacy,
        lat: NaN,
        lng: NaN,
      };
      
      expect(() => {
        render(<MapModal {...defaultProps} pharmacy={invalidPharmacy} />);
      }).not.toThrow();
    });

    it('should handle zero distance correctly', () => {
      const zeroDistancePharmacy = {
        ...mockPharmacy,
        distance: 0,
      };
      
      render(<MapModal {...defaultProps} pharmacy={zeroDistancePharmacy} />);
      expect(screen.queryByText('0.0 km uzaklıkta')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not render map components when modal is closed', () => {
      render(<MapModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tile-layer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
    });

    it('should clean up event listeners when unmounted', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = render(<MapModal {...defaultProps} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });
});