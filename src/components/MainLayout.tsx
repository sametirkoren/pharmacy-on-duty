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

export default function MainLayout() {
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyWithDistance[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyWithDistance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPharmacies, setSavedPharmacies] = useState<SavedPharmacy[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'distance' | 'name'>('default');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [themeMode, setThemeMode] = useState<'auto' | 'dark' | 'light'>('auto');
  const [isMobile, setIsMobile] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasSavedLocation, setHasSavedLocation] = useState(false);

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
      // Default to auto mode - check system preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemDark);
    }
    
    // Check if there's a saved location
    const savedLocation = localStorage.getItem('savedLocation');
    if (savedLocation) {
      setHasSavedLocation(true);
    }
  }, [mounted]);

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
    
    const hasAskedBefore = localStorage.getItem('locationPermissionAsked');
    const savedLocation = localStorage.getItem('savedLocation');
    
    // Kayıtlı konum varsa veya daha önce sorulmuşsa modal gösterme
    if (!hasAskedBefore && !savedLocation) {
      const timer = setTimeout(() => {
        setShowLocationModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, mounted]); // userLocation'ı dependency'den çıkardık - modal gösterimi konum alınmasına bağlı olmamalı

  const handleLocationPermission = () => {
    setShowLocationModal(false);
    localStorage.setItem('locationPermissionAsked', 'true');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          setUserLocation(location);
          // Konum alındıktan sonra yakındaki eczaneleri getir
          fetchNearbyWithLocation(location.lat, location.lng);
        },
        (error) => console.log('Konum izni reddedildi:', error.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };
  
  // Konum ile yakındaki eczaneleri getir
  const fetchNearbyWithLocation = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&limit=20`);
      const data: NearbyPharmaciesResponse = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const sorted = data.data.sort((a, b) => a.distance - b.distance);
        console.log('Nearby pharmacies with distances:', sorted.slice(0, 3).map(p => ({ name: p.pharmacy, distance: p.distance })));
        setPharmacies(sorted);
        setSelectedPharmacy(sorted[0]);
        // NOT: selectedCity/selectedDistrict set etmiyoruz çünkü
        // bu Sidebar'ın yeniden arama yapmasına ve mesafelerin kaybolmasına neden olur
      } else {
        setError('Yakınında nöbetçi eczane bulunamadı');
      }
    } catch (err) {
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
  useEffect(() => {
    if (!mounted) return;
    
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

    // Kayıtlı konum yoksa, kullanıcı konumunu al ve yakındaki eczaneleri getir
    if (!savedLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          setUserLocation(location);
          // Konum alındıysa yakındaki eczaneleri getir
          fetchNearbyWithLocation(location.lat, location.lng);
        },
        (error) => {
          console.log('Could not get user location:', error.message);
          // Konum alınamadıysa tüm eczaneleri yükle
          loadInitialData();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      // Kayıtlı konum varsa normal yükle
      loadInitialData();
    }
  }, [mounted]);

  // Search pharmacies by city/district
  const handleCityDistrictSearch = async (city: string, district: string) => {
    if (!city || !district) return;

    setIsLoading(true);
    setError(null);
    setSelectedCity(city);
    setSelectedDistrict(district);

    try {
      const response = await fetch(
        `/api/pharmacies?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`
      );
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
        isDarkMode={isDarkMode}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
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
          background: 'rgba(0,0,0,0.7)', 
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ 
            background: isDarkMode ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', 
            borderRadius: '28px', 
            padding: '40px 32px', 
            maxWidth: '400px',
            width: '100%',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            {/* Icon */}
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(0,255,157,0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '2px solid rgba(0,255,157,0.3)'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#00ff9d">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
            </div>
            
            {/* Title */}
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              color: isDarkMode ? 'white' : '#0f172a', 
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              Konum İzni Gerekli
            </h2>
            
            {/* Description */}
            <p style={{ 
              fontSize: '15px', 
              color: isDarkMode ? '#94a3b8' : '#64748b', 
              textAlign: 'center',
              lineHeight: 1.7,
              marginBottom: '32px'
            }}>
              Size en yakın nöbetçi eczaneleri gösterebilmemiz için konum bilginize ihtiyacımız var. 
              Konum bilginiz sadece bu amaçla kullanılır ve üçüncü taraflarla paylaşılmaz.
            </p>
            
            {/* Buttons */}
            <button 
              onClick={handleLocationPermission}
              style={{ 
                width: '100%', 
                background: '#00ff9d', 
                color: '#050b14', 
                fontSize: '16px', 
                fontWeight: 700, 
                padding: '16px', 
                borderRadius: '16px', 
                border: 'none', 
                cursor: 'pointer',
                marginBottom: '12px',
                boxShadow: '0 0 30px rgba(0,255,157,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
              Konumumu Kullan
            </button>
            
            <button 
              onClick={skipLocationPermission}
              style={{ 
                width: '100%', 
                background: 'transparent', 
                color: isDarkMode ? '#64748b' : '#94a3b8', 
                fontSize: '14px', 
                fontWeight: 500, 
                padding: '14px', 
                borderRadius: '12px', 
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', 
                cursor: 'pointer'
              }}
            >
              Şimdilik Geç
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
      />
    </div>
  );
}
