import React, { useState } from 'react';
import { VotingSession, Player, Vote, Partner, Match } from '../types.ts';
import { dataService, getOrCreateDeviceId } from '../services/dataService.ts';
import { Star, CheckCircle, Trophy, Award, Lock, Sparkles, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VotingViewProps {
  sessions: VotingSession[];
  players: Player[];
  votes: Vote[];
  partners: Partner[];
  matches?: Match[];
  initialCategory?: 'DAMER' | 'HERRER';
}

export const VotingView: React.FC<VotingViewProps> = ({
  sessions,
  players,
  votes,
  partners,
  matches,
  initialCategory = 'DAMER',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'DAMER' | 'HERRER'>(initialCategory);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasJustVoted, setHasJustVoted] = useState(false);

  const deviceId = getOrCreateDeviceId();
  const currentMatch = (matches || []).find((m) => m.category === selectedCategory);

  // Find active session for current category
  const currentSession = sessions.find((s) => s.category === selectedCategory);
  const sessionPlayers = currentSession
    ? players.filter((p) => p.sessionId === currentSession.id)
    : [];

  // Check if device has voted
  const userVote = currentSession
    ? votes.find((v) => v.sessionId === currentSession.id && v.deviceId === deviceId)
    : null;

  const votedPlayer = userVote
    ? sessionPlayers.find((p) => p.id === userVote.playerId)
    : null;

  // Session stats (for percentages if enabled)
  const sessionVotes = currentSession
    ? votes.filter((v) => v.sessionId === currentSession.id)
    : [];
  const totalVotesCount = sessionVotes.length;

  const winnerPlayer = currentSession?.winnerPlayerId
    ? sessionPlayers.find((p) => p.id === currentSession.winnerPlayerId)
    : null;

  const handleVoteSubmit = async () => {
    if (!currentSession || !selectedPlayerId) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await dataService.submitVote(currentSession.id, selectedPlayerId);
    setIsSubmitting(false);

    if (res.success) {
      setHasJustVoted(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#081326', '#C8102E', '#FFFFFF'],
        });
      } catch {
        // Fallback
      }
    } else {
      setErrorMessage(res.error || 'Fejl ved afgivelse af stemme');
    }
  };

  return (
    <div className="pb-16 pt-2">
      {/* Category selector pills (Damer / Herrer) */}
      <div className="flex rounded-xl bg-gray-200/80 p-1 mb-4">
        {(['DAMER', 'HERRER'] as const).map((cat) => {
          const catSession = sessions.find((s) => s.category === cat);
          const isOpen = catSession?.status === 'open';

          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedPlayerId(null);
                setErrorMessage(null);
                setHasJustVoted(false);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                selectedCategory === cat
                  ? 'bg-[#081326] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#081326]'
              }`}
            >
              <span>{cat}</span>
              {isOpen && (
                <span className="w-2 h-2 rounded-full bg-[#C8102E] animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Card */}
      {!currentSession ? (
        <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-gray-200">
          Ingen aktiv afstemning for {selectedCategory.toLowerCase()}.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header info */}
          <div className="bg-[#081326] text-white rounded-2xl p-5 shadow-sm border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-gray-300">
                AGF {selectedCategory}{currentMatch?.opponent ? ` · MOD ${currentMatch.opponent.toUpperCase()}` : ''}
              </span>
              {currentSession.status === 'open' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#C8102E] text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  Åben for stemmer
                </span>
              ) : currentSession.status === 'closed' ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-gray-700 text-gray-200">
                  Afstemning afsluttet
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-white/10 text-gray-300">
                  Afventer start
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-400 fill-current" />
              <span>Kampens Spiller</span>
            </h2>

            <p className="text-xs text-gray-300 mt-1">
              Stem på den spiller der har gjort den største forskel på banen i dag.
            </p>

            {currentSession.sponsor && (
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 text-[11px] text-gray-300">
                <span>Præsenteres af:</span>
                <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                  {currentSession.sponsor}
                </span>
              </div>
            )}
          </div>

          {/* Winner Display if Session is Closed & Winner is chosen */}
          {currentSession.status === 'closed' && winnerPlayer && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-300 rounded-2xl p-6 text-center shadow-md">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-400 text-[#081326] flex items-center justify-center mb-3 shadow-inner">
                <Trophy className="w-8 h-8 text-[#081326]" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-900">
                Officielt kåret
              </span>
              <h3 className="text-2xl font-extrabold text-[#081326] mt-0.5">
                {winnerPlayer.name}
              </h3>
              <p className="text-xs text-gray-600 font-medium">
                #{winnerPlayer.number} · {winnerPlayer.position}
              </p>
              {currentSession.sponsor && (
                <p className="text-[11px] text-gray-500 mt-2 font-medium">
                  Præsenteret af {currentSession.sponsor}
                </p>
              )}
            </div>
          )}

          {/* Closed without winner yet */}
          {currentSession.status === 'closed' && !winnerPlayer && (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-200">
              <Lock className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <h3 className="font-bold text-[#081326]">Afstemningen er lukket</h3>
              <p className="text-xs text-gray-500 mt-1">
                Stemmerne tælles op. Vinderen offentliggøres i hallen kort efter kampen!
              </p>
            </div>
          )}

          {/* Pending session */}
          {currentSession.status === 'pending' && (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-200">
              <Star className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <h3 className="font-bold text-[#081326]">Afstemningen åbner snart</h3>
              <p className="text-xs text-gray-500 mt-1">
                Afstemningen åbner i anden halvleg af kampen. Hold øje med storskærmen!
              </p>
            </div>
          )}

          {/* If user has voted in active session */}
          {(userVote || hasJustVoted) && currentSession.status === 'open' && (
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-emerald-500/80 shadow-md">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-[#081326]">
                Tak for din stemme 💙
              </h3>
              {votedPlayer ? (
                <p className="text-xs text-gray-600 mt-1">
                  Du har stemt på <strong className="text-[#081326]">#{votedPlayer.number} {votedPlayer.name}</strong> ({votedPlayer.position}).
                </p>
              ) : (
                <p className="text-xs text-gray-600 mt-1">Din stemme er registreret.</p>
              )}
              <p className="text-[11px] text-gray-400 mt-3 italic">
                Resultatet afsløres ved slutfløjt i hallen.
              </p>
            </div>
          )}

          {/* Voting is open and user hasn't voted */}
          {currentSession.status === 'open' && !userVote && !hasJustVoted && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#081326]">
                  Hvem er Kampens Spiller?
                </h3>
                <span className="text-xs text-gray-500">Vælg én spiller</span>
              </div>

              {errorMessage && (
                <div className="p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}

              {sessionPlayers.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-gray-200">
                  Ingen spillere tilføjet til denne afstemning endnu.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessionPlayers.map((player) => {
                    const isSelected = selectedPlayerId === player.id;

                    return (
                      <button
                        key={player.id}
                        id={`player-select-${player.id}`}
                        onClick={() => setSelectedPlayerId(player.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'bg-[#081326] text-white border-[#081326] shadow-md scale-[1.01]'
                            : 'bg-white text-[#081326] border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Jersey number circle */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                              isSelected
                                ? 'bg-white text-[#081326]'
                                : 'bg-[#F6F6F4] text-[#081326] border border-gray-200'
                            }`}
                          >
                            #{player.number}
                          </div>

                          <div>
                            <div className="font-extrabold text-sm leading-tight">
                              {player.name}
                            </div>
                            <div
                              className={`text-xs mt-0.5 ${
                                isSelected ? 'text-gray-300' : 'text-gray-500'
                              }`}
                            >
                              {player.position}
                            </div>
                          </div>
                        </div>

                        <div className="pr-2">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-[#C8102E] bg-[#C8102E] text-white'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <CheckCircle className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      id="submit-vote-btn"
                      disabled={!selectedPlayerId || isSubmitting}
                      onClick={handleVoteSubmit}
                      className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
                        selectedPlayerId && !isSubmitting
                          ? 'bg-[#081326] text-white hover:bg-black'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? (
                        <span>Registrerer stemme...</span>
                      ) : (
                        <>
                          <span>Afgiv Stemme</span>
                          <Heart className="w-4 h-4 text-[#C8102E] fill-current" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Optional Public Results (only if admin enabled) */}
          {currentSession.publicResultsEnabled && totalVotesCount > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs mt-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2.5">
                Foreløbig fordeling ({totalVotesCount} stemmer afgivet)
              </h4>
              <div className="space-y-2">
                {sessionPlayers.map((player) => {
                  const count = sessionVotes.filter((v) => v.playerId === player.id).length;
                  const pct = Math.round((count / totalVotesCount) * 100) || 0;
                  return (
                    <div key={player.id} className="text-xs">
                      <div className="flex justify-between font-semibold text-[#081326] mb-1">
                        <span>#{player.number} {player.name}</span>
                        <span>{pct}% ({count})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-[#081326] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
