'use client';

import React from 'react';
import { PharmacyWithDistance } from '@/types';
import { MapPin, Phone, Navigation, Clock } from 'lucide-react';

interface NearestCardProps {
  pharmacy: PharmacyWithDistance;
  onSelect: () => void;
  isSelected: boolean;
}

export default function NearestCard({ pharmacy, onSelect, isSelected }: NearestCardProps) {
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  const getWalkingTime = (distance: number): number => {
    return Math.round(distance * 12);
  };

  const handleGoNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`;
    window.open(url, '_blank');
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = pharmacy.phone.replace(/\D/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  return (
    <div 
      onClick={onSelect}
      className={`mx-4 mt-4 rounded-2xl overflow-hidden cursor-pointer transition-all ${
        isSelected 
          ? 'ring-2 ring-[var(--accent)]' 
          : 'hover:ring-1 hover:ring-[var(--accent)]/50'
      }`}
    >
      {/* Top section with gradient */}
      <div className="relative bg-gradient-to-br from-[#0d3320] to-[#0a1f15] p-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--accent)] rounded-full mb-3">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            Open Now
          </span>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              {pharmacy.pharmacy}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{pharmacy.address.slice(0, 40)}...</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {formatDistance(pharmacy.distance)}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Clock className="w-3 h-3" />
              ~{getWalkingTime(pharmacy.distance)} min
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action section */}
      <div className="bg-[var(--bg-card)] p-3 flex items-center gap-2">
        <button
          onClick={handleGoNow}
          className="flex-1 flex items-center justify-center gap-2 h-11 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
        >
          <Navigation className="w-4 h-4" />
          Directions
        </button>

        <button
          onClick={handleCall}
          className="w-11 h-11 flex items-center justify-center bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl transition-colors"
        >
          <Phone className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
      </div>
    </div>
  );
}
