import React from 'react';
import { Matchday } from '../types.ts';

interface HeaderProps {
  matchday?: Matchday;
}

export const Header: React.FC<HeaderProps> = ({ matchday }) => {
  return (
    <header className="bg-[#081326] text-white p-4 pt-6 pb-4 sm:pt-8 flex flex-col items-center border-b border-white/10 relative shadow-md">
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
