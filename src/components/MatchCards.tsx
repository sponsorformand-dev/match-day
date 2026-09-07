import React from 'react';
import { Match, MatchStatus } from '../types.ts';
import { Clock, Shield, Flame } from 'lucide-react';

interface MatchCardsProps {
  matches: Match[];
  onVoteClick: (category: 'DAMER' | 'HERRER') => void;
}

export const MatchCards: React.FC<MatchCardsProps> = ({ matches, onVoteClick }) => {
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[#C8102E] text-white animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            LIVE
          </span>
        );
      case 'first_half':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500 text-white">
            1. Halvleg
          </span>
        );
      case 'halftime':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-600 text-white">
            Halvleg
          </span>
        );
      case 'second_half':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500 text-white">
            2. Halvleg
          </span>
        );
      case 'finished':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-gray-600 text-white">
            Afsluttet
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-gray-100 text-gray-700">
            Kommende
          </span>
        );
    }
  };

  return (
    <div className="space-y-3.5 my-3">
      {matches.map((match) => {
        const isLive = ['live', 'first_half', 'halftime', 'second_half'].includes(match.status);

        return (
          <div
            key={match.id}
            id={`match-card-${match.id}`}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md"
          >
            {/* Dark Navy Header Banner */}
            <div className="bg-[#081326] text-white py-1.5 px-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span>{match.category}</span>
                <span className="opacity-40">•</span>
                <span className="opacity-75">{match.league || '1. Division'}</span>
                <span className="opacity-40">•</span>
                <span className="font-mono">Kl. {match.time}</span>
              </div>
              <div>{getStatusBadge(match.status)}</div>
            </div>

            {/* Teams & Score / VS */}
            <div className="p-4 flex items-center justify-between">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <div className="font-black text-lg sm:text-xl text-[#081326] uppercase tracking-tight leading-tight">
                  {match.homeTeam}
                </div>
                <div className="text-[10px] opacity-60 uppercase font-semibold mt-0.5">
                  Aarhus
                </div>
              </div>

              {/* Center VS or Score */}
              <div className="px-4 flex flex-col items-center justify-center min-w-[90px]">
                {isLive || match.status === 'finished' ? (
                  <div className="flex flex-col items-center">
                    <div className="font-black text-2xl sm:text-3xl text-[#081326] tracking-tighter">
                      <span>{match.homeScore ?? 0}</span>
                      <span className="text-gray-300 mx-1">:</span>
                      <span>{match.awayScore ?? 0}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-red-600 mt-0.5">
                      {isLive ? 'Live stilling' : 'Slutresultat'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-2xl sm:text-3xl font-black italic text-gray-300">
                      VS
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-gray-400 mt-0.5">
                      Kl. {match.time}
                    </span>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <div className="font-black text-lg sm:text-xl text-[#081326] uppercase tracking-tight leading-tight">
                  {match.awayTeam}
                </div>
                <div className="text-[10px] opacity-60 uppercase font-semibold mt-0.5">
                  Modstander
                </div>
              </div>
            </div>

            {/* Bottom bar: Partner & Action */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 text-[10px] font-medium truncate max-w-[180px]">
                {match.partner ? `Partner: ${match.partner}` : 'Ceres Arena, Aarhus'}
              </span>

              {match.category === 'DAMER' || match.category === 'HERRER' ? (
                <button
                  onClick={() => onVoteClick(match.category as 'DAMER' | 'HERRER')}
                  className="text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <span>Stem på MVP</span>
                  <span>⭐</span>
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
