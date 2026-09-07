import React from 'react';
import { ActiveTab } from '../types.ts';
import { Star, Tag, CalendarClock, Beer, Trophy, HeartHandshake } from 'lucide-react';

interface QuickNavGridProps {
  onNavigate: (tab: ActiveTab) => void;
  isVotingOpen: boolean;
  couponCount: number;
}

export const QuickNavGrid: React.FC<QuickNavGridProps> = ({
  onNavigate,
  isVotingOpen,
  couponCount,
}) => {
  const items = [
    {
      id: 'stem' as ActiveTab,
      title: 'Kampens Spiller',
      subtitle: isVotingOpen ? 'Afstemning åben nu' : 'Stem på dagens profil',
      icon: Star,
      iconColor: 'text-amber-500',
      badge: isVotingOpen ? 'LIVE' : undefined,
      badgeColor: 'bg-[#C8102E] text-white',
    },
    {
      id: 'tilbud' as ActiveTab,
      title: 'Tilbud & Kuponer',
      subtitle: `${couponCount} aktive pausetilbud`,
      icon: Tag,
      iconColor: 'text-rose-500',
      badge: couponCount > 0 ? `${couponCount} TILBUD` : undefined,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'program' as ActiveTab,
      title: 'Dagens Program',
      subtitle: 'Tidsplan & aktiviteter',
      icon: CalendarClock,
      iconColor: 'text-blue-600',
    },
    {
      id: 'kiosk' as ActiveTab,
      title: 'Kiosk & Priser',
      subtitle: 'Øl, sodavand & mad',
      icon: Beer,
      iconColor: 'text-amber-600',
    },
    {
      id: 'konkurrencer' as ActiveTab,
      title: 'Konkurrencer',
      subtitle: 'Skudmåler & highscore',
      icon: Trophy,
      iconColor: 'text-yellow-600',
    },
    {
      id: 'partnere' as ActiveTab,
      title: 'Dagens Partnere',
      subtitle: 'Støt vores sponsorer',
      icon: HeartHandshake,
      iconColor: 'text-indigo-600',
    },
  ];

  return (
    <div className="my-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#081326]">
          Hurtig Adgang
        </h2>
        <span className="text-[10px] uppercase font-bold text-gray-400">Vælg sektion</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`quick-nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className="bg-white rounded-2xl p-4 text-left border border-gray-200 shadow-sm hover:border-gray-400 transition-all active:scale-[0.98] flex flex-col justify-between min-h-[105px] group relative overflow-hidden"
            >
              <div className="flex items-start justify-between w-full">
                <div className="w-9 h-9 rounded-xl bg-[#F6F6F4] flex items-center justify-center group-hover:bg-[#081326] transition-colors">
                  <Icon className={`w-4 h-4 ${item.iconColor} group-hover:text-white transition-colors`} />
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h3 className="font-black text-[#081326] text-xs sm:text-sm uppercase tracking-tight leading-tight">
                  {item.title}
                </h3>
                <p className="text-[10px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
