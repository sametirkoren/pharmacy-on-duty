import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PharmacyCard from '../PharmacyCard';
import { PharmacyWithDistance } from '../../types';

describe('PharmacyCard', () => {
  const mockPharmacy: PharmacyWithDistance = {
    id: '1',
    pharmacy: 'Test Pharmacy',
    address: '123 Test Street',
    phone: '05551234567',
    city: 'Istanbul',
    district: 'Kadikoy',
    date: '2024-01-15',
    lat: 40.9833,
    lng: 29.0167,
    distance: 1.5,
  };

  it('renders pharmacy information correctly', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);

    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.getByText('Kadikoy, Istanbul')).toBeInTheDocument();
    expect(screen.getByText('0555 123 45 67')).toBeInTheDocument();
    expect(screen.getByText('On Duty Today')).toBeInTheDocument();
  });

  it('displays distance correctly in kilometers', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    expect(screen.getByText('1.5km')).toBeInTheDocument();
  });

  it('displays distance in meters when less than 1km', () => {
    const closePharmacy = { ...mockPharmacy, distance: 0.5 };
    render(<PharmacyCard pharmacy={closePharmacy} />);
    expect(screen.getByText('500m')).toBeInTheDocument();
  });

  it('displays very close distance in meters correctly', () => {
    const veryClosePharmacy = { ...mockPharmacy, distance: 0.123 };
    render(<PharmacyCard pharmacy={veryClosePharmacy} />);
    expect(screen.getByText('123m')).toBeInTheDocument();
  });

  it('formats Turkish phone numbers correctly', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    expect(screen.getByText('0555 123 45 67')).toBeInTheDocument();
  });

  it('handles unformatted phone numbers', () => {
    const pharmacyWithUnformattedPhone = {
      ...mockPharmacy,
      phone: '555-123-4567',
    };
    render(<PharmacyCard pharmacy={pharmacyWithUnformattedPhone} />);
    expect(screen.getByText('555-123-4567')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    
    const phoneButton = screen.getByRole('button', { name: /call test pharmacy/i });
    expect(phoneButton).toHaveAttribute('aria-label', 'Call Test Pharmacy');
  });

  it('displays hover effects on card', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    
    // Get the main card container (outermost div)
    const card = screen.getByText('Test Pharmacy').closest('.bg-white');
    expect(card).toHaveClass('hover:shadow-lg');
  });

  it('has responsive design classes', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    
    // Check for responsive padding on main card
    const card = screen.getByText('Test Pharmacy').closest('.bg-white');
    expect(card).toHaveClass('p-4', 'sm:p-6');

    // Check for responsive flex layout on header
    const header = screen.getByText('Test Pharmacy').parentElement;
    expect(header).toHaveClass('flex', 'flex-col', 'sm:flex-row');
  });

  it('displays on-duty indicator with animation', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    
    const indicator = screen.getByText('On Duty Today').previousElementSibling;
    expect(indicator).toHaveClass('animate-pulse');
  });

  it('handles long pharmacy names gracefully', () => {
    const pharmacyWithLongName = {
      ...mockPharmacy,
      pharmacy: 'Very Long Pharmacy Name That Should Wrap Properly On Mobile Devices',
    };
    render(<PharmacyCard pharmacy={pharmacyWithLongName} />);
    
    const nameElement = screen.getByText('Very Long Pharmacy Name That Should Wrap Properly On Mobile Devices');
    expect(nameElement).toHaveClass('leading-tight');
  });

  it('handles long addresses gracefully', () => {
    const pharmacyWithLongAddress = {
      ...mockPharmacy,
      address: 'Very Long Address That Should Display Properly Across Multiple Lines When Needed',
    };
    render(<PharmacyCard pharmacy={pharmacyWithLongAddress} />);
    
    expect(screen.getByText('Very Long Address That Should Display Properly Across Multiple Lines When Needed')).toBeInTheDocument();
  });

  it('displays all required fields', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    
    // Check all required fields are present
    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument(); // name
    expect(screen.getByText('123 Test Street')).toBeInTheDocument(); // address
    expect(screen.getByText('0555 123 45 67')).toBeInTheDocument(); // phone
    expect(screen.getByText('Kadikoy, Istanbul')).toBeInTheDocument(); // district and city
    expect(screen.getByText('1.5km')).toBeInTheDocument(); // distance
  });

  it('has proper button styling and interactions', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    
    const phoneButton = screen.getByRole('button', { name: /call test pharmacy/i });
    expect(phoneButton).toHaveClass(
      'bg-green-600',
      'hover:bg-green-700',
      'focus:ring-green-500',
      'transition-colors'
    );
  });

  it('displays SVG elements correctly', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    
    // Check for SVG elements by looking for specific paths
    const container = screen.getByText('Test Pharmacy').closest('.bg-white');
    const svgElements = container?.querySelectorAll('svg');
    expect(svgElements?.length).toBeGreaterThanOrEqual(2); // At least location and phone icons
  });

  it('formats distance with proper precision', () => {
    const pharmacyWithPreciseDistance = { ...mockPharmacy, distance: 2.456 };
    render(<PharmacyCard pharmacy={pharmacyWithPreciseDistance} />);
    expect(screen.getByText('2.5km')).toBeInTheDocument(); // Should round to 1 decimal place
  });

  it('handles zero distance correctly', () => {
    const pharmacyAtSameLocation = { ...mockPharmacy, distance: 0 };
    render(<PharmacyCard pharmacy={pharmacyAtSameLocation} />);
    expect(screen.getByText('0m')).toBeInTheDocument();
  });

  it('renders phone button with correct text', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    
    const phoneButton = screen.getByRole('button', { name: /call test pharmacy/i });
    expect(phoneButton).toHaveTextContent('0555 123 45 67');
  });

  it('has proper card structure and styling', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    
    const card = screen.getByText('Test Pharmacy').closest('.bg-white');
    expect(card).toHaveClass(
      'bg-white',
      'rounded-lg',
      'shadow-md',
      'border',
      'border-gray-200',
      'mb-4',
      'transition-shadow'
    );
  });

  it('displays distance badge with proper styling', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />);
    
    const distanceBadge = screen.getByText('1.5km').closest('span');
    expect(distanceBadge).toHaveClass(
      'inline-flex',
      'items-center',
      'px-2.5',
      'py-0.5',
      'rounded-full',
      'text-xs',
      'font-medium',
      'bg-blue-100',
      'text-blue-800'
    );
  });
});