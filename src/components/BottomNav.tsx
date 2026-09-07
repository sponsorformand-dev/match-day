import React from 'react';
import { ActiveTab } from '../types.ts';
import { Home, CalendarClock, Star, Beer, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isVotingOpen: boolean;
  hasActiveOffers: boolean;
  onOpenMore: () => void;
  isMoreOpen: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  isVotingOpen,
  hasActiveOffers,
  onOpenMore,
  isMoreOpen,
}) => {
  const tabs = [
    { id: 'hjem' as ActiveTab, label: 'Hjem', icon: Home },
    { id: 'program' as ActiveTab, label: 'Program', icon: CalendarClock },
    {
      id: 'stem' as ActiveTab,
      label: 'Stem',
      icon: Star,
      badge: isVotingOpen,
    },
    { id: 'kiosk' as ActiveTab, label: 'Kiosk', icon: Beer },
    {
      id: 'mere' as ActiveTab,
      label: 'Mere',
      icon: MoreHorizontal,
      badge: hasActiveOffers,
      isMoreTrigger: true,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:max-w-[410px] md:mx-auto z-40 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="w-full grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isMoreTrigger
            ? isMoreOpen || ['konkurrencer', 'tilbud', 'tilmelding', 'partnere'].includes(activeTab)
            : activeTab === tab.id && !isMoreOpen;

          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              onClick={() => {
                if (tab.isMoreTrigger) {
                  onOpenMore();
                } else {
                  onTabChange(tab.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center w-full h-full select-none transition-all ${
                isActive ? 'text-[#081326]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider mt-1.5 ${isActive ? 'text-[#081326]' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-[#081326] rounded-b-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
