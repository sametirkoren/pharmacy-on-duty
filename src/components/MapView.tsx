'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { PharmacyWithDistance, UserLocation } from '@/types';

let L: typeof import('leaflet') | null = null;
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

const createPharmacyIcon = (isSelected: boolean, name?: string, isDarkMode: boolean = true) => {
  if (typeof window === 'undefined' || !L) return null;

  // Theme-based colors
  const bgGradient = isDarkMode ? 'linear-gradient(135deg,#0a1628,#050b14)' : 'linear-gradient(135deg,#ffffff,#f1f5f9)';
  const crossColor = isDarkMode ? '#00ff9d' : '#10b981';
  const centerBg = isDarkMode ? '#050b14' : '#ffffff';
  const borderColor = isDarkMode ? 'rgba(0,255,157,0.4)' : '#e2e8f0';
  const boxShadow = isDarkMode ? '0 0 20px rgba(0,255,157,0.5),0 8px 24px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.15)';
  const smallBoxShadow = isDarkMode ? '0 0 12px rgba(0,255,157,0.3),0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)';
  const labelBg = isDarkMode ? 'rgba(5,11,20,0.95)' : 'rgba(255,255,255,0.95)';
  const labelColor = isDarkMode ? 'white' : '#1e293b';
  const labelBorder = isDarkMode ? '1.5px solid rgba(0,255,157,0.4)' : '1.5px solid #e2e8f0';
  const labelShadow = isDarkMode ? '0 0 20px rgba(0,255,157,0.4)' : '0 4px 16px rgba(0,0,0,0.1)';
  const pulseColor = isDarkMode ? 'rgba(0,255,157,0.15)' : 'rgba(16,185,129,0.15)';

  const html = isSelected
    ? `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="background:${labelBg};padding:6px 12px;border-radius:10px;margin-bottom:8px;text-align:center;border:${labelBorder};box-shadow:${labelShadow};">
          <p style="font-weight:600;font-size:13px;color:${labelColor};margin:0;">${name || 'Eczane'}</p>
          <p style="color:${crossColor};font-size:9px;font-weight:700;margin-top:2px;letter-spacing:0.5px;">ŞU AN AÇIK</p>
        </div>
        <div style="position:relative;">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:72px;height:72px;background:${pulseColor};border-radius:18px;animation:pulse 2s ease-out infinite;"></div>
          <div style="width:52px;height:52px;background:${bgGradient};border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:${boxShadow};border:2px solid ${borderColor};position:relative;z-index:2;">
            <svg width="28" height="28" viewBox="0 0 24 24">
              <rect x="10" y="4" width="4" height="16" rx="1" fill="${crossColor}"/>
              <rect x="4" y="10" width="16" height="4" rx="1" fill="${crossColor}"/>
              <circle cx="12" cy="12" r="2.5" fill="${centerBg}"/>
              <circle cx="12" cy="12" r="1.2" fill="${crossColor}"/>
            </svg>
          </div>
        </div>
      </div>`
    : `<div style="width:40px;height:40px;background:${bgGradient};border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:${smallBoxShadow};border:1.5px solid ${isDarkMode ? 'rgba(0,255,157,0.2)' : '#e2e8f0'};">
        <svg width="22" height="22" viewBox="0 0 24 24">
          <rect x="10" y="4" width="4" height="16" rx="1" fill="${crossColor}"/>
          <rect x="4" y="10" width="16" height="4" rx="1" fill="${crossColor}"/>
          <circle cx="12" cy="12" r="2" fill="${centerBg}"/>
          <circle cx="12" cy="12" r="1" fill="${crossColor}"/>
        </svg>
      </div>`;

  return L.divIcon({
    className: 'custom-pharmacy-marker',
    html,
    iconSize: isSelected ? [60, 120] : [40, 40],
    iconAnchor: isSelected ? [30, 110] : [20, 20],
  });
};

const userIcon = typeof window !== 'undefined' && L ? L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="width:20px;height:20px;background:#3b82f6;border-radius:50%;border:4px solid white;box-shadow:0 4px 12px rgba(59,130,246,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
}) : null;

const DynamicMapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const DynamicTileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const DynamicMarker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const DynamicPopup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const MarkerClusterGroup = dynamic(() => import('react-leaflet-cluster'), { ssr: false });

const createClusterIcon = (cluster: { getChildCount: () => number }) => {
  if (typeof window === 'undefined' || !L) return null;
  const count = cluster.getChildCount();
  const size = count > 100 ? 56 : count > 50 ? 48 : 40;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:#0f3d2e;border:2px solid #00ff9d;border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <span style="color:#00ff9d;font-weight:bold;font-size:${size > 48 ? 18 : 14}px;">${count}</span>
    </div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size, true),
  });
};

interface MapViewProps {
  pharmacies: PharmacyWithDistance[];
  selectedPharmacy: PharmacyWithDistance | null;
  userLocation: UserLocation | null;
  onSelectPharmacy: (pharmacy: PharmacyWithDistance) => void;
  onFetchNearby?: () => void;
  isDarkMode?: boolean;
}

