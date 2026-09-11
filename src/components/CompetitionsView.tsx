import React, { useState } from 'react';
import { Competition, Score, Matchday } from '../types.ts';
import { Trophy, Flame, Target, Award, Medal, Clock, Users, ArrowUpRight } from 'lucide-react';

interface CompetitionsViewProps {
  competitions: Competition[];
  scores: Score[];
  matchdays: Matchday[];
  activeMatchdayId: string;
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({
  competitions,
  scores,
  matchdays,
  activeMatchdayId,
}) => {
  const activeCompetitions = competitions.filter((c) => c.active);
  const [selectedCompId, setSelectedCompId] = useState<string>(
    activeCompetitions[0]?.id || ''
  );

  const selectedCompetition =
    competitions.find((c) => c.id === selectedCompId) || activeCompetitions[0];

  if (!selectedCompetition) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-gray-200 mt-4">
        Ingen aktive konkurrencer i øjeblikket.
      </div>
    );
  }

  // Filter scores for this competition
  const allCompScores = scores.filter((s) => s.competitionId === selectedCompetition.id);
  const todayScores = allCompScores.filter((s) => s.matchdayId === activeMatchdayId);

  // Sorting function
  const sortFn = (a: Score, b: Score) => {
    return selectedCompetition.higherScoreWins ? b.score - a.score : a.score - b.score;
  };

  const sortedToday = [...todayScores].sort(sortFn);

  const maxDisplay = selectedCompetition.maxLeaderboardEntries || 5;
  const topScoresToday = sortedToday.slice(0, maxDisplay);

  const todayBestScore = sortedToday[0];

  return (
    <div className="pb-20 pt-2">
      {/* Header */}
      <div className="bg-[#081326] text-white rounded-2xl p-5 mb-4 shadow-sm border border-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>Fanzone & Arena Aktiviteter</span>
        </div>
        <h2 className="text-2xl font-black font-['Teko'] uppercase tracking-tight text-white">
          Konkurrencer & Leaderboard
        </h2>
        <p className="text-xs text-gray-300">
          Deltag i fanzonens konkurrencer i pausen og se om du kan slå dagens rekord!
        </p>
      </div>

      {/* Competition Tabs (Horizontally scroll/swipe on mobile) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3 -mx-1 px-1 touch-pan-x select-none">
        {activeCompetitions.map((comp) => {
          const isSelected = comp.id === selectedCompetition.id;
          return (
            <button
              key={comp.id}
              id={`comp-tab-${comp.id}`}
              onClick={() => setSelectedCompId(comp.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#081326] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-[#C8102E]" />
              <span>{comp.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Competition Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-[#081326] uppercase font-['Teko'] tracking-wide">
            {selectedCompetition.name}
          </h3>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
            Måles i {selectedCompetition.scoringUnit}
          </span>
        </div>

        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
          {selectedCompetition.description}
        </p>
      </div>

      {/* Today's Record Only (All-time record removed) */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
            <Medal className="w-4 h-4 text-amber-500" />
            <span>Dagens Rekord</span>
          </div>
          {todayBestScore && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
              Dagens bedste
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <div className="font-black text-2xl text-[#081326]">
            {todayBestScore ? `${todayBestScore.score} ${selectedCompetition.scoringUnit}` : '–'}
          </div>
          <div className="text-xs text-gray-500 font-medium truncate">
            {todayBestScore ? `sat af ${todayBestScore.participantName}` : 'Ingen forsøg registreret i dag endnu'}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-[#081326]">
              {selectedCompetition.name.toUpperCase()} – TOP {maxDisplay}
            </h4>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {sortedToday.length} deltagere i dag
          </span>
        </div>

        {topScoresToday.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            Ingen resultater registreret i dag endnu. Kom ned i fanzonen og sæt barren!
          </div>
        ) : (
          <div className="space-y-2.5">
            {topScoresToday.map((item, index) => {
              const isLeader = index === 0;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl flex items-center justify-between transition-all ${
                    isLeader
                      ? 'bg-amber-50/80 border-2 border-amber-300 shadow-xs'
                      : 'bg-gray-50 border border-gray-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                        isLeader
                          ? 'bg-amber-400 text-[#081326]'
                          : index === 1
                          ? 'bg-gray-300 text-gray-800'
                          : index === 2
                          ? 'bg-amber-700/20 text-amber-900'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#081326]">
                          {item.participantName}
                        </span>
                        {item.isNewRecord && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-[#C8102E] text-white">
                            <Flame className="w-2.5 h-2.5" />
                            NY REKORD!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-base text-[#081326]">
                      {item.score}
                    </span>{' '}
                    <span className="text-xs text-gray-500 font-bold">
                      {selectedCompetition.scoringUnit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How to participate */}
      <div className="mt-4 p-4 rounded-2xl bg-white border border-gray-200 text-center">
        <h5 className="font-bold text-xs uppercase tracking-wider text-[#081326]">
          Vil du være med?
        </h5>
        <p className="text-xs text-gray-500 mt-1">
          Henvend dig til AGF-frivillige i fanzonen eller ved skudradaren bag sektion B. Personalet registrerer dit resultat live på tavlen!
        </p>
      </div>
    </div>
  );
};
