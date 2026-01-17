'use client';

import React from 'react';
import { PharmacyWithDistance } from '@/types';
import { Phone, Navigation, Clock, MapPin } from 'lucide-react';

interface PharmacyListItemProps {
  pharmacy: PharmacyWithDistance;
  isSelected: boolean;
  onSelect: () => void;
}

export default function PharmacyListItem({ pharmacy, isSelected, onSelect }: PharmacyListItemProps) {
  const formatDistance = (distance: number): string => {
    if (!distance || distance === 0) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = pharmacy.phone.replace(/\D/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'bg-[#0d2818] ring-1 ring-[var(--accent)]' 
          : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]'
      }`}
    >
      {/* Image placeholder / gradient header */}
      <div className="relative h-28 bg-gradient-to-br from-[#1a2e35] to-[#0f1a1d] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pharmacy-pattern.svg')] opacity-5" />
        
        {/* Open badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full">
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
          <span className="text-xs font-medium text-white">OPEN</span>
        </div>

        {/* Distance badge */}
        {pharmacy.distance > 0 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-[var(--accent)] rounded-lg">
            <span className="text-xs font-bold text-white">{formatDistance(pharmacy.distance)}</span>
          </div>
        )}

        {/* Action buttons on hover/selected */}
        <div className={`absolute bottom-3 right-3 flex items-center gap-2 transition-opacity duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <button
            onClick={handleCall}
            className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)]/80 backdrop-blur-sm hover:bg-[var(--bg-card-hover)] flex items-center justify-center transition-colors"
          >
            <Phone className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleDirections}
            className="w-9 h-9 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] flex items-center justify-center transition-colors"
          >
            <Navigation className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[var(--text-primary)] text-base mb-1">
          {pharmacy.pharmacy}
        </h3>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-secondary)]">Until 08:00</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">{pharmacy.district}</span>
          </div>
        </div>

        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
          {pharmacy.address}, {pharmacy.district}/{pharmacy.city}
        </p>
      </div>
    </div>
  );
}
