'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserLocation, PharmacyWithDistance, NearbyPharmaciesResponse, PharmaciesResponse } from '@/types';
import Sidebar from './Sidebar';
import MapView from './MapView';
import MobileView from './MobileView';

// Saved location type
interface SavedLocation {
  city: string;
  district: string;
  country?: string;
  timestamp: number;
}

// Saved pharmacy type - stores full data for navigation
interface SavedPharmacy {
  id: string;
  pharmacy: string;
  address: string;
  phone: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  savedAt: number;
}

interface MainLayoutProps {
  initialCity?: string;
  initialDistrict?: string;
}

export default function MainLayout({ initialCity, initialDistrict }: MainLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyWithDistance[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyWithDistance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPharmacies, setSavedPharmacies] = useState<SavedPharmacy[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'distance' | 'name'>('default');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeMode, setThemeMode] = useState<'auto' | 'dark' | 'light'>('light');
  const [isMobile, setIsMobile] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasSavedLocation, setHasSavedLocation] = useState(false);
  const [lastUpdateDate, setLastUpdateDate] = useState<string>('');
  const [locationAttempts, setLocationAttempts] = useState(0);
  const [locationError, setLocationError] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  // Fetch last update date from API
  useEffect(() => {
    const fetchLastUpdate = async () => {
      try {
        const res = await fetch('/api/last-update');
        const data = await res.json();
        if (data.success && data.data?.formattedDate) {
          setLastUpdateDate(data.data.formattedDate);
        }
      } catch (error) {
        console.error('Failed to fetch last update:', error);
      }
    };
    fetchLastUpdate();
  }, []);

  // Auto-fetch pharmacies when initialCity is provided (from URL like /ankara or /istanbul/bahcelievler)
  // This runs only once when mounted and initialCity exists
  const [initialCityFetched, setInitialCityFetched] = useState(false);
  
  useEffect(() => {
    if (!mounted || !initialCity || initialCityFetched) return;
    
    const fetchCityPharmacies = async () => {
      setIsLoading(true);
      setError(null);
      setSelectedCity(initialCity);
      if (initialDistrict) {
        setSelectedDistrict(initialDistrict);
      }
      try {
        // Build URL with optional district
        let url = `/api/pharmacies?city=${encodeURIComponent(initialCity)}`;
        if (initialDistrict) {
          url += `&district=${encodeURIComponent(initialDistrict)}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          setPharmacies(data.data);
          setSelectedPharmacy(data.data[0]);
          setInitialCityFetched(true);
        } else {
          const location = initialDistrict ? `${initialDistrict}, ${initialCity}` : initialCity;
          setError(`${location} için nöbetçi eczane bulunamadı`);
        }
      } catch (err) {
        console.error('Error fetching city pharmacies:', err);
        setError('Eczaneler yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCityPharmacies();
  }, [mounted, initialCity, initialDistrict, initialCityFetched]);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hydration fix - set mounted after first render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load saved pharmacies from localStorage on mount
  useEffect(() => {
    if (!mounted) return;
    const storedSavedPharmacies = localStorage.getItem('savedPharmacies');
    if (storedSavedPharmacies) {
      // Filter out expired entries (older than 24 hours)
      const parsed = JSON.parse(storedSavedPharmacies) as SavedPharmacy[];
      const now = Date.now();
      const valid = parsed.filter(p => now - p.savedAt < 24 * 60 * 60 * 1000);
      setSavedPharmacies(valid);
      if (valid.length !== parsed.length) {
        localStorage.setItem('savedPharmacies', JSON.stringify(valid));
      }
    }
    const savedThemeMode = localStorage.getItem('pharmacyThemeMode');
    if (savedThemeMode) {
      setThemeMode(savedThemeMode as 'auto' | 'dark' | 'light');
      if (savedThemeMode === 'auto') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemDark);
      } else {
        setIsDarkMode(savedThemeMode === 'dark');
      }
    } else {
      // Default to light mode for better usability
      setThemeMode('light');
      setIsDarkMode(false);
    }
    
    // Check if there's a saved location
    const savedLocation = localStorage.getItem('savedLocation');
    if (savedLocation) {
      setHasSavedLocation(true);
    }
  }, [mounted]);

  // Auto-request location on page load if permission was previously granted
  // Skip if initialCity is provided (user came from URL like /ankara)
  useEffect(() => {
    if (!mounted || initialCity) return;
    
    const savedLocation = localStorage.getItem('savedLocation');
    const hasAskedBefore = localStorage.getItem('locationPermissionAsked');
    
    if (hasAskedBefore && !savedLocation && !userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          setUserLocation(location);
          
          // Fetch nearby pharmacies only if no initialCity
          if (!initialCity) {
            setIsLoading(true);
            try {
              const response = await fetch(`/api/nearby?lat=${location.lat}&lng=${location.lng}&radius=50`);
              const data = await response.json();
              if (data.success && data.data) {
                setPharmacies(data.data);
                if (data.data.length > 0) {
                  setSelectedPharmacy(data.data[0]);
                }
              }
            } catch (err) {
              console.log('Auto fetch nearby failed:', err);
            } finally {
              setIsLoading(false);
            }
          }
        },
        (error) => {
          console.log('Auto location failed:', error.message);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, [mounted, userLocation, initialCity]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (!mounted || themeMode !== 'auto') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, themeMode]);

  // Toggle theme: auto -> dark -> light -> auto
  const handleToggleTheme = () => {
    let newMode: 'auto' | 'dark' | 'light';
    if (themeMode === 'auto') {
      newMode = 'dark';
      setIsDarkMode(true);
    } else if (themeMode === 'dark') {
      newMode = 'light';
      setIsDarkMode(false);
    } else {
      newMode = 'auto';
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemDark);
    }
    setThemeMode(newMode);
    localStorage.setItem('pharmacyThemeMode', newMode);
  };

  // Masaüstünde konum izni modalını göster (kayıtlı konum yoksa)
  useEffect(() => {
    if (!mounted) return;
    if (isMobile) return; // Mobilde MobileView kendi modalını gösteriyor
    
    const savedLocation = localStorage.getItem('savedLocation');
    
    // Kayıtlı konum yoksa ve konum hatası yoksa modal göster
    if (!savedLocation && !userLocation && !locationError) {
      const timer = setTimeout(() => {
        setShowLocationModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, mounted, userLocation, locationError]);

  const handleLocationPermission = () => {
    if (isRequestingLocation) return; // Prevent multiple requests
    
    if (navigator.geolocation) {
      setIsRequestingLocation(true);
      setError(null);
      
      // İlk olarak düşük doğruluk ile hızlı konum almayı dene
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Konum alındı:', position.coords);
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          setUserLocation(location);
          setShowLocationModal(false);
          setLocationAttempts(0);
          setLocationError(false);
          setIsRequestingLocation(false);
          localStorage.setItem('locationPermissionAsked', 'true');
          // Konum alındıktan sonra yakındaki eczaneleri getir
          fetchNearbyWithLocation(location.lat, location.lng);
        },
        (error) => {
          console.error('Konum hatası:', error.code, error.message);
          setIsRequestingLocation(false);
          localStorage.setItem('locationPermissionAsked', 'true');
          
          // Hata koduna göre mesaj göster
          let errorMessage = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Konum izni reddedildi. Tarayıcı ayarlarından izin verin.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Konum bilgisi alınamadı. GPS açık mı kontrol edin.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Konum isteği zaman aşımına uğradı. Tekrar deneyin.';
              break;
            default:
              errorMessage = 'Konum alınamadı. Lütfen tekrar deneyin.';
          }
          setError(errorMessage);
          
          setLocationAttempts(prev => {
            const newAttempts = prev + 1;
            if (newAttempts >= 3) {
              setShowLocationModal(false);
              setLocationError(true);
            }
            return newAttempts;
          });
        },
        { 
          enableHighAccuracy: false, 
          timeout: 15000,  // 15 saniye timeout
          maximumAge: 60000  // 1 dakikalık cache
        }
      );
    } else {
      // Geolocation desteklenmiyor
      setShowLocationModal(false);
      setLocationError(true);
      setError('Bu tarayıcı konum servisini desteklemiyor.');
    }
  };
  
  // Konum ile yakındaki eczaneleri getir
  const fetchNearbyWithLocation = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching nearby pharmacies for location:', lat, lng);
      const response = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&limit=20`);
      const data: NearbyPharmaciesResponse = await response.json();
      
      console.log('Nearby API response:', data);
      
      if (data.success && data.data && data.data.length > 0) {
        const sorted = data.data.sort((a, b) => a.distance - b.distance);
        console.log('Nearby pharmacies with distances:', sorted.slice(0, 3).map(p => ({ name: p.pharmacy, distance: p.distance })));
        setPharmacies(sorted);
        setSelectedPharmacy(sorted[0]);
      } else {
        // Fallback: tüm eczaneleri getir ve mesafe hesapla
        console.log('No nearby pharmacies found, fetching all...');
        const allResponse = await fetch('/api/all-pharmacies');
        const allData = await allResponse.json();
        
        if (allData.success && allData.data && allData.data.length > 0) {
          const withDistance = allData.data.map((p: PharmacyWithDistance) => ({
            ...p,
            distance: calculateDistance(lat, lng, p.lat, p.lng)
          }));
          const sorted = withDistance.sort((a: PharmacyWithDistance, b: PharmacyWithDistance) => a.distance - b.distance);
          setPharmacies(sorted);
          setSelectedPharmacy(sorted[0]);
        } else {
          setError('Nöbetçi eczane bulunamadı');
        }
      }
    } catch (err) {
      console.error('Error fetching nearby:', err);
      setError('Eczaneler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const skipLocationPermission = () => {
    setShowLocationModal(false);
    localStorage.setItem('locationPermissionAsked', 'true');
  };

  // Toggle saved pharmacy
  const toggleSavedPharmacy = (pharmacy: PharmacyWithDistance) => {
    const exists = savedPharmacies.find(p => p.id === pharmacy.id);
    let newSaved: SavedPharmacy[];
    
    if (exists) {
      // Remove from saved
      newSaved = savedPharmacies.filter(p => p.id !== pharmacy.id);
    } else {
      // Add to saved with full data
      const savedItem: SavedPharmacy = {
        id: pharmacy.id,
        pharmacy: pharmacy.pharmacy,
        address: pharmacy.address,
        phone: pharmacy.phone,
        district: pharmacy.district,
        city: pharmacy.city,
        lat: pharmacy.lat,
        lng: pharmacy.lng,
        savedAt: Date.now()
      };
      newSaved = [savedItem, ...savedPharmacies].slice(0, 20); // Max 20 items
    }
    
    setSavedPharmacies(newSaved);
    localStorage.setItem('savedPharmacies', JSON.stringify(newSaved));
  };
  
  // Check if pharmacy is saved
  const isPharmacySaved = (pharmacyId: string) => {
    return savedPharmacies.some(p => p.id === pharmacyId);
  };

  // Toggle theme - use the new handleToggleTheme
  const toggleTheme = handleToggleTheme;

  // Share pharmacy
  const sharePharmacy = (pharmacy: PharmacyWithDistance, method: 'whatsapp' | 'sms' | 'copy') => {
    const text = `${pharmacy.pharmacy}\n${pharmacy.address}\nTel: ${pharmacy.phone}\nHarita: https://www.google.com/maps?q=${pharmacy.lat},${pharmacy.lng}`;
    
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (method === 'sms') {
      window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
    } else {
      navigator.clipboard.writeText(text);
      alert('Kopyalandı!');
    }
  };

  // Fetch pharmacies and get user location on mount
  // Skip if initialCity is provided (URL like /bursa or /istanbul/bahcelievler)
  useEffect(() => {
    if (!mounted || initialCity || initialDistrict) return;
    
    // Check for saved location first
    const savedLocation = localStorage.getItem('savedLocation');
    
    const loadInitialData = async () => {
      // If there's a saved location, load pharmacies for that location
      if (savedLocation) {
        const { city, district } = JSON.parse(savedLocation) as SavedLocation;
        if (city && district) {
          setIsLoading(true);
          setSelectedCity(city);
          setSelectedDistrict(district);
          setHasSavedLocation(true);
          
          try {
            const response = await fetch(
              `/api/pharmacies?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`
            );
            const data: PharmaciesResponse = await response.json();
            
            if (data.success && data.data) {
              setPharmacies(data.data.map(p => ({ ...p, distance: 0 })));
              if (data.data.length > 0) {
                setSelectedPharmacy({ ...data.data[0], distance: 0 });
              }
            }
          } catch (err) {
            console.log('Could not fetch saved location pharmacies:', err);
            // Fallback to all pharmacies
            const allResponse = await fetch('/api/all-pharmacies');
            const allData = await allResponse.json();
            if (allData.success && allData.data) {
              setPharmacies(allData.data);
            }
          } finally {
            setIsLoading(false);
          }
          return;
        }
      }
      
      // No saved location - fetch all pharmacies for the map
      setIsLoading(true);
      try {
        const response = await fetch('/api/all-pharmacies');
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          setPharmacies(data.data);
          console.log('Loaded all pharmacies:', data.data.length);
        }
      } catch (err) {
        console.log('Could not fetch all pharmacies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Kayıtlı konum yoksa modal gösterilecek, şimdilik tüm eczaneleri yükle
    loadInitialData();
  }, [mounted, initialCity, initialDistrict]);

  // Search pharmacies by city/district (district is optional)
  const handleCityDistrictSearch = async (city: string, district: string) => {
    if (!city) return;

    setIsLoading(true);
    setError(null);
    setSelectedCity(city);
    setSelectedDistrict(district);

    try {
      // Build URL - district is optional
      let url = `/api/pharmacies?city=${encodeURIComponent(city)}`;
      if (district && district.trim()) {
        url += `&district=${encodeURIComponent(district)}`;
      }
      const response = await fetch(url);
      const data: PharmaciesResponse = await response.json();

      if (data.success && data.data) {
        const pharmaciesWithDistance: PharmacyWithDistance[] = data.data.map(p => ({
          ...p,
          distance: userLocation
            ? calculateDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
            : 0
        }));

        // Sort by distance if user location is available
        if (userLocation) {
          pharmaciesWithDistance.sort((a, b) => a.distance - b.distance);
        }

        setPharmacies(pharmaciesWithDistance);
        if (pharmaciesWithDistance.length > 0) {
          setSelectedPharmacy(pharmaciesWithDistance[0]);
        }
        
        // Save location to localStorage
        const savedLocation: SavedLocation = {
          city,
          district,
          timestamp: Date.now()
        };
        localStorage.setItem('savedLocation', JSON.stringify(savedLocation));
        setHasSavedLocation(true);
      } else {
        throw new Error(data.error || 'Eczane bulunamadı');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Arama yapılamadı';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch nearby pharmacies
  const handleFetchNearby = async () => {
    if (!userLocation) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10`
      );
      const data: NearbyPharmaciesResponse = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const sorted = data.data.sort((a, b) => a.distance - b.distance);
        setPharmacies(sorted);
        setSelectedPharmacy(sorted[0]);
      } else {
        setError('Yakınında nöbetçi eczane bulunamadı');
      }
    } catch (err) {
      setError('Eczaneler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to show all pharmacies and clear saved location
  const handleReset = async () => {
    setIsLoading(true);
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedPharmacy(null);
    
    // Clear saved location from localStorage
    localStorage.removeItem('savedLocation');
    setHasSavedLocation(false);
    
    try {
      const response = await fetch('/api/all-pharmacies');
      const data = await response.json();
      if (data.success && data.data) {
        setPharmacies(data.data);
      }
    } catch (err) {
      console.log('Could not fetch all pharmacies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort pharmacies
  const filteredPharmacies = pharmacies
    .filter(p =>
      p.pharmacy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'distance' && a.distance && b.distance) {
        return a.distance - b.distance;
      } else if (sortBy === 'name') {
        return a.pharmacy.localeCompare(b.pharmacy, 'tr');
      }
      return 0;
    });

  const bgColor = isDarkMode ? '#050b14' : '#f8fafc';

  // Mobile view
  if (isMobile) {
    return (
      <MobileView
        pharmacies={filteredPharmacies}
        selectedPharmacy={selectedPharmacy}
        onSelectPharmacy={setSelectedPharmacy}
        onShare={sharePharmacy}
        isLoading={isLoading}
        userLocation={userLocation}
        onCityDistrictSearch={handleCityDistrictSearch}
        onReset={handleReset}
        onFetchNearby={handleFetchNearby}
        onRequestLocation={handleLocationPermission}
        isDarkMode={isDarkMode}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        lastUpdateDate={lastUpdateDate}
        initialCity={initialCity}
        initialDistrict={initialDistrict}
      />
    );
  }

  // Desktop view
  return (
    <div className="h-screen w-full overflow-hidden relative" style={{ background: bgColor }}>
      {/* Location Permission Modal */}
      {showLocationModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.6)', 
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ 
            background: isDarkMode ? '#1e293b' : '#ffffff', 
            borderRadius: '24px', 
            padding: '32px', 
            maxWidth: '380px',
            width: '100%',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Icon */}
            <div style={{ 
              width: '72px', 
              height: '72px', 
              borderRadius: '50%', 
              background: 'rgba(16,185,129,0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#10b981">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
            </div>
            
            {/* Title */}
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              color: isDarkMode ? 'white' : '#111827', 
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              {locationAttempts > 0 ? `Konum Alınamadı (${locationAttempts}/3)` : 'Konum İzni Gerekli'}
            </h2>
            
            {/* Description */}
            <p style={{ 
              fontSize: '14px', 
              color: isDarkMode ? '#9ca3af' : '#6b7280', 
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              {locationAttempts > 0 
                ? 'Konum bilginiz alınamadı. Lütfen tarayıcı ayarlarından konum iznini aktif edin ve tekrar deneyin.'
                : 'Size en yakın nöbetçi eczaneleri gösterebilmemiz için konum bilginize ihtiyacımız var.'}
            </p>
            
            {/* Retry indicator */}
            {locationAttempts > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '8px', 
                marginBottom: '20px' 
              }}>
                {[1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: i <= locationAttempts ? '#ef4444' : '#e5e7eb'
                    }} 
                  />
                ))}
              </div>
            )}
            
            {/* Buttons */}
            <button 
              onClick={handleLocationPermission}
              style={{ 
                width: '100%', 
                background: '#10b981', 
                color: 'white', 
                fontSize: '15px', 
                fontWeight: 600, 
                padding: '14px', 
                borderRadius: '12px', 
                border: 'none', 
                cursor: 'pointer',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
              {locationAttempts > 0 ? 'Tekrar Dene' : 'Konumumu Kullan'}
            </button>
          </div>
        </div>
      )}

      {/* Location Error Modal - after 3 failed attempts */}
      {locationError && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.6)', 
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ 
            background: isDarkMode ? '#1e293b' : '#ffffff', 
            borderRadius: '24px', 
            padding: '32px', 
            maxWidth: '380px',
            width: '100%',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Error Icon */}
            <div style={{ 
              width: '72px', 
              height: '72px', 
              borderRadius: '50%', 
              background: 'rgba(239,68,68,0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            
            {/* Title */}
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              color: isDarkMode ? 'white' : '#111827', 
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              Konum Alınamıyor
            </h2>
            
            {/* Description */}
            <p style={{ 
              fontSize: '14px', 
              color: isDarkMode ? '#9ca3af' : '#6b7280', 
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              Konum bilginize erişemedik. Çevrenizdekileri görebilmek için lütfen tarayıcı ayarlarından konum iznini etkinleştirin veya manuel olarak şehir/ilçe seçin.
            </p>
            
            {/* Buttons */}
            <button 
              onClick={() => {
                setLocationError(false);
                setLocationAttempts(0);
                setShowLocationModal(true);
              }}
              style={{ 
                width: '100%', 
                background: '#10b981', 
                color: 'white', 
                fontSize: '15px', 
                fontWeight: 600, 
                padding: '14px', 
                borderRadius: '12px', 
                border: 'none', 
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              Tekrar Dene
            </button>
            
            <button 
              onClick={() => setLocationError(false)}
              style={{ 
                width: '100%', 
                background: 'transparent', 
                color: isDarkMode ? '#9ca3af' : '#6b7280', 
                fontSize: '14px', 
                fontWeight: 500, 
                padding: '12px', 
                borderRadius: '10px', 
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb', 
                cursor: 'pointer'
              }}
            >
              Manuel Seçim Yap
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Map */}
      <div className="absolute inset-0">
        <MapView
          pharmacies={pharmacies}
          selectedPharmacy={selectedPharmacy}
          userLocation={userLocation}
          onSelectPharmacy={setSelectedPharmacy}
          onFetchNearby={handleFetchNearby}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Floating Sidebar */}
      <Sidebar
        pharmacies={filteredPharmacies}
        selectedPharmacy={selectedPharmacy}
        onSelectPharmacy={setSelectedPharmacy}
        onCityDistrictSearch={handleCityDistrictSearch}
        onReset={handleReset}
        selectedCity={selectedCity}
        selectedDistrict={selectedDistrict}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
        error={error}
        savedPharmacies={savedPharmacies}
        onToggleSaved={toggleSavedPharmacy}
        isPharmacySaved={isPharmacySaved}
        sortBy={sortBy}
        onSortChange={setSortBy}
        isDarkMode={isDarkMode}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onShare={sharePharmacy}
        lastUpdateDate={lastUpdateDate}
      />
    </div>
  );
}
