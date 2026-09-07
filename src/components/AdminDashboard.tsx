import React, { useState } from 'react';
import {
  MatchdayDatabase,
  Matchday,
  Match,
  ScheduleItem,
  Product,
  Coupon,
  Competition,
  Score,
  VotingSession,
  Player,
  Partner,
  Announcement,
  FeaturedHero,
  StaffUser,
} from '../types.ts';
import { dataService } from '../services/dataService.ts';
import { StaffScannerView } from './StaffScannerView.tsx';
import {
  Calendar,
  Clock,
  Star,
  Beer,
  Tag,
  Trophy,
  UserCheck,
  HeartHandshake,
  Megaphone,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Radio,
  Flame,
  X,
  Sparkles,
  RefreshCw,
  LogOut,
  Sliders,
  ScanLine,
  Users,
  Key,
  ShieldCheck,
  Share2,
} from 'lucide-react';

interface AdminDashboardProps {
  db: MatchdayDatabase;
  onClose: () => void;
}

type AdminSection =
  | 'matchday'
  | 'kampe'
  | 'program'
  | 'stem'
  | 'kiosk'
  | 'kuponer'
  | 'scanner'
  | 'staff'
  | 'konkurrencer'
  | 'tilmelding'
  | 'partnere'
  | 'beskeder'
  | 'analytics';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ db, onClose }) => {
  // Authentication state (simple secure PIN for volunteers)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('agf_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active admin section
  const [currentSection, setCurrentSection] = useState<AdminSection>('matchday');

  // Fast score entry state
  const [scoreCompId, setScoreCompId] = useState<string>('');
  const [scoreName, setScoreName] = useState<string>('');
  const [scoreValue, setScoreValue] = useState<string>('');
  const [scoreSuccess, setScoreSuccess] = useState<string | null>(null);

  // Quick announcement state
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annMessage, setAnnMessage] = useState<string>('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('normal');

  // Canonical App URL state for Feature 21
  const [canonicalUrlInput, setCanonicalUrlInput] = useState<string>(() => db.canonicalAppUrl || '');
  const [canonicalUrlSaved, setCanonicalUrlSaved] = useState<boolean>(false);

  // New staff user form state for Feature 25
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffPin, setNewStaffPin] = useState<string>('');
  const [newStaffRole, setNewStaffRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [staffActionMsg, setStaffActionMsg] = useState<string | null>(null);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === (db.adminPin || '1880') || pinInput.toLowerCase() === 'agf1880' || pinInput.toLowerCase() === 'sponsorformand@agfhaandbold.dk') {
      setIsAuthenticated(true);
      sessionStorage.setItem('agf_admin_auth', 'true');
      setLoginError(null);
    } else {
      setLoginError('Forkert adgangskode. Prøv stiftelsesåret 1880.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('agf_admin_auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-[#081326] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white text-[#081326] rounded-3xl p-6 shadow-2xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-[#081326] p-2 mx-auto mb-3 flex items-center justify-center">
            <img src="/agf-logo.svg" alt="AGF" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-xl font-extrabold text-center font-['Teko'] text-2xl tracking-wide">
            AGF Matchday Admin
          </h2>
          <p className="text-xs text-gray-500 text-center mb-5">
            Adgang for AGF Håndbold personale og frivillige
          </p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Adgangskode (Standard: 1880)
              </label>
              <input
                id="admin-pin-input"
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Indtast PIN eller kode"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#081326]"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#081326] hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
            >
              Log Ind i Kontrolpanel
            </button>
          </form>

          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-xs text-gray-500 hover:text-gray-800 text-center"
          >
            ← Tilbage til tilskuer-appen
          </button>
        </div>
      </div>
    );
  }

  const activeMatchday = db.matchdays.find((m) => m.id === db.activeMatchdayId) || db.matchdays[0];

  const navItems = [
    { id: 'matchday' as AdminSection, label: 'Matchday', icon: Calendar },
    { id: 'scanner' as AdminSection, label: 'Kuponscanner', icon: ScanLine },
    { id: 'staff' as AdminSection, label: 'Personale', icon: Users },
    { id: 'kampe' as AdminSection, label: 'Kampe', icon: Flame },
    { id: 'program' as AdminSection, label: 'Program', icon: Clock },
    { id: 'stem' as AdminSection, label: 'Kampens Spiller', icon: Star },
    { id: 'kiosk' as AdminSection, label: 'Kiosk', icon: Beer },
    { id: 'kuponer' as AdminSection, label: 'Kuponer & Stats', icon: Tag },
    { id: 'konkurrencer' as AdminSection, label: 'Konkurrencer', icon: Trophy },
    { id: 'tilmelding' as AdminSection, label: 'Tilmelding', icon: UserCheck },
    { id: 'partnere' as AdminSection, label: 'Partnere', icon: HeartHandshake },
    { id: 'beskeder' as AdminSection, label: 'Beskeder', icon: Megaphone },
    { id: 'analytics' as AdminSection, label: 'Statistik', icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#F6F6F4] text-[#081326] flex flex-col overflow-hidden">
      {/* Admin Top Bar */}
      <div className="bg-[#081326] text-white px-4 py-3 flex items-center justify-between border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white p-1">
            <img src="/agf-logo.svg" alt="AGF" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#C8102E] text-white px-1.5 py-0.2 rounded">
                Admin
              </span>
              <span className="text-xs font-bold text-gray-200 truncate max-w-[150px]">
                {activeMatchday?.title || 'AGF Matchday'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Mobil kontrolpanel</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            title="Log ud"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white text-[#081326] font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-gray-100"
          >
            Se Tilskuer App
          </button>
        </div>
      </div>

      {/* Horizontal Nav Tabs for Mobile Staff */}
      <div className="bg-white border-b border-gray-200 px-2 py-1.5 flex gap-1 overflow-x-auto scrollbar-none flex-shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              id={`admin-tab-${item.id}`}
              onClick={() => setCurrentSection(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all select-none ${
                isActive
                  ? 'bg-[#081326] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Admin Content Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full pb-20">
        {/* ================= SECTION: MATCHDAY ================= */}
        {currentSection === 'matchday' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-base text-[#081326] mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" />
                <span>Vælg Aktiv Matchday</span>
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Den valgte matchday vises automatisk for alle tilskuere i hallen.
              </p>

              <div className="space-y-2">
                {db.matchdays.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      m.id === db.activeMatchdayId
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#081326]">{m.title}</span>
                        {m.id === db.activeMatchdayId && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.2 rounded-full">
                            AKTIV NU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500">{m.date} · {m.venue}</span>
                    </div>

                    {m.id !== db.activeMatchdayId && (
                      <button
                        onClick={() => dataService.setActiveMatchday(m.id)}
                        className="px-3 py-1.5 bg-[#081326] text-white text-xs font-bold uppercase rounded-lg shadow-xs"
                      >
                        Aktivér
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Hero Priority Card Controller */}
            {activeMatchday && (
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-base text-[#081326] mb-1 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#C8102E]" />
                  <span>Fremhævet Hero Kort (Top af Tilskuer-skærm)</span>
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Skift hvad der vises i det store fremhævede felt øverst med ét tryk!
                </p>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => {
                      dataService.updateFeaturedHero(activeMatchday.id, {
                        enabled: true,
                        badge: 'LIVE NU',
                        title: 'STEM PÅ KAMPENS SPILLER',
                        subtitle: 'Afstemningen er åben! Vælg kampens bedste spiller nu.',
                        actionText: 'AFGIV DIN STEMME',
                        actionTarget: 'stem',
                      });
                    }}
                    className="p-2.5 rounded-xl border border-gray-200 text-left bg-gray-50 hover:bg-gray-100 text-xs font-bold"
                  >
                    ⭐ Stem på Kampens Spiller
                  </button>

                  <button
                    onClick={() => {
                      dataService.updateFeaturedHero(activeMatchday.id, {
                        enabled: true,
                        badge: '🔥 PAUSETILBUD',
                        title: '2 FADØL FOR 80 KR.',
                        subtitle: 'Aktivér din kupon og hent forfriskninger i kiosken nu.',
                        actionText: 'SE PAUSETILBUD',
                        actionTarget: 'tilbud',
                      });
                    }}
                    className="p-2.5 rounded-xl border border-gray-200 text-left bg-gray-50 hover:bg-gray-100 text-xs font-bold"
                  >
                    🍺 2 Fadøl for 80 kr.
                  </button>

                  <button
                    onClick={() => {
                      dataService.updateFeaturedHero(activeMatchday.id, {
                        enabled: true,
                        badge: '🎯 KONKURRENCE',
                        title: 'KAN DU SLÅ 96 KM/T?',
                        subtitle: 'Test dit skud i fanzonen bag sektion B og kom på leaderboardet.',
                        actionText: 'SE HIGH SCORES',
                        actionTarget: 'konkurrencer',
                      });
                    }}
                    className="p-2.5 rounded-xl border border-gray-200 text-left bg-gray-50 hover:bg-gray-100 text-xs font-bold"
                  >
                    🎯 Skudmåler Konkurrence
                  </button>

                  <button
                    onClick={() => {
                      dataService.updateFeaturedHero(activeMatchday.id, {
                        enabled: true,
                        badge: 'VELKOMMEN',
                        title: 'VELKOMMEN TIL MATCHDAY',
                        subtitle: 'Se dagens fulde program og aktiviteter i Ceres Arena.',
                        actionText: 'SE PROGRAM',
                        actionTarget: 'program',
                      });
                    }}
                    className="p-2.5 rounded-xl border border-gray-200 text-left bg-gray-50 hover:bg-gray-100 text-xs font-bold"
                  >
                    👋 Velkommen til Ceres Arena
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                  <span className="font-semibold">Nuværende Hero Kort:</span>
                  <span className="font-bold text-[#081326]">
                    {activeMatchday.featuredHero?.title || 'Ingen aktiv'}
                  </span>
                </div>
              </div>
            )}

            {/* Feature 21: Del Matchday Canonical URL Settings */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-base text-[#081326] mb-1 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-red-600" />
                <span>Fast URL for Del Matchday (QR-kode)</span>
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                QR-koden under "Del Matchday" peger altid på denne faste hoved-URL fremfor undersider.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={canonicalUrlInput}
                  onChange={(e) => {
                    setCanonicalUrlInput(e.target.value);
                    setCanonicalUrlSaved(false);
                  }}
                  placeholder="https://matchday.agf.dk"
                  className="flex-1 px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-red-600 outline-hidden font-bold"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await dataService.updateCanonicalUrl(canonicalUrlInput);
                    setCanonicalUrlSaved(true);
                    setTimeout(() => setCanonicalUrlSaved(false), 3000);
                  }}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    canonicalUrlSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#081326] hover:bg-black text-white'
                  }`}
                >
                  {canonicalUrlSaved ? 'Gemt ✓' : 'Gem Link'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION: KAMPE ================= */}
        {currentSection === 'kampe' && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-[#081326] px-1 uppercase tracking-wider">
              Dagens Kampe & Live Stilling
            </h3>
            {db.matches.map((match) => (
              <div key={match.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-[#081326] text-white">
                    {match.category}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">{match.league} · kl. {match.time}</span>
                </div>

                <div className="font-bold text-base text-[#081326]">
                  {match.homeTeam} vs. {match.awayTeam}
                </div>

                {/* Score Controls */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">AGF</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => {
                          const updated = { ...match, homeScore: Math.max(0, (match.homeScore || 0) - 1) };
                          dataService.saveMatch(updated);
                        }}
                        className="w-7 h-7 bg-white rounded-lg border text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="font-black text-xl w-6 text-center">{match.homeScore ?? 0}</span>
                      <button
                        onClick={() => {
                          const updated = { ...match, homeScore: (match.homeScore || 0) + 1 };
                          dataService.saveMatch(updated);
                        }}
                        className="w-7 h-7 bg-white rounded-lg border text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <span className="text-gray-400 font-bold text-lg">:</span>

                  <div className="text-center">
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">{match.awayTeam.substring(0, 8)}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => {
                          const updated = { ...match, awayScore: Math.max(0, (match.awayScore || 0) - 1) };
                          dataService.saveMatch(updated);
                        }}
                        className="w-7 h-7 bg-white rounded-lg border text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="font-black text-xl w-6 text-center">{match.awayScore ?? 0}</span>
                      <button
                        onClick={() => {
                          const updated = { ...match, awayScore: (match.awayScore || 0) + 1 };
                          dataService.saveMatch(updated);
                        }}
                        className="w-7 h-7 bg-white rounded-lg border text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status selector */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Kampstatus:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                    {(['upcoming', 'live', 'halftime', 'second_half', 'finished'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => dataService.saveMatch({ ...match, status: st })}
                        className={`py-1.5 px-2 rounded-lg border text-center uppercase tracking-tight text-[10px] ${
                          match.status === st
                            ? 'bg-[#081326] text-white border-[#081326]'
                            : 'bg-white text-gray-700 border-gray-200'
                        }`}
                      >
                        {st === 'upcoming'
                          ? 'Kommende'
                          : st === 'live'
                          ? '1. Halvleg'
                          : st === 'halftime'
                          ? 'Pause'
                          : st === 'second_half'
                          ? '2. Halvleg'
                          : 'Afsluttet'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= SECTION: PROGRAM ================= */}
        {currentSection === 'program' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm text-[#081326] uppercase tracking-wider">
                Tidsplan for Dagen
              </h3>
              <span className="text-xs text-gray-500">Skift status med ét tryk</span>
            </div>

            <div className="space-y-2">
              {db.schedule.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded">
                        kl. {item.time}
                      </span>
                      <h4 className="font-bold text-sm text-[#081326]">{item.title}</h4>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}

                  {/* Status Toggle Buttons */}
                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => dataService.saveScheduleItem({ ...item, status: 'upcoming' })}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold uppercase ${
                        item.status === 'upcoming' ? 'bg-gray-300 text-gray-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      Kommende
                    </button>
                    <button
                      onClick={() => dataService.saveScheduleItem({ ...item, status: 'live' })}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold uppercase ${
                        item.status === 'live' ? 'bg-[#C8102E] text-white shadow-xs animate-pulse' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      I gang nu (LIVE)
                    </button>
                    <button
                      onClick={() => dataService.saveScheduleItem({ ...item, status: 'completed' })}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold uppercase ${
                        item.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      Afsluttet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION: KAMPENS SPILLER ================= */}
        {currentSection === 'stem' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#081326] px-1 uppercase tracking-wider">
              Afstemnings-kontrol: Kampens Spiller
            </h3>

            {db.votingSessions.map((session) => {
              const sessionPlayers = db.players.filter((p) => p.sessionId === session.id);
              const sessionVotes = db.votes.filter((v) => v.sessionId === session.id);
              const totalVotes = sessionVotes.length;

              return (
                <div key={session.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <span className="font-extrabold text-xs uppercase px-2 py-0.5 rounded bg-[#081326] text-white mr-2">
                        {session.category}
                      </span>
                      <span className="font-bold text-sm text-[#081326]">{session.title}</span>
                    </div>

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      session.status === 'open'
                        ? 'bg-[#C8102E] text-white animate-pulse'
                        : session.status === 'closed'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {session.status === 'open' ? 'ÅBEN' : session.status === 'closed' ? 'LUKKET' : 'AFVENTER'}
                    </span>
                  </div>

                  {/* Actions: Open / Close / Reset */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => dataService.saveVotingSession({ ...session, status: 'open' })}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase"
                    >
                      Åbn Stemmer
                    </button>
                    <button
                      onClick={() => dataService.saveVotingSession({ ...session, status: 'closed' })}
                      className="py-2 bg-gray-800 hover:bg-black text-white rounded-xl text-xs font-bold uppercase"
                    >
                      Luk Afstemning
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Er du sikker på, at du vil nulstille alle stemmer for ${session.category}?`)) {
                          dataService.resetVoting(session.id);
                        }
                      }}
                      className="py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold uppercase"
                    >
                      Nulstil
                    </button>
                  </div>

                  {/* Live Stats */}
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between text-xs font-bold text-[#081326] mb-2">
                      <span>Stemmetal: {totalVotes} stemmer</span>
                      <button
                        onClick={() =>
                          dataService.saveVotingSession({
                            ...session,
                            publicResultsEnabled: !session.publicResultsEnabled,
                          })
                        }
                        className="text-[11px] underline text-[#081326]"
                      >
                        {session.publicResultsEnabled ? 'Skjul offentlige tal' : 'Gør tal offentlige'}
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {sessionPlayers.map((player) => {
                        const count = sessionVotes.filter((v) => v.playerId === player.id).length;
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        const isWinner = session.winnerPlayerId === player.id;

                        return (
                          <div key={player.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-none">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-gray-500">#{player.number}</span>
                              <span className="font-semibold text-[#081326]">{player.name}</span>
                              {isWinner && (
                                <span className="text-[10px] font-black uppercase bg-amber-400 text-black px-1.5 rounded">
                                  VINDER 🏆
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-[11px] font-medium">{pct}% ({count})</span>
                              <button
                                onClick={() =>
                                  dataService.saveVotingSession({
                                    ...session,
                                    winnerPlayerId: player.id,
                                  })
                                }
                                title="Kår som vinder"
                                className="text-[10px] bg-white border border-gray-300 hover:bg-amber-100 px-2 py-0.5 rounded font-bold"
                              >
                                Vælg vinder
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= SECTION: KIOSK ================= */}
        {currentSection === 'kiosk' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm text-[#081326] uppercase tracking-wider">
                Kiosk & Priser – Hurtig Udsolgt-styring
              </h3>
            </div>
            <p className="text-xs text-gray-500 px-1">
              Tryk på "UDSOLGT"-knappen ud for en vare for øjeblikkeligt at opdatere tilskuernes skærme.
            </p>

            <div className="space-y-2">
              {db.products.map((product) => (
                <div
                  key={product.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    product.available ? 'bg-white border-gray-200' : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#081326]">{product.name}</span>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {product.price} kr.
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">Kategori: {product.category}</span>
                  </div>

                  <button
                    onClick={() => dataService.toggleProductAvailability(product.id)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all ${
                      product.available
                        ? 'bg-gray-100 hover:bg-rose-100 text-gray-700 hover:text-rose-700'
                        : 'bg-[#C8102E] text-white shadow-xs'
                    }`}
                  >
                    {product.available ? 'Markér Udsolgt' : 'UDSOLGT ✕'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION: KUPONSCANNER (EMBEDDED) ================= */}
        {currentSection === 'scanner' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#081326] uppercase tracking-wider">
                Kiosk Kuponscanner
              </h3>
              <button
                onClick={() => setCurrentSection('kuponer')}
                className="text-xs font-bold text-gray-500 hover:text-[#081326] cursor-pointer"
              >
                Tilbage til oversigt
              </button>
            </div>
            <StaffScannerView db={db} onExit={() => setCurrentSection('kuponer')} />
          </div>
        )}

        {/* ================= SECTION: PERSONALE & VAGTSTYRING ================= */}
        {currentSection === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#081326] px-1 uppercase tracking-wider">
                Kioskpersonale & Vagtstyring
              </h3>
              <span className="text-xs font-bold text-gray-400">
                {(db.staffUsers || []).length} aktive brugere
              </span>
            </div>

            {/* Master Admin PIN info card */}
            <div className="bg-[#081326] text-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-red-400">
                    Master Admin PIN
                  </h4>
                  <p className="font-mono text-xl font-black tracking-widest text-white">
                    {db.adminPin || '1880'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase text-gray-300 bg-white/10 px-2 py-1 rounded-lg">
                Fuld systemadgang
              </span>
            </div>

            {/* Add New Staff Member Form */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-[#081326] flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                <span>Opret ny medarbejder / kioskvagt</span>
              </h4>

              {staffActionMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                  {staffActionMsg}
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newStaffName.trim() || !newStaffPin.trim()) return;

                  const newStaff: StaffUser = {
                    id: `staff-${Date.now()}`,
                    name: newStaffName.trim(),
                    pin: newStaffPin.trim(),
                    role: newStaffRole,
                    createdAt: new Date().toISOString(),
                  };

                  await dataService.saveStaffUser(newStaff);
                  setStaffActionMsg(`✓ Medarbejder "${newStaffName}" oprettet med PIN ${newStaffPin}`);
                  setNewStaffName('');
                  setNewStaffPin('');
                  setTimeout(() => setStaffActionMsg(null), 3500);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                    Fulde navn / Vagt:
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="F.eks. Anders (Kiosk A)"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                      4-cifret PIN-kode:
                    </label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={newStaffPin}
                      onChange={(e) => setNewStaffPin(e.target.value)}
                      placeholder="fx 2401"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                      Rolle:
                    </label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as 'STAFF' | 'ADMIN')}
                      className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl"
                    >
                      <option value="STAFF">STAFF (Kun scanner)</option>
                      <option value="ADMIN">ADMIN (Fuld adgang)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Tilføj Personale
                </button>
              </form>
            </div>

            {/* List of Staff Members */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 px-1">
                Registrerede medarbejdere
              </h4>
              {(!db.staffUsers || db.staffUsers.length === 0) ? (
                <div className="p-4 bg-white rounded-2xl border text-center text-xs text-gray-400">
                  Ingen særskilte personale-profiler oprettet endnu.
                </div>
              ) : (
                db.staffUsers.map((staff) => {
                  const scans = (db.couponRedemptions || []).filter(
                    (r) => r.redeemedByStaffId === staff.id
                  ).length;

                  return (
                    <div
                      key={staff.id}
                      className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#081326] text-white flex items-center justify-center font-black text-xs">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#081326]">{staff.name}</span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-gray-100 text-gray-600">
                              {staff.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5 font-mono">
                            <span>PIN: •••• ({staff.pin})</span>
                            <span>•</span>
                            <span>{scans} scanninger i dag</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (confirm(`Vil du slette medarbejder "${staff.name}"?`)) {
                            await dataService.deleteStaffUser(staff.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Slet personale"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= SECTION: KUPONER & STATS ================= */}
        {currentSection === 'kuponer' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm text-[#081326] uppercase tracking-wider">
                Kupon-overvågning & Scanner
              </h3>
              <button
                onClick={() => setCurrentSection('scanner')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Åbn Scanner</span>
              </button>
            </div>

            {/* High level KPI summary */}
            {(() => {
              const allRedemptions = db.couponRedemptions || [];
              const totalActive = allRedemptions.length;
              const totalRedeemed = allRedemptions.filter((r) => r.status === 'redeemed' || r.redeemed).length;
              const rate = totalActive > 0 ? Math.round((totalRedeemed / totalActive) * 100) : 0;
              const totalRevenue = allRedemptions
                .filter((r) => r.status === 'redeemed' || r.redeemed)
                .reduce((acc, r) => {
                  const c = db.coupons.find((cp) => cp.id === r.couponId);
                  return acc + (c ? c.offerPrice : 0);
                }, 0);

              return (
                <div className="grid grid-cols-4 gap-2 bg-[#081326] text-white p-4 rounded-2xl shadow-sm">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Aktiveret</span>
                    <span className="font-black text-lg text-white font-mono">{totalActive}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Indløst</span>
                    <span className="font-black text-lg text-emerald-400 font-mono">{totalRedeemed}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Rate</span>
                    <span className="font-black text-lg text-amber-400 font-mono">{rate}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Omsætning</span>
                    <span className="font-black text-lg text-white font-mono">{totalRevenue} kr.</span>
                  </div>
                </div>
              );
            })()}

            {/* Individual coupon controls */}
            <div className="space-y-3">
              {db.coupons.map((coupon) => {
                const totalActivations = (db.couponRedemptions || []).filter(
                  (r) => r.couponId === coupon.id
                ).length;
                const totalRedeemed = (db.couponRedemptions || []).filter(
                  (r) => r.couponId === coupon.id && (r.status === 'redeemed' || r.redeemed)
                ).length;
                const redemptionRate =
                  totalActivations > 0 ? Math.round((totalRedeemed / totalActivations) * 100) : 0;
                const remaining = (coupon.maxRedemptions || 100) - totalRedeemed;

                return (
                  <div key={coupon.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-base text-[#081326]">{coupon.title}</h4>
                        <span className="text-xs text-gray-500 font-semibold">
                          Tilbud: {coupon.offerPrice} kr. {coupon.originalPrice && `(før ${coupon.originalPrice} kr.)`}
                        </span>
                      </div>

                      <button
                        onClick={() => dataService.saveCoupon({ ...coupon, active: !coupon.active })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer ${
                          coupon.active ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {coupon.active ? 'Aktiv' : 'Deaktiveret'}
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center p-2.5 bg-gray-50 rounded-xl">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Aktiveret</span>
                        <span className="font-black text-sm text-[#081326]">{totalActivations}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Indfriet</span>
                        <span className="font-black text-sm text-emerald-600">{totalRedeemed}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Tilbage</span>
                        <span className="font-black text-sm text-[#081326]">{Math.max(0, remaining)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Rate</span>
                        <span className="font-black text-sm text-blue-600">{redemptionRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Real-time Redemption Audit Trail Table */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#081326] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Kuponscanner Audit-Trail & Log</span>
                </h4>
                <span className="text-[10px] font-bold text-gray-400">
                  {(db.redemptionLogs || []).length} hændelser
                </span>
              </div>

              {(!db.redemptionLogs || db.redemptionLogs.length === 0) ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  Ingen scanningshændelser logget endnu i dag.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {db.redemptionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#081326]">{log.couponTitle}</span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                              log.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.status === 'already_used'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.status === 'success'
                              ? 'Godkendt'
                              : log.status === 'already_used'
                              ? 'Allerede brugt'
                              : log.status === 'expired'
                              ? 'Udløbet'
                              : 'Afvist'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Scannet af {log.staffName} • {log.tokenPreview || 'Token'}
                        </p>
                      </div>

                      <span className="font-mono text-[10px] text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString('da-DK', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= SECTION: KONKURRENCER (RAPID SCORE ENTRY) ================= */}
        {currentSection === 'konkurrencer' && (
          <div className="space-y-4">
            {/* Quick Score Entry Form */}
            <div className="bg-white rounded-2xl p-4 border-2 border-[#081326] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-[#081326]">
                  Hurtig Resultat-registrering (Mobil)
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Indtast deltager og resultat. Leaderboard opdateres live på storskærm og telefoner!
              </p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!scoreName || !scoreValue) return;
                  const compId = scoreCompId || db.competitions[0]?.id;
                  const res = await dataService.addScore(compId, scoreName, Number(scoreValue));
                  if (res.success) {
                    setScoreSuccess(
                      `Resultat gemt for ${scoreName}! ${res.isNewRecord ? '🔥 NY REKORD!' : ''}`
                    );
                    setScoreName('');
                    setScoreValue('');
                    setTimeout(() => setScoreSuccess(null), 4000);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                    Vælg Konkurrence:
                  </label>
                  <select
                    value={scoreCompId || db.competitions[0]?.id}
                    onChange={(e) => setScoreCompId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs font-bold text-[#081326]"
                  >
                    {db.competitions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.scoringUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                      Deltagers Navn:
                    </label>
                    <input
                      type="text"
                      value={scoreName}
                      onChange={(e) => setScoreName(e.target.value)}
                      placeholder="F.eks. Mikkel Lind"
                      className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs font-bold text-[#081326]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                      Score / Resultat:
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={scoreValue}
                      onChange={(e) => setScoreValue(e.target.value)}
                      placeholder="F.eks. 94"
                      className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs font-bold text-[#081326]"
                      required
                    />
                  </div>
                </div>

                {scoreSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold text-center animate-fade-in">
                    {scoreSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-[#081326] hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Gem Resultat (Opdatér Leaderboard)
                </button>
              </form>
            </div>

            {/* Existing Scores & Edit/Delete */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">
                Seneste Registrerede Resultater
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {db.scores.slice(0, 15).map((score) => {
                  const comp = db.competitions.find((c) => c.id === score.competitionId);
                  return (
                    <div key={score.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50">
                      <div>
                        <span className="font-bold text-[#081326] mr-2">{score.participantName}</span>
                        <span className="text-gray-500 font-mono">
                          {score.score} {comp?.scoringUnit}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {comp?.name} · kl. {score.timestamp}
                        </span>
                      </div>
                      <button
                        onClick={() => dataService.deleteScore(score.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title="Slet forkert resultat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION: TILMELDING (LOOAD) ================= */}
        {currentSection === 'tilmelding' && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-base text-[#081326] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Looad Tilmeldings-indstillinger</span>
            </h3>
            <p className="text-xs text-gray-500">
              Indsæt eller opdatér Looad tilmeldings-linket for denne Matchday.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Looad URL
              </label>
              <input
                type="url"
                defaultValue={activeMatchday?.looadUrl || 'https://looad.dk/event/agf-matchday-2026'}
                onBlur={(e) => {
                  if (activeMatchday) {
                    dataService.updateLooadSettings(activeMatchday.id, e.target.value);
                  }
                }}
                className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Titel på tilmeldingskort
              </label>
              <input
                type="text"
                defaultValue={activeMatchday?.looadTitle || 'Tilmeld dig aktiviteten'}
                onBlur={(e) => {
                  if (activeMatchday) {
                    dataService.updateLooadSettings(activeMatchday.id, activeMatchday.looadUrl, e.target.value);
                  }
                }}
                className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Kort beskrivelse
              </label>
              <textarea
                rows={2}
                defaultValue={activeMatchday?.looadDescription || 'Tilmeld dig her og vær med på dagen.'}
                onBlur={(e) => {
                  if (activeMatchday) {
                    dataService.updateLooadSettings(activeMatchday.id, activeMatchday.looadUrl, undefined, e.target.value);
                  }
                }}
                className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
              />
            </div>
          </div>
        )}

        {/* ================= SECTION: PARTNERE ================= */}
        {currentSection === 'partnere' && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-[#081326] px-1 uppercase tracking-wider">
              Dagens Partnere & Sponsorer
            </h3>
            <div className="space-y-2">
              {db.partners.map((partner) => (
                <div key={partner.id} className="bg-white rounded-2xl p-3.5 border border-gray-200 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#081326]">{partner.name}</h4>
                    <span className="text-xs text-gray-400">{partner.category}</span>
                    {partner.offer && (
                      <p className="text-[11px] text-[#C8102E] font-medium">{partner.offer}</p>
                    )}
                  </div>

                  <button
                    onClick={() => dataService.savePartner({ ...partner, active: !partner.active })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                      partner.active ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {partner.active ? 'Aktiv' : 'Skjult'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION: BESKEDER ================= */}
        {currentSection === 'beskeder' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-base text-[#081326] flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <span>Opret Matchday Meddelelse</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Overskrift
                </label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="F.eks. Pausekonkurrence starter om 5 minutter!"
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Besked
                </label>
                <textarea
                  rows={2}
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Skriv den vigtige besked til tilskuerne her..."
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                />
              </div>

              <div className="flex gap-2">
                {(['normal', 'important', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAnnPriority(p)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase ${
                      annPriority === p ? 'bg-[#081326] text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {p === 'normal' ? 'Normal' : p === 'important' ? 'Vigtigt' : 'Haster 🚨'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (!annTitle || !annMessage) return;
                  dataService.saveAnnouncement({
                    id: `ann-${Date.now()}`,
                    matchdayId: db.activeMatchdayId,
                    title: annTitle,
                    message: annMessage,
                    priority: annPriority,
                    active: true,
                    createdAt: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
                  });
                  setAnnTitle('');
                  setAnnMessage('');
                }}
                className="w-full py-2.5 bg-[#081326] text-white font-bold text-xs uppercase rounded-xl shadow-xs"
              >
                Udsend Besked Nu
              </button>
            </div>

            {/* List of announcements */}
            <div className="space-y-2">
              {db.announcements.map((ann) => (
                <div key={ann.id} className="p-3 bg-white rounded-xl border flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#081326]">{ann.title}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-gray-100 rounded">
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{ann.message}</p>
                  </div>
                  <button
                    onClick={() => dataService.deleteAnnouncement(ann.id)}
                    className="text-gray-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION: ANALYTICS ================= */}
        {currentSection === 'analytics' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#081326] px-1 uppercase tracking-wider">
              Matchday Nøgletal & Statistik
            </h3>

            {/* Primary KPI Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <span className="text-xs text-gray-400 uppercase font-bold block">App Besøg i dag</span>
                <span className="font-black text-3xl text-[#081326]">{db.visits}</span>
                <span className="text-[10px] text-gray-400 block mt-1">QR scanninger</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <span className="text-xs text-gray-400 uppercase font-bold block">Afgivne Stemmer</span>
                <span className="font-black text-3xl text-amber-500">{db.votes.length}</span>
                <span className="text-[10px] text-gray-400 block mt-1">Kampens Spiller</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <span className="text-xs text-gray-400 uppercase font-bold block">Aktiverede Kuponer</span>
                <span className="font-black text-3xl text-rose-600">{db.couponRedemptions.length}</span>
                <span className="text-[10px] text-gray-400 block mt-1">
                  Heraf {db.couponRedemptions.filter((r) => r.status === 'redeemed').length} indfriet
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <span className="text-xs text-gray-400 uppercase font-bold block">Konkurrencer</span>
                <span className="font-black text-3xl text-blue-600">{db.scores.length}</span>
                <span className="text-[10px] text-gray-400 block mt-1">Registrerede forsøg</span>
              </div>
            </div>

            {/* Voting Details */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2">
              <h4 className="font-bold text-xs uppercase text-gray-700">
                Stemmer Fordelt på Spillere
              </h4>
              {db.players.map((p) => {
                const count = db.votes.filter((v) => v.playerId === p.id).length;
                if (count === 0) return null;
                return (
                  <div key={p.id} className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-none">
                    <span>#{p.number} {p.name}</span>
                    <span className="font-bold">{count} stemmer</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
