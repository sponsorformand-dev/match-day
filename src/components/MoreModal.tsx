import React from 'react';
import { ActiveTab } from '../types.ts';
import { Trophy, Tag, UserCheck, HeartHandshake, X, ChevronRight, Info, Share2, ScanLine } from 'lucide-react';

interface MoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  hasCoupons: boolean;
}

export const MoreModal: React.FC<MoreModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  hasCoupons,
}) => {
  if (!isOpen) return null;

  const items = [
    {
      id: 'del-matchday' as ActiveTab,
      label: 'Del Matchday',
      desc: 'Scan QR-kode og del appen direkte med en sidemand',
      icon: Share2,
      badge: 'QR & Deling',
      color: 'bg-red-600/10 text-red-600',
    },
    {
      id: 'tilbud' as ActiveTab,
      label: 'Tilbud & Kuponer',
      desc: 'Aktiver pausetilbud og spar penge i kiosken',
      icon: Tag,
      badge: hasCoupons ? 'Aktive tilbud' : undefined,
      color: 'bg-rose-500/10 text-[#C8102E]',
    },
    {
      id: 'konkurrencer' as ActiveTab,
      label: 'Konkurrencer & Leaderboards',
      desc: 'Skudmåler, præcision & dagens rekorder',
      icon: Trophy,
      color: 'bg-amber-500/10 text-amber-700',
    },
    {
      id: 'tilmelding' as ActiveTab,
      label: 'Tilmelding (Looad)',
      desc: 'Tilmeld dig pauselodtrækningen og fanzonen',
      icon: UserCheck,
      color: 'bg-blue-500/10 text-blue-700',
    },
    {
      id: 'partnere' as ActiveTab,
      label: 'Dagens Partnere & Sponsorer',
      desc: 'Se hvem der støtter AGF Håndbold',
      icon: HeartHandshake,
      color: 'bg-emerald-500/10 text-emerald-700',
    },
    {
      id: 'scanner' as ActiveTab,
      label: 'Kuponscanner (Personale)',
      desc: 'Hurtig QR-scanning af gæsternes kuponer i kiosken',
      icon: ScanLine,
      badge: 'Kiosk',
      color: 'bg-[#081326]/10 text-[#081326]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-gray-200 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[#081326] flex items-center gap-2">
              <span>Flere funktioner</span>
            </h2>
            <p className="text-xs text-gray-500">Aktiviteter og fordele i Ceres Arena</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Luk menu"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`more-menu-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition-all text-left group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#081326] text-sm group-hover:text-[#081326]">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-[#C8102E] text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#081326] transition-colors" />
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Ceres Arena, Aarhus
          </span>
          <span className="font-mono text-[11px]">AGF Håndbold v1.0</span>
        </div>
      </div>
    </div>
  );
};
