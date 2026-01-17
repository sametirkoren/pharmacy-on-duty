import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CityDistrictSelector from '../CityDistrictSelector';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CityDistrictSelector', () => {
  const mockOnSelectionComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  const renderComponent = () => {
    return render(
      <CityDistrictSelector onSelectionComplete={mockOnSelectionComplete} />
    );
  };

  describe('Initial Render', () => {
    it('should render the location selection UI', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: ['Istanbul', 'Ankara', 'Izmir']
        })
      });

      renderComponent();
      
      expect(screen.getByText('Select Your Location')).toBeInTheDocument();
      expect(screen.getByText(/Choose your city and district to find nearby on-duty pharmacies/)).toBeInTheDocument();
      expect(screen.getByLabelText('City')).toBeInTheDocument();
      expect(screen.getByLabelText('District')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Find Pharmacies/i })).toBeInTheDocument();
    });

    it('should load cities on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: ['Istanbul', 'Ankara', 'Izmir']
        })
      });

      renderComponent();

      expect(mockFetch).toHaveBeenCalledWith('/api/cities');
      
      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
        expect(screen.getByText('Ankara')).toBeInTheDocument();
        expect(screen.getByText('Izmir')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching cities', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderComponent();
      
      expect(screen.getByText('Loading cities...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Loading cities...')).toBeDisabled();
    });
  });

  describe('City Selection', () => {
    it('should enable district dropdown after city selection', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Istanbul', 'Ankara', 'Izmir']
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Kadikoy', 'Besiktas', 'Sisli']
          })
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      const citySelect = screen.getByLabelText('City');
      const districtSelect = screen.getByLabelText('District');

      // Initially district should be disabled
      expect(districtSelect).toBeDisabled();
      expect(screen.getByDisplayValue('Select a city first')).toBeInTheDocument();

      // Select a city
      fireEvent.change(citySelect, { target: { value: 'Istanbul' } });

      // District should now be enabled and loading
      await waitFor(() => {
        expect(districtSelect).not.toBeDisabled();
      });
    });

    it('should load districts when city is selected', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Istanbul', 'Ankara', 'Izmir']
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Kadikoy', 'Besiktas', 'Sisli']
          })
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      const citySelect = screen.getByLabelText('City');
      fireEvent.change(citySelect, { target: { value: 'Istanbul' } });

      expect(mockFetch).toHaveBeenCalledWith('/api/districts?city=Istanbul');

      await waitFor(() => {
        expect(screen.getByText('Kadikoy')).toBeInTheDocument();
        expect(screen.getByText('Besiktas')).toBeInTheDocument();
        expect(screen.getByText('Sisli')).toBeInTheDocument();
      });
    });

    it('should reset district selection when city changes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Istanbul', 'Ankara']
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Kadikoy', 'Besiktas']
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Cankaya', 'Kecioren']
          })
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      const citySelect = screen.getByLabelText('City');
      const districtSelect = screen.getByLabelText('District');

      // Select Istanbul
      fireEvent.change(citySelect, { target: { value: 'Istanbul' } });

      await waitFor(() => {
        expect(screen.getByText('Kadikoy')).toBeInTheDocument();
      });

      // Select a district
      fireEvent.change(districtSelect, { target: { value: 'Kadikoy' } });
      expect(districtSelect).toHaveValue('Kadikoy');

      // Change city to Ankara
      fireEvent.change(citySelect, { target: { value: 'Ankara' } });

      // District should be reset
      await waitFor(() => {
        expect(districtSelect).toHaveValue('');
      });
    });
  });

  describe('Form Submission', () => {

    it('should call onSelectionComplete with selected city and district', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Istanbul']
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Kadikoy']
          })
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      const citySelect = screen.getByLabelText('City');
      const districtSelect = screen.getByLabelText('District');
      const submitButton = screen.getByRole('button', { name: /Find Pharmacies/i });

      // Initially submit button should be disabled
      expect(submitButton).toBeDisabled();

      // Select city
      fireEvent.change(citySelect, { target: { value: 'Istanbul' } });

      await waitFor(() => {
        expect(screen.getByText('Kadikoy')).toBeInTheDocument();
      });

      // Select district
      fireEvent.change(districtSelect, { target: { value: 'Kadikoy' } });

      // Submit button should now be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Submit form
      fireEvent.click(submitButton);

      expect(mockOnSelectionComplete).toHaveBeenCalledWith('Istanbul', 'Kadikoy');
    });

    it('should show error when submitting without selections', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: ['Istanbul']
        })
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      const form = screen.getByRole('button', { name: /Find Pharmacies/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Please select both city and district')).toBeInTheDocument();
      });

      expect(mockOnSelectionComplete).not.toHaveBeenCalled();
    });

    it('should prevent submission when only city is selected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: ['Istanbul']
        })
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      const citySelect = screen.getByLabelText('City');
      const submitButton = screen.getByRole('button', { name: /Find Pharmacies/i });

      fireEvent.change(citySelect, { target: { value: 'Istanbul' } });

      // Button should still be disabled
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle cities loading error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('should handle districts loading error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Istanbul']
          })
        })
        .mockRejectedValueOnce(new Error('Districts not found'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      const citySelect = screen.getByLabelText('City');
      fireEvent.change(citySelect, { target: { value: 'Istanbul' } });

      await waitFor(() => {
        expect(screen.getByText('Districts not found')).toBeInTheDocument();
      });
    });

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Server error'
        })
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should retry loading cities when try again is clicked', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Istanbul']
          })
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Try again');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading States', () => {
    it('should show loading state for districts', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: ['Istanbul']
          })
        });

      let resolveDistricts: (value: unknown) => void;
      const districtsPromise = new Promise((resolve) => {
        resolveDistricts = resolve;
      });

      mockFetch.mockImplementationOnce(() => districtsPromise);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Istanbul')).toBeInTheDocument();
      });

      const citySelect = screen.getByLabelText('City');
      fireEvent.change(citySelect, { target: { value: 'Istanbul' } });

      // Should show loading state
      expect(screen.getByText('Loading districts...')).toBeInTheDocument();

      // Resolve the promise
      resolveDistricts!({
        ok: true,
        json: async () => ({
          success: true,
          data: ['Kadikoy']
        })
      });

      await waitFor(() => {
        expect(screen.getByText('Kadikoy')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form elements', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: ['Istanbul']
        })
      });

      renderComponent();

      expect(screen.getByLabelText('City')).toBeInTheDocument();
      expect(screen.getByLabelText('District')).toBeInTheDocument();
    });

    it('should have required attributes on form elements', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: ['Istanbul']
        })
      });

      renderComponent();

      const citySelect = screen.getByLabelText('City');
      const districtSelect = screen.getByLabelText('District');

      expect(citySelect).toBeRequired();
      expect(districtSelect).toBeRequired();
    });
  });
});