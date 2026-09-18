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
import { UnifiedLoginModal } from './components/UnifiedLoginModal.tsx';
import { InvitationView } from './components/InvitationView.tsx';
import { StaffRole } from './types.ts';

export default function App() {
  const [db, setDb] = useState<MatchdayDatabase>(() => dataService.getDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/invitation' || hash === '#invitation') return 'invitation';
      if (path === '/del-matchday' || hash === '#del-matchday') return 'del-matchday';
      if (path === '/scanner' || path === '/admin/scanner' || hash === '#scanner') return 'scanner';
    }
    return 'hjem';
  });
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [session, setSession] = useState(() => dataService.getCurrentSession());
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    return (
      window.location.search.includes('admin') ||
      window.location.hash.includes('admin') ||
      window.location.pathname.startsWith('/admin')
    );
  });
  const [adminInitialSection, setAdminInitialSection] = useState<any>(undefined);
  const [voteCategory, setVoteCategory] = useState<'DAMER' | 'HERRER'>('DAMER');

  // Verify active 12-hour session on launch
  useEffect(() => {
    dataService.verifySession().then((valid) => {
      if (valid) {
        setSession(dataService.getCurrentSession());
      } else {
        setSession(null);
      }
    });
  }, []);

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
      } else if (hash === '#invitation' || path === '/invitation') {
        setActiveTab('invitation');
      } else if (path === '/' && (activeTab === 'invitation' || activeTab === 'del-matchday' || activeTab === 'scanner')) {
        setActiveTab('hjem');
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

  if (activeTab === 'invitation') {
    return <InvitationView />;
  }

  return (
    <div className="min-h-screen bg-[#F6F6F4] text-[#081326] flex flex-col items-center justify-start p-0 md:p-6 selection:bg-red-600 selection:text-white">
      <div className="w-full max-w-6xl flex gap-6 items-start justify-center">
        {/* Mobile Phone App Container */}
        <div className="w-full md:w-[410px] min-h-screen md:min-h-[844px] bg-[#F6F6F4] md:rounded-3xl border-0 md:border md:border-gray-200 shadow-none md:shadow-2xl flex flex-col overflow-hidden relative pb-16">
          {/* Header */}
          <Header
            matchday={activeMatchday}
            session={session}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenScanner={() => handleTabChange('scanner')}
            isAdminActive={isAdminOpen}
            agfLogo={db.agfLogo}
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
                partners={db.partners}
                onNavigate={handleTabChange}
                onVoteMatch={handleVoteForMatch}
                agfLogo={db.agfLogo}
              />
            )}

            {activeTab === 'program' && (
              <ProgrammeView
                schedule={activeSchedule}
                matchdayTitle={activeMatchday?.title}
                matchdayDate={activeMatchday?.date}
                matches={activeMatches}
                agfLogo={db.agfLogo}
              />
            )}

            {activeTab === 'stem' && (
              <VotingView
                sessions={db.votingSessions}
                players={db.players}
                votes={db.votes}
                partners={db.partners}
                matches={activeMatches}
                initialCategory={voteCategory}
                agfLogo={db.agfLogo}
              />
            )}

            {activeTab === 'kiosk' && (
              <KioskView
                products={db.products}
                coupons={db.coupons}
                redemptions={db.couponRedemptions}
                mobilePayNumber={db.mobilePayNumber}
              />
            )}

            {activeTab === 'tilbud' && (
              <KioskView
                products={db.products}
                coupons={db.coupons}
                redemptions={db.couponRedemptions}
                mobilePayNumber={db.mobilePayNumber}
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
                agfLogo={db.agfLogo}
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
          onOpenAdmin={(section) => {
            setAdminInitialSection(section);
            setIsAdminOpen(true);
          }}
        />
      </div>

      {/* "Mere" Menu Sheet */}
      <MoreModal
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        onSelectTab={handleTabChange}
        hasCoupons={hasActiveOffers}
        session={session}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAdmin={() => {
          setAdminInitialSection(undefined);
          setIsAdminOpen(true);
        }}
        onLogout={() => {
          dataService.logout();
          setSession(null);
        }}
      />

      {/* Unified Login Modal for Staff & Admin */}
      <UnifiedLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        agfLogo={db.agfLogo}
        onLoginSuccess={(role: StaffRole) => {
          const updatedSession = dataService.getCurrentSession();
          setSession(updatedSession);
          if (role === 'ADMIN') {
            setAdminInitialSection(undefined);
            setIsAdminOpen(true);
          } else if (role === 'STAFF') {
            handleTabChange('scanner');
          }
        }}
      />

      {/* Full Admin Dashboard Modal Overlay */}
      {isAdminOpen && (
        <AdminDashboard
          db={db}
          initialSection={adminInitialSection}
          onClose={() => {
            setIsAdminOpen(false);
            setAdminInitialSection(undefined);
            if (window.location.hash === '#admin') {
              history.pushState(null, '', window.location.pathname);
            }
          }}
        />
      )}
    </div>
  );
}
