'use client';

import React, { useState, useEffect } from 'react';
import { PharmacyWithDistance } from '@/types';

// Saved pharmacy type
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

interface SidebarProps {
  pharmacies: PharmacyWithDistance[];
  selectedPharmacy: PharmacyWithDistance | null;
  onSelectPharmacy: (pharmacy: PharmacyWithDistance) => void;
  onCityDistrictSearch: (city: string, district: string) => void;
  onReset: () => void;
  selectedCity: string;
  selectedDistrict: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  error: string | null;
  savedPharmacies: SavedPharmacy[];
  onToggleSaved: (pharmacy: PharmacyWithDistance) => void;
  isPharmacySaved: (id: string) => boolean;
  sortBy: 'default' | 'distance' | 'name';
  onSortChange: (sort: 'default' | 'distance' | 'name') => void;
  isDarkMode: boolean;
  themeMode?: 'auto' | 'dark' | 'light';
  onToggleTheme: () => void;
  onShare: (pharmacy: PharmacyWithDistance, method: 'whatsapp' | 'sms' | 'copy') => void;
  lastUpdateDate?: string;
}

export default function Sidebar({
  pharmacies,
  selectedPharmacy,
  onSelectPharmacy,
  onCityDistrictSearch,
  onReset,
  selectedCity,
  selectedDistrict,
  searchQuery,
  onSearchChange,
  isLoading,
  error,
  savedPharmacies,
  onToggleSaved,
  isPharmacySaved,
  sortBy,
  onSortChange,
  isDarkMode,
  themeMode = 'auto',
  onToggleTheme,
  onShare,
  lastUpdateDate
}: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [localCity, setLocalCity] = useState('');
  const [localDistrict, setLocalDistrict] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<'turkey' | 'cyprus'>('turkey');
  const [showSaved, setShowSaved] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Hydration fix - only run on client after mount
  useEffect(() => {
    setMounted(true);
    // Initialize from props after mount
    if (selectedCity) {
      setLocalCity(selectedCity);
      // Determine country from city
      if (selectedCity.toLowerCase() === 'kibris') {
        setSelectedCountry('cyprus');
      }
    }
    if (selectedDistrict) {
      setLocalDistrict(selectedDistrict);
    }
  }, []);

  // Sync with parent state (after mount)
  useEffect(() => {
    if (!mounted) return;
    if (selectedCity && selectedCity !== localCity) {
      setLocalCity(selectedCity);
      if (selectedCity.toLowerCase() === 'kibris') {
        setSelectedCountry('cyprus');
      }
    }
  }, [selectedCity, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (selectedDistrict && selectedDistrict !== localDistrict) setLocalDistrict(selectedDistrict);
  }, [selectedDistrict, mounted]);

  useEffect(() => {
    if (!mounted) return;
    fetch('/api/cities').then(r => r.json()).then(d => d.success && setCities(d.data)).catch(console.error);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !localCity) return;
    fetch('/api/districts?city=' + encodeURIComponent(localCity)).then(r => r.json()).then(d => d.success && setDistricts(d.data)).catch(console.error);
  }, [localCity, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (localCity && localDistrict) onCityDistrictSearch(localCity, localDistrict);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDistrict, localCity, mounted]);

  const formatDist = (d: number) => d > 0 ? d.toFixed(1) + ' km' : '';
  const walkTime = (d: number) => d > 0 ? '~' + Math.round(d * 12) + ' dk' : '';
  const call = (p: string) => { window.location.href = 'tel:' + p.replace(/\D/g, ''); };
  const directions = (lat: number, lng: number) => window.open('https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng, '_blank');

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    });
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
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const glassStyle: React.CSSProperties = {
    background: isDarkMode ? 'rgba(10, 15, 30, 0.75)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)'
  };

  const textColor = isDarkMode ? 'white' : '#1e293b';
  const subTextColor = isDarkMode ? '#94a3b8' : '#64748b';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    padding: '12px 12px 12px 40px',
    fontSize: '14px',
    color: textColor,
    outline: 'none'
  };

  const selectStyle: React.CSSProperties = {
    appearance: 'none' as const,
    width: '100%',
    background: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    padding: '12px 32px 12px 40px',
    fontSize: '14px',
    color: textColor,
    cursor: 'pointer',
    outline: 'none'
  };

  return (
    <aside style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      bottom: '16px',
      width: '400px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      ...glassStyle
    }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 16px', borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', background: isDarkMode ? 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)' : 'linear-gradient(to bottom, rgba(0,0,0,0.02), transparent)' }}>
        {/* Logo & Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={isDarkMode ? "/icon-512.svg" : "/icon-512-light.svg"}
              alt="PharmacyFinder Logo" 
              style={{ width: '48px', height: '48px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: textColor, margin: 0 }}>Nöbetçi<span style={{ color: '#10b981' }}> Eczane</span></h1>
              <p style={{ fontSize: '11px', color: subTextColor, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#10b981"><circle cx="12" cy="12" r="10"/></svg>
                {lastUpdateDate ? `${lastUpdateDate} • Güncel Veri` : 'Güncel Veri'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowSaved(!showSaved)} style={{ width: '36px', height: '36px', background: showSaved ? 'rgba(16,185,129,0.2)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), border: showSaved ? '1px solid rgba(16,185,129,0.3)' : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'), borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showSaved ? '#10b981' : subTextColor, position: 'relative' }} title="Kaydedilenler">
              <svg width="18" height="18" viewBox="0 0 24 24" fill={showSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              {savedPharmacies.length > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#10b981', color: '#050b14', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{savedPharmacies.length}</span>}
            </button>
            <button onClick={() => setShowPrivacy(!showPrivacy)} style={{ width: '36px', height: '36px', background: showPrivacy ? 'rgba(16,185,129,0.2)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), border: showPrivacy ? '1px solid rgba(16,185,129,0.3)' : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'), borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showPrivacy ? '#10b981' : subTextColor }} title="Gizlilik Politikası">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
            </button>
            <button onClick={onToggleTheme} style={{ width: '36px', height: '36px', background: themeMode === 'auto' ? 'rgba(16,185,129,0.2)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), border: themeMode === 'auto' ? '1px solid rgba(16,185,129,0.3)' : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'), borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeMode === 'auto' ? '#10b981' : subTextColor }} title={themeMode === 'auto' ? 'Otomatik Tema' : themeMode === 'dark' ? 'Karanlık Tema' : 'Açık Tema'}>
              {themeMode === 'auto' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 0 0-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 0 1 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/></svg>
              ) : isDarkMode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Saved Pharmacies Panel */}
        {showSaved && (
          <div style={{ marginBottom: '16px', padding: '16px', background: isDarkMode ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#10b981' }}>Kaydedilen Eczaneler</h3>
              <span style={{ fontSize: '11px', color: subTextColor }}>24 saat saklanır</span>
            </div>
            {savedPharmacies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill={isDarkMode ? '#334155' : '#94a3b8'} style={{ margin: '0 auto 8px', display: 'block' }}><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                <p style={{ color: subTextColor, fontSize: '12px', margin: 0 }}>Henüz eczane kaydetmediniz</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {savedPharmacies.map(saved => (
                  <div key={saved.id} style={{ padding: '12px', background: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)', borderRadius: '10px' }}>
                    <div onClick={() => { onSelectPharmacy({ ...saved, distance: 0, date: '' } as PharmacyWithDistance); setShowSaved(false); }} style={{ cursor: 'pointer', marginBottom: '10px' }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '2px' }}>{saved.pharmacy}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: subTextColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{saved.address}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => window.open(`tel:${saved.phone}`)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '11px', fontWeight: 600, color: textColor, cursor: 'pointer' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                        Ara
                      </button>
                      <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${saved.lat},${saved.lng}`, '_blank')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#10b981', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '11px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                        Git
                      </button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`💊 ${saved.pharmacy}\n📍 ${saved.address}\n📞 ${saved.phone}\n🗺️ https://www.google.com/maps/dir/?api=1&destination=${saved.lat},${saved.lng}`)}`, '_blank')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '11px', fontWeight: 600, color: textColor, cursor: 'pointer' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                        Paylaş
                      </button>
                      <button onClick={e => { e.stopPropagation(); onToggleSaved({ ...saved, distance: 0, date: '' } as PharmacyWithDistance); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', color: '#ef4444' }} title="Kaldır">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Privacy Policy Panel */}
        {showPrivacy && (
          <div style={{ marginBottom: '16px', padding: '16px', background: isDarkMode ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#10b981' }}>Gizlilik Politikası</h3>
              <span style={{ fontSize: '11px', color: subTextColor }}>KVKK Uyumlu</span>
            </div>
            <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)', borderRadius: '10px', padding: '12px', fontSize: '11px', color: subTextColor, lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: textColor }}>📍 Konum Verisi</p>
              <p style={{ margin: '0 0 10px' }}>Konum bilginiz yalnızca size en yakın nöbetçi eczaneleri göstermek için kullanılır. Sunucularımıza gönderilmez, yalnızca cihazınızda işlenir.</p>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: textColor }}>💾 Yerel Depolama</p>
              <p style={{ margin: '0 0 10px' }}>Tercihleriniz (tema, son aranan konum, kaydedilen eczaneler) cihazınızda saklanır ve 24 saat sonra silinir.</p>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: textColor }}>🔒 Veri Güvenliği</p>
              <p style={{ margin: 0 }}>Kişisel verileriniz üçüncü taraflarla paylaşılmaz. Uygulama hesap veya kayıt gerektirmez.</p>
            </div>
          </div>
        )}

        {/* Country Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          <button 
            onClick={() => { setSelectedCountry('turkey'); setLocalCity(''); setLocalDistrict(''); }}
            style={{ 
              flex: 1, 
              padding: '10px 16px', 
              borderRadius: '10px', 
              border: 'none',
              background: selectedCountry === 'turkey' ? '#10b981' : 'transparent',
              color: selectedCountry === 'turkey' ? 'white' : subTextColor,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
              🇹🇷 Türkiye
          </button>
          <button 
            onClick={() => { setSelectedCountry('cyprus'); setLocalCity('kibris'); setLocalDistrict(''); }}
            style={{ 
              flex: 1, 
              padding: '10px 16px', 
              borderRadius: '10px', 
              border: 'none',
              background: selectedCountry === 'cyprus' ? '#10b981' : 'transparent',
              color: selectedCountry === 'cyprus' ? 'white' : subTextColor,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
              🇨🇾 Kıbrıs
          </button>
        </div>

        {/* City/District Selectors */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {selectedCountry === 'turkey' && (
            <div style={{ flex: 1, position: 'relative' }}>
              <select value={localCity} onChange={e => { setLocalCity(e.target.value); setLocalDistrict(''); }} style={{ ...selectStyle, fontSize: '13px', fontWeight: 500 }}>
                <option value="">İl Seçin</option>
                {cities.filter(c => c !== 'kibris').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: 1, position: 'relative' }}>
            <select value={localDistrict} onChange={e => setLocalDistrict(e.target.value)} disabled={!localCity} style={{ ...selectStyle, fontSize: '13px', fontWeight: 500, opacity: localCity ? 1 : 0.6 }}>
              <option value="">İlçe Seçin</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button onClick={() => { setLocalCity(''); setLocalDistrict(''); setSelectedCountry('turkey'); onReset(); }} style={{ width: '44px', height: '44px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0, transition: 'all 0.2s' }} title="Sıfırla">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="#94a3b8">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input type="text" placeholder="Eczane ara..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Sort Options */}
      <div style={{ padding: '12px 16px', borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e5e7eb', display: 'flex', gap: '8px', background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
        <button onClick={() => onSortChange('default')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: sortBy === 'default' ? 'none' : '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'), background: sortBy === 'default' ? '#10b981' : 'transparent', color: sortBy === 'default' ? 'white' : subTextColor, fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Varsayılan</button>
        <button onClick={() => onSortChange('distance')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: sortBy === 'distance' ? 'none' : '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'), background: sortBy === 'distance' ? '#10b981' : 'transparent', color: sortBy === 'distance' ? 'white' : subTextColor, fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Mesafe</button>
        <button onClick={() => onSortChange('name')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: sortBy === 'name' ? 'none' : '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'), background: sortBy === 'name' ? '#10b981' : 'transparent', color: sortBy === 'name' ? 'white' : subTextColor, fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>İsim (A-Z)</button>
      </div>

      {/* Share Nearest to WhatsApp - only show if location is available */}
      {pharmacies.some(p => p.distance && p.distance > 0) && (
        <div style={{ padding: '0 16px 12px' }}>
          <button onClick={shareNearestToWhatsApp} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#25d366', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Yakınımdaki 5 Eczaneyi Paylaş
          </button>
        </div>
      )}

      {/* Pharmacy List */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ borderRadius: '16px', background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)', border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', padding: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div className="skeleton-pulse" style={{ width: '40px', height: '40px', borderRadius: '8px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-pulse" style={{ width: '70%', height: '16px', borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginBottom: '8px' }} />
                    <div className="skeleton-pulse" style={{ width: '40%', height: '12px', borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
                  </div>
                  <div className="skeleton-pulse" style={{ width: '50px', height: '20px', borderRadius: '4px', background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)' }} />
                </div>
                <div className="skeleton-pulse" style={{ width: '100%', height: '12px', borderRadius: '4px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color: '#f87171', fontSize: '14px' }}>{error}</p>
          </div>
        ) : pharmacies.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#64748b"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
            </div>
            <h3 style={{ color: textColor, fontWeight: 600, marginBottom: '4px' }}>Eczane seçilmedi</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Yukarıdan il ve ilçe seçin.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* All Pharmacies */}
            {pharmacies.map(p => {
              const isSelected = selectedPharmacy?.id === p.id;
              return isSelected ? (
                <div key={p.id} onClick={() => onSelectPharmacy(p)} style={{ position: 'relative', borderRadius: '16px', padding: '16px', cursor: 'pointer', background: isDarkMode ? 'linear-gradient(to right, rgba(16,185,129,0.1), transparent)' : 'linear-gradient(to right, rgba(16,185,129,0.15), rgba(255,255,255,0.9))', border: '1px solid rgba(16,185,129,0.3)', boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <div style={{ position: 'absolute', left: 0, top: '24px', bottom: '24px', width: '4px', borderRadius: '0 4px 4px 0', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', paddingLeft: '12px' }}>
                    <div>
                      <h3 style={{ fontWeight: 'bold', color: textColor, fontSize: '18px', margin: 0 }}>{p.pharmacy}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', background: '#10b981', color: 'black' }}>Açık</span>
                      </div>
                    </div>
                    {p.distance && p.distance > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: isDarkMode ? '#10b981' : '#059669' }}>{formatDist(p.distance)}</span>
                        <div style={{ fontSize: '10px', color: subTextColor }}>{walkTime(p.distance)}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ paddingLeft: '12px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderRadius: '10px', border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        <p style={{ flex: 1, color: isDarkMode ? '#e5e7eb' : '#374151', fontSize: '13px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</p>
                        <button onClick={e => { e.stopPropagation(); copyToClipboard(p.address, `addr-${p.id}`); }} style={{ background: copiedText === `addr-${p.id}` ? 'rgba(16,185,129,0.2)' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'), border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copiedText === `addr-${p.id}` ? '#10b981' : subTextColor, transition: 'all 0.2s' }} title="Adresi Kopyala">
                          {copiedText === `addr-${p.id}` ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>}
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderRadius: '10px', border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                        <p style={{ flex: 1, color: isDarkMode ? '#ffffff' : '#1f2937', fontSize: '14px', fontWeight: 600, margin: 0 }}>{p.phone}</p>
                        <button onClick={e => { e.stopPropagation(); copyToClipboard(p.phone, `phone-${p.id}`); }} style={{ background: copiedText === `phone-${p.id}` ? 'rgba(16,185,129,0.2)' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'), border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copiedText === `phone-${p.id}` ? '#10b981' : subTextColor, transition: 'all 0.2s' }} title="Telefonu Kopyala">
                          {copiedText === `phone-${p.id}` ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={e => { e.stopPropagation(); directions(p.lat, p.lng); }} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z" /></svg>
                        Yol Tarifi
                      </button>
                      <button onClick={e => { e.stopPropagation(); call(p.phone); }} style={{ width: '36px', height: '36px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor }} title="Ara">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" /></svg>
                      </button>
                      <button onClick={e => { e.stopPropagation(); onToggleSaved(p); }} style={{ width: '36px', height: '36px', background: isPharmacySaved(p.id) ? 'rgba(16,185,129,0.2)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), border: isPharmacySaved(p.id) ? '1px solid rgba(16,185,129,0.3)' : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'), borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isPharmacySaved(p.id) ? '#10b981' : textColor }} title={isPharmacySaved(p.id) ? 'Kaydedildi' : 'Kaydet'}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={isPharmacySaved(p.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                      </button>
                      <button onClick={e => { e.stopPropagation(); onShare(p, 'whatsapp'); }} style={{ width: '36px', height: '36px', background: 'rgba(37,211,102,0.2)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366' }} title="WhatsApp">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={p.id} onClick={() => onSelectPharmacy(p)} style={{ borderRadius: '16px', background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)', border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDarkMode ? 'linear-gradient(135deg, #0a1628, #050b14)' : 'linear-gradient(135deg, #ffffff, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isDarkMode ? '0 0 10px rgba(16,185,129,0.2)' : '0 2px 8px rgba(0,0,0,0.1)', border: isDarkMode ? '1px solid rgba(16,185,129,0.15)' : '1px solid #e2e8f0' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24">
                          <rect x="10" y="4" width="4" height="16" rx="1" fill={isDarkMode ? '#10b981' : '#10b981'}/>
                          <rect x="4" y="10" width="16" height="4" rx="1" fill={isDarkMode ? '#10b981' : '#10b981'}/>
                          <circle cx="12" cy="12" r="2" fill={isDarkMode ? '#050b14' : '#ffffff'}/>
                          <circle cx="12" cy="12" r="1" fill={isDarkMode ? '#10b981' : '#10b981'}/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, color: textColor, margin: 0 }}>{p.pharmacy}</h4>
                      </div>
                    </div>
                    {p.distance !== undefined && p.distance !== null && p.distance > 0 && <span style={{ color: isDarkMode ? '#10b981' : '#059669', fontWeight: 600, fontSize: '12px' }}>{formatDist(p.distance)}</span>}
                  </div>
                  <p style={{ color: subTextColor, fontSize: '12px', margin: 0, paddingLeft: '52px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</p>
                </div>
              );
            })}
          </div>
        )}

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes skeleton-shimmer { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        .skeleton-pulse { animation: skeleton-shimmer 1.5s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.5); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(16,185,129,0.3) transparent; }
      `}</style>
    </aside>
  );
}
