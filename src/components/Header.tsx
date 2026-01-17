'use client';

import React from 'react';
import { Bell, User } from 'lucide-react';

interface HeaderProps {
  onFindNearMe: () => void;
  isLoading: boolean;
  location?: string;
}

export default function Header({ location = 'Turkey' }: HeaderProps) {
  return (
    <>
      {/* Left Header - Logo section */}
      <header className="h-[72px] bg-[#0d1117] flex items-center px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#10b981] rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1z"/>
              <path d="M11 7h2v4h4v2h-4v4h-2v-4H7v-2h4z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Pharmacy<span className="text-[#10b981]">Finder</span>
            </h1>
            <p className="text-[9px] text-[#64748b] uppercase tracking-[0.12em]">
              ON-DUTY • 24/7 ACCESS
            </p>
          </div>
        </div>
      </header>

      {/* Right Header - Fixed position on map */}
      <div className="fixed top-4 right-4 flex items-center gap-3 z-[1001]">
        {/* Location badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1117]/90 backdrop-blur-sm rounded-full border border-[#1e293b]">
          <div className="w-2 h-2 bg-[#10b981] rounded-full" />
          <span className="text-[11px] text-[#64748b]">LOCATION:</span>
          <span className="text-[11px] text-white font-medium">{location}</span>
        </div>

        {/* Notification */}
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0d1117]/90 backdrop-blur-sm border border-[#1e293b] hover:bg-[#1e293b] transition-colors">
          <Bell className="w-[18px] h-[18px] text-[#94a3b8]" />
        </button>

        {/* User */}
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0d1117]/90 backdrop-blur-sm border border-[#1e293b] hover:bg-[#1e293b] transition-colors">
          <User className="w-[18px] h-[18px] text-[#94a3b8]" />
        </button>
      </div>
    </>
  );
}
