'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PharmacyWithDistance } from '@/types';

interface MobileMapProps {
  pharmacies: PharmacyWithDistance[];
  selectedPharmacy: PharmacyWithDistance | null;
  userLocation: { lat: number; lng: number } | null;
  onSelectPharmacy: (pharmacy: PharmacyWithDistance) => void;
  isDarkMode?: boolean;
}

const MobileMapComponent = dynamic<MobileMapProps>(() => import('./MobileMap'), { 
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    </div>
  )
});

interface MobileViewProps {
  pharmacies: PharmacyWithDistance[];
  selectedPharmacy: PharmacyWithDistance | null;
  onSelectPharmacy: (pharmacy: PharmacyWithDistance) => void;
  onShare: (pharmacy: PharmacyWithDistance, method: 'whatsapp' | 'sms' | 'copy') => void;
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  onCityDistrictSearch: (city: string, district: string) => void;
  onReset: () => void;
  onFetchNearby: () => void;
  onRequestLocation?: () => void;
  isDarkMode?: boolean;
  themeMode?: 'auto' | 'dark' | 'light';
  onToggleTheme?: () => void;
  lastUpdateDate?: string;
}

export default function MobileView({
  pharmacies,
  selectedPharmacy,
  onSelectPharmacy,
  onShare,
  isLoading,
  userLocation,
  onCityDistrictSearch,
  onReset,
  onFetchNearby,
  onRequestLocation,
  isDarkMode = false,
  themeMode = 'light',
  onToggleTheme,
  lastUpdateDate
}: MobileViewProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'map' | 'saved' | 'settings'>('search');
  const [savedPharmacies, setSavedPharmacies] = useState<{id: string; name: string; address: string; phone: string; lat: number; lng: number; savedAt: number}[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showPharmacyList, setShowPharmacyList] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const countries = ['Türkiye', 'Kuzey Kıbrıs'];

  // Hydration fix - set mounted after client render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Kayıtlı konumu yükle (after mount)
  useEffect(() => {
    if (!mounted) return;
    const savedLocation = localStorage.getItem('savedLocation');
    if (savedLocation) {
      const { city, district } = JSON.parse(savedLocation);
      if (city && district) {
        // Kıbrıs mı Türkiye mi kontrol et
        const isKibris = city.toLowerCase() === 'kibris';
        setSelectedCountry(isKibris ? 'Kuzey Kıbrıs' : 'Türkiye');
        setSelectedCity(city);
        setSelectedDistrict(district);
        setShowResults(true);
        setShowPharmacyList(true);
      }
    }
  }, [mounted]);

  // Uygulama açıldığında konum izni modalını göster veya otomatik konum al
  useEffect(() => {
    if (!mounted) return;
    const savedLocation = localStorage.getItem('savedLocation');
    
    // Kayıtlı il/ilçe seçimi varsa konum modal gösterme
    if (savedLocation) return;
    
    // Konum zaten varsa modal gösterme
    if (userLocation) return;
    
    // Daha önce izin sorulduysa, otomatik konum almayı dene
    const hasAskedBefore = localStorage.getItem('locationPermissionAsked');
    if (hasAskedBefore && onRequestLocation) {
      // Kısa bir gecikme ile otomatik konum iste
      const timer = setTimeout(() => {
        onRequestLocation();
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // İlk kez ise modal göster
    if (!hasAskedBefore) {
      const timer = setTimeout(() => {
        setShowLocationModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userLocation, mounted, onRequestLocation]);


  const handleLocationPermission = () => {
    setShowLocationModal(false);
    setLocationPermissionAsked(true);
    localStorage.setItem('locationPermissionAsked', 'true');
    
    // Ana component'ın konum iznini istemesini sağla
    if (onRequestLocation) {
      onRequestLocation();
    }
  };

  const skipLocationPermission = () => {
    setShowLocationModal(false);
    setLocationPermissionAsked(true);
    localStorage.setItem('locationPermissionAsked', 'true');
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollableElement = e.currentTarget as HTMLElement;
    if (scrollableElement.scrollTop === 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const scrollableElement = e.currentTarget as HTMLElement;
    if (scrollableElement.scrollTop > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, Math.min((currentY - startY) * 0.5, 100));
    setPullDistance(distance);
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    
    if (pullDistance >= 60) {
      setIsRefreshing(true);
      setPullDistance(60);
      
      // Refresh data
      if (showPharmacyList && selectedCity && selectedDistrict) {
        onCityDistrictSearch(selectedCity, selectedDistrict);
      } else if (userLocation) {
        onFetchNearby();
      }
      
      // Wait a bit for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  // Navigate to nearest pharmacy
  const navigateToNearest = () => {
    if (nearestPharmacy) {
      directions(nearestPharmacy.lat, nearestPharmacy.lng);
    }
  };

  // Share nearest 5 pharmacies to WhatsApp
  const shareNearestToWhatsApp = () => {
    const nearest5 = pharmacies
      .filter(p => p.distance && p.distance > 0)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 5);
    
    if (nearest5.length === 0) {
      alert('Yakınızdaki eczane bulunamadı. Lütfen konum izni verin.');
      return;
    }

    let message = '*Yakinimdaki Nobetci Eczaneler*\n\n';
    
    nearest5.forEach((p, index) => {
      const dist = p.distance ? p.distance.toFixed(1) : '?';
      const walkMins = p.distance ? Math.round(p.distance * 12) : '?';
      message += `*${index + 1}. ${p.pharmacy}*\n`;
      message += `Adres: ${p.address}\n`;
      message += `Tel: ${p.phone}\n`;
      message += `Mesafe: ${dist} km (~${walkMins} dk yurume)\n`;
      message += `Yol Tarifi: https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}\n\n`;
    });

    message += '_Nobetci Eczane uygulamasi ile paylasildi_';
    
    const encoded = encodeURIComponent(message);
    
    // Mobile: Use whatsapp:// protocol, fallback to api.whatsapp.com
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try native WhatsApp app first
      window.location.href = `whatsapp://send?text=${encoded}`;
    } else {
      // Desktop: use web.whatsapp.com
      window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank');
    }
  };

  // Menu actions
  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    switch (action) {
      case 'nearby':
        onFetchNearby();
        setShowPharmacyList(true);
        setActiveTab('search');
        break;
      case 'map':
        setActiveTab('map');
        break;
      case 'favorites':
        setActiveTab('saved');
        break;
      case 'settings':
        setActiveTab('settings');
        break;
      case 'reset':
        onReset();
        setShowPharmacyList(false);
        setSelectedCity('');
        setSelectedDistrict('');
        break;
    }
  };

  // Fetch cities based on country
  useEffect(() => {
    if (!selectedCountry) { setCities([]); return; }
    
    // Kuzey Kıbrıs için özel işlem - şehir otomatik "Kıbrıs" olarak ayarla
    if (selectedCountry === 'Kuzey Kıbrıs') {
      setCities(['Kıbrıs']);
      setSelectedCity('Kıbrıs'); // Otomatik seç
      return;
    }
    
    const countryParam = 'turkiye';
    fetch(`/api/cities?country=${countryParam}`)
      .then(res => res.json())
      .then(data => { if (data.success && data.data) setCities(data.data); })
      .catch(() => {});
  }, [selectedCountry]);

  // Fetch districts when city changes
  useEffect(() => {
    if (!selectedCity) { setDistricts([]); return; }
    fetch(`/api/districts?city=${encodeURIComponent(selectedCity)}`)
      .then(res => res.json())
      .then(data => { if (data.success && data.data) setDistricts(data.data); })
      .catch(() => {});
  }, [selectedCity]);

  // Harita sekmesine geçildiğinde ve konum varsa yakındaki eczaneleri getir
  useEffect(() => {
    if (activeTab === 'map' && userLocation && pharmacies.length === 0) {
      onFetchNearby();
    }
  }, [activeTab, userLocation, pharmacies.length, onFetchNearby]);

  const sortedPharmacies = [...pharmacies].sort((a, b) => (a.distance || 999) - (b.distance || 999));
  // Konum varsa sadece 50km içindeki eczaneleri göster
  const nearbyPharmacies = userLocation 
    ? sortedPharmacies.filter(p => (p.distance || 999) < 50)
    : sortedPharmacies;
  const nearestPharmacy = sortedPharmacies[0];
  const favoritePharmacies = pharmacies.filter(p => savedPharmacies.some(s => s.id === p.id));
  
  const formatDist = (d: number) => d > 0 ? (d < 1 ? Math.round(d * 1000) + ' m' : d.toFixed(1) + ' km') : '';
  const walkTime = (d: number) => d > 0 ? Math.round(d * 12) + ' min' : '';
  const call = (p: string) => { window.location.href = 'tel:' + p.replace(/\D/g, ''); };
  const directions = (lat: number, lng: number) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');

  // District pharmacy counts
  const districtCounts: { [key: string]: { count: number; color: string } } = {};
  pharmacies.forEach(p => {
    if (!districtCounts[p.district]) {
      const colors = ['#10b981', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];
      districtCounts[p.district] = { count: 0, color: colors[Object.keys(districtCounts).length % colors.length] };
    }
    districtCounts[p.district].count++;
  });

  const handleSearch = () => {
    if (selectedCity && selectedDistrict) {
      onCityDistrictSearch(selectedCity, selectedDistrict);
      setShowResults(true);
      setShowPharmacyList(true);
    }
  };

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  // Eczane kaydetme fonksiyonu - 24 saat tutar
  const savePharmacy = (pharmacy: PharmacyWithDistance) => {
    const now = Date.now();
    // 24 saatten eski kayıtları temizle
    const validSaved = savedPharmacies.filter(p => now - p.savedAt < 24 * 60 * 60 * 1000);
    
    // Zaten kayıtlı mı kontrol et
    const exists = validSaved.find(p => p.id === pharmacy.id);
    if (exists) {
      // Kaydı kaldır
      setSavedPharmacies(validSaved.filter(p => p.id !== pharmacy.id));
    } else {
      // Yeni kayıt ekle
      setSavedPharmacies([{
        id: pharmacy.id,
        name: pharmacy.pharmacy,
        address: pharmacy.address,
        phone: pharmacy.phone,
        lat: pharmacy.lat,
        lng: pharmacy.lng,
        savedAt: now
      }, ...validSaved].slice(0, 20));
    }
  };

  const isPharmacySaved = (id: string) => {
    const now = Date.now();
    return savedPharmacies.some(p => p.id === id && now - p.savedAt < 24 * 60 * 60 * 1000);
  };

  // Theme colors - Clean, professional design
  const colors = {
    bg: isDarkMode ? '#111827' : '#ffffff',
    bgGradient: isDarkMode ? 'linear-gradient(180deg, #111827 0%, #1f2937 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
    card: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : '#ffffff',
    cardHover: isDarkMode ? 'rgba(55, 65, 81, 0.95)' : '#f9fafb',
    cardBorder: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    cardShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
    text: isDarkMode ? '#f9fafb' : '#111827',
    textSecondary: isDarkMode ? '#9ca3af' : '#6b7280',
    textMuted: isDarkMode ? '#6b7280' : '#9ca3af',
    inputBg: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
    inputBorder: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
    buttonBg: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
    buttonBgHover: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
    iconBg: isDarkMode ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
    accent: isDarkMode ? '#34d399' : '#059669',
    accentLight: isDarkMode ? '#34d399' : '#10b981',
  };

  return (
    <div style={{ height: '100vh', width: '100%', background: colors.bg, position: 'relative', overflow: 'hidden', fontFamily: "'Lexend', system-ui, sans-serif" }}>
      {/* Clean Background */}
      <div style={{ position: 'absolute', inset: 0, background: colors.bgGradient }}></div>

      {/* Location Permission Modal */}
      {showLocationModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ 
            background: colors.card, 
            borderRadius: '24px', 
            padding: '32px 24px', 
            maxWidth: '340px',
            width: '100%',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
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
              color: colors.text, 
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              Konum İzni Gerekli
            </h2>
            
            {/* Description */}
            <p style={{ 
              fontSize: '14px', 
              color: colors.textSecondary, 
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              Size en yakın nöbetçi eczaneleri gösterebilmemiz için konum bilginize ihtiyacımız var. 
              Konum bilginiz sadece bu amaçla kullanılır.
            </p>
            
            {/* Buttons */}
            <button 
              onClick={handleLocationPermission}
              style={{ 
                width: '100%', 
                background: '#10b981', 
                color: '#ffffff', 
                fontSize: '16px', 
                fontWeight: 600, 
                padding: '16px', 
                borderRadius: '14px', 
                border: 'none', 
                cursor: 'pointer',
                marginBottom: '12px',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
                Konumumu Kullan
              </span>
            </button>
            
            <button 
              onClick={skipLocationPermission}
              style={{ 
                width: '100%', 
                background: colors.buttonBg, 
                color: colors.textSecondary, 
                fontSize: '14px', 
                fontWeight: 500, 
                padding: '14px', 
                borderRadius: '14px', 
                border: 'none', 
                cursor: 'pointer'
              }}
            >
              Şimdilik Geç
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '440px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexShrink: 0, position: 'relative', zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={isDarkMode ? "/icon-512.svg" : "/icon-512-light.svg"}
              alt="PharmacyFinder Logo" 
              style={{ width: '40px', height: '40px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: colors.text }}>Nöbetçi<span style={{ color: colors.accent }}> Eczane</span></div>
              <div style={{ fontSize: '10px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill={colors.accent}><circle cx="12" cy="12" r="10"/></svg>
                {lastUpdateDate ? `${lastUpdateDate} • Güncel Veri` : 'Güncel Veri'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: showMenu ? 'rgba(16,185,129,0.15)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), border: showMenu ? '1px solid rgba(16,185,129,0.3)' : `1px solid ${colors.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={showMenu ? colors.accent : colors.text}><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div style={{ 
              position: 'absolute', 
              top: '60px', 
              right: '0', 
              background: isDarkMode ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)', 
              backdropFilter: 'blur(20px)', 
              borderRadius: '16px', 
              padding: '8px', 
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '200px',
              zIndex: 9999
            }}>
              <button onClick={() => handleMenuAction('nearby')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', color: colors.text, fontSize: '14px', fontWeight: 500, textAlign: 'left' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#10b981"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
                Yakınımdaki Eczaneler
              </button>
              <button onClick={() => handleMenuAction('map')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', color: colors.text, fontSize: '14px', fontWeight: 500, textAlign: 'left' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#64748b"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
                Harita Görünümü
              </button>
              <button onClick={() => handleMenuAction('favorites')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', color: colors.text, fontSize: '14px', fontWeight: 500, textAlign: 'left' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#10b981"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                Kaydedilenler ({savedPharmacies.length})
              </button>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }}></div>
              <button onClick={() => handleMenuAction('reset')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', color: '#f87171', fontSize: '14px', fontWeight: 500, textAlign: 'left' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#f87171"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                Aramayı Sıfırla
              </button>
              <button onClick={() => handleMenuAction('settings')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', color: colors.text, fontSize: '14px', fontWeight: 500, textAlign: 'left' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#64748b"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                Ayarlar
              </button>
            </div>
          )}
        </header>

        {/* Main Content - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
          {/* SEARCH TAB */}
          {activeTab === 'search' && (
            <>
              {/* Search Card */}
              {!showPharmacyList ? (
                <div style={{ 
                  background: colors.card, 
                  backdropFilter: 'blur(24px)', 
                  borderRadius: '32px', 
                  padding: '28px', 
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: 'none',
                  marginBottom: '20px',
                  position: 'relative'
                }}>
                                    
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: colors.text, marginBottom: '24px', lineHeight: 1.3 }}>Yakındaki Nöbetçi<br/>Eczaneyi Bul</h2>
                  
                  {/* Country Selector - Tab Style */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f1f5f9', padding: '4px', borderRadius: '14px' }}>
                    <button 
                      onClick={() => { setSelectedCountry('Türkiye'); setSelectedCity(''); setSelectedDistrict(''); setShowPharmacyList(false); }}
                      style={{ 
                        flex: 1, 
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        border: 'none',
                        background: selectedCountry === 'Türkiye' ? '#10b981' : 'transparent',
                        color: selectedCountry === 'Türkiye' ? 'white' : colors.textSecondary,
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      🇹🇷 Türkiye
                    </button>
                    <button 
                      onClick={() => { setSelectedCountry('Kuzey Kıbrıs'); setSelectedCity('Kıbrıs'); setSelectedDistrict(''); setShowPharmacyList(false); }}
                      style={{ 
                        flex: 1, 
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        border: 'none',
                        background: selectedCountry === 'Kuzey Kıbrıs' ? '#10b981' : 'transparent',
                        color: selectedCountry === 'Kuzey Kıbrıs' ? 'white' : colors.textSecondary,
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      🇨🇾 Kıbrıs
                    </button>
                  </div>

                  {/* City/District Select Row */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    {/* City Select - Kuzey Kıbrıs için gizle */}
                    {selectedCountry !== 'Kuzey Kıbrıs' && (
                      <div style={{ flex: 1, position: 'relative' }}>
                        <select
                          value={selectedCity}
                          onChange={e => { setSelectedCity(e.target.value); setSelectedDistrict(''); setShowPharmacyList(false); }}
                          style={{ 
                            width: '100%', 
                            appearance: 'none', 
                            background: colors.card, 
                            border: `1px solid ${colors.inputBorder}`, 
                            borderRadius: '14px', 
                            padding: '14px 36px 14px 14px', 
                            fontSize: '14px', 
                            fontWeight: 500,
                            color: selectedCity ? colors.text : colors.textSecondary, 
                            cursor: 'pointer', 
                            outline: 'none' 
                          }}
                        >
                          <option value="">İl Seçin</option>
                          {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8"><path d="M7 10l5 5 5-5z"/></svg>
                        </div>
                      </div>
                    )}

                    {/* District Select */}
                    <div style={{ flex: 1, position: 'relative' }}>
                      <select
                        value={selectedDistrict}
                        onChange={e => setSelectedDistrict(e.target.value)}
                        disabled={!selectedCity}
                        style={{ 
                          width: '100%', 
                          appearance: 'none', 
                          background: colors.card, 
                          border: `1px solid ${colors.inputBorder}`, 
                          borderRadius: '14px', 
                          padding: '14px 36px 14px 14px', 
                          fontSize: '14px', 
                          fontWeight: 500,
                          color: selectedDistrict ? colors.text : colors.textSecondary, 
                          cursor: selectedCity ? 'pointer' : 'not-allowed', 
                          outline: 'none', 
                          opacity: selectedCity ? 1 : 0.6 
                        }}
                      >
                        <option value="">İlçe Seçin</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8"><path d="M7 10l5 5 5-5z"/></svg>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <button 
                      onClick={() => { setSelectedCountry(''); setSelectedCity(''); setSelectedDistrict(''); setShowPharmacyList(false); onReset(); }} 
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', 
                        border: 'none', 
                        borderRadius: '14px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#64748b', 
                        flexShrink: 0 
                      }} 
                      title="Sıfırla"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                    </button>
                  </div>

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    disabled={!selectedCity || !selectedDistrict}
                    style={{ width: '100%', background: selectedCity && selectedDistrict ? '#10b981' : '#e5e7eb', color: selectedCity && selectedDistrict ? '#ffffff' : '#9ca3af', fontSize: '16px', fontWeight: 700, padding: '16px', borderRadius: '16px', border: 'none', cursor: selectedCity && selectedDistrict ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: selectedCity && selectedDistrict ? '0 4px 14px rgba(16,185,129,0.3)' : 'none' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                    Ara
                  </button>

                  {/* Nearby Button */}
                  <button
                    onClick={() => { onFetchNearby(); setShowPharmacyList(true); }}
                    style={{ width: '100%', marginTop: '12px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : colors.buttonBg, color: colors.text, fontSize: '14px', fontWeight: 600, padding: '14px', borderRadius: '16px', border: `1px solid ${colors.cardBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={colors.accentLight}><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
                    Yakınımdaki Eczaneler
                  </button>

                  {/* Share Nearest to WhatsApp - only show if location is available */}
                  {pharmacies.some(p => p.distance && p.distance > 0) && (
                    <button
                      onClick={shareNearestToWhatsApp}
                      style={{ width: '100%', marginTop: '10px', background: '#25d366', color: 'white', fontSize: '13px', fontWeight: 600, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Yakınımdaki 5 Eczaneyi Paylaş
                    </button>
                  )}
                </div>
              ) : (
                <div
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    overflowX: 'hidden',
                    transform: `translateY(${pullDistance}px)`,
                    transition: isPulling ? 'none' : 'transform 0.3s ease'
                  }}
                >
                  {/* Pull to Refresh Indicator */}
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    transform: `translateX(-50%) translateY(${-60 + pullDistance}px)`,
                    opacity: pullDistance / 60,
                    transition: isPulling ? 'none' : 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(16,185,129,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                    }}>
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="#10b981"
                        style={{ 
                          transform: `rotate(${pullDistance * 3}deg)`,
                          transition: isPulling ? 'none' : 'transform 0.3s ease'
                        }}
                      >
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: '12px', color: colors.accent, fontWeight: 600 }}>
                      {isRefreshing ? 'Yenileniyor...' : (pullDistance >= 60 ? 'Bırak' : 'Yenilemek için çek')}
                    </span>
                  </div>

                  {/* Results Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <button onClick={() => { setShowPharmacyList(false); setShowMiniMap(false); onReset(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.accent, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                      Geri
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{sortedPharmacies.length} eczane</span>
                      <button 
                        onClick={() => setShowMiniMap(!showMiniMap)} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '6px', 
                          background: showMiniMap ? 'rgba(16,185,129,0.15)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'), 
                          border: showMiniMap ? '1px solid rgba(16,185,129,0.3)' : `1px solid ${colors.cardBorder}`, 
                          borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: showMiniMap ? colors.accent : colors.textSecondary, fontSize: '11px', fontWeight: 600 
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
                        {showMiniMap ? 'Gizle' : 'Harita'}
                      </button>
                    </div>
                  </div>

                  {/* Mini Map */}
                  {showMiniMap && sortedPharmacies.length > 0 && (
                    <div style={{ height: '200px', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', border: `1px solid ${colors.cardBorder}` }}>
                      <MobileMapComponent
                        pharmacies={sortedPharmacies}
                        selectedPharmacy={selectedPharmacy}
                        userLocation={userLocation}
                        onSelectPharmacy={onSelectPharmacy}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  )}

                  {/* Loading - Skeleton */}
                  {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ background: colors.card, borderRadius: '20px', padding: '20px', border: `1px solid ${colors.cardBorder}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div className="skeleton-pulse" style={{ width: '60%', height: '20px', borderRadius: '6px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                            <div className="skeleton-pulse" style={{ width: '70px', height: '28px', borderRadius: '20px', background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)' }} />
                          </div>
                          <div className="skeleton-pulse" style={{ width: '30%', height: '24px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', marginBottom: '16px' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="skeleton-pulse" style={{ width: '100%', height: '44px', borderRadius: '12px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                            <div className="skeleton-pulse" style={{ width: '100%', height: '44px', borderRadius: '12px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <div className="skeleton-pulse" style={{ flex: 1, height: '44px', borderRadius: '12px', background: isDarkMode ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)' }} />
                            <div className="skeleton-pulse" style={{ width: '44px', height: '44px', borderRadius: '12px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                            <div className="skeleton-pulse" style={{ width: '44px', height: '44px', borderRadius: '12px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                            <div className="skeleton-pulse" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(37,211,102,0.15)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Pharmacy List */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {sortedPharmacies.map(p => (
                        <div key={p.id} onClick={() => onSelectPharmacy(p)} style={{ 
                          background: isDarkMode ? colors.card : 'white',
                          borderRadius: '20px', 
                          padding: '20px', 
                          border: selectedPharmacy?.id === p.id 
                            ? `2px solid ${colors.accent}`
                            : `1px solid ${isDarkMode ? colors.cardBorder : '#e5e7eb'}`,
                          boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>
                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.text, margin: 0 }}>{p.pharmacy}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.accent}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: colors.accent }}>{formatDist(p.distance || 0)}</span>
                            </div>
                          </div>

                          {/* Address & Phone Section */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderRadius: '12px' }}>
                              <div style={{ width: '32px', height: '32px', background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: isDarkMode ? 'none' : '1px solid #e5e7eb' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.accent}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                              </div>
                              <p style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: colors.text, margin: 0, lineHeight: 1.4 }}>{p.address}</p>
                              <button onClick={e => { e.stopPropagation(); copyToClipboard(p.address, `addr-${p.id}`); }} style={{ background: copiedText === `addr-${p.id}` ? (isDarkMode ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)') : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'), border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copiedText === `addr-${p.id}` ? (isDarkMode ? '#10b981' : '#10b981') : colors.textMuted, transition: 'all 0.2s' }}>
                                {copiedText === `addr-${p.id}` ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>}
                              </button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderRadius: '12px' }}>
                              <div style={{ width: '32px', height: '32px', background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: isDarkMode ? 'none' : '1px solid #e5e7eb' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.accent}><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                              </div>
                              <p style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: colors.text, margin: 0 }}>{p.phone}</p>
                              <button onClick={e => { e.stopPropagation(); copyToClipboard(p.phone, `phone-${p.id}`); }} style={{ background: copiedText === `phone-${p.id}` ? (isDarkMode ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)') : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'), border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copiedText === `phone-${p.id}` ? (isDarkMode ? '#10b981' : '#10b981') : colors.textMuted, transition: 'all 0.2s' }}>
                                {copiedText === `phone-${p.id}` ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>}
                              </button>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                            <button onClick={e => { e.stopPropagation(); call(p.phone); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: colors.accent, border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 600, color: isDarkMode ? 'black' : 'white', cursor: 'pointer' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                              Ara
                            </button>
                            <button onClick={e => { e.stopPropagation(); directions(p.lat, p.lng); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: `1.5px solid ${isDarkMode ? 'rgba(239,68,68,0.4)' : '#fca5a5'}`, borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 600, color: isDarkMode ? '#f87171' : '#ef4444', cursor: 'pointer' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/></svg>
                              Yol Tarifi
                            </button>
                            <button onClick={e => { e.stopPropagation(); window.open(`https://wa.me/?text=${encodeURIComponent(`💊 ${p.pharmacy}\n📍 ${p.address}\n📞 ${p.phone}\n🗺️ https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`)}`, '_blank'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : '#d1d5db'}`, borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 600, color: colors.textSecondary, cursor: 'pointer' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                              Paylaş
                            </button>
                            <button onClick={e => { e.stopPropagation(); savePharmacy(p); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: isPharmacySaved(p.id) ? (isDarkMode ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)') : 'transparent', border: `1.5px solid ${isPharmacySaved(p.id) ? (isDarkMode ? '#10b981' : '#10b981') : (isDarkMode ? 'rgba(255,255,255,0.15)' : '#d1d5db')}`, borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 600, color: isPharmacySaved(p.id) ? (isDarkMode ? '#10b981' : '#10b981') : colors.textSecondary, cursor: 'pointer' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill={isPharmacySaved(p.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                              {isPharmacySaved(p.id) ? 'Kaydedildi' : 'Kaydet'}
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* MAP TAB */}
          {activeTab === 'map' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 200px)' }}>
              {/* Map Container */}
              <div style={{ flex: 1, minHeight: '300px', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${colors.cardBorder}` }}>
                <MobileMapComponent
                  pharmacies={nearbyPharmacies}
                  selectedPharmacy={selectedPharmacy}
                  userLocation={userLocation}
                  onSelectPharmacy={onSelectPharmacy}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Swipeable Pharmacy Cards */}
              {nearbyPharmacies.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                  {nearbyPharmacies.slice(0, 15).map(p => {
                    const isSelected = selectedPharmacy?.id === p.id;
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => onSelectPharmacy(p)} 
                        style={{ 
                          flexShrink: 0, 
                          width: '280px', 
                          background: isSelected ? (isDarkMode ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)') : colors.card, 
                          backdropFilter: 'blur(24px)', 
                          borderRadius: '16px', 
                          padding: '14px', 
                          cursor: 'pointer', 
                          border: isSelected ? `2px solid ${isDarkMode ? '#10b981' : '#10b981'}` : `1px solid ${colors.cardBorder}`,
                          boxShadow: isSelected ? `0 0 20px ${isDarkMode ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}` : colors.cardShadow,
                          scrollSnapAlign: 'start',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isDarkMode ? 'linear-gradient(135deg, #0a1628, #050b14)' : 'linear-gradient(135deg, #ffffff, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isDarkMode ? '0 0 8px rgba(16,185,129,0.2)' : '0 2px 6px rgba(0,0,0,0.1)', border: isDarkMode ? '1px solid rgba(16,185,129,0.15)' : '1px solid #e2e8f0' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                              <rect x="10" y="4" width="4" height="16" rx="1" fill={colors.accent}/>
                              <rect x="4" y="10" width="16" height="4" rx="1" fill={colors.accent}/>
                              <circle cx="12" cy="12" r="2" fill={isDarkMode ? '#050b14' : '#ffffff'}/>
                              <circle cx="12" cy="12" r="1" fill={colors.accent}/>
                            </svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.pharmacy}</span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#10b981' : '#059669', flexShrink: 0 }}>{formatDist(p.distance || 0)}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                            <button onClick={(e) => { e.stopPropagation(); call(p.phone); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: colors.buttonBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '8px', padding: '8px', fontSize: '11px', fontWeight: 600, color: colors.text, cursor: 'pointer' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                              Ara
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); directions(p.lat, p.lng); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: colors.accent, border: 'none', borderRadius: '8px', padding: '8px', fontSize: '11px', fontWeight: 700, color: isDarkMode ? 'black' : 'white', cursor: 'pointer' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                              Git
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); savePharmacy(p); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: isPharmacySaved(p.id) ? (isDarkMode ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)') : colors.buttonBg, border: isPharmacySaved(p.id) ? '1px solid rgba(16,185,129,0.3)' : `1px solid ${colors.cardBorder}`, borderRadius: '8px', padding: '8px', fontSize: '11px', fontWeight: 600, color: isPharmacySaved(p.id) ? colors.accentLight : colors.text, cursor: 'pointer' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={isPharmacySaved(p.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                              Kaydet
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {nearbyPharmacies.length === 0 && (
                <div style={{ background: colors.card, backdropFilter: 'blur(24px)', borderRadius: '16px', padding: '20px', border: `1px solid ${colors.cardBorder}`, textAlign: 'center' }}>
                  <p style={{ color: colors.textMuted, fontSize: '13px' }}>
                    {userLocation ? 'Yakında nöbetçi eczane bulunamadı' : 'Konum bilgisi alınamadı'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SAVED TAB */}
          {activeTab === 'saved' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.text, marginBottom: '8px' }}>Kaydedilen Eczaneler</h2>
              <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '16px' }}>Kayıtlar 24 saat boyunca saklanır</p>
              {savedPharmacies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#334155" style={{ margin: '0 auto 16px' }}><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                  <p style={{ color: colors.textMuted, fontSize: '14px' }}>Henüz eczane kaydetmediniz</p>
                  <p style={{ color: colors.textMuted, fontSize: '12px', marginTop: '8px' }}>Eczane kartlarındaki kaydet butonuna tıklayarak eczaneleri buraya ekleyebilirsiniz</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {savedPharmacies.map((item) => {
                    const remainingHours = Math.max(0, Math.round((24 * 60 * 60 * 1000 - (Date.now() - item.savedAt)) / (1000 * 60 * 60)));
                    return (
                      <div 
                        key={item.id} 
                        style={{ background: colors.card, borderRadius: '16px', padding: '16px', border: `1px solid ${colors.cardBorder}`, boxShadow: colors.cardShadow }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: colors.text }}>{item.name}</span>
                          <span style={{ fontSize: '10px', color: colors.textMuted, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '10px' }}>{remainingHours}s kaldı</span>
                        </div>
                        <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '12px' }}>{item.address}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <button onClick={() => call(item.phone)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: colors.buttonBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '10px', padding: '10px', fontSize: '12px', fontWeight: 600, color: colors.text, cursor: 'pointer' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                            Ara
                          </button>
                          <button onClick={() => directions(item.lat, item.lng)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: colors.accent, border: 'none', borderRadius: '10px', padding: '10px', fontSize: '12px', fontWeight: 700, color: isDarkMode ? 'black' : 'white', cursor: 'pointer' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                            Git
                          </button>
                          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`💊 ${item.name}\n📍 ${item.address}\n📞 ${item.phone}\n🗺️ https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`)}`, '_blank')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: colors.buttonBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '10px', padding: '10px', fontSize: '12px', fontWeight: 600, color: colors.text, cursor: 'pointer' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                            Paylaş
                          </button>
                        </div>
                        <button 
                          onClick={() => setSavedPharmacies(prev => prev.filter(p => p.id !== item.id))}
                          style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                          Kaldır
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.text, marginBottom: '20px' }}>Ayarlar</h2>
              
              {/* Theme Mode Selector */}
              <div style={{ background: colors.card, borderRadius: '16px', padding: '16px', border: `1px solid ${colors.cardBorder}`, marginBottom: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: colors.text }}>Tema Modu</span>
                  <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                    {themeMode === 'auto' ? 'Sistem temasına göre otomatik' : themeMode === 'dark' ? 'Her zaman karanlık' : 'Her zaman açık'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={onToggleTheme}
                    style={{ 
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: themeMode === 'auto' ? '2px solid #10b981' : `1px solid ${colors.cardBorder}`,
                      background: themeMode === 'auto' ? 'rgba(16,185,129,0.1)' : colors.card,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={themeMode === 'auto' ? '#10b981' : colors.textSecondary}><path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 0 0-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 0 1 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/></svg>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: themeMode === 'auto' ? '#10b981' : colors.textSecondary }}>Otomatik</span>
                  </button>
                  <button 
                    onClick={onToggleTheme}
                    style={{ 
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: themeMode === 'dark' ? '2px solid #10b981' : `1px solid ${colors.cardBorder}`,
                      background: themeMode === 'dark' ? 'rgba(16,185,129,0.1)' : colors.card,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={themeMode === 'dark' ? '#10b981' : colors.textSecondary}><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: themeMode === 'dark' ? '#10b981' : colors.textSecondary }}>Karanlık</span>
                  </button>
                  <button 
                    onClick={onToggleTheme}
                    style={{ 
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: themeMode === 'light' ? '2px solid #10b981' : `1px solid ${colors.cardBorder}`,
                      background: themeMode === 'light' ? 'rgba(16,185,129,0.1)' : colors.card,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={themeMode === 'light' ? '#10b981' : colors.textSecondary}><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: themeMode === 'light' ? '#10b981' : colors.textSecondary }}>Açık</span>
                  </button>
                </div>
              </div>

              <div style={{ background: colors.card, borderRadius: '16px', padding: '16px', border: `1px solid ${colors.cardBorder}`, marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: colors.text }}>Konum Servisi</span>
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>Yakındaki eczaneleri bulmak için</p>
                  </div>
                  <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: userLocation ? '#10b981' : '#334155', position: 'relative' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: userLocation ? '22px' : '2px', transition: 'left 0.2s' }}></div>
                  </div>
                </div>
              </div>
              <div style={{ background: colors.card, borderRadius: '16px', padding: '16px', border: `1px solid ${colors.cardBorder}`, marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: colors.text }}>Uygulama Versiyonu</span>
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>PharmacyFinder Mobile</p>
                  </div>
                  <span style={{ fontSize: '14px', color: '#10b981' }}>v1.0.0</span>
                </div>
              </div>
              <div style={{ background: colors.card, borderRadius: '16px', padding: '16px', border: `1px solid ${colors.cardBorder}`, marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: colors.text }}>Kaydedilen Eczaneler</span>
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>24 saat saklanır</p>
                  </div>
                  <span style={{ fontSize: '14px', color: '#10b981' }}>{savedPharmacies.length}</span>
                </div>
              </div>

              {/* Privacy Policy */}
              <div style={{ background: colors.card, borderRadius: '16px', padding: '16px', border: `1px solid ${colors.cardBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={colors.accent}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: colors.text }}>Gizlilik Politikası</span>
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>Verileriniz güvende</p>
                  </div>
                </div>
                <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', borderRadius: '12px', padding: '14px', fontSize: '12px', color: colors.textSecondary, lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 10px', fontWeight: 600, color: colors.text }}>📍 Konum Verisi</p>
                  <p style={{ margin: '0 0 12px' }}>Konum bilginiz yalnızca size en yakın nöbetçi eczaneleri göstermek için kullanılır. Konum veriniz sunucularımıza gönderilmez, yalnızca cihazınızda işlenir.</p>
                  
                  <p style={{ margin: '0 0 10px', fontWeight: 600, color: colors.text }}>💾 Yerel Depolama</p>
                  <p style={{ margin: '0 0 12px' }}>Tercihleriniz (tema, son aranan konum, kaydedilen eczaneler) cihazınızın yerel depolamasında saklanır. Bu veriler 24 saat sonra otomatik olarak silinir.</p>
                  
                  <p style={{ margin: '0 0 10px', fontWeight: 600, color: colors.text }}>🔒 Veri Güvenliği</p>
                  <p style={{ margin: '0 0 12px' }}>Kişisel verileriniz üçüncü taraflarla paylaşılmaz. Uygulama herhangi bir kullanıcı hesabı veya kayıt gerektirmez.</p>
                  
                  <p style={{ margin: '0 0 10px', fontWeight: 600, color: colors.text }}>📋 KVKK Uyumu</p>
                  <p style={{ margin: 0 }}>Bu uygulama 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;na uygun olarak geliştirilmiştir.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Tab Bar */}
        <nav style={{ 
          position: 'fixed', 
          bottom: 'max(16px, env(safe-area-inset-bottom, 16px))', 
          left: '16px', 
          right: '16px', 
          background: isDarkMode ? 'rgba(10, 15, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)', 
          WebkitBackdropFilter: 'blur(20px)', 
          backdropFilter: 'blur(20px)', 
          borderRadius: '24px', 
          padding: '10px 12px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: isDarkMode ? '0 -4px 30px rgba(0,0,0,0.3)' : '0 -2px 20px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          <button onClick={() => { setActiveTab('search'); setShowMenu(false); }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'search' ? (isDarkMode ? '#10b981' : '#059669') : (isDarkMode ? '#64748b' : '#64748b'), padding: '4px 0' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Ara</span>
          </button>
          <button onClick={() => { setActiveTab('map'); setShowMenu(false); }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'map' ? (isDarkMode ? '#10b981' : '#059669') : (isDarkMode ? '#64748b' : '#64748b'), padding: '4px 0' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Harita</span>
          </button>
          
          {/* Center Navigate Button - Goes to nearest pharmacy */}
          <button 
            onClick={navigateToNearest}
            disabled={!nearestPharmacy}
            style={{ 
              position: 'absolute', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              top: '-28px', 
              width: '56px', 
              height: '56px', 
              background: nearestPharmacy ? '#10b981' : (isDarkMode ? '#334155' : '#e2e8f0'), 
              border: isDarkMode ? '3px solid #0f172a' : '3px solid #ffffff', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: nearestPharmacy ? 'pointer' : 'not-allowed', 
              boxShadow: nearestPharmacy ? '0 0 30px rgba(16,185,129,0.4)' : (isDarkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.15)'),
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={nearestPharmacy ? '#0f172a' : (isDarkMode ? '#64748b' : '#94a3b8')}><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
          </button>
          
          {/* Spacer for center button */}
          <div style={{ width: '56px' }}></div>
          
          <button onClick={() => { setActiveTab('saved'); setShowMenu(false); }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'saved' ? (isDarkMode ? '#10b981' : '#059669') : (isDarkMode ? '#64748b' : '#64748b'), padding: '4px 0' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Kayıtlı</span>
          </button>
          <button onClick={() => { setActiveTab('settings'); setShowMenu(false); }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'settings' ? (isDarkMode ? '#10b981' : '#059669') : (isDarkMode ? '#64748b' : '#64748b'), padding: '4px 0' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Ayarlar</span>
          </button>
        </nav>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes skeleton-shimmer {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        .skeleton-pulse { animation: skeleton-shimmer 1.5s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        *::-webkit-scrollbar { width: 6px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 10px; }
        *::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.5); }
        * { scrollbar-width: thin; scrollbar-color: rgba(16,185,129,0.3) transparent; }
        @supports (padding: max(0px)) {
          nav { padding-bottom: max(10px, env(safe-area-inset-bottom)); }
        }
      `}</style>
    </div>
  );
}
