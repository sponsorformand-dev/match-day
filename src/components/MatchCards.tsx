import React from 'react';
import { Match, MatchStatus, VotingSession } from '../types.ts';
import { ExternalLink, Star, MapPin } from 'lucide-react';

interface MatchCardsProps {
  matches: Match[];
  venue?: string;
  votingSessions?: VotingSession[];
  onVoteClick: (category: 'DAMER' | 'HERRER') => void;
}

export const MatchCards: React.FC<MatchCardsProps> = ({
  matches,
  venue = 'Ceres Arena · Hal 1',
  votingSessions = [],
  onVoteClick,
}) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 text-center text-gray-500 border border-gray-200">
        Ingen kampe planlagt for i dag.
      </div>
    );
  }

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#C8102E] text-white animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            I gang
          </span>
        );
      case 'first_half':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white">
            1. Halvleg
          </span>
        );
      case 'halftime':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white">
            Halvleg
          </span>
        );
      case 'second_half':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white">
            2. Halvleg
          </span>
        );
      case 'finished':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gray-600 text-white">
            Afsluttet
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-700">
            Kommende
          </span>
        );
    }
  };

  return (
    <div className="space-y-3.5 my-3">
      {matches.map((match) => {
        // Only show voting CTA when the relevant voting session is currently OPEN
        const isSessionOpen = votingSessions.some(
          (s) => s.category === match.category && s.status === 'open'
        );

        return (
          <div
            key={match.id}
            id={`match-card-${match.id}`}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md"
          >
            {/* Dark Navy Header Banner */}
            <div className="bg-[#081326] text-white py-2 px-4 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-white/10">{match.category}</span>
                <span className="opacity-40">•</span>
                <span className="opacity-80">{match.league || '1. Division'}</span>
              </div>
              <div>{getStatusBadge(match.status)}</div>
            </div>

            {/* Teams & Match Start Time / VS (No hardcoded/mock scores) */}
            <div className="p-4 flex items-center justify-between gap-3">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <div className="font-black text-base sm:text-lg text-[#081326] uppercase tracking-tight leading-tight">
                  {match.homeTeam}
                </div>
                <div className="text-[10px] opacity-60 uppercase font-bold mt-0.5">
                  Aarhus
                </div>
              </div>

              {/* Center VS & Start Time */}
              <div className="px-3 flex flex-col items-center justify-center min-w-[80px]">
                <span className="text-xl sm:text-2xl font-black italic text-gray-300">
                  VS
                </span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#081326] mt-0.5">
                  Kl. {match.time}
                </span>
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <div className="font-black text-base sm:text-lg text-[#081326] uppercase tracking-tight leading-tight">
                  {match.awayTeam}
                </div>
                <div className="text-[10px] opacity-60 uppercase font-bold mt-0.5">
                  Modstander
                </div>
              </div>
            </div>

            {/* Live Match URL Link Button (Flashscore / Official results) */}
            {match.liveMatchUrl && (
              <div className="px-4 pb-3 flex justify-center">
                <a
                  href={match.liveMatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#081326] hover:bg-black text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                >
                  <span>FØLG KAMPEN LIVE</span>
                  <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                </a>
              </div>
            )}

            {/* Bottom bar: Venue, Partner & Optional Voting CTA */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-500 text-[10px] font-medium truncate max-w-[200px]">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{venue}</span>
              </div>

              {/* Only show voting CTA when this category's voting session is actively open */}
              {isSessionOpen && (match.category === 'DAMER' || match.category === 'HERRER') && (
                <button
                  id={`vote-cta-${match.id}`}
                  onClick={() => onVoteClick(match.category as 'DAMER' | 'HERRER')}
                  className="text-xs font-black uppercase tracking-wider text-[#C8102E] hover:text-red-700 flex items-center gap-1 transition-colors animate-pulse cursor-pointer"
                >
                  <span>Stem på MVP</span>
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
