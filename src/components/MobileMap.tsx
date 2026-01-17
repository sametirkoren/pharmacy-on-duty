'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { PharmacyWithDistance } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MarkerClusterGroup = any;

interface MobileMapProps {
  pharmacies: PharmacyWithDistance[];
  selectedPharmacy: PharmacyWithDistance | null;
  userLocation: { lat: number; lng: number } | null;
  onSelectPharmacy: (pharmacy: PharmacyWithDistance) => void;
  isDarkMode?: boolean;
}

export default function MobileMap({ pharmacies, selectedPharmacy, userLocation, onSelectPharmacy, isDarkMode = true }: MobileMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<MarkerClusterGroup>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      const defaultCenter: [number, number] = userLocation 
        ? [userLocation.lat, userLocation.lng] 
        : [39.9334, 32.8597]; // Ankara default

      mapRef.current = L.map('mobile-map', {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false,
        preferCanvas: true, // Better performance
      });

      // Tile layer based on theme
      const tileUrl = isDarkMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      // Create cluster group with custom styling
      // @ts-expect-error - markerClusterGroup is added by leaflet.markercluster
      clusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: { getChildCount: () => number }) => {
          const count = cluster.getChildCount();
          let size = 'small';
          let dimensions = 40;
          if (count > 50) { size = 'large'; dimensions = 56; }
          else if (count > 10) { size = 'medium'; dimensions = 48; }
          
          return L.divIcon({
            html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(dimensions, dimensions),
          });
        }
      });
      mapRef.current.addLayer(clusterGroupRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        clusterGroupRef.current = null;
      }
    };
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    if (mapRef.current && tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
      const tileUrl = isDarkMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }
  }, [isDarkMode]);

  // Update markers when pharmacies change
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    // Clear existing markers
    clusterGroupRef.current.clearLayers();

    // Custom pharmacy icon matching logo design with theme support
    const bgGradient = isDarkMode ? 'linear-gradient(135deg,#0a1628,#050b14)' : 'linear-gradient(135deg,#ffffff,#f1f5f9)';
    const crossColor = isDarkMode ? '#00ff9d' : '#10b981';
    const centerBg = isDarkMode ? '#050b14' : '#ffffff';
    const borderColor = isDarkMode ? 'rgba(0,255,157,0.4)' : '#e2e8f0';
    const boxShadow = isDarkMode ? '0 0 20px rgba(0,255,157,0.5),0 8px 24px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.15)';
    const smallBoxShadow = isDarkMode ? '0 0 10px rgba(0,255,157,0.3),0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)';
    const labelBg = isDarkMode ? 'rgba(5,11,20,0.95)' : 'rgba(255,255,255,0.95)';
    const labelColor = isDarkMode ? 'white' : '#1e293b';
    const labelBorder = isDarkMode ? '1.5px solid rgba(0,255,157,0.4)' : '1.5px solid #e2e8f0';
    const labelShadow = isDarkMode ? '0 0 20px rgba(0,255,157,0.4)' : '0 4px 16px rgba(0,0,0,0.1)';
    const pulseColor = isDarkMode ? 'rgba(0,255,157,0.2)' : 'rgba(16,185,129,0.15)';

    const createIcon = (isSelected: boolean, name?: string) => {
      if (isSelected) {
        return L.divIcon({
          className: 'custom-pharmacy-marker-selected',
          html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:140px;">
            <div style="background:${labelBg};padding:6px 10px;border-radius:10px;margin-bottom:6px;border:${labelBorder};box-shadow:${labelShadow};max-width:140px;">
              <p style="font-weight:600;font-size:11px;color:${labelColor};margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name || 'Eczane'}</p>
            </div>
            <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:64px;height:64px;background:${pulseColor};border-radius:16px;animation:pulse 1.5s ease-out infinite;"></div>
              <div style="width:48px;height:48px;background:${bgGradient};border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:${boxShadow};border:2px solid ${borderColor};position:relative;z-index:2;">
                <svg width="26" height="26" viewBox="0 0 24 24">
                  <rect x="10" y="4" width="4" height="16" rx="1" fill="${crossColor}"/>
                  <rect x="4" y="10" width="16" height="4" rx="1" fill="${crossColor}"/>
                  <circle cx="12" cy="12" r="2.5" fill="${centerBg}"/>
                  <circle cx="12" cy="12" r="1.2" fill="${crossColor}"/>
                </svg>
              </div>
            </div>
          </div>`,
          iconSize: [140, 90],
          iconAnchor: [70, 85],
        });
      }
      return L.divIcon({
        className: 'custom-pharmacy-marker',
        html: `<div style="width:36px;height:36px;background:${bgGradient};border-radius:10px;display:flex;align-items:center;justify-content:center;border:1.5px solid ${isDarkMode ? 'rgba(0,255,157,0.25)' : '#e2e8f0'};box-shadow:${smallBoxShadow};">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <rect x="10" y="4" width="4" height="16" rx="1" fill="${crossColor}"/>
            <rect x="4" y="10" width="16" height="4" rx="1" fill="${crossColor}"/>
            <circle cx="12" cy="12" r="2" fill="${centerBg}"/>
            <circle cx="12" cy="12" r="1" fill="${crossColor}"/>
          </svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    };

    // Add pharmacy markers to cluster group
    pharmacies.forEach(pharmacy => {
      const isSelected = selectedPharmacy?.id === pharmacy.id;
      const marker = L.marker([pharmacy.lat, pharmacy.lng], {
        icon: createIcon(isSelected, pharmacy.pharmacy),
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.bindPopup(`
        <div style="min-width: 180px; padding: 6px;">
          <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${pharmacy.pharmacy}</h3>
          <p style="font-size: 11px; color: #666; margin-bottom: 6px;">${pharmacy.address}</p>
          <p style="font-size: 11px;"><strong>Tel:</strong> ${pharmacy.phone}</p>
        </div>
      `);

      marker.on('click', () => {
        onSelectPharmacy(pharmacy);
      });

      clusterGroupRef.current!.addLayer(marker);
    });

    // Add user location marker (outside cluster)
    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
    }
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(59,130,246,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      userMarkerRef.current.addTo(mapRef.current);
    }

    // Fit bounds to show all markers only if no pharmacy is selected
    if (pharmacies.length > 0 && !selectedPharmacy) {
      const bounds = L.latLngBounds(pharmacies.map(p => [p.lat, p.lng]));
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [pharmacies, selectedPharmacy, userLocation, onSelectPharmacy, isDarkMode]);

  // Center on selected pharmacy
  useEffect(() => {
    if (mapRef.current && selectedPharmacy) {
      mapRef.current.setView([selectedPharmacy.lat, selectedPharmacy.lng], 15, { animate: true });
    }
  }, [selectedPharmacy]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div id="mobile-map" style={{ width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden' }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .leaflet-popup-content-wrapper {
          background: #1e293b;
          color: white;
          border-radius: 12px;
        }
        .leaflet-popup-tip {
          background: #1e293b;
        }
        .leaflet-popup-content h3 {
          color: white;
        }
        .leaflet-popup-content p {
          color: #94a3b8;
        }
        .custom-cluster-icon {
          background: transparent;
        }
        .cluster-icon {
          background: #00ff9d;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #0f172a;
          box-shadow: 0 0 20px rgba(0,255,157,0.6);
          border: 3px solid white;
        }
        .cluster-small {
          width: 40px;
          height: 40px;
          font-size: 14px;
        }
        .cluster-medium {
          width: 48px;
          height: 48px;
          font-size: 16px;
        }
        .cluster-large {
          width: 56px;
          height: 56px;
          font-size: 18px;
        }
        .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
          background: rgba(0,255,157,0.3) !important;
        }
        .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
          background: #00ff9d !important;
          color: #0f172a !important;
          font-weight: 700 !important;
        }
      `}</style>
    </div>
  );
}
