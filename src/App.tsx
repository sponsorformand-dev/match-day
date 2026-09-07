import React, { useState, useEffect } from 'react';
import {
  MatchdayDatabase,
  ActiveTab,
} from './types.ts';
import { dataService } from './services/dataService.ts';
import { Header } from './components/Header.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { MoreModal } from './components/MoreModal.tsx';
import { HomeView } from './components/HomeView.tsx';
import { ProgrammeView } from './components/ProgrammeView.tsx';
import { VotingView } from './components/VotingView.tsx';
import { KioskView } from './components/KioskView.tsx';
import { CouponsView } from './components/CouponsView.tsx';
import { CompetitionsView } from './components/CompetitionsView.tsx';
import { LooadView } from './components/LooadView.tsx';
import { PartnersView } from './components/PartnersView.tsx';
import { ShareMatchdayView } from './components/ShareMatchdayView.tsx';
import { StaffScannerView } from './components/StaffScannerView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { DesktopAdminCompanion } from './components/DesktopAdminCompanion.tsx';

export default function App() {
  const [db, setDb] = useState<MatchdayDatabase>(() => dataService.getDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('hjem');
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    return (
      window.location.search.includes('admin') ||
      window.location.hash.includes('admin') ||
      window.location.pathname.startsWith('/admin')
    );
  });
  const [voteCategory, setVoteCategory] = useState<'DAMER' | 'HERRER'>('DAMER');

  // Subscribe to real-time updates and record visit on launch
  useEffect(() => {
    dataService.recordVisit();
    const unsubscribe = dataService.subscribeToDatabase((updatedDb) => {
      setDb(updatedDb);
    });

    return () => unsubscribe();
  }, []);

  // Listen for hash/popstate changes for #admin, #scanner, #del-matchday
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      if (hash === '#admin' || path === '/admin') {
        setIsAdminOpen(true);
      } else if (hash === '#scanner' || path === '/admin/scanner' || path === '/scanner') {
        setActiveTab('scanner');
      } else if (hash === '#del-matchday' || path === '/del-matchday') {
        setActiveTab('del-matchday');
      }
    };

    handleHash();
    window.addEventListener('popstate', handleHash);
    window.addEventListener('hashchange', handleHash);
    return () => {
      window.removeEventListener('popstate', handleHash);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const activeMatchday = db.matchdays.find((m) => m.id === db.activeMatchdayId) || db.matchdays[0];
  const activeMatches = db.matches.filter((m) => m.matchdayId === db.activeMatchdayId);
  const activeSchedule = db.schedule.filter((s) => s.matchdayId === db.activeMatchdayId);
  const activeAnnouncements = db.announcements.filter((a) => a.matchdayId === db.activeMatchdayId);
  const isAnyVotingOpen = db.votingSessions.some((s) => s.status === 'open');
  const hasActiveOffers = db.coupons.some((c) => c.active);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVoteForMatch = (category: 'DAMER' | 'HERRER') => {
    setVoteCategory(category);
    handleTabChange('stem');
  };

  return (
    <div className="min-h-screen bg-[#F6F6F4] text-[#081326] flex flex-col items-center justify-start p-0 md:p-6 selection:bg-red-600 selection:text-white">
      <div className="w-full max-w-6xl flex gap-6 items-start justify-center">
        {/* Mobile Phone App Container */}
        <div className="w-full md:w-[410px] min-h-screen md:min-h-[844px] bg-[#F6F6F4] md:rounded-3xl border-0 md:border md:border-gray-200 shadow-none md:shadow-2xl flex flex-col overflow-hidden relative pb-16">
          {/* Header */}
          <Header
            matchday={activeMatchday}
            onOpenAdmin={() => setIsAdminOpen(true)}
            isAdminActive={isAdminOpen}
          />

          {/* Main Content Area - Mobile Constrained Container */}
          <main className="flex-1 w-full px-3.5 sm:px-4">
            {activeTab === 'hjem' && (
              <HomeView
                matchday={activeMatchday}
                matches={activeMatches}
                announcements={activeAnnouncements}
                votingSessions={db.votingSessions}
                coupons={db.coupons}
                onNavigate={handleTabChange}
                onVoteMatch={handleVoteForMatch}
              />
            )}

            {activeTab === 'program' && (
              <ProgrammeView
                schedule={activeSchedule}
                matchdayTitle={activeMatchday?.title}
                matchdayDate={activeMatchday?.date}
              />
            )}

            {activeTab === 'stem' && (
              <VotingView
                sessions={db.votingSessions}
                players={db.players}
                votes={db.votes}
                partners={db.partners}
                initialCategory={voteCategory}
              />
            )}

            {activeTab === 'kiosk' && (
              <KioskView products={db.products} />
            )}

            {activeTab === 'tilbud' && (
              <CouponsView
                coupons={db.coupons}
                redemptions={db.couponRedemptions}
              />
            )}

            {activeTab === 'konkurrencer' && (
              <CompetitionsView
                competitions={db.competitions}
                scores={db.scores}
                matchdays={db.matchdays}
                activeMatchdayId={db.activeMatchdayId}
              />
            )}

            {activeTab === 'tilmelding' && (
              <LooadView
                looadUrl={activeMatchday?.looadUrl}
                looadTitle={activeMatchday?.looadTitle}
                looadDescription={activeMatchday?.looadDescription}
              />
            )}

            {activeTab === 'partnere' && (
              <PartnersView partners={db.partners} />
            )}

            {activeTab === 'del-matchday' && (
              <ShareMatchdayView
                matchday={activeMatchday}
                canonicalUrl={db.canonicalAppUrl}
                onBack={() => handleTabChange('hjem')}
              />
            )}

            {activeTab === 'scanner' && (
              <StaffScannerView
                db={db}
                onExit={() => handleTabChange('hjem')}
              />
            )}
          </main>

          {/* Bottom Sticky Navigation */}
          <BottomNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isVotingOpen={isAnyVotingOpen}
            hasActiveOffers={hasActiveOffers}
            onOpenMore={() => setIsMoreOpen(true)}
            isMoreOpen={isMoreOpen}
          />
        </div>

        {/* Desktop Admin Companion Panel (Visible on Desktop / Large Tablet Screens) */}
        <DesktopAdminCompanion
          db={db}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      </div>

      {/* "Mere" Menu Sheet */}
      <MoreModal
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        onSelectTab={handleTabChange}
        hasCoupons={hasActiveOffers}
      />

      {/* Full Admin Dashboard Modal Overlay */}
      {isAdminOpen && (
        <AdminDashboard
          db={db}
          onClose={() => {
            setIsAdminOpen(false);
            if (window.location.hash === '#admin') {
              history.pushState(null, '', window.location.pathname);
            }
          }}
        />
      )}
    </div>
  );
}
