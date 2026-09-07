import React from 'react';
import {
  Matchday,
  Match,
  FeaturedHero,
  Announcement,
  ActiveTab,
  VotingSession,
  Coupon,
} from '../types.ts';
import { FeaturedHeroCard } from './FeaturedHeroCard.tsx';
import { MatchCards } from './MatchCards.tsx';
import { QuickNavGrid } from './QuickNavGrid.tsx';
import { AnnouncementsBanner } from './AnnouncementsBanner.tsx';
import { Shield, Sparkles, Trophy, UserCheck, Flame, ArrowRight } from 'lucide-react';

interface HomeViewProps {
  matchday?: Matchday;
  matches: Match[];
  announcements: Announcement[];
  votingSessions: VotingSession[];
  coupons: Coupon[];
  onNavigate: (tab: ActiveTab) => void;
  onVoteMatch: (category: 'DAMER' | 'HERRER') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  matchday,
  matches,
  announcements,
  votingSessions,
  coupons,
  onNavigate,
  onVoteMatch,
}) => {
  const isAnyVotingOpen = votingSessions.some((s) => s.status === 'open');
  const activeCouponsCount = coupons.filter((c) => c.active).length;

  return (
    <div className="pb-20 pt-1">
      {/* Real-time Announcements Banner */}
      <AnnouncementsBanner announcements={announcements} />

      {/* Featured Dynamic Hero Card (Controlled by Admin: "LIVE NU", "PAUSETILBUD", etc.) */}
      {matchday?.featuredHero && (
        <FeaturedHeroCard
          hero={matchday.featuredHero}
          onNavigate={onNavigate}
        />
      )}

      {/* Welcome / Arena location context */}
      <div className="flex items-center justify-between px-1 my-2">
        <div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            {matchday?.venue ? matchday.venue.toUpperCase() : 'CERES ARENA · HAL 1'}
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-[#081326] leading-none mt-0.5">
            Dagens Kampe
          </h2>
        </div>

        {isAnyVotingOpen && (
          <button
            onClick={() => onNavigate('stem')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse shadow-sm"
          >
            <span>Stemme åben</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          </button>
        )}
      </div>

      {/* Large Match Cards (Damer, Herrer) */}
      <MatchCards matches={matches} onVoteClick={onVoteMatch} />

      {/* Large Quick Navigation Grid for Arena Spectators */}
      <QuickNavGrid
        onNavigate={onNavigate}
        isVotingOpen={isAnyVotingOpen}
        couponCount={activeCouponsCount}
      />

      {/* Looad Registration Teaser Card */}
      {matchday?.looadUrl && (
        <div className="my-4 bg-[#081326] rounded-2xl p-4 sm:p-5 text-white shadow-md border border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-red-400 block">
                Pauselodtrækning
              </span>
              <h3 className="font-black text-sm uppercase tracking-tight leading-snug">
                {matchday.looadTitle || 'Tilmeld dig aktiviteten'}
              </h3>
              <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5 font-medium">
                {matchday.looadDescription || 'Vær med i konkurrencerne i Ceres Arena.'}
              </p>
            </div>
          </div>

          <button
            id="home-looad-teaser-btn"
            onClick={() => onNavigate('tilmelding')}
            className="px-4 py-2 rounded-xl bg-white text-[#081326] hover:bg-gray-100 font-black text-xs uppercase tracking-wider flex-shrink-0 flex items-center gap-1 shadow-sm transition-all active:scale-95"
          >
            <span>Deltag</span>
            <ArrowRight className="w-3.5 h-3.5 text-red-600" />
          </button>
        </div>
      )}

      {/* Official AGF Motto & Footer Branding */}
      <div className="mt-8 text-center pt-4 border-t border-gray-200 text-gray-400">
        <div className="w-8 h-8 mx-auto mb-2 opacity-50">
          <img src="/agf-logo.svg" alt="AGF" className="w-full h-full object-contain grayscale" referrerPolicy="no-referrer" />
        </div>
        <p className="text-[11px] font-serif italic tracking-wider text-gray-500">
          Sudare pro communi causa
        </p>
        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">
          AGF Håndbold · Ceres Arena, Aarhus
        </p>
      </div>
    </div>
  );
};
