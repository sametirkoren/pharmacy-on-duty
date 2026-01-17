import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-6', 'w-6', 'text-blue-600');
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('renders with custom color', () => {
    render(<LoadingSpinner color="green" />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('text-green-600');
  });

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading..." />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const container = screen.getByText('', { selector: '.custom-class' });
    expect(container).toBeInTheDocument();
  });

  it('renders in fullscreen mode', () => {
    render(<LoadingSpinner fullScreen={true} />);
    
    const fullscreenContainer = screen.getByText('', { 
      selector: '.fixed.inset-0.bg-white.bg-opacity-75' 
    });
    expect(fullscreenContainer).toBeInTheDocument();
  });

  it('renders with different size text when text is provided', () => {
    render(<LoadingSpinner size="xl" text="Loading..." />);
    
    const text = screen.getByText('Loading...');
    expect(text).toHaveClass('text-xl');
  });

  it('applies correct color to text', () => {
    render(<LoadingSpinner color="red" text="Error loading..." />);
    
    const text = screen.getByText('Error loading...');
    expect(text).toHaveClass('text-red-600');
  });

  it('has spinning animation', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('animate-spin');
  });
});