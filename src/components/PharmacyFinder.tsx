'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserLocation, PharmacyWithDistance, NearbyPharmaciesResponse, PharmaciesResponse, CitiesResponse, DistrictsResponse } from '@/types';
import LocationPermission from './LocationPermission';
import CityDistrictSelector from './CityDistrictSelector';
import PharmacyCard from './PharmacyCard';
import LoadingSpinner from './LoadingSpinner';
import MapModal from './MapModal';

interface SavedPharmacy {
  pharmacy: PharmacyWithDistance;
  savedAt: number;
}

type LocationMode = 'initial' | 'requesting' | 'gps' | 'manual' | 'results';
type SearchMode = 'gps' | 'manual';
type Country = 'turkey' | 'cyprus';

export default function PharmacyFinder() {
  const [locationMode, setLocationMode] = useState<LocationMode>('initial');
  const [searchMode, setSearchMode] = useState<SearchMode>('gps');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyWithDistance | null>(null);
  const [savedPharmacies, setSavedPharmacies] = useState<SavedPharmacy[]>([]);

  const [allPharmacies, setAllPharmacies] = useState<PharmacyWithDistance[]>([]);

  // Header dropdown states
  const [selectedCountry, setSelectedCountry] = useState<Country>('turkey');
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [headerCity, setHeaderCity] = useState<string>('');
  const [headerDistrict, setHeaderDistrict] = useState<string>('');
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  // Load saved pharmacies from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedPharmacies');
    if (saved) {
      const parsed: SavedPharmacy[] = JSON.parse(saved);
      // Filter out expired entries (older than 24 hours)
      const now = Date.now();
      const valid = parsed.filter(item => now - item.savedAt < 24 * 60 * 60 * 1000);
      setSavedPharmacies(valid);
      localStorage.setItem('savedPharmacies', JSON.stringify(valid));
    }
  }, []);

  // Load cities on mount
  useEffect(() => {
    loadCities();
  }, []);

  // Load districts when headerCity changes
  useEffect(() => {
    if (headerCity) {
      loadDistricts(headerCity);
      setHeaderDistrict('');
    } else {
      setDistricts([]);
    }
  }, [headerCity]);

  const loadCities = async () => {
    try {
      setIsLoadingCities(true);
      const response = await fetch('/api/cities');
      const data: CitiesResponse = await response.json();
      if (data.success && data.data) {
        setCities(data.data);
      }
    } catch (err) {
      console.error('Error loading cities:', err);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const loadDistricts = async (city: string) => {
    try {
      setIsLoadingDistricts(true);
      const response = await fetch(`/api/districts?city=${encodeURIComponent(city)}`);
      const data: DistrictsResponse = await response.json();
      if (data.success && data.data) {
        setDistricts(data.data);
      }
    } catch (err) {
      console.error('Error loading districts:', err);
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  const handleHeaderSearch = () => {
    if (headerCity && headerDistrict) {
      handleManualSelection(headerCity.toLowerCase(), headerDistrict);
    }
  };

  // Save pharmacy function
  const handleSavePharmacy = (pharmacy: PharmacyWithDistance) => {
    setSavedPharmacies(prev => {
      const exists = prev.find(item => item.pharmacy.id === pharmacy.id);
      let updated: SavedPharmacy[];
      if (exists) {
        // Remove if already saved
        updated = prev.filter(item => item.pharmacy.id !== pharmacy.id);
      } else {
        // Add new
        updated = [...prev, { pharmacy, savedAt: Date.now() }];
      }
      localStorage.setItem('savedPharmacies', JSON.stringify(updated));
      return updated;
    });
  };

  // Check if pharmacy is saved
  const isPharmacySaved = (pharmacyId: string) => {
    return savedPharmacies.some(item => item.pharmacy.id === pharmacyId);
  };

  // Handle successful location permission
  const handleLocationGranted = async (location: UserLocation) => {
    console.log('Location granted:', location);
    setUserLocation(location);
    setLocationMode('gps');
    setSearchMode('gps');

    // Ensure state is updated before making API call
    setTimeout(async () => {
      await findNearestPharmacy(location);
    }, 100);
  };

  // Handle location permission denied or unavailable
  const handleLocationDenied = () => {
    setLocationMode('manual');
    setSearchMode('manual');
    setUserLocation(null);
  };

  // Find nearby pharmacies using GPS coordinates
  const findNearestPharmacy = async (location: UserLocation) => {
    console.log('findNearestPharmacy called with location:', location);
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = `/api/nearby?lat=${location.lat}&lng=${location.lng}&limit=5`;
      console.log('Making API request to:', apiUrl);

      const response = await fetch(apiUrl);
      console.log('API response status:', response.status);

      const data: NearbyPharmaciesResponse = await response.json();
      console.log('API response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.success && data.data && data.data.length > 0) {
        console.log('Found pharmacies:', data.data.length);
        const pharmaciesData = data.data; // Store data to avoid undefined access in setTimeout
        setAllPharmacies(pharmaciesData); // Store all pharmacies for filtering
        setPharmacies(pharmaciesData);
        setLocationMode('results');

        // Ensure userLocation is set before opening map
        setUserLocation(location);

        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          setSelectedPharmacy(pharmaciesData[0]); // First pharmacy is the closest
          setIsMapOpen(true);
          console.log('Map should open now with userLocation:', location);
        }, 100);
      } else {
        throw new Error(data.error || 'No nearby pharmacies found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find nearby pharmacies';
      setError(errorMessage);
      console.error('Error finding nearby pharmacies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual city/district selection
  const handleManualSelection = async (city: string, district: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedCity(city);
      setSelectedDistrict(district);

      const response = await fetch(
        `/api/pharmacies?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`
      );

      const data: PharmaciesResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.success && data.data) {
        // Convert Pharmacy[] to PharmacyWithDistance[] (distance will be 0 for manual selection)
        const pharmaciesWithDistance: PharmacyWithDistance[] = data.data.map(pharmacy => ({
          ...pharmacy,
          distance: 0 // No distance calculation for manual selection
        }));

        setPharmacies(pharmaciesWithDistance);
        setLocationMode('results');
      } else {
        throw new Error(data.error || 'No pharmacies found in the selected area');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find pharmacies';
      setError(errorMessage);
      console.error('Error finding pharmacies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to initial state
  const handleStartOver = () => {
    setLocationMode('initial');
    setSearchMode('gps');
    setUserLocation(null);
    setPharmacies([]);
    setError(null);
    setSelectedCity('');
    setSelectedDistrict('');
    setIsMapOpen(false);
    setSelectedPharmacy(null);
  };

  // Handle GPS mode selection - directly request location
  const handleSelectGPS = async () => {
    console.log('GPS button clicked!');
    setSearchMode('gps');
    setError(null);
    setIsLoading(true);

    // Check HTTPS requirement for mobile
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError('Konum servisi için güvenli bağlantı (HTTPS) gereklidir. Lütfen sayfayı yenileyin.');
      setIsLoading(false);
      return;
    }

    try {
      if (!navigator.geolocation) {
        setError('Bu tarayıcı konum servisini desteklemiyor');
        setIsLoading(false);
        return;
      }

      // Geolocation options
      const options: PositionOptions = {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      };

      // Get position
      const getPosition = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
      };

      const position = await getPosition();

      const location: UserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      };

      // Directly call findNearestPharmacy
      setUserLocation(location);
      console.log('About to call findNearestPharmacy with:', location);
      await findNearestPharmacy(location);

    } catch (error: unknown) {
      console.error('Error in handleSelectGPS:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', JSON.stringify(error));
      setIsLoading(false);

      let errorMessage = 'Konumunuz alınamadı';

      // Check if it's a GeolocationPositionError
      if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'number') {
        console.log('Geolocation error code:', error.code);
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Konum erişimi reddedildi. Lütfen tarayıcı ayarlarından konum iznini etkinleştirin.';
            break;
          case 2: // POSITION_UNAVAILABLE
            // In development, use a test location (Istanbul center)
            if (process.env.NODE_ENV === 'development') {
              console.log('Using test location for development');
              const testLocation: UserLocation = {
                lat: 41.0082,
                lng: 28.9784,
                accuracy: 100,
                timestamp: Date.now()
              };
              setUserLocation(testLocation);
              await findNearestPharmacy(testLocation);
              return; // Exit early, don't show error
            }
            errorMessage = 'Konum bilgisi mevcut değil. Geliştirme ortamında GPS çalışmayabilir. Manuel olarak il/ilçe seçin veya farklı bir tarayıcı deneyin.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Konum isteği zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.';
            break;
          default:
            errorMessage = `Konum hatası (kod: ${error.code}). Lütfen tekrar deneyin.`;
            break;
        }
      } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        console.log('Error message:', error.message);
        errorMessage = `Konum hatası: ${error.message}`;
        if (error.message.includes('secure')) {
          errorMessage = 'Konum servisi için güvenli bağlantı gereklidir. Lütfen HTTPS kullanın.';
        }
      } else {
        // Fallback for unknown error types
        console.log('Unknown error type, using fallback message');
        errorMessage = 'Konum alınırken bir hata oluştu. Lütfen sayfayı yenileyin veya manuel olarak il/ilçe seçin.';
      }

      setError(errorMessage);
    }
  };

  // Handle manual mode selection
  const handleSelectManual = () => {
    console.log('Manual button clicked!');
    setLocationMode('manual');
    setSearchMode('manual');
    setError(null);
  };

  // Switch between GPS and manual mode
  const handleSwitchMode = async () => {
    if (searchMode === 'gps') {
      setLocationMode('manual');
      setSearchMode('manual');
      setPharmacies([]);
      setError(null);
    } else {
      // When switching from manual to GPS, directly request location and show map
      setPharmacies([]);
      setError(null);
      await handleSelectGPS();
    }
  };

  // Handle showing pharmacy on map
  const handleShowMap = (pharmacy: PharmacyWithDistance) => {
    console.log('Opening map for pharmacy:', pharmacy.pharmacy);
    setSelectedPharmacy(pharmacy);
    setIsMapOpen(true);
  };

  // Handle closing map modal
  const handleCloseMap = () => {
    setIsMapOpen(false);
    // Don't reset selectedPharmacy so we can reopen the map
  };



  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {locationMode === 'initial' && (
          <div className="mb-8">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
              {/* Title */}
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Nöbetçi Eczane Bulucu
                </h1>
              </div>

              {/* Version and Coffee Button - Mobile: Center, Desktop: Right */}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 sm:flex-shrink-0">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  v1.0.0
                </span>
                <a
                  href="https://coff.ee/sametirkoren"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  ☕ Kahve Ismarla
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center px-6 py-3 font-semibold leading-6 text-sm shadow-lg rounded-lg text-white bg-blue-600">
              <LoadingSpinner
                size="md"
                color="white"
                text={searchMode === 'gps' ? 'En yakın eczane aranıyor...' : 'Eczaneler yükleniyor...'}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !isLoading && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <div className="text-red-400 mr-3 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  {searchMode === 'gps' ? 'Konum Arama Hatası' : 'Manuel Arama Hatası'}
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      if (searchMode === 'gps') {
                        handleSelectGPS(); // Use the same GPS function that requests location
                      } else if (searchMode === 'manual' && selectedCity && selectedDistrict) {
                        handleManualSelection(selectedCity, selectedDistrict);
                      }
                    }}
                    className="text-sm bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-800 px-4 py-2 rounded-md transition-all duration-200 touch-manipulation min-h-[44px] flex items-center justify-center"
                  >
                    Tekrar Dene
                  </button>
                  <button
                    onClick={handleSwitchMode}
                    className="text-sm bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-all duration-200 touch-manipulation min-h-[44px] flex items-center justify-center"
                  >
                    {searchMode === 'gps' ? 'Konumu Manuel Seç' : 'GPS Konumu Kullan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && (
          <>
            {/* Initial Selection Screen */}
            {locationMode === 'initial' && (
              <div className="max-w-3xl mx-auto">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-3xl p-8 sm:p-12 mb-8 text-center shadow-xl border border-blue-100">
                  <div className="mb-8">
                    <div className="relative inline-block">
                      <Image
                        src="/pharmacy-marker.png"
                        alt="Nöbetçi Eczane"
                        width={128}
                        height={128}
                        className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 drop-shadow-lg"
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                      Yakındaki Nöbetçi Eczaneleri Bul
                    </h2>
                    <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                      Konumunuzu kullanarak size en yakın eczaneleri bulabilir veya il/ilçe seçerek arama yapabilirsiniz.
                    </p>
                  </div>

                  {/* Feature Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-100 shadow-sm">
                      <div className="text-green-600 mb-3">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm mb-1">Hızlı Sonuç</h3>
                      <p className="text-xs text-gray-600">Saniyeler içinde en yakın eczaneleri bulun</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100 shadow-sm">
                      <div className="text-blue-600 mb-3">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm mb-1">7/24 Güncel</h3>
                      <p className="text-xs text-gray-600">Her zaman güncel nöbetçi bilgileri</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
                      <div className="text-purple-600 mb-3">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm mb-1">Harita Desteği</h3>
                      <p className="text-xs text-gray-600">İnteraktif harita ile kolay navigasyon</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
                  <div className="space-y-4">
                    {/* GPS Location Button */}
                    <button
                      onClick={() => {
                        console.log('GPS button clicked directly!');
                        handleSelectGPS();
                      }}
                      className="w-full p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white rounded-xl transition-all duration-300 touch-manipulation min-h-[80px] flex items-center justify-center group shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <div className="flex items-center">
                        <div className="bg-white/20 rounded-full p-3 mr-4 group-hover:scale-110 transition-transform">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="text-xl font-bold mb-1">Konumumu Kullan</div>
                          <div className="text-sm text-blue-100 opacity-90">Hızlı ve kolay - size en yakın eczaneleri bulur</div>
                        </div>
                      </div>
                    </button>

                    {/* Manual Selection Button */}
                    <button
                      onClick={handleSelectManual}
                      className="w-full p-6 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 active:from-gray-300 active:to-gray-400 text-gray-800 rounded-xl transition-all duration-300 touch-manipulation min-h-[80px] flex items-center justify-center group shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    >
                      <div className="flex items-center">
                        <div className="bg-gray-300/50 rounded-full p-3 mr-4 group-hover:scale-110 transition-transform">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-2 4h2M7 7h.01M7 11h.01M7 15h.01" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="text-xl font-bold mb-1">İl / İlçe Seç</div>
                          <div className="text-sm text-gray-600 opacity-90">Manuel olarak bölge seçerek arama yapın</div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Trust Indicators */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span>Anlık Veriler</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Güvenli</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>Mobil Uyumlu</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Location Permission Request */}
            {locationMode === 'requesting' && (
              <LocationPermission
                onLocationGranted={handleLocationGranted}
                onLocationDenied={handleLocationDenied}
              />
            )}

            {/* Manual City/District Selection */}
            {locationMode === 'manual' && (
              <div>
                <CityDistrictSelector onSelectionComplete={handleManualSelection} />
                <div className="text-center mt-4">
                  <button
                    onClick={handleSwitchMode}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Bunun yerine GPS konumu kullan
                  </button>
                </div>
              </div>
            )}

            {/* GPS Mode - Show location granted state */}
            {locationMode === 'gps' && pharmacies.length === 0 && !error && (
              <div className="text-center">
                <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
                  <div className="text-green-600 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Konum Erişimi Verildi
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    Sizin için en yakın nöbetçi eczaneyi buluyoruz.
                  </p>
                  <button
                    onClick={handleSwitchMode}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Bunun yerine konumu manuel seç
                  </button>
                </div>
              </div>
            )}

            {/* Results Display */}
            {locationMode === 'results' && pharmacies.length > 0 && (
              <div>
                {/* Header with Logo and Dropdowns */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 shadow-lg">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-white">PharmacyFinder</h1>
                        <p className="text-xs text-blue-200">ON-DUTY • 24/7 ACCESS</p>
                      </div>
                    </div>

                    {/* Dropdowns */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Country Selector */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedCountry('turkey'); setHeaderCity(''); }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCountry === 'turkey' ? 'bg-white text-blue-600' : 'bg-blue-500/30 text-white hover:bg-blue-500/50'}`}
                        >
                          🇹🇷 Türkiye
                        </button>
                        <button
                          onClick={() => { setSelectedCountry('cyprus'); setHeaderCity('kibris'); }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCountry === 'cyprus' ? 'bg-white text-blue-600' : 'bg-blue-500/30 text-white hover:bg-blue-500/50'}`}
                        >
                          🇨🇾 Kıbrıs
                        </button>
                      </div>

                      {/* City Dropdown - Only for Turkey */}
                      {selectedCountry === 'turkey' && (
                        <select
                          value={headerCity}
                          onChange={(e) => setHeaderCity(e.target.value)}
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[140px]"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="" className="text-gray-900">🏛️ İl Seçin</option>
                          {cities.filter(c => c !== 'kibris').map(city => (
                            <option key={city} value={city} className="text-gray-900">{city}</option>
                          ))}
                        </select>
                      )}

                      {/* District Dropdown */}
                      <select
                        value={headerDistrict}
                        onChange={(e) => setHeaderDistrict(e.target.value)}
                        disabled={!headerCity}
                        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[140px] disabled:opacity-50"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="" className="text-gray-900">📍 İlçe Seçin</option>
                        {districts.map(district => (
                          <option key={district} value={district} className="text-gray-900">{district}</option>
                        ))}
                      </select>

                      {/* Search Button */}
                      <button
                        onClick={handleHeaderSearch}
                        disabled={!headerCity || !headerDistrict}
                        className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Ara
                      </button>
                    </div>
                  </div>

                  {/* Current Location Info */}
                  <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-blue-100">
                      {searchMode === 'gps' 
                        ? '📍 Mevcut konumunuza göre' 
                        : `📍 ${selectedDistrict}, ${selectedCity} bölgesinde`
                      }
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleStartOver}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-all"
                      >
                        Baştan Başla
                      </button>
                      <button
                        onClick={() => {
                          if (pharmacies.length > 0) {
                            setSelectedPharmacy(pharmacies[0]);
                            setIsMapOpen(true);
                          }
                        }}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Haritada Göster
                      </button>
                    </div>
                  </div>
                </div>

                {/* Saved Pharmacies Section */}
                {savedPharmacies.length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        Kaydedilenler ({savedPharmacies.length})
                      </h3>
                      <span className="text-xs text-green-600">24 saat saklanır</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {savedPharmacies.map(item => (
                        <div 
                          key={item.pharmacy.id} 
                          className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-green-200 text-sm"
                        >
                          <span className="font-medium text-gray-800">{item.pharmacy.pharmacy}</span>
                          <button
                            onClick={() => handleSavePharmacy(item.pharmacy)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Kaldır"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pharmacy Cards */}
                <div className="space-y-4">
                  {pharmacies.map((pharmacy) => (
                    <PharmacyCard
                      key={pharmacy.id}
                      pharmacy={pharmacy}
                      onShowMap={() => handleShowMap(pharmacy)}
                      onSave={handleSavePharmacy}
                      isSaved={isPharmacySaved(pharmacy.id)}
                    />
                  ))}
                </div>

                {/* Results Footer */}
                {pharmacies.length > 1 && (
                  <div className="mt-6 text-center text-sm text-gray-500">
                    <p>{pharmacies.length} nöbetçi eczane gösteriliyor</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Privacy Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            🔒 Gizliliğiniz korunmaktadır. Konum verileriniz saklanmaz ve sadece yakındaki eczaneleri bulmak için kullanılır.
          </p>
        </div>
      </div>

      {/* Map Modal */}
      {selectedPharmacy && (
        <MapModal
          isOpen={isMapOpen}
          onClose={handleCloseMap}
          userLocation={userLocation}
          pharmacies={pharmacies}
          selectedPharmacy={selectedPharmacy}
        />
      )}


    </div>
  );
}