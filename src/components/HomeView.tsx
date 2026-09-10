import React from 'react';
import {
  Matchday,
  Match,
  FeaturedHero,
  Announcement,
  ActiveTab,
  VotingSession,
  Coupon,
  Partner,
} from '../types.ts';
import { FeaturedHeroCard } from './FeaturedHeroCard.tsx';
import { MatchCards } from './MatchCards.tsx';
import { QuickNavGrid } from './QuickNavGrid.tsx';
import { AnnouncementsBanner } from './AnnouncementsBanner.tsx';
import { Shield, Sparkles, Trophy, Zap, Flame, ArrowRight, ExternalLink } from 'lucide-react';

interface HomeViewProps {
  matchday?: Matchday;
  matches: Match[];
  announcements: Announcement[];
  votingSessions: VotingSession[];
  coupons: Coupon[];
  partners?: Partner[];
  onNavigate: (tab: ActiveTab) => void;
  onVoteMatch: (category: 'DAMER' | 'HERRER') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  matchday,
  matches,
  announcements,
  votingSessions,
  coupons,
  partners = [],
  onNavigate,
  onVoteMatch,
}) => {
  const isAnyVotingOpen = votingSessions.some((s) => s.status === 'open');
  const activeCouponsCount = coupons.filter((c) => c.active).length;
  const featuredPartners = (partners || []).filter((p) => p.active !== false && p.featured);

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

      {/* Prominent Looad Club Supporter Promotional Card (Direct Partnerlink) */}
      {matchday?.looadUrl && (
        <a
          id="home-looad-promo-card"
          href={matchday.looadUrl || 'https://looad.dk/pages/klub-agf-haandbold'}
          target="_blank"
          rel="noopener noreferrer"
          className="group block my-3.5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-linear-to-br from-[#081326] via-[#0E1F3D] to-[#081326] text-white shadow-md hover:shadow-xl border border-white/12 transition-all duration-200 active:scale-[0.99] cursor-pointer relative overflow-hidden"
        >
          {/* Subtle warm ambient lighting */}
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl" />

          {/* Top Row: Official Looad Logo + Category Badge */}
          <div className="flex items-center justify-between gap-2 relative z-10 mb-2.5">
            <div className="h-8 px-3 py-1 bg-white rounded-xl shadow-xs inline-flex items-center justify-center border border-white/20">
              <img
                src="/partners/looad.png"
                alt="Looad"
                className="h-4 sm:h-5 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/25 text-[10px] font-black uppercase tracking-wider">
              <Zap className="w-3 h-3 fill-current text-amber-400" />
              <span>Energipartner</span>
            </span>
          </div>

          {/* Core Supporter Copy */}
          <div className="relative z-10">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-snug group-hover:text-amber-300 transition-colors">
              {matchday.looadTitle || 'STØT AGF HÅNDBOLD MED LOOAD'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-200 mt-1 leading-relaxed font-medium">
              {matchday.looadDescription || 'Skift elselskab til Looad og støt samtidig AGF Håndbold.'}
            </p>
          </div>

          {/* Strong Primary CTA Bar */}
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3 relative z-10">
            <div className="text-[11px] text-gray-400 font-medium hidden xs:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Direkte klubstøtte</span>
            </div>

            <div
              id="home-looad-support-btn"
              className="w-full xs:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#081326] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm group-hover:shadow-md transition-all ml-auto"
            >
              <span>STØT KLUBBEN</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#081326]" />
            </div>
          </div>
        </a>
      )}

      {/* Subtle Featured Partner(s) on Home Screen */}
      {featuredPartners.length > 0 && (
        <div className="my-3.5 bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Dagens Partner</span>
            </span>
            <button
              onClick={() => onNavigate('partnere')}
              className="text-[10px] font-bold text-gray-500 hover:text-[#081326] transition-colors"
            >
              Se alle partnere →
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {featuredPartners.map((fp) => {
              const Wrapper = fp.websiteUrl ? 'a' : 'div';
              const wrapperProps = fp.websiteUrl
                ? { href: fp.websiteUrl, target: '_blank', rel: 'noopener noreferrer' }
                : {};
              return (
                <Wrapper
                  key={fp.id}
                  {...wrapperProps}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50/80 hover:bg-gray-100/90 border border-gray-200/70 transition-colors flex-1 min-w-[140px]"
                >
                  <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0 border border-gray-100 shadow-2xs overflow-hidden">
                    <img
                      src={fp.logo || fp.logoUrl || '/agf-logo.svg'}
                      alt={fp.name}
                      onError={(e) => {
                        e.currentTarget.src = '/agf-logo.svg';
                      }}
                      className="max-h-7 w-auto max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-[#081326] block leading-tight truncate">
                      {fp.name}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium block truncate">
                      {fp.category === 'HOVEDSPONSOR' ? 'Hovedsponsor' : fp.category}
                    </span>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </div>
      )}

      {/* Large Quick Navigation Grid for Arena Spectators */}
      <QuickNavGrid
        onNavigate={onNavigate}
        isVotingOpen={isAnyVotingOpen}
        couponCount={activeCouponsCount}
      />

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
