import React from 'react';
import { Matchday } from '../types.ts';
import { Shield, ShieldAlert, Sparkles } from 'lucide-react';

interface HeaderProps {
  matchday?: Matchday;
  onOpenAdmin: () => void;
  isAdminActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ matchday, onOpenAdmin, isAdminActive }) => {
  return (
    <header className="bg-[#081326] text-white p-4 pt-6 pb-4 sm:pt-8 text-white flex flex-col items-center border-b border-white/10 relative shadow-md">
      {/* Top right Admin shortcut button */}
      <div className="absolute top-4 right-4">
        <button
          id="admin-toggle-btn"
          onClick={onOpenAdmin}
          aria-label="Admin adgang"
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all ${
            isAdminActive
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white/10 text-gray-200 hover:bg-white/20'
          }`}
        >
          {isAdminActive ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5 text-gray-300" />}
          <span className="text-[10px]">{isAdminActive ? 'Admin' : 'Personale'}</span>
        </button>
      </div>

      {/* Centerpiece Bold Brand Emblem */}
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm border border-white/20 p-1">
        <img
          src="/agf-logo.svg"
          alt="AGF Håndbold Logo"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="text-[10px] tracking-[0.2em] opacity-60 uppercase font-black">
        AGF Håndbold
      </div>
      <div className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none mt-0.5">
        Matchday
      </div>
      <div className="text-[10px] mt-1.5 font-mono opacity-50 uppercase tracking-wider">
        {matchday?.date ? matchday.date.toUpperCase() : 'CERES ARENA · AARHUS'}
      </div>
    </header>
  );
};
