import React from 'react';
import { ScheduleItem, Match } from '../types.ts';
import { Clock, MapPin, CheckCircle2, Radio, Calendar } from 'lucide-react';

interface ProgrammeViewProps {
  schedule: ScheduleItem[];
  matchdayTitle?: string;
  matchdayDate?: string;
  matches?: Match[];
  agfLogo?: string;
}

export const ProgrammeView: React.FC<ProgrammeViewProps> = ({
  schedule,
  matchdayTitle,
  matchdayDate,
  matches = [],
  agfLogo,
}) => {
  const sorted = [...schedule].sort((a, b) => a.order - b.order);
  const currentLogo = agfLogo || '/agf-logo.svg';

  return (
    <div className="pb-16 pt-2">
      {/* Section Header */}
      <div className="bg-[#081326] text-white rounded-2xl p-5 mb-4 shadow-sm border border-white/10 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5 text-[#C8102E]" />
            <span>{matchdayDate || 'Dagens program'}</span>
          </div>
          <h2 className="text-2xl font-black font-['Teko'] uppercase tracking-tight text-white">
            Dagens Program
          </h2>
          <p className="text-xs text-gray-300">
            Følg tidsplanen for alle aktiviteter og kampe i Ceres Arena.
          </p>
        </div>
        <div className="w-12 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center border border-white/20 shadow-xs shrink-0">
          <img
            src={currentLogo}
            alt="AGF Håndbold"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/agf-logo.svg';
            }}
          />
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-gray-200">
          Ingen programpunkter tilføjet endnu.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
          {sorted.map((item) => {
            const isLive = item.status === 'live';
            const isCompleted = item.status === 'completed';

            return (
              <div
                key={item.id}
                id={`program-item-${item.id}`}
                className="relative group"
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isLive
                      ? 'bg-[#C8102E] border-white shadow-md text-white ring-4 ring-[#C8102E]/20 animate-pulse'
                      : isCompleted
                      ? 'bg-gray-100 border-gray-400 text-gray-500'
                      : 'bg-white border-[#081326] text-[#081326]'
                  }`}
                >
                  {isLive ? (
                    <Radio className="w-3 h-3" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#081326]"></div>
                  )}
                </div>

                {/* Card */}
                <div
                  className={`ml-2 rounded-2xl p-4 transition-all border-l-4 ${
                    isLive
                      ? 'bg-red-50/70 border-red-600 border border-y-red-100 border-r-red-100 shadow-sm'
                      : isCompleted
                      ? 'bg-gray-50 border-gray-400 border border-y-gray-200 border-r-gray-200 opacity-80'
                      : 'bg-white border-gray-300 border border-y-gray-200 border-r-gray-200 shadow-xs'
                  }`}
                >
                  {/* Top row: Time & Status */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-sm font-black text-[#081326] font-mono">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>{item.time}</span>
                    </div>

                    <div>
                      {isLive && (
                        <span className="bg-red-600 text-white text-[10px] px-2.5 py-1 rounded font-black uppercase tracking-wider">
                          Live
                        </span>
                      )}
                      {isCompleted && (
                        <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider">
                          Gennemført
                        </span>
                      )}
                      {item.status === 'upcoming' && (
                        <span className="bg-white text-gray-400 text-[10px] px-2 py-1 rounded border border-gray-200 font-black uppercase tracking-wider">
                          Næste
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  {(() => {
                    const matchingMatch = matches.find(
                      (m) =>
                        (item.title.toLowerCase().includes('damer') && m.category === 'DAMER') ||
                        (item.title.toLowerCase().includes('herrer') && m.category === 'HERRER')
                    );
                    const displayTitle = matchingMatch
                      ? `${matchingMatch.homeTeamName || matchingMatch.homeTeam || 'AGF Håndbold'} vs. ${matchingMatch.awayTeamName || matchingMatch.awayTeam || 'Udehold'}`
                      : item.title;

                    return (
                      <h3
                        className={`font-black text-base uppercase tracking-tight leading-tight ${
                          isLive ? 'text-red-950' : isCompleted ? 'text-gray-700' : 'text-[#081326]'
                        }`}
                      >
                        {displayTitle}
                      </h3>
                    );
                  })()}

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Location badge */}
                  {item.location && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1 text-[11px] font-medium text-gray-500">
                      <MapPin className="w-3 h-3 text-[#C8102E]" />
                      <span>{item.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
