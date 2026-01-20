'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { UserLocation, PharmacyWithDistance } from '@/types';

// Fix for default markers in react-leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Custom icons for different marker types - larger and more prominent
const createUserIcon = () => {
  if (typeof window === 'undefined') return undefined;

  const html = `<div style="width: 20px; height: 20px; background: #3b82f6; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);"></div>`;

  return L.divIcon({
    className: 'custom-user-marker',
    html,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const createPharmacyIcon = (isClosest: boolean = false, isDarkMode: boolean = true) => {
  if (typeof window === 'undefined') return undefined;

  // Theme-based colors
  const bgGradient = isDarkMode ? 'linear-gradient(135deg, #0a1628, #050b14)' : 'linear-gradient(135deg, #ffffff, #f1f5f9)';
  const crossColor = isDarkMode ? '#10b981' : '#059669';
  const centerBg = isDarkMode ? '#1f2937' : '#ffffff';
  const borderColor = isDarkMode ? 'rgba(16,185,129,0.3)' : '#e5e7eb';
  const boxShadow = isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)';
  const smallBoxShadow = isDarkMode ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.08)';
  const labelBg = isDarkMode ? '#0d1117' : '#ffffff';
  const labelColor = isDarkMode ? 'white' : '#1e293b';
  const labelBorder = isDarkMode ? '1px solid #1e293b' : '1px solid #e2e8f0';
  const labelShadow = isDarkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.1)';

  const html = isClosest
    ? `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="
          background: ${labelBg}; 
          color: ${labelColor}; 
          padding: 8px 16px; 
          border-radius: 12px; 
          font-family: 'Inter', sans-serif;
          font-size: 13px; 
          font-weight: 700; 
          white-space: nowrap; 
          margin-bottom: 12px; 
          box-shadow: ${labelShadow};
          border: ${labelBorder};
          text-align: center;
          position: absolute;
          bottom: 100%;
          z-index: 10;
        ">
          EN YAKIN
          <div style="color: ${crossColor}; font-size: 10px; font-weight: 800; margin-top: 2px;">ŞU AN AÇIK</div>
        </div>
        
        <div class="marker-pulse" style="
          width: 52px; 
          height: 52px; 
          background: ${bgGradient};
          border-radius: 14px;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          box-shadow: ${boxShadow};
          border: 2px solid ${borderColor};
          position: relative;
        ">
          <svg width="28" height="28" viewBox="0 0 24 24">
            <rect x="10" y="4" width="4" height="16" rx="1" fill="${crossColor}"/>
            <rect x="4" y="10" width="16" height="4" rx="1" fill="${crossColor}"/>
            <circle cx="12" cy="12" r="2.5" fill="${centerBg}"/>
            <circle cx="12" cy="12" r="1.2" fill="${crossColor}"/>
          </svg>
        </div>
      </div>`
    : `
      <div style="
        width: 40px; 
        height: 40px; 
        background: ${bgGradient};
        border-radius: 12px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: ${smallBoxShadow};
        border: 1.5px solid ${isDarkMode ? 'rgba(0,255,157,0.2)' : '#e2e8f0'};
        position: relative;
      ">
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
    iconSize: isClosest ? [56, 56] : [40, 40],
    iconAnchor: isClosest ? [28, 28] : [20, 20],
  });
};

interface DynamicMapProps {
  userLocation: UserLocation | null;
  pharmacies: PharmacyWithDistance[];
  selectedPharmacy?: PharmacyWithDistance;
  isDarkMode?: boolean;
}

// Component to fit map bounds to show all markers
function MapBounds({ userLocation, pharmacies }: { userLocation: UserLocation | null, pharmacies: PharmacyWithDistance[] }) {
  const map = useMap();

  useEffect(() => {
    if (pharmacies.length === 0) return;

    const points: L.LatLngExpression[] = [];

    // Add user location if available
    if (userLocation) {
      points.push([userLocation.lat, userLocation.lng]);
    }

    // Add all pharmacy locations
    pharmacies.forEach(pharmacy => {
      points.push([pharmacy.lat, pharmacy.lng]);
    });

    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [map, userLocation, pharmacies]);

  return null;
}

export default function DynamicMap({ userLocation, pharmacies, selectedPharmacy, isDarkMode = true }: DynamicMapProps) {
  const userIcon = createUserIcon();

  // Find the closest pharmacy (first one in the sorted array)
  const closestPharmacy = pharmacies.length > 0 ? pharmacies[0] : null;

  // Handle Google Maps directions
  const handleDirectionsClick = (pharmacy: PharmacyWithDistance) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  // Use the first pharmacy as center if no selected pharmacy
  const centerPharmacy = selectedPharmacy || pharmacies[0];

  if (!centerPharmacy) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">Eczane verisi bulunamadı</div>;
  }

  return (
    <MapContainer
      center={[centerPharmacy.lat, centerPharmacy.lng]}
      zoom={13}
      className="w-full h-full z-0"
      zoomControl={true}
      scrollWheelZoom={true}
      touchZoom={true}
      doubleClickZoom={true}
      dragging={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* User location marker */}
      {userLocation && userIcon && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userIcon}
        >
          <Popup>
            <div className="text-center">
              <strong>Konumunuz</strong>
              <br />
              <span className="text-sm text-gray-600">
                Mevcut konum
              </span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Pharmacy markers with clustering */}
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={(cluster: { getChildCount: () => number }) => {
          const count = cluster.getChildCount();
          let size = 'small';

          if (count < 10) {
            size = 'small';
          } else if (count < 100) {
            size = 'medium';
          } else {
            size = 'large';
          }

          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: `marker-cluster marker-cluster-${size}`,
            iconSize: L.point(40, 40, true),
          });
        }}
      >
        {pharmacies.map((pharmacy) => {
          const isClosest = closestPharmacy ? pharmacy.id === closestPharmacy.id : false;
          const pharmacyIcon = createPharmacyIcon(isClosest, isDarkMode);

          return (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.lat, pharmacy.lng]}
              icon={pharmacyIcon}
            >
              <Popup>
                <div className="min-w-[240px] max-w-[300px]">
                  {/* Header with badges */}
                  <div className="flex justify-between items-start mb-3">
                    {/* Closest pharmacy badge */}
                    {isClosest && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                        🎯 EN YAKIN
                      </span>
                    )}

                    {/* Distance badge */}
                    {userLocation && pharmacy.distance > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-auto">
                        📍 {pharmacy.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>

                  {/* Pharmacy name */}
                  <div className="mb-3">
                    <div className="font-semibold text-gray-900 leading-tight">
                      🏥 {pharmacy.pharmacy}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-3">
                    <div className="text-sm text-gray-600">
                      📍 {pharmacy.address}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pharmacy.district}, {pharmacy.city}
                    </div>
                  </div>

                  {/* Phone number - clickable */}
                  <button
                    onClick={() => {
                      const cleanPhone = pharmacy.phone.replace(/\D/g, '');
                      window.location.href = `tel:${cleanPhone}`;
                    }}
                    className="text-left w-full mb-3 group"
                    aria-label={`${pharmacy.pharmacy} eczanesini ara`}
                  >
                    <div className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                      📞 {pharmacy.phone}
                    </div>
                    <div className="text-xs text-gray-500">Aramak için tıklayın</div>
                  </button>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <button
                      onClick={() => handleDirectionsClick(pharmacy)}
                      className={`w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md text-white transition-all duration-200 ${isClosest
                        ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                        }`}
                      aria-label={`${pharmacy.pharmacy} eczanesine Google Maps ile yol tarifi al`}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 713 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      {isClosest ? 'En Yakın Eczaneye Git' : 'Google Maps\'te Yol Tarifi'}
                    </button>

                    <button
                      onClick={() => {
                        const cleanPhone = pharmacy.phone.replace(/\D/g, '');
                        window.location.href = `tel:${cleanPhone}`;
                      }}
                      className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 active:bg-green-200 border border-green-200 transition-all duration-200"
                      aria-label={`${pharmacy.pharmacy} eczanesini ara`}
                    >
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Ara
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      {/* Auto-fit bounds */}
      <MapBounds userLocation={userLocation} pharmacies={pharmacies} />
    </MapContainer>
  );
}