import { Pharmacy } from '../types';

export const mockPharmacyData: Pharmacy[] = [
  {
    id: '1',
    city: 'Istanbul',
    district: 'Kadikoy',
    pharmacy: 'Kadikoy Merkez Eczanesi',
    address: 'Bahariye Cad. No:15 Kadikoy',
    phone: '+90 216 336 1234',
    date: '2025-01-20',
    lat: 40.9833,
    lng: 29.0167,
  },
  {
    id: '2',
    city: 'Istanbul',
    district: 'Besiktas',
    pharmacy: 'Besiktas Acibadem Eczanesi',
    address: 'Barbaros Bulvari No:23 Besiktas',
    phone: '+90 212 227 5678',
    date: '2025-01-20',
    lat: 41.0422,
    lng: 29.0094,
  },
  {
    id: '3',
    city: 'Istanbul',
    district: 'Sisli',
    pharmacy: 'Sisli Merkez Eczanesi',
    address: 'Halaskargazi Cad. No:45 Sisli',
    phone: '+90 212 296 9012',
    date: '2025-01-20',
    lat: 41.0608,
    lng: 28.9768,
  },
  {
    id: '4',
    city: 'Ankara',
    district: 'Cankaya',
    pharmacy: 'Cankaya Saglik Eczanesi',
    address: 'Ataturk Bulvari No:67 Cankaya',
    phone: '+90 312 468 3456',
    date: '2025-01-20',
    lat: 39.9208,
    lng: 32.8541,
  },
  {
    id: '5',
    city: 'Ankara',
    district: 'Kecioren',
    pharmacy: 'Kecioren Aile Eczanesi',
    address: 'Etlik Cad. No:89 Kecioren',
    phone: '+90 312 321 7890',
    date: '2025-01-20',
    lat: 39.9697,
    lng: 32.8156,
  },
  {
    id: '6',
    city: 'Izmir',
    district: 'Konak',
    pharmacy: 'Konak Deniz Eczanesi',
    address: 'Cumhuriyet Bulvari No:12 Konak',
    phone: '+90 232 484 2345',
    date: '2025-01-20',
    lat: 38.4237,
    lng: 27.1428,
  },
];

export const mockCities = ['Istanbul', 'Ankara', 'Izmir'];

export const mockDistrictsByCity = {
  Istanbul: ['Kadikoy', 'Besiktas', 'Sisli'],
  Ankara: ['Cankaya', 'Kecioren'],
  Izmir: ['Konak'],
};

export const mockPharmaciesByArea = {
  'Istanbul-Kadikoy': [mockPharmacyData[0]],
  'Istanbul-Besiktas': [mockPharmacyData[1]],
  'Istanbul-Sisli': [mockPharmacyData[2]],
  'Ankara-Cankaya': [mockPharmacyData[3]],
  'Ankara-Kecioren': [mockPharmacyData[4]],
  'Izmir-Konak': [mockPharmacyData[5]],
};

// Helper function to get test data for specific area
export const getTestPharmaciesForArea = (city: string, district: string): Pharmacy[] => {
  const key = `${city}-${district}`;
  return mockPharmaciesByArea[key as keyof typeof mockPharmaciesByArea] || [];
};

// Helper function to get test cities
export const getTestCities = (): string[] => {
  return [...mockCities];
};

// Helper function to get test districts for city
export const getTestDistrictsForCity = (city: string): string[] => {
  return mockDistrictsByCity[city as keyof typeof mockDistrictsByCity] || [];
};

// Test coordinates for distance calculations
export const testCoordinates = {
  istanbul: { lat: 41.0082, lng: 28.9784 },
  ankara: { lat: 39.9334, lng: 32.8597 },
  izmir: { lat: 38.4192, lng: 27.1287 },
  kadikoy: { lat: 40.9833, lng: 29.0167 },
  besiktas: { lat: 41.0422, lng: 29.0094 },
  sisli: { lat: 41.0608, lng: 28.9768 },
};

// Expected distances (approximate) for testing
export const expectedDistances = {
  istanbulToKadikoy: 7.2,
  istanbulToBesiktas: 3.8,
  istanbulToSisli: 6.1,
  ankaraToIstanbul: 350.0,
  izmirToIstanbul: 330.0,
};