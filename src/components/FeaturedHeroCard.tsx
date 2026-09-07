import React from 'react';
import { FeaturedHero, ActiveTab } from '../types.ts';
import { Sparkles, ArrowRight, Flame, Star, Trophy, Clock } from 'lucide-react';

interface FeaturedHeroCardProps {
  hero?: FeaturedHero;
  onNavigate: (tab: ActiveTab) => void;
}

export const FeaturedHeroCard: React.FC<FeaturedHeroCardProps> = ({ hero, onNavigate }) => {
  if (!hero || !hero.enabled) return null;

  const isRed = hero.badge.toLowerCase().includes('live') || hero.badge.toLowerCase().includes('stem') || hero.badge.toLowerCase().includes('pause');

  return (
    <div
      className={`rounded-2xl p-3.5 sm:p-4 shadow-lg flex items-center justify-between gap-3 my-3 transition-all ${
        isRed
          ? 'bg-red-600 text-white'
          : 'bg-[#081326] text-white border border-white/10'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-black uppercase tracking-wider opacity-85 mb-0.5">
          {hero.badge || 'Live nu'}
        </div>
        <div className="text-sm sm:text-base font-black uppercase tracking-tight truncate leading-tight">
          {hero.title}
        </div>
        {hero.subtitle && (
          <div className="text-xs opacity-90 truncate mt-0.5 font-medium">
            {hero.subtitle}
          </div>
        )}
      </div>

      <button
        id="hero-action-btn"
        onClick={() => onNavigate(hero.actionTarget as ActiveTab)}
        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 flex-shrink-0 flex items-center gap-1 ${
          isRed
            ? 'bg-white text-red-600 hover:bg-gray-100'
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        <span>{hero.actionText || 'Gå til'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
