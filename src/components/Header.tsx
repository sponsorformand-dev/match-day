import React from 'react';
import { Matchday } from '../types.ts';
import { ShieldCheck, Lock, QrCode } from 'lucide-react';

interface HeaderProps {
  matchday?: Matchday;
  session?: { id: string; role: 'ADMIN' | 'STAFF' } | null;
  onOpenLogin?: () => void;
  onOpenAdmin?: () => void;
  onOpenScanner?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  matchday,
  session,
  onOpenLogin,
  onOpenAdmin,
  onOpenScanner,
}) => {
  return (
    <header className="bg-[#081326] text-white p-4 pt-6 pb-4 sm:pt-8 flex flex-col items-center border-b border-white/10 relative shadow-md">
      {/* Top right quick staff/admin trigger */}
      <div className="absolute top-3 right-3 z-10">
        {session?.role === 'ADMIN' ? (
          <button
            id="header-admin-btn"
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            title="Åbn Admin Kontrolpanel"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Admin</span>
          </button>
        ) : session?.role === 'STAFF' ? (
          <button
            id="header-staff-btn"
            onClick={onOpenScanner || onOpenAdmin}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
            title="Åbn Kuponscanner"
          >
            <QrCode className="w-3 h-3 text-red-400" />
            <span>Personale</span>
          </button>
        ) : (
          <button
            id="header-login-btn"
            onClick={onOpenLogin}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Personale & Admin login"
            aria-label="Personale login"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}
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

