import React, { useState, useEffect } from 'react';
import { MatchdayDatabase, StaffUser, Competition } from '../types.ts';
import { dataService } from '../services/dataService.ts';
import { StaffScannerView } from './StaffScannerView.tsx';
import { AdminDashboard } from './AdminDashboard.tsx';
import {
  ScanLine,
  Trophy,
  Sliders,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  User,
  Shield,
  Flame,
  Award,
} from 'lucide-react';

interface StaffPortalViewProps {
  db: MatchdayDatabase;
  onExitToPublic: () => void;
}

type StaffTab = 'scanner' | 'scores' | 'admin';

export const StaffPortalView: React.FC<StaffPortalViewProps> = ({ db, onExitToPublic }) => {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    const session = dataService.getCurrentSession();
    if (session) {
      return {
        id: session.id,
        name: session.role === 'ADMIN' ? 'Administrator' : 'Personale',
        role: session.role,
        pin: '',
        createdAt: new Date().toISOString(),
      };
    }
    return dataService.getCurrentStaffUser();
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StaffTab>('scanner');

  // Competition score state
  const activeCompetitions = (db.competitions || []).filter((c) => c.active);
  const [selectedCompId, setSelectedCompId] = useState<string>(
    activeCompetitions[0]?.id || ''
  );
  const [participantName, setParticipantName] = useState<string>('');
  const [scoreValue, setScoreValue] = useState<string>('');
  const [isSubmittingScore, setIsSubmittingScore] = useState<boolean>(false);
  const [scoreFeedback, setScoreFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    isRecord?: boolean;
  } | null>(null);

  // Keep selected competition valid
  useEffect(() => {
    if (!selectedCompId && activeCompetitions.length > 0) {
      setSelectedCompId(activeCompetitions[0].id);
    }
  }, [activeCompetitions, selectedCompId]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setAuthError(null);
    const res = await dataService.login(pinInput.trim());
    if (res.success && res.role) {
      setCurrentUser({
        id: 'sess-' + Date.now(),
        name: res.role === 'ADMIN' ? 'Administrator' : 'Personale',
        role: res.role,
        pin: '',
        createdAt: new Date().toISOString(),
      });
      setPinInput('');
    } else {
      setAuthError(res.error || 'Forkert adgangskode');
    }
  };

  const handleLogout = () => {
    dataService.logout();
    setCurrentUser(null);
  };

  // Submit competition score
  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompId || !participantName.trim() || !scoreValue.trim()) return;

    const numericScore = parseFloat(scoreValue.replace(',', '.'));
    if (isNaN(numericScore)) {
      setScoreFeedback({ type: 'error', message: 'Ugyldig score værdi' });
      return;
    }

    setIsSubmittingScore(true);
    setScoreFeedback(null);

    const res = await dataService.addScore(
      selectedCompId,
      participantName.trim(),
      numericScore
    );

    setIsSubmittingScore(false);

    if (res.success) {
      setScoreFeedback({
        type: 'success',
        message: res.isNewRecord
          ? `🎉 NY DAGSREKORD! ${participantName.trim()} er nu nr. 1!`
          : `✓ Resultat registreret for ${participantName.trim()}!`,
        isRecord: res.isNewRecord,
      });
      setParticipantName('');
      setScoreValue('');
      setTimeout(() => setScoreFeedback(null), 5000);
    } else {
      setScoreFeedback({
        type: 'error',
        message: res.error || 'Kunne ikke gemme score',
      });
    }
  };

  // If not authenticated, show Staff Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#081326] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white text-[#081326] rounded-3xl p-6 shadow-2xl border border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-[#081326] p-2.5 mx-auto mb-3 flex items-center justify-center shadow-md">
            <img
              src="/agf-logo.svg"
              alt="AGF"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <h2 className="text-xl font-black text-center uppercase tracking-tight text-[#081326]">
            AGF Personale & Drift
          </h2>
          <p className="text-xs text-gray-500 text-center mt-0.5 mb-6">
            Log ind for adgang til kuponscanner og resultatregistrering
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                Indtast adgangskode
              </label>
              <input
                id="staff-portal-pin"
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-center font-mono text-xl tracking-widest focus:outline-hidden focus:border-[#081326] focus:ring-2 focus:ring-[#081326]/20 transition-all font-bold"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl text-center font-semibold">
                {authError}
              </div>
            )}

            <button
              id="staff-login-btn"
              type="submit"
              className="w-full py-3.5 bg-[#081326] hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-98 transition-all cursor-pointer"
            >
              Log Ind som Personale
            </button>
          </form>

          <button
            onClick={onExitToPublic}
            className="w-full mt-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tilbage til tilskuer-appen</span>
          </button>
        </div>
      </div>
    );
  }

  // Selected competition details
  const selectedComp = activeCompetitions.find((c) => c.id === selectedCompId);
  const compScores = (db.scores || [])
    .filter((s) => s.competitionId === selectedCompId)
    .sort((a, b) =>
      selectedComp?.higherScoreWins ? b.score - a.score : a.score - b.score
    );

  return (
    <div className="min-h-screen bg-[#F6F6F4] text-[#081326] flex flex-col">
      {/* Top Staff App Bar */}
      <header className="bg-[#081326] text-white px-4 py-3.5 flex items-center justify-between shadow-md border-b border-white/10 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 p-1 flex items-center justify-center">
            <img
              src="/agf-logo.svg"
              alt="AGF"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black uppercase tracking-wider leading-none">
                Driftsportal
              </h1>
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-amber-500 text-black'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {currentUser.role === 'ADMIN' ? 'Admin' : 'Personale'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              {currentUser.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExitToPublic}
            title="Gå til offentlig app"
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tilskuer-app</span>
          </button>

          <button
            onClick={handleLogout}
            title="Log ud"
            className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs for Staff */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'scanner'
              ? 'bg-[#081326] text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>Kuponscanner</span>
        </button>

        <button
          onClick={() => setActiveTab('scores')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'scores'
              ? 'bg-[#081326] text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Score-registrering</span>
        </button>

        {currentUser.role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Fuld Kontrolpanel</span>
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 p-3 sm:p-5 max-w-3xl mx-auto w-full">
        {/* TAB 1: KUPONSCANNER */}
        {activeTab === 'scanner' && (
          <div>
            <StaffScannerView db={db} onExit={onExitToPublic} />
          </div>
        )}

        {/* TAB 2: COMPETITION SCORE ENTRY */}
        {activeTab === 'scores' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 mb-1">
                <Trophy className="w-4 h-4" />
                <span>Arena Konkurrencer</span>
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[#081326]">
                Registrer Score
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Indtast skudmåling eller konkurrenceresultater. Opdaterer omgående publikums leaderboard i hallen.
              </p>

              {activeCompetitions.length === 0 ? (
                <div className="mt-4 p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                  Ingen aktive konkurrencer i dag. Opret en i kontrolpanelet.
                </div>
              ) : (
                <form onSubmit={handleScoreSubmit} className="mt-4 space-y-4">
                  {/* Select Competition */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                      Vælg Konkurrence
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeCompetitions.map((comp) => (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => setSelectedCompId(comp.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedCompId === comp.id
                              ? 'bg-[#081326] text-white border-[#081326] shadow-sm'
                              : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-extrabold text-xs uppercase tracking-wide">
                            {comp.name}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              selectedCompId === comp.id
                                ? 'text-gray-300'
                                : 'text-gray-500'
                            }`}
                          >
                            Enhed: {comp.scoringUnit} ·{' '}
                            {comp.higherScoreWins ? 'Højeste vinder' : 'Laveste vinder'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Participant Name */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                      Deltagers Navn
                    </label>
                    <input
                      type="text"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="F.eks. Mikkel Hansen"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:outline-hidden focus:border-[#081326] focus:ring-2 focus:ring-[#081326]/20"
                      required
                    />
                  </div>

                  {/* Score Value */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                      Resultat / Score ({selectedComp?.scoringUnit || 'point'})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={scoreValue}
                        onChange={(e) => setScoreValue(e.target.value)}
                        placeholder="F.eks. 94"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-lg font-black focus:outline-hidden focus:border-[#081326] focus:ring-2 focus:ring-[#081326]/20 pr-16 font-mono"
                        required
                      />
                      <span className="absolute right-3.5 top-3 text-xs font-black uppercase text-gray-400">
                        {selectedComp?.scoringUnit || 'point'}
                      </span>
                    </div>
                  </div>

                  {/* Status / Feedback message */}
                  {scoreFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        scoreFeedback.type === 'success'
                          ? scoreFeedback.isRecord
                            ? 'bg-amber-100 border border-amber-300 text-amber-900 shadow-sm'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}
                    >
                      {scoreFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{scoreFeedback.message}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingScore}
                    className="w-full py-3.5 bg-[#081326] hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>
                      {isSubmittingScore ? 'Gemmer...' : 'Gem og Opdater Leaderboard'}
                    </span>
                  </button>
                </form>
              )}
            </div>

            {/* Current Competition Leaderboard Preview */}
            {selectedComp && (
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#081326]">
                    Leaderboard: {selectedComp.name}
                  </h3>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">
                    {compScores.length} registreringer
                  </span>
                </div>

                {compScores.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">
                    Ingen resultater registreret endnu i dag.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {compScores.slice(0, 5).map((entry, idx) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${
                          idx === 0
                            ? 'bg-amber-50 border border-amber-200 font-bold'
                            : 'bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] ${
                              idx === 0
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-[#081326]">
                            {entry.participantName}
                          </span>
                        </div>
                        <div className="font-mono font-black text-[#081326]">
                          {entry.score} {selectedComp.scoringUnit}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FULL ADMIN DASHBOARD (ADMIN ONLY) */}
        {activeTab === 'admin' && currentUser.role === 'ADMIN' && (
          <div>
            <AdminDashboard
              db={db}
              isOpen={true}
              onClose={() => setActiveTab('scanner')}
            />
          </div>
        )}
      </main>
    </div>
  );
};
