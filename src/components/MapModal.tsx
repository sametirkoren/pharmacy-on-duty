'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { UserLocation, PharmacyWithDistance } from '@/types';

// Dynamically import the entire map component to avoid SSR issues
const DynamicMap = dynamic(
  () => import('./DynamicMap').then((mod) => ({ default: mod.default })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Harita yükleniyor...</p>
        </div>
      </div>
    )
  }
);

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation | null;
  pharmacies: PharmacyWithDistance[];
  selectedPharmacy: PharmacyWithDistance;
}

export default function MapModal({ isOpen, onClose, userLocation, pharmacies, selectedPharmacy }: MapModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  console.log('MapModal render:', { isOpen, pharmacy: selectedPharmacy?.pharmacy, userLocation });

  // Handle escape key and outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Modal - Full screen */}
      <div 
        ref={modalRef}
        className="relative w-full h-full bg-white overflow-hidden"
      >
        {/* Map Container - Full screen */}
        <div className="absolute inset-0">
          <DynamicMap userLocation={userLocation} pharmacies={pharmacies} selectedPharmacy={selectedPharmacy} />
        </div>

        {/* Header - Floating over map */}
        <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between p-4 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200">
          <button
            onClick={() => {
              const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedPharmacy.lat},${selectedPharmacy.lng}&travelmode=driving`;
              window.open(googleMapsUrl, '_blank');
            }}
            className="flex-1 text-left group"
            aria-label={`${selectedPharmacy.pharmacy} eczanesine Google Maps ile yol tarifi al`}
          >
            <h2 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
              {selectedPharmacy.pharmacy}
            </h2>
            <p className="text-sm text-gray-600 truncate group-hover:text-blue-500 transition-colors duration-200">
              {selectedPharmacy.district}, {selectedPharmacy.city}
            </p>
            <p className="text-xs text-gray-500 mt-1">📍 Google Maps&apos;te yol tarifi için tıklayın</p>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-800 rounded-md transition-all duration-200 touch-manipulation min-h-[44px] flex items-center justify-center"
              aria-label="Liste görünümüne dön"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Liste
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
              aria-label="Haritayı kapat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Footer with pharmacy info - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4 border-t border-gray-200 bg-white bg-opacity-95 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex-1">
              <div className="text-sm text-gray-600">
                📍 {selectedPharmacy.address}
              </div>
              <div className="text-sm text-gray-600">
                📞 {selectedPharmacy.phone}
              </div>
            </div>
            {userLocation && selectedPharmacy.distance > 0 && (
              <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {selectedPharmacy.distance.toFixed(1)} km uzaklıkta
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}