function MapViewInner({ pharmacies, selectedPharmacy, userLocation, onSelectPharmacy, onFetchNearby, isDarkMode = true }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [currentCity, setCurrentCity] = useState('Türkiye');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (mapRef.current && selectedPharmacy) {
      mapRef.current.setView([selectedPharmacy.lat, selectedPharmacy.lng], 15, { animate: true });
    }
  }, [selectedPharmacy]);

  useEffect(() => {
    if (selectedPharmacy?.city) setCurrentCity(selectedPharmacy.city);
  }, [selectedPharmacy]);

  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : selectedPharmacy ? [selectedPharmacy.lat, selectedPharmacy.lng] : [39.9334, 32.8597];

  const getWalkingTime = (d?: number) => {
    if (!d) return 12;
    const mins = Math.round(d * 12);
    return mins > 60 ? Math.round(mins / 60) : mins;
  };
  const getWalkingUnit = (d?: number) => {
    if (!d) return 'dk';
    return (d * 12) > 60 ? 'sa' : 'dk';
  };

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#050b14' }}>
        <div className="w-8 h-8 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tileUrl = isDarkMode 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="w-full h-full relative" style={{ background: isDarkMode ? '#050b14' : '#f8fafc' }}>
      <DynamicMapContainer center={defaultCenter} zoom={13} style={{ width: '100%', height: '100%' }} ref={mapRef} zoomControl={false} minZoom={3} maxZoom={18} worldCopyJump={true}>
        <DynamicTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        {userLocation && userIcon && (
          <DynamicMarker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <DynamicPopup><span className="text-sm font-medium">Your Location</span></DynamicPopup>
          </DynamicMarker>
        )}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={40}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          disableClusteringAtZoom={12}
          animate={false}
          removeOutsideVisibleBounds={true}
          spiderfyDistanceMultiplier={2}
          zoomToBoundsOnClick={true}
        >
          {pharmacies.filter(p => p.lat !== null && p.lat !== undefined && p.lng !== null && p.lng !== undefined && (p.lat !== 0 || p.lng !== 0)).map(p => (
            <DynamicMarker key={p.id} position={[p.lat, p.lng]} icon={createPharmacyIcon(selectedPharmacy?.id === p.id, p.pharmacy, isDarkMode) || undefined}
              eventHandlers={{ click: () => onSelectPharmacy(p) }}>
              {selectedPharmacy?.id !== p.id && (
                <DynamicPopup>
                  <div className="min-w-[180px] p-1">
                    <h3 className="font-semibold">{p.pharmacy}</h3>
                    <p className="text-sm mt-1">{p.address}</p>
                  </div>
                </DynamicPopup>
              )}
            </DynamicMarker>
          ))}
        </MarkerClusterGroup>
      </DynamicMapContainer>

      {/* Top Right - Location Badge */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 1000 }}>
        <div style={{ background: isDarkMode ? 'rgba(10, 15, 30, 0.75)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '9999px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: isDarkMode ? 'white' : '#1e293b' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff9d', boxShadow: '0 0 10px #00ff9d' }}></span>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>Konum:</span>
            {currentCity}, TR
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div style={{ position: 'absolute', right: '32px', bottom: '32px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000 }}>
        <button onClick={() => mapRef.current?.zoomIn()} style={{ background: isDarkMode ? 'rgba(10, 15, 30, 0.75)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isDarkMode ? 'white' : '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
        </button>
        <button onClick={() => mapRef.current?.zoomOut()} style={{ background: isDarkMode ? 'rgba(10, 15, 30, 0.75)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isDarkMode ? 'white' : '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H5v-2h14v2z" /></svg>
        </button>
        <button onClick={() => { 
          if (userLocation) {
            mapRef.current?.setView([userLocation.lat, userLocation.lng], 15);
            onFetchNearby?.();
          }
        }} style={{ background: isDarkMode ? 'rgba(10, 15, 30, 0.75)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(0,255,157,0.3)', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#00ff9d', marginTop: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" /></svg>
        </button>
      </div>

      {/* Bottom Navigation Panel */}
      {selectedPharmacy && (
        <div style={{ position: 'absolute', bottom: '32px', left: '440px', width: '380px', zIndex: 1000, display: 'none' }} className="md:!block">
          <div style={{ background: isDarkMode ? 'rgba(10, 15, 30, 0.85)' : 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '16px', padding: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '128px', height: '128px', borderRadius: '50%', background: 'rgba(0,255,157,0.1)', filter: 'blur(40px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,255,157,0.1)', border: '1px solid rgba(0,255,157,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ff9d', boxShadow: '0 0 20px rgba(0,255,157,0.3)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" /></svg>
                </div>
                <div>
                  <h4 style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px', fontWeight: 500 }}>En Yakın Eczane</h4>
                  <p style={{ color: isDarkMode ? 'white' : '#1e293b', fontWeight: 'bold', fontSize: '18px', margin: 0, lineHeight: 1.2 }}>{selectedPharmacy.pharmacy}</p>
                </div>
              </div>
              {selectedPharmacy.distance && selectedPharmacy.distance > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff9d', margin: 0, textShadow: '0 0 5px rgba(0,255,157,0.5)' }}>
                    {getWalkingTime(selectedPharmacy.distance)} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#94a3b8' }}>{getWalkingUnit(selectedPharmacy.distance)}</span>
                  </p>
                  <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, fontWeight: 600 }}>Yürüme Süresi</p>
                </div>
              )}
            </div>
            {selectedPharmacy.distance && selectedPharmacy.distance > 0 && (
              <div style={{ position: 'relative', zIndex: 10, marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>
                  <span>Mevcut Konum</span>
                  <span>{selectedPharmacy.distance.toFixed(1)} km uzaklıkta</span>
                </div>
                <div style={{ height: '6px', width: '100%', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(10, Math.min(90, 100 - selectedPharmacy.distance * 10))}%`, borderRadius: '9999px', background: 'linear-gradient(to right, rgba(0,255,157,0.4), #00ff9d)', boxShadow: '0 0 10px #00ff9d', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}
            <button onClick={() => window.open('https://www.google.com/maps/dir/?api=1&destination=' + selectedPharmacy.lat + ',' + selectedPharmacy.lng, '_blank')} style={{ width: '100%', background: 'white', color: 'black', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}>
              Navigasyonu Başlat
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapView(props: MapViewProps) {
  return <MapViewInner {...props} />;
}
