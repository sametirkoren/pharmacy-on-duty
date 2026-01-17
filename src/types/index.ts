// Core Pharmacy interface with all required fields
export interface Pharmacy {
  id: string;           // UUID primary key
  city: string;         // City name
  district: string;     // District name
  pharmacy: string;     // Pharmacy name
  address: string;      // Full address
  phone: string;        // Contact phone number
  date: string;         // On-duty date (YYYY-MM-DD)
  lat: number;          // Latitude coordinate
  lng: number;          // Longitude coordinate
}

// User location interface for geolocation data
export interface UserLocation {
  lat: number;          // User latitude
  lng: number;          // User longitude
  accuracy?: number;    // Location accuracy in meters
  timestamp: number;    // When location was obtained
}

// Pharmacy with distance field extending base Pharmacy
export interface PharmacyWithDistance extends Pharmacy {
  distance: number;     // Distance in kilometers
}

// Generic API response interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Specific pharmacy response interface
export interface PharmacyResponse {
  success: boolean;
  data?: {
    id: string;
    pharmacy: string;
    address: string;
    phone: string;
    city: string;
    district: string;
    distance: number;
    lat: number;
    lng: number;
  };
  error?: string;
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  timestamp: string;
  details?: unknown;
}

// Additional response interfaces for API endpoints
export interface CitiesResponse {
  success: boolean;
  data?: string[];
  error?: string;
}

export interface DistrictsResponse {
  success: boolean;
  data?: string[];
  error?: string;
}

export interface PharmaciesResponse {
  success: boolean;
  data?: Pharmacy[];
  error?: string;
}

export interface NearbyPharmaciesResponse {
  success: boolean;
  data?: PharmacyWithDistance[];
  error?: string;
}