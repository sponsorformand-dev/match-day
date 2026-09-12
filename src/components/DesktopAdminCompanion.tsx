import React, { useState } from 'react';
import { MatchdayDatabase, ScheduleItem } from '../types.ts';
import { dataService } from '../services/dataService.ts';
import { Plus, Check, Send, ScanLine, Share2 } from 'lucide-react';

interface DesktopAdminCompanionProps {
  db: MatchdayDatabase;
  onOpenAdmin: (section?: string) => void;
}

export const DesktopAdminCompanion: React.FC<DesktopAdminCompanionProps> = ({
  db,
  onOpenAdmin,
}) => {
  const [showQuickMsg, setShowQuickMsg] = useState(false);
  const [quickMsgText, setQuickMsgText] = useState('');
  const [quickMsgTitle, setQuickMsgTitle] = useState('');
  const [quickActionStatus, setQuickActionStatus] = useState<string | null>(null);

  const activeMatchday = db.matchdays.find((m) => m.id === db.activeMatchdayId) || db.matchdays[0];
  const activeSchedule = db.schedule
    .filter((s) => s.matchdayId === db.activeMatchdayId)
    .sort((a, b) => a.order - b.order);

  const isVotingOpen = db.votingSessions.some((s) => s.status === 'open');
  const activeCoupons = db.coupons.filter((c) => c.active).length;

  const handleToggleVoting = async () => {
    const session = db.votingSessions[0];
    if (!session) return;
    const nextStatus = session.status === 'open' ? 'closed' : 'open';
    await dataService.saveVotingSession({ ...session, status: nextStatus });
    setQuickActionStatus(`Afstemning er nu ${nextStatus === 'open' ? 'ÅBEN' : 'LUKKET'}`);
    setTimeout(() => setQuickActionStatus(null), 3000);
  };

  const handleToggleCoupons = async () => {
    const anyActive = db.coupons.some((c) => c.active);
    for (const c of db.coupons) {
      await dataService.saveCoupon({ ...c, active: !anyActive });
    }
    setQuickActionStatus(`Pausetilbud ${!anyActive ? 'aktiveret' : 'deaktiveret'}`);
    setTimeout(() => setQuickActionStatus(null), 3000);
  };

  const handleSendQuickMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMsgText.trim()) return;
    await dataService.saveAnnouncement({
      id: `ann-${Date.now()}`,
      matchdayId: db.activeMatchdayId,
      title: quickMsgTitle.trim() || 'Vigtig meddelelse',
      message: quickMsgText.trim(),
      priority: 'important',
      active: true,
      createdAt: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
    });
    setQuickMsgText('');
    setQuickMsgTitle('');
    setShowQuickMsg(false);
    setQuickActionStatus('Besked udsendt til hallen');
    setTimeout(() => setQuickActionStatus(null), 3000);
  };

  return (
    <div className="hidden lg:flex flex-1 flex-col bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden self-stretch sticky top-6 max-h-[calc(100vh-48px)]">
      {/* Top Header */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 xl:px-8 flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 p-1 flex items-center justify-center shadow-2xs">
            <img src="/agf-logo.svg" alt="AGF Håndbold" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <h1 className="font-black uppercase tracking-tight text-xl text-[#081326]">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>System Status: OK</span>
          </div>
          <button
            onClick={() => setShowQuickMsg(!showQuickMsg)}
            className="bg-[#081326] hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shadow-xs"
          >
            {showQuickMsg ? 'Luk Besked' : 'Ny Besked'}
          </button>
        </div>
      </div>

      {/* Quick message drawer */}
      {showQuickMsg && (
        <form onSubmit={handleSendQuickMsg} className="p-4 bg-gray-50 border-b border-gray-200 flex gap-2 items-center flex-shrink-0">
          <input
            type="text"
            placeholder="Overskrift..."
            value={quickMsgTitle}
            onChange={(e) => setQuickMsgTitle(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-gray-300 w-40 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#081326]"
          />
          <input
            type="text"
            placeholder="Skriv live besked til tilskuerne i hallen..."
            value={quickMsgText}
            onChange={(e) => setQuickMsgText(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#081326]"
            autoFocus
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      )}

      {/* Notification feedback */}
      {quickActionStatus && (
        <div className="bg-emerald-500 text-white text-xs font-bold py-1.5 px-4 text-center tracking-wide uppercase">
          {quickActionStatus}
        </div>
      )}

      {/* Main Grid View */}
      <div className="flex-1 p-6 xl:p-8 grid grid-cols-3 gap-6 overflow-y-auto">
        <div className="col-span-2 flex flex-col gap-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#F6F6F4] p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-wider">
                Aktive Brugere
              </div>
              <div className="text-4xl font-black text-[#081326] leading-none">
                {db.visits}
              </div>
              <div className="text-[10px] text-green-600 font-bold mt-2">
                Besøg i dag
              </div>
            </div>

            <div className="bg-[#F6F6F4] p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-wider">
                Stemmer Afgivet
              </div>
              <div className="text-4xl font-black text-[#081326] leading-none">
                {db.votes.length}
              </div>
              <div className="text-[10px] text-blue-600 font-bold mt-2">
                {isVotingOpen ? 'Afstemning åben' : 'Afstemning lukket'}
              </div>
            </div>

            <div className="bg-[#F6F6F4] p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-wider">
                Indløste Kuponer
              </div>
              <div className="text-4xl font-black text-[#081326] leading-none">
                {db.couponRedemptions.filter((r) => r.status === 'redeemed').length}
              </div>
              <div className="text-[10px] text-orange-600 font-bold mt-2">
                {db.couponRedemptions.length} aktiverede i alt
              </div>
            </div>
          </div>

          {/* Dagens Program section */}
          <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-6 flex flex-col shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black uppercase text-sm tracking-widest text-gray-400">
                Dagens Program
              </h2>
              <button
                onClick={onOpenAdmin}
                className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider"
              >
                Redigér Program
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1">
              {activeSchedule.length > 0 ? (
                activeSchedule.slice(0, 6).map((item) => {
                  const isLive = item.status === 'live';
                  const isCompleted = item.status === 'completed';

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-3 rounded-xl border-l-4 transition-all ${
                        isLive
                          ? 'bg-red-50 border-red-600'
                          : isCompleted
                          ? 'bg-gray-50 border-gray-400'
                          : 'bg-white rounded-xl border border-gray-100 border-l-4 border-gray-200'
                      }`}
                    >
                      <div className="font-black text-sm w-12 text-[#081326]">
                        {item.time}
                      </div>
                      <div className="flex-1 font-bold text-sm text-[#081326]">
                        {item.title}
                      </div>
                      <div>
                        {isLive && (
                          <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                            Live
                          </span>
                        )}
                        {isCompleted && (
                          <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                            Gennemført
                          </span>
                        )}
                        {item.status === 'upcoming' && (
                          <span className="bg-white text-gray-400 text-[10px] px-2 py-1 rounded border border-gray-200 font-bold uppercase tracking-wider">
                            Næste
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-xs text-gray-400 text-center font-bold">
                  Ingen programpunkter
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="bg-[#081326] rounded-3xl p-6 text-white flex flex-col gap-6 shadow-xl">
          <div>
            <h2 className="font-black uppercase text-xs tracking-widest text-white/40 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2.5">
              <button
                onClick={handleToggleVoting}
                className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center justify-between transition-all text-left group"
              >
                <span className="text-sm font-bold">
                  {isVotingOpen ? 'Luk Stemmeafgivning' : 'Åben Stemmeafgivning'}
                </span>
                <div className={`w-3 h-3 rounded-full ${isVotingOpen ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </button>

              <button
                onClick={handleToggleCoupons}
                className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center justify-between transition-all text-left group"
              >
                <span className="text-sm font-bold">
                  {activeCoupons > 0 ? 'Deaktivér Pausetilbud' : 'Aktivér Pausetilbud'}
                </span>
                <div className={`w-3 h-3 rounded-full ${activeCoupons > 0 ? 'bg-red-500' : 'bg-gray-500'}`}></div>
              </button>

              <button
                onClick={() => onOpenAdmin('konkurrencer')}
                className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center justify-between transition-all text-left group cursor-pointer"
              >
                <span className="text-sm font-bold">Indtast resultat</span>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </button>

              <button
                onClick={() => {
                  window.location.hash = '#scanner';
                }}
                className="w-full bg-red-600/80 hover:bg-red-600 p-3 rounded-xl flex items-center justify-between transition-all text-left group text-white cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4" />
                  <span className="text-sm font-bold">Åbn Kiosk Scanner</span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">QR</div>
              </button>

              <button
                onClick={() => onOpenAdmin()}
                className="w-full bg-white/5 hover:bg-white/15 p-3 rounded-xl flex items-center justify-between transition-all text-left text-xs text-gray-300 font-bold uppercase tracking-wider cursor-pointer"
              >
                <span>Alle indstillinger</span>
                <Plus className="w-3.5 h-3.5 text-white/60" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
