import React from 'react';
import { Match, MatchStatus, VotingSession, Player, Partner } from '../types.ts';
import { ExternalLink, Star, MapPin, Trophy } from 'lucide-react';

interface MatchCardsProps {
  matches: Match[];
  venue?: string;
  votingSessions?: VotingSession[];
  players?: Player[];
  partners?: Partner[];
  kampensSpillerSponsorId?: string;
  onVoteClick: (category: 'DAMER' | 'HERRER') => void;
}

export const MatchCards: React.FC<MatchCardsProps> = ({
  matches,
  venue = 'Ceres Arena',
  votingSessions = [],
  players = [],
  partners = [],
  kampensSpillerSponsorId,
  onVoteClick,
}) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 text-center text-gray-500 border border-gray-200">
        Ingen kampe planlagt for i dag.
      </div>
    );
  }

  // Find Kampens Spiller sponsor if configured
  const mvpSponsor = kampensSpillerSponsorId
    ? partners.find((p) => p.id === kampensSpillerSponsorId)
    : null;

  return (
    <div className="space-y-4 my-3">
      {matches.map((match) => {
        // Relevant voting session
        const session = votingSessions.find((s) => s.category === match.category);
        const isSessionOpen = session?.status === 'open';

        // Winner if closed and selected
        const winnerPlayer =
          session?.status === 'closed' && session?.winnerPlayerId
            ? players.find((p) => p.id === session.winnerPlayerId)
            : null;

        // Teams config
        const homeName = match.homeTeamName || match.homeTeam || 'AGF Håndbold';
        const homeLogo = match.homeTeamLogo || '/agf-logo.svg';
        const awayName = match.awayTeamName || match.awayTeam || 'Udehold';
        const awayLogo = match.awayTeamLogo || match.awayLogo || '';

        // Opponent clean initials fallback
        const awayInitials =
          awayName
            .replace(/kfums?|haandbold|håndbold/gi, '')
            .trim()
            .split(/[\s-]+/)
            .filter(Boolean)
            .map((w) => w[0])
            .join('')
            .substring(0, 3)
            .toUpperCase() || 'UDE';

        return (
          <div
            key={match.id}
            id={`match-card-${match.id}`}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-gray-200/90 overflow-hidden transition-all hover:shadow-md"
          >
            {/* Dark Navy Header Banner */}
            <div className="bg-[#081326] text-white py-2.5 px-4 sm:px-5 flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-black">
                  {match.category}
                </span>
                <span className="opacity-30">•</span>
                <span className="text-gray-300 font-bold">{match.league || '1. Division'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300 font-semibold text-[10px]">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <span>{match.venue || venue || 'Ceres Arena'}</span>
              </div>
            </div>

            {/* Teams & Match Visual Section (No manual or fake scores) */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-2 sm:gap-4">
              {/* Home Team (AGF Håndbold) */}
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center p-2 mb-2 shadow-2xs">
                  <img
                    src={homeLogo}
                    alt={homeName}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/agf-logo.svg';
                    }}
                  />
                </div>
                <div className="font-black text-sm sm:text-base text-[#081326] uppercase tracking-tight leading-tight">
                  {homeName}
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                  Aarhus
                </span>
              </div>

              {/* Center VS & Kickoff Time */}
              <div className="px-2 sm:px-4 flex flex-col items-center justify-center shrink-0">
                <span className="text-lg sm:text-xl font-black italic text-gray-300">
                  VS
                </span>
                <div className="mt-1 px-3 py-1 rounded-xl bg-gray-100/80 border border-gray-200/60 text-center">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#081326] block">
                    Kl. {match.time}
                  </span>
                </div>
              </div>

              {/* Away Team */}
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center p-2 mb-2 shadow-2xs">
                  {awayLogo ? (
                    <img
                      src={awayLogo}
                      alt={awayName}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-[#081326] text-white flex flex-col items-center justify-center p-1 border border-gray-800 shadow-inner">
                      <span className="font-black text-xs sm:text-sm tracking-wider leading-none">
                        {awayInitials}
                      </span>
                      <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        UDE
                      </span>
                    </div>
                  )}
                </div>
                <div className="font-black text-sm sm:text-base text-[#081326] uppercase tracking-tight leading-tight">
                  {awayName}
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                  Udehold
                </span>
              </div>
            </div>

            {/* Winner Presentation (Kampens Spiller) if Voting is closed and winner selected */}
            {winnerPlayer && (
              <div className="mx-4 sm:mx-5 mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#081326]">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                    KAMPENS SPILLER: #{winnerPlayer.number} {winnerPlayer.name}
                  </span>
                </div>
                {mvpSponsor && (
                  <div className="text-[10px] text-gray-600 font-medium mt-0.5 pl-6">
                    Præsenteret i samarbejde med {mvpSponsor.name}
                  </div>
                )}
              </div>
            )}

            {/* External Live Match URL (Only when configured) */}
            {match.liveMatchUrl && (
              <div className="px-4 sm:px-5 pb-3">
                <a
                  href={match.liveMatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#081326] hover:bg-black text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
                >
                  <span>FØLG KAMPEN LIVE</span>
                  <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                </a>
              </div>
            )}

            {/* Bottom bar with Voting CTA if voting is active */}
            {isSessionOpen && (
              <div className="px-4 py-2.5 bg-red-50/70 border-t border-red-100 flex items-center justify-between">
                <div className="text-[11px] font-bold text-red-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  <span>Afstemningen er åben!</span>
                </div>
                <button
                  id={`vote-cta-${match.id}`}
                  onClick={() => onVoteClick(match.category as 'DAMER' | 'HERRER')}
                  className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                >
                  <span>Stem nu</span>
                  <Star className="w-3 h-3 fill-white text-white" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

