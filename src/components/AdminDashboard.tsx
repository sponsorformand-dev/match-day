import React, { useState, useEffect } from 'react';
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
  SponsorCategory,
  Announcement,
  FeaturedHero,
  StaffUser,
  AnnouncementActionTarget,
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
  Zap,
  ExternalLink,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface AdminDashboardProps {
  db: MatchdayDatabase;
  onClose: () => void;
  initialSection?: AdminSection;
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ db, onClose, initialSection }) => {
  // Authentication & Session Management (12-hour active session)
  const [session, setSession] = useState<{ id: string; role: 'ADMIN' | 'STAFF' } | null>(() => {
    return dataService.getCurrentSession();
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!dataService.getCurrentSession() || sessionStorage.getItem('agf_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Upgrade to admin state for staff
  const [adminUpgradeCode, setAdminUpgradeCode] = useState<string>('');
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState<boolean>(false);

  // Reset Matchday state
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetAdminCode, setResetAdminCode] = useState<string>('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Matchday Create & Edit State
  const [editingMatchday, setEditingMatchday] = useState<Matchday | null>(null);
  const [isMatchdayModalOpen, setIsMatchdayModalOpen] = useState<boolean>(false);
  const [matchdayForm, setMatchdayForm] = useState<{
    id?: string;
    title: string;
    date: string;
    venue: string;
    welcomeMessage: string;
    kampdagssponsorId?: string;
    kampensSpillerSponsorId?: string;
    looadUrl: string;
    active: boolean;
  }>({
    title: '',
    date: '',
    venue: 'Ceres Arena, Hal 1',
    welcomeMessage: 'Gør dig klar til det store lokalopgør!',
    looadUrl: 'https://looad.dk/pages/klub-agf-haandbold',
    active: false,
  });

  // Active sessions state
  const [activeSessionsData, setActiveSessionsData] = useState<{
    total: number;
    staffCount: number;
    adminCount: number;
    sessions: any[];
  }>({ total: 0, staffCount: 0, adminCount: 0, sessions: [] });
  const [loadingSessions, setLoadingSessions] = useState(false);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await dataService.getActiveSessions();
      setActiveSessionsData(data);
    } catch {
      // ignore
    } finally {
      setLoadingSessions(false);
    }
  };

  // Programme Item Editor State
  const [editingScheduleItem, setEditingScheduleItem] = useState<ScheduleItem | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [scheduleForm, setScheduleForm] = useState<{
    id?: string;
    time: string;
    title: string;
    description: string;
    venue: string;
    status: 'upcoming' | 'live' | 'completed';
  }>({
    time: '13:00',
    title: '',
    description: '',
    venue: 'Ceres Arena',
    status: 'upcoming',
  });

  // Competition Editor State
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [isCompetitionModalOpen, setIsCompetitionModalOpen] = useState<boolean>(false);
  const [compActionMsg, setCompActionMsg] = useState<string | null>(null);
  const [competitionForm, setCompetitionForm] = useState<{
    id?: string;
    name: string;
    description: string;
    scoringUnit: string;
    higherScoreWins: boolean;
    sponsor: string;
    active: boolean;
  }>({
    name: '',
    description: '',
    scoringUnit: 'km/t',
    higherScoreWins: true,
    sponsor: 'Sport 24',
    active: true,
  });

  // Active admin section
  const [currentSection, setCurrentSection] = useState<AdminSection>(() => {
    if (initialSection) return initialSection;
    const s = dataService.getCurrentSession();
    return s?.role === 'STAFF' ? 'scanner' : 'matchday';
  });

  useEffect(() => {
    if (initialSection) {
      setCurrentSection(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    if (currentSection === 'staff') {
      loadSessions();
    }
  }, [currentSection]);

  // Fast score entry state
  const [scoreCompId, setScoreCompId] = useState<string>('');
  const [scoreName, setScoreName] = useState<string>('');
  const [scoreValue, setScoreValue] = useState<string>('');
  const [scoreSuccess, setScoreSuccess] = useState<string | null>(null);

  // Quick announcement state
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annMessage, setAnnMessage] = useState<string>('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [annActionTarget, setAnnActionTarget] = useState<AnnouncementActionTarget>('none');

  // Canonical App URL state for Feature 21
  const [canonicalUrlInput, setCanonicalUrlInput] = useState<string>(() => db.canonicalAppUrl || '');
  const [canonicalUrlSaved, setCanonicalUrlSaved] = useState<boolean>(false);

  // Looad partnerlink state
  const [looadUrlInput, setLooadUrlInput] = useState<string>(
    () => db.matchdays.find(m => m.id === db.activeMatchdayId)?.looadUrl || 'https://looad.dk/pages/klub-agf-haandbold'
  );
  const [looadUrlSaved, setLooadUrlSaved] = useState<boolean>(false);

  // New staff user form state for Feature 25
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffPin, setNewStaffPin] = useState<string>('');
  const [newStaffRole, setNewStaffRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [staffActionMsg, setStaffActionMsg] = useState<string | null>(null);

  // Partner Administration State
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState<boolean>(false);
  const [partnerFilterCategory, setPartnerFilterCategory] = useState<string>('ALL');
  const [partnerSaveMsg, setPartnerSaveMsg] = useState<string | null>(null);
  const [partnerForm, setPartnerForm] = useState<{
    id?: string;
    name: string;
    category: SponsorCategory;
    logo: string;
    websiteUrl: string;
    shortDescription: string;
    active: boolean;
    sortOrder: number;
    featured: boolean;
    offer: string;
  }>({
    name: '',
    category: 'AGF PLAY',
    logo: '',
    websiteUrl: '',
    shortDescription: '',
    active: true,
    sortOrder: 1,
    featured: false,
    offer: '',
  });

  const PRESET_PARTNER_LOGOS = [
    { label: 'Raundahl & Moesby', path: '/partners/raundahl-moesby.png' },
    { label: 'Sport 24', path: '/partners/sport-24.png' },
    { label: 'Jasa Company', path: '/partners/jasa-company.png' },
    { label: 'Jørgen Kræmer Rasmussen', path: '/partners/jorgen-kraemer-rasmussen.png' },
    { label: 'Djurslands Bank', path: '/partners/djurslands-bank.png' },
    { label: 'Harald Nyborg', path: '/partners/harald-nyborg.png' },
    { label: 'AGF Play', path: '/partners/scorjobbet.png' },
    { label: 'Kaufmann', path: '/partners/kaufmann.png' },
    { label: 'V Steel A/S', path: '/partners/v-steel.png' },
    { label: 'AK Smede', path: '/partners/ak-smede.png' },
    { label: 'Dansk Psykologisk Forlag', path: '/partners/dansk-psykologisk-forlag.png' },
    { label: 'Ringkjøbing Landbobank', path: '/partners/ringkjobing-landbobank.png' },
    { label: 'Café Faust', path: '/partners/cafe-faust.png' },
    { label: 'Formueforvalterne', path: '/partners/formueforvalterne.png' },
    { label: 'LPH Byg', path: '/partners/lph-byg.png' },
    { label: 'PH Trading', path: '/partners/ph-trading.png' },
    { label: 'Looad (Energipartner)', path: '/partners/looad.png' },
    { label: 'AGF Håndbold Logo', path: '/agf-logo.svg' },
  ];

  const handleOpenCreatePartner = () => {
    setEditingPartner(null);
    setPartnerForm({
      name: '',
      category: 'AGF PLAY',
      logo: '',
      websiteUrl: '',
      shortDescription: '',
      active: true,
      sortOrder: (db.partners?.length || 0) + 1,
      featured: false,
      offer: '',
    });
    setPartnerSaveMsg(null);
    setIsPartnerModalOpen(true);
  };

  const handleOpenEditPartner = (p: Partner) => {
    setEditingPartner(p);
    setPartnerForm({
      id: p.id,
      name: p.name || p.companyName || '',
      category: ((p.category || p.sponsorCategory || 'AGF PLAY') as SponsorCategory),
      logo: p.logo || p.logoUrl || '',
      websiteUrl: p.websiteUrl || '',
      shortDescription: p.shortDescription || p.message || '',
      active: p.active !== false,
      sortOrder: p.sortOrder ?? 1,
      featured: Boolean(p.featured),
      offer: p.offer || p.optionalMatchdayOffer || '',
    });
    setPartnerSaveMsg(null);
    setIsPartnerModalOpen(true);
  };

  const handleSavePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name.trim()) {
      setPartnerSaveMsg('Angiv venligst et virksomhedsnavn.');
      return;
    }

    const partnerToSave: Partner = {
      id: partnerForm.id || `part-${Date.now()}`,
      name: partnerForm.name.trim(),
      companyName: partnerForm.name.trim(),
      category: partnerForm.category,
      sponsorCategory: partnerForm.category,
      logo: partnerForm.logo.trim() || '/agf-logo.svg',
      logoUrl: partnerForm.logo.trim() || '/agf-logo.svg',
      websiteUrl: partnerForm.websiteUrl.trim(),
      shortDescription: partnerForm.shortDescription.trim(),
      message: partnerForm.shortDescription.trim(),
      active: partnerForm.active,
      sortOrder: Number(partnerForm.sortOrder) || 1,
      featured: Boolean(partnerForm.featured),
      offer: partnerForm.offer.trim(),
      optionalMatchdayOffer: partnerForm.offer.trim(),
    };

    await dataService.savePartner(partnerToSave);
    setPartnerSaveMsg('Partner gemt!');
    setTimeout(() => {
      setIsPartnerModalOpen(false);
      setPartnerSaveMsg(null);
    }, 400);
  };

  const handleDeletePartnerClick = async (partnerId: string, name: string) => {
    if (window.confirm(`Er du sikker på, at du vil slette partneren "${name}"?`)) {
      await dataService.deletePartner(partnerId);
    }
  };

  const handlePartnerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPartnerForm((prev) => ({ ...prev, logo: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isAdmin = session?.role === 'ADMIN' || sessionStorage.getItem('agf_admin_auth') === 'true';
  const isStaff = session?.role === 'STAFF';

  // Handle Unified Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setLoginError('Indtast venligst adgangskode');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    const res = await dataService.login(pinInput.trim(), 'Kontrolpanel');
    setLoginLoading(false);
    if (res.success && res.role) {
      const s = dataService.getCurrentSession();
      setSession(s);
      setIsAuthenticated(true);
      setPinInput('');
      if (res.role === 'STAFF') {
        setCurrentSection('scanner');
      } else {
        setCurrentSection('matchday');
      }
    } else {
      setLoginError(res.error || 'Forkert adgangskode. Prøv igen.');
    }
  };

  // Handle Upgrade to Admin from Staff session
  const handleUpgradeToAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUpgradeCode.trim()) {
      setUpgradeError('Indtast administratorkode');
      return;
    }
    setUpgradeLoading(true);
    setUpgradeError(null);
    const res = await dataService.login(adminUpgradeCode.trim(), 'Opgradering');
    setUpgradeLoading(false);
    if (res.success && res.role === 'ADMIN') {
      const s = dataService.getCurrentSession();
      setSession(s);
      setAdminUpgradeCode('');
    } else {
      setUpgradeError('Forkert administratorkode');
    }
  };

  const handleSaveScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.title.trim() || !scheduleForm.time.trim()) return;

    const itemToSave: ScheduleItem = {
      id: scheduleForm.id || `sch-${Date.now()}`,
      time: scheduleForm.time.trim(),
      title: scheduleForm.title.trim(),
      description: scheduleForm.description.trim() || undefined,
      venue: scheduleForm.venue.trim() || undefined,
      status: scheduleForm.status,
      order: editingScheduleItem ? editingScheduleItem.order : (db.schedule.length + 1),
    };

    await dataService.saveScheduleItem(itemToSave);
    setIsScheduleModalOpen(false);
  };

  const handleSaveCompetitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitionForm.name.trim()) return;

    const compToSave: Competition = {
      id: competitionForm.id || `comp-${Date.now()}`,
      name: competitionForm.name.trim(),
      description: competitionForm.description.trim() || '',
      scoringUnit: competitionForm.scoringUnit.trim() || 'km/t',
      higherScoreWins: competitionForm.higherScoreWins,
      higherIsBetter: competitionForm.higherScoreWins,
      active: competitionForm.active,
    };

    await dataService.saveCompetition(compToSave);
    setIsCompetitionModalOpen(false);
  };

  const handleOpenCreateMatchday = () => {
    setEditingMatchday(null);
    setMatchdayForm({
      title: '',
      date: new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      venue: 'Ceres Arena, Hal 1',
      welcomeMessage: 'Gør dig klar til det store lokalopgør!',
      looadUrl: 'https://looad.dk/pages/klub-agf-haandbold',
      active: true,
      kampdagssponsorId: '',
      kampensSpillerSponsorId: '',
    });
    setIsMatchdayModalOpen(true);
  };

  const handleOpenEditMatchday = (m: Matchday) => {
    setEditingMatchday(m);
    setMatchdayForm({
      id: m.id,
      title: m.title,
      date: m.date,
      venue: m.venue,
      welcomeMessage: m.welcomeMessage || '',
      looadUrl: m.looadUrl || 'https://looad.dk/pages/klub-agf-haandbold',
      active: m.id === db.activeMatchdayId,
      kampdagssponsorId: m.kampdagssponsorId || '',
      kampensSpillerSponsorId: m.kampensSpillerSponsorId || '',
    });
    setIsMatchdayModalOpen(true);
  };

  const handleSaveMatchdaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchdayForm.title.trim()) return;

    const matchdayId = matchdayForm.id || `matchday-${Date.now()}`;
    const newMatchday: Matchday = {
      id: matchdayId,
      title: matchdayForm.title.trim(),
      date: matchdayForm.date.trim() || 'I dag',
      venue: matchdayForm.venue.trim() || 'Ceres Arena',
      active: matchdayForm.active,
      looadUrl: matchdayForm.looadUrl.trim() || 'https://looad.dk/pages/klub-agf-haandbold',
      welcomeMessage: matchdayForm.welcomeMessage.trim(),
      kampdagssponsorId: matchdayForm.kampdagssponsorId || undefined,
      kampensSpillerSponsorId: matchdayForm.kampensSpillerSponsorId || undefined,
      createdAt: editingMatchday ? editingMatchday.createdAt : new Date().toISOString(),
      featuredHero: editingMatchday?.featuredHero || {
        enabled: true,
        badge: 'VELKOMMEN',
        title: 'VELKOMMEN TIL MATCHDAY',
        subtitle: 'Se dagens fulde program og aktiviteter i Ceres Arena.',
        actionText: 'SE PROGRAM',
        actionTarget: 'program',
      },
    };

    await dataService.saveMatchday(newMatchday);
    if (matchdayForm.active) {
      await dataService.setActiveMatchday(matchdayId);
    }
    setIsMatchdayModalOpen(false);
  };

  const handleConfirmReset = async () => {
    if (!resetAdminCode.trim()) {
      setResetError('Indtast venligst ADMIN adgangskoden.');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    const res = await dataService.resetMatchday(resetAdminCode.trim());
    setResetLoading(false);
    if (res.success) {
      setIsResetModalOpen(false);
      setResetAdminCode('');
      setResetNotice('Matchday data er nu nulstillet til standard.');
      setTimeout(() => setResetNotice(null), 5000);
    } else {
      setResetError(res.error || 'Forkert adgangskode. Kunne ikke nulstille Matchday.');
    }
  };

  const handleLogout = () => {
    dataService.logout();
    setSession(null);
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
            AGF Matchday Login
          </h2>
          <p className="text-xs text-gray-500 text-center mb-5">
            Adgang for AGF Håndbold personale og frivillige
          </p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Adgangskode
              </label>
              <input
                id="admin-pin-input"
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (loginError) setLoginError(null);
                }}
                placeholder="Indtast adgangskode..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center font-mono text-base focus:outline-none focus:ring-2 focus:ring-[#081326]"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg text-center font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-[#081326] hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? 'Logger ind...' : 'Log Ind'}
            </button>
          </form>

          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-xs text-gray-500 hover:text-gray-800 text-center cursor-pointer"
          >
            ← Tilbage til tilskuer-appen
          </button>
        </div>
      </div>
    );
  }

  const activeMatchday = db.matchdays.find((m) => m.id === db.activeMatchdayId) || db.matchdays[0];

  const ADMIN_ONLY_SECTIONS: AdminSection[] = [
    'matchday',
    'kampe',
    'program',
    'stem',
    'kiosk',
    'kuponer',
    'staff',
    'tilmelding',
    'partnere',
    'beskeder',
    'analytics',
  ];

  const navItems = [
    { id: 'matchday' as AdminSection, label: 'Matchday', icon: Calendar, adminOnly: true },
    { id: 'scanner' as AdminSection, label: 'Kuponscanner', icon: ScanLine, adminOnly: false },
    { id: 'staff' as AdminSection, label: 'Sessioner', icon: Users, adminOnly: true },
    { id: 'kampe' as AdminSection, label: 'Kampe', icon: Flame, adminOnly: true },
    { id: 'program' as AdminSection, label: 'Program', icon: Clock, adminOnly: true },
    { id: 'stem' as AdminSection, label: 'Kampens Spiller', icon: Star, adminOnly: true },
    { id: 'kiosk' as AdminSection, label: 'Kiosk', icon: Beer, adminOnly: true },
    { id: 'kuponer' as AdminSection, label: 'Kuponer & Stats', icon: Tag, adminOnly: true },
    { id: 'konkurrencer' as AdminSection, label: 'Konkurrencer', icon: Trophy, adminOnly: false },
    { id: 'tilmelding' as AdminSection, label: 'Looad partnerlink', icon: Zap, adminOnly: true },
    { id: 'partnere' as AdminSection, label: 'Partnere', icon: HeartHandshake, adminOnly: true },
    { id: 'beskeder' as AdminSection, label: 'Beskeder', icon: Megaphone, adminOnly: true },
    { id: 'analytics' as AdminSection, label: 'Statistik', icon: BarChart3, adminOnly: true },
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
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white ${
                isAdmin ? 'bg-[#C8102E]' : 'bg-emerald-600'
              }`}>
                {isAdmin ? 'Admin' : 'Personale'}
              </span>
              <span className="text-xs font-bold text-gray-200 truncate max-w-[150px]">
                {activeMatchday?.title || 'AGF Matchday'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              {isAdmin ? 'Matchday kontrolpanel' : 'Scanner- & resultatadgang'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            title="Log ud"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Log ud</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white text-[#081326] font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-gray-100 cursor-pointer"
          >
            Se App
          </button>
        </div>
      </div>

      {/* Horizontal Nav Tabs for Mobile Staff */}
      <div className="bg-white border-b border-gray-200 px-2 py-1.5 flex gap-1 overflow-x-auto scrollbar-none flex-shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          const isRestricted = item.adminOnly && !isAdmin;
          return (
            <button
              key={item.id}
              id={`admin-tab-${item.id}`}
              onClick={() => setCurrentSection(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                isActive
                  ? 'bg-[#081326] text-white shadow-xs'
                  : isRestricted
                  ? 'bg-gray-100/70 text-gray-400 hover:bg-gray-200/80'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {isRestricted && <Lock className="w-2.5 h-2.5 text-amber-600 ml-0.5 opacity-80" />}
            </button>
          );
        })}
      </div>

      {/* Admin Content Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full pb-20">
        {/* Permission Gate for Staff trying to access Admin-Only sections */}
        {isStaff && !isAdmin && ADMIN_ONLY_SECTIONS.includes(currentSection) ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 text-center space-y-4 max-w-md mx-auto my-8 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase text-[#081326]">
                Kræver administratoradgang
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Du er logget ind som personale (kuponscanner og resultatregistrering). Redigering af denne sektion kræver administratoradgang.
              </p>
            </div>
            <form onSubmit={handleUpgradeToAdmin} className="space-y-3 pt-2">
              <div>
                <input
                  type="password"
                  value={adminUpgradeCode}
                  onChange={(e) => {
                    setAdminUpgradeCode(e.target.value);
                    if (upgradeError) setUpgradeError(null);
                  }}
                  placeholder="Indtast administratorkode..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-center font-bold text-sm tracking-wider focus:outline-hidden focus:border-[#081326]"
                />
              </div>
              {upgradeError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {upgradeError}
                </div>
              )}
              <button
                type="submit"
                disabled={upgradeLoading}
                className="w-full py-3 bg-[#081326] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {upgradeLoading ? 'Låser op...' : 'Lås op som Administrator'}
              </button>
            </form>
          </div>
        ) : (
          <>
        {/* ================= SECTION: MATCHDAY ================= */}
        {currentSection === 'matchday' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base text-[#081326] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C8102E]" />
                  <span>Matchdays & Kampdage</span>
                </h3>
                <button
                  type="button"
                  onClick={handleOpenCreateMatchday}
                  className="px-3 py-1.5 bg-[#C8102E] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ny Matchday</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Kun én matchday er aktiv ad gangen. Den aktive matchday vises automatisk for alle tilskuere på tværs af platformen.
              </p>

              <div className="space-y-2">
                {db.matchdays.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      m.id === db.activeMatchdayId
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#081326]">{m.title}</span>
                        {m.id === db.activeMatchdayId && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            AKTIV NU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500">{m.date} · {m.venue}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMatchday(m)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        title="Rediger Matchday"
                      >
                        Rediger
                      </button>

                      {m.id !== db.activeMatchdayId ? (
                        <button
                          type="button"
                          onClick={() => dataService.setActiveMatchday(m.id)}
                          className="px-3 py-1.5 bg-[#081326] hover:bg-black text-white text-xs font-bold uppercase rounded-lg shadow-xs cursor-pointer transition-colors"
                        >
                          Aktivér
                        </button>
                      ) : null}

                      {db.matchdays.length > 1 && m.id !== db.activeMatchdayId && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Vil du slette matchday "${m.title}"?`)) {
                              await dataService.deleteMatchday(m.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Slet Matchday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
                  placeholder="https://match-day-rose.vercel.app"
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

            {/* Looad Partnerlink Settings */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-base text-[#081326] mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 fill-current" />
                <span>Looad partnerlink</span>
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Link til Looad-partnersiden for AGF Håndbold supportere. Bruges i appen under "Mere" og på forsiden.
              </p>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={looadUrlInput}
                  onChange={(e) => {
                    setLooadUrlInput(e.target.value);
                    setLooadUrlSaved(false);
                  }}
                  placeholder="https://looad.dk/pages/klub-agf-haandbold"
                  className="flex-1 px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-amber-500 outline-hidden font-bold"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (activeMatchday) {
                      await dataService.saveMatchday({
                        ...activeMatchday,
                        looadUrl: looadUrlInput.trim() || 'https://looad.dk/pages/klub-agf-haandbold',
                        looadTitle: 'STØT AGF HÅNDBOLD MED LOOAD',
                        looadDescription: 'Skift elselskab til Looad og støt samtidig AGF Håndbold.',
                      });
                      setLooadUrlSaved(true);
                      setTimeout(() => setLooadUrlSaved(false), 3000);
                    }
                  }}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    looadUrlSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#081326] hover:bg-black text-white'
                  }`}
                >
                  {looadUrlSaved ? 'Gemt ✓' : 'Gem Link'}
                </button>
              </div>
              <div className="mt-2 text-[11px] text-gray-400">
                Standard: <code className="font-mono text-[10px] text-gray-600">https://looad.dk/pages/klub-agf-haandbold</code>
              </div>
            </div>

            {/* Danger Zone: Nulstil Matchday */}
            <div className="bg-white rounded-2xl p-5 border-2 border-red-200 shadow-xs space-y-3 mt-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-red-700 uppercase tracking-wide">
                    Nulstil Matchday
                  </h3>
                  <p className="text-xs text-gray-500">
                    Klargør systemet til en ny kampdag eller nulstil testdata.
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Nulstilling sletter alle stemmer, scanninger, indløste kuponer og dagens konkurrenceresultater. Grundopsætningen (partnere, kioskprodukter, kuponkatalog og kampe) bevares intakt.
              </p>

              {resetNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold text-center animate-fade-in">
                  ✓ {resetNotice}
                </div>
              )}

              <button
                type="button"
                id="admin-reset-matchday-btn"
                onClick={() => setIsResetModalOpen(true)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Nulstil Matchday</span>
              </button>
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

                {/* Live Match URL (Flashscore, tophaandbold.dk, etc.) */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex items-center justify-between">
                    <span>Live match URL (ekstern livescore):</span>
                    <span className="text-[10px] text-gray-400 font-normal">Valgfri</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={match.liveMatchUrl || ''}
                      onChange={(e) => dataService.saveMatch({ ...match, liveMatchUrl: e.target.value })}
                      placeholder="https://tophaandbold.dk/kampe"
                      className="flex-1 px-3 py-1.5 text-xs font-mono bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-[#081326] outline-hidden font-medium"
                    />
                    {match.liveMatchUrl && (
                      <a
                        href={match.liveMatchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs flex items-center gap-1"
                        title="Test link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Når denne URL er udfyldt, vises knappen <strong>"FØLG KAMPEN LIVE"</strong> på kampkortet for tilskuere.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= SECTION: PROGRAM ================= */}
        {currentSection === 'program' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="font-bold text-sm text-[#081326] uppercase tracking-wider">
                  Dagens Program & Tidsplan
                </h3>
                <span className="text-xs text-gray-500">Styr dagens aktiviteter, tidspunkter og lokationer</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingScheduleItem(null);
                  setScheduleForm({
                    time: '13:00',
                    title: '',
                    description: '',
                    venue: 'Ceres Arena',
                    status: 'upcoming',
                  });
                  setIsScheduleModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#081326] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nyt Punkt</span>
              </button>
            </div>

            {db.schedule.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-xs border border-gray-200">
                Ingen programpunkter oprettet endnu. Tryk på "Nyt Punkt" ovenfor.
              </div>
            ) : (
              <div className="space-y-2.5">
                {db.schedule.map((item, idx) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1">
                        <span className="font-mono font-bold text-xs bg-gray-100 text-[#081326] px-2.5 py-1 rounded-lg shrink-0">
                          kl. {item.time}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-[#081326] leading-tight">{item.title}</h4>
                          {item.venue && (
                            <span className="text-[11px] font-semibold text-gray-400 block mt-0.5">
                              📍 {item.venue}
                            </span>
                          )}
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons: Edit & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingScheduleItem(item);
                            setScheduleForm({
                              id: item.id,
                              time: item.time,
                              title: item.title,
                              description: item.description || '',
                              venue: item.venue || 'Ceres Arena',
                              status: item.status,
                            });
                            setIsScheduleModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#081326] hover:bg-gray-100 rounded-lg cursor-pointer"
                          title="Rediger punkt"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Vil du slette programpunktet "${item.title}"?`)) {
                              await dataService.deleteScheduleItem(item.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Slet punkt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => dataService.saveScheduleItem({ ...item, status: 'upcoming' })}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                          item.status === 'upcoming' ? 'bg-gray-300 text-gray-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        Kommende
                      </button>
                      <button
                        onClick={() => dataService.saveScheduleItem({ ...item, status: 'live' })}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                          item.status === 'live' ? 'bg-[#C8102E] text-white shadow-xs animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        I gang nu (LIVE)
                      </button>
                      <button
                        onClick={() => dataService.saveScheduleItem({ ...item, status: 'completed' })}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                          item.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        Afsluttet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        {/* ================= SECTION: AKTIVE SESSIONER ================= */}
        {currentSection === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#081326] px-1 uppercase tracking-wider">
                  Aktive Sessioner
                </h3>
                <p className="text-xs text-gray-500 px-1">
                  12-timers gyldige adgange for personale og administratorer.
                </p>
              </div>
              <button
                type="button"
                onClick={loadSessions}
                disabled={loadingSessions}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? 'animate-spin' : ''}`} />
                <span>Opdater</span>
              </button>
            </div>

            {/* 3 Metrics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Totale Sessioner</span>
                <span className="text-2xl font-black text-[#081326] mt-0.5 block">{activeSessionsData.total}</span>
                <span className="text-[10px] text-gray-500 block mt-1">i alt lige nu</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">STAFF</span>
                <span className="text-2xl font-black text-emerald-700 mt-0.5 block">{activeSessionsData.staffCount}</span>
                <span className="text-[10px] text-gray-500 block mt-1">Scanner & kiosk</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-red-100 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">ADMIN</span>
                <span className="text-2xl font-black text-red-700 mt-0.5 block">{activeSessionsData.adminCount}</span>
                <span className="text-[10px] text-gray-500 block mt-1">Fuld adgang</span>
              </div>
            </div>

            {/* Session Expiry Policy Card */}
            <div className="bg-[#081326] text-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200">
                  12-timers automatisk udløb
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Alle sessioner godkendt med adgangskoder forbliver aktive i præcis 12 timer på tværs af scannere og computere. Efter 12 timer afbrydes adgangen automatisk, og fornyet login kræves.
                </p>
              </div>
            </div>

            {/* Active Sessions List */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 px-1">
                Logget ind på enheder
              </h4>
              {(!activeSessionsData.sessions || activeSessionsData.sessions.length === 0) ? (
                <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
                  Ingen aktive registrerede sessioner i databasen lige nu.
                </div>
              ) : (
                activeSessionsData.sessions.map((sess) => {
                  const remainingMs = new Date(sess.expiresAt).getTime() - Date.now();
                  const hoursLeft = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
                  const minsLeft = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

                  return (
                    <div
                      key={sess.id}
                      className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white ${
                          sess.role === 'ADMIN' ? 'bg-[#C8102E]' : 'bg-emerald-600'
                        }`}>
                          {sess.role === 'ADMIN' ? 'ADM' : 'STF'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#081326]">
                              {sess.deviceLabel || 'Matchday Terminal'}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              sess.role === 'ADMIN' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {sess.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5 font-mono">
                            <span>Oprettet {new Date(sess.createdAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className="text-amber-700 font-bold">Udløber om {hoursLeft}t {minsLeft}m</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('Vil du afbryde denne session? Enheden vil blive logget ud.')) {
                            await dataService.terminateSession(sess.id);
                            await loadSessions();
                          }
                        }}
                        className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold cursor-pointer"
                        title="Afbryd session"
                      >
                        Afbryd
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
                  Indtast resultat
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

            {/* Manage Competitions & Reset Scores */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#081326] flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Konkurrencer & Opsætning</span>
                </h4>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCompetition(null);
                      setCompetitionForm({
                        name: '',
                        description: '',
                        scoringUnit: 'km/t',
                        higherScoreWins: true,
                        higherIsBetter: true,
                        active: true,
                        sponsor: '',
                      });
                      setIsCompetitionModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-[#081326] hover:bg-black text-white text-[11px] font-bold uppercase rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ny</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {db.competitions.map((comp) => {
                  const compScores = db.scores.filter((s) => s.competitionId === comp.id);
                  return (
                    <div key={comp.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#081326]">{comp.name}</span>
                            <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border text-gray-600">
                              {comp.scoringUnit}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              ({comp.higherScoreWins !== false ? 'Højeste vinder' : 'Laveste vinder'})
                            </span>
                          </div>
                          {comp.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{comp.description}</p>
                          )}
                          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                            <span>{compScores.length} registrerede scores</span>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCompetition(comp);
                                setCompetitionForm({
                                  id: comp.id,
                                  name: comp.name,
                                  description: comp.description || '',
                                  scoringUnit: comp.scoringUnit,
                                  higherScoreWins: comp.higherScoreWins !== false,
                                  higherIsBetter: comp.higherScoreWins !== false,
                                  active: comp.active,
                                  sponsor: '',
                                });
                                setIsCompetitionModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-[#081326] hover:bg-white rounded-lg cursor-pointer"
                              title="Rediger konkurrence"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Vil du slette konkurrencen "${comp.name}" og tilhørende resultater?`)) {
                                  await dataService.deleteCompetition(comp.id);
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Slet konkurrence"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Clear Scores Button */}
                      {compScores.length > 0 && (
                        <div className="pt-2 border-t border-gray-200/60 flex justify-end">
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Er du sikker på, at du vil rydde alle ${compScores.length} resultater for "${comp.name}"?`)) {
                                await dataService.clearCompetitionScores(comp.id);
                              }
                            }}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Ryd alle resultater for {comp.name}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION: LOOAD PARTNERLINK ================= */}
        {currentSection === 'tilmelding' && (
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-500 fill-current" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#081326] uppercase tracking-wide">
                  Looad partnerlink
                </h3>
                <p className="text-xs text-gray-500">
                  Konfigurer partnerlinket til Looad for denne Matchday. Skift elselskab til Looad og støt samtidig AGF Håndbold.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Standard destination er altid <strong>https://looad.dk/pages/klub-agf-haandbold</strong>. Når fans klikker på kortet eller knappen "STØT KLUBBEN", ledes de direkte hertil i et nyt vindue.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Looad partnerlink (URL)
              </label>
              <input
                type="url"
                defaultValue={activeMatchday?.looadUrl || 'https://looad.dk/pages/klub-agf-haandbold'}
                onBlur={(e) => {
                  if (activeMatchday) {
                    const clean = e.target.value.trim() || 'https://looad.dk/pages/klub-agf-haandbold';
                    dataService.updateLooadSettings(activeMatchday.id, clean);
                  }
                }}
                placeholder="https://looad.dk/pages/klub-agf-haandbold"
                className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326] font-mono focus:bg-white focus:border-amber-500 outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Overskrift på Looad-kort
              </label>
              <input
                type="text"
                defaultValue={activeMatchday?.looadTitle || 'STØT AGF HÅNDBOLD MED LOOAD'}
                onBlur={(e) => {
                  if (activeMatchday) {
                    dataService.updateLooadSettings(activeMatchday.id, activeMatchday.looadUrl, e.target.value.trim() || 'STØT AGF HÅNDBOLD MED LOOAD');
                  }
                }}
                className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326] font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Beskrivelse
              </label>
              <textarea
                rows={2}
                defaultValue={activeMatchday?.looadDescription || 'Skift elselskab til Looad og støt samtidig AGF Håndbold.'}
                onBlur={(e) => {
                  if (activeMatchday) {
                    dataService.updateLooadSettings(activeMatchday.id, activeMatchday.looadUrl, undefined, e.target.value.trim() || 'Skift elselskab til Looad og støt samtidig AGF Håndbold.');
                  }
                }}
                className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
              />
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Standard: <code className="font-mono text-gray-700">https://looad.dk/pages/klub-agf-haandbold</code></span>
              <a
                href={activeMatchday?.looadUrl || 'https://looad.dk/pages/klub-agf-haandbold'}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-700 hover:underline flex items-center gap-1"
              >
                <span>Test link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* ================= SECTION: PARTNERE ================= */}
        {currentSection === 'partnere' && (
          <div className="space-y-4">
            {/* Header & Create Button */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-base text-[#081326] uppercase tracking-wide">
                    Partnere & Sponsorstruktur
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Administrer AGF Håndbold sponsorer, kategorier, logoer og kampdagsplaceringer.
                </p>
              </div>

              <button
                id="admin-create-partner-btn"
                onClick={handleOpenCreatePartner}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#081326] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors flex-shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Opret Partner</span>
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'ALL', label: `Alle (${db.partners?.length || 0})` },
                { id: 'HOVEDSPONSOR', label: 'Hovedsponsor' },
                { id: 'AGF PLAY', label: 'AGF Play' },
                { id: 'AGF MATCH', label: 'AGF Match' },
                { id: 'AGF FORDEL', label: 'AGF Fordel' },
                { id: 'ØVRIGE MATCHDAY-PARTNERE', label: 'Øvrige' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPartnerFilterCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    partnerFilterCategory === tab.id
                      ? 'bg-[#081326] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Partner List */}
            <div className="space-y-3">
              {(['HOVEDSPONSOR', 'AGF PLAY', 'AGF MATCH', 'AGF FORDEL', 'ØVRIGE MATCHDAY-PARTNERE'] as SponsorCategory[])
                .filter((cat) => partnerFilterCategory === 'ALL' || partnerFilterCategory === cat)
                .map((cat) => {
                  const partnersInCat = (db.partners || [])
                    .filter((p) => {
                      const c = (p.category || p.sponsorCategory || '').toUpperCase().trim();
                      if (cat === 'HOVEDSPONSOR') return c === 'HOVEDSPONSOR' || c.includes('HOVED');
                      if (cat === 'AGF PLAY') return c === 'AGF PLAY' || c === 'PLAY';
                      if (cat === 'AGF MATCH') return c === 'AGF MATCH' || c === 'MATCH';
                      if (cat === 'AGF FORDEL') return c === 'AGF FORDEL' || c === 'FORDEL';
                      if (cat === 'ØVRIGE MATCHDAY-PARTNERE') {
                        return (
                          c === 'ØVRIGE MATCHDAY-PARTNERE' ||
                          c === 'OVRIGE MATCHDAY-PARTNERE' ||
                          c.includes('ØVRIG') ||
                          c.includes('ENERGIPARTNER') ||
                          c.includes('MATCHDAY')
                        );
                      }
                      return false;
                    })
                    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));

                  if (partnersInCat.length === 0 && partnerFilterCategory !== 'ALL') {
                    return (
                      <div key={cat} className="bg-white rounded-2xl p-6 text-center text-xs text-gray-500 border border-gray-200">
                        Ingen partnere i kategorien {cat}.
                      </div>
                    );
                  }

                  if (partnersInCat.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              cat === 'HOVEDSPONSOR'
                                ? 'bg-amber-500'
                                : cat === 'AGF PLAY'
                                ? 'bg-blue-600'
                                : cat === 'AGF MATCH'
                                ? 'bg-slate-600'
                                : cat === 'AGF FORDEL'
                                ? 'bg-gray-500'
                                : 'bg-emerald-600'
                            }`}
                          />
                          <span>{cat}</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {partnersInCat.length} {partnersInCat.length === 1 ? 'partner' : 'partnere'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {partnersInCat.map((partner) => (
                          <div
                            key={partner.id}
                            className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Logo Box */}
                              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 p-1 flex items-center justify-center flex-shrink-0">
                                <img
                                  src={partner.logo || partner.logoUrl || '/agf-logo.svg'}
                                  alt={partner.name}
                                  className="max-h-9 w-auto max-w-full object-contain"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/agf-logo.svg';
                                  }}
                                />
                              </div>

                              {/* Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-extrabold text-sm text-[#081326] truncate">
                                    {partner.name}
                                  </h4>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                    #{partner.sortOrder ?? 1}
                                  </span>
                                  {partner.featured && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                      <span>Fremhævet forside</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                                  <span>{partner.category}</span>
                                  {partner.websiteUrl ? (
                                    <a
                                      href={partner.websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-blue-600 hover:underline text-[11px]"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      <span>Link</span>
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic">Intet weblink</span>
                                  )}
                                </div>

                                {partner.offer && (
                                  <div className="flex items-center gap-1 text-[10px] text-[#C8102E] font-medium mt-1">
                                    <Tag className="w-2.5 h-2.5 flex-shrink-0" />
                                    <span>{partner.offer}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              {/* Toggle Featured */}
                              <button
                                type="button"
                                title={partner.featured ? 'Fjern fra forsiden' : 'Fremhæv på forsiden'}
                                onClick={() =>
                                  dataService.savePartner({
                                    ...partner,
                                    featured: !partner.featured,
                                  })
                                }
                                className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                  partner.featured
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-gray-100 text-gray-400 hover:text-gray-700'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Active / Inactive */}
                              <button
                                type="button"
                                onClick={() =>
                                  dataService.savePartner({
                                    ...partner,
                                    active: !partner.active,
                                  })
                                }
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer ${
                                  partner.active
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                              >
                                {partner.active ? 'Aktiv' : 'Skjult'}
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditPartner(partner)}
                                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#081326] transition-colors cursor-pointer"
                                title="Rediger partner"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeletePartnerClick(partner.id, partner.name)}
                                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                title="Slet partner"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* CREATE / EDIT PARTNER MODAL */}
            {isPartnerModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-gray-200 max-h-[92vh] overflow-y-auto text-[#081326]">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-extrabold text-base text-[#081326]">
                        {editingPartner ? 'Rediger Partner' : 'Opret Ny Partner'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsPartnerModalOpen(false)}
                      className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {partnerSaveMsg && (
                    <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200">
                      {partnerSaveMsg}
                    </div>
                  )}

                  <form onSubmit={handleSavePartnerSubmit} className="space-y-4">
                    {/* Virksomhedsnavn */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-gray-500 mb-1">
                        Virksomhedsnavn *
                      </label>
                      <input
                        type="text"
                        required
                        value={partnerForm.name}
                        onChange={(e) =>
                          setPartnerForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="F.eks. Raundahl & Moesby"
                        className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-[#081326] focus:outline-hidden focus:border-blue-600"
                      />
                    </div>

                    {/* Sponsorkategori */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-gray-500 mb-1">
                        Sponsor Kategori *
                      </label>
                      <select
                        value={partnerForm.category}
                        onChange={(e) =>
                          setPartnerForm((prev) => ({
                            ...prev,
                            category: e.target.value as SponsorCategory,
                          }))
                        }
                        className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-[#081326] font-medium focus:outline-hidden focus:border-blue-600"
                      >
                        <option value="HOVEDSPONSOR">1. HOVEDSPONSOR</option>
                        <option value="AGF PLAY">2. AGF PLAY</option>
                        <option value="AGF MATCH">3. AGF MATCH</option>
                        <option value="AGF FORDEL">4. AGF FORDEL</option>
                        <option value="ØVRIGE MATCHDAY-PARTNERE">5. ØVRIGE MATCHDAY-PARTNERE</option>
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Bestemmer placering og visuel fremhævning på den offentlige partnerside.
                      </p>
                    </div>

                    {/* Logo Management */}
                    <div className="space-y-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                      <label className="block text-[11px] font-extrabold uppercase text-gray-600">
                        Partner Logo
                      </label>

                      {/* Preset selector */}
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">
                          Vælg fra eksisterende officielle AGF sponsorer:
                        </span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              setPartnerForm((prev) => ({ ...prev, logo: e.target.value }));
                            }
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs text-[#081326]"
                        >
                          <option value="">-- Vælg officielt logo --</option>
                          {PRESET_PARTNER_LOGOS.map((preset) => (
                            <option key={preset.path} value={preset.path}>
                              {preset.label} ({preset.path})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* File upload or custom URL */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 mb-1">
                            Eller upload billedfil:
                          </span>
                          <label className="flex items-center justify-center gap-1.5 p-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 text-gray-500" />
                            <span>Upload logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePartnerFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 mb-1">
                            Eller sti / URL:
                          </span>
                          <input
                            type="text"
                            value={partnerForm.logo}
                            onChange={(e) =>
                              setPartnerForm((prev) => ({ ...prev, logo: e.target.value }))
                            }
                            placeholder="/partners/logo.png eller https://..."
                            className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs text-[#081326]"
                          />
                        </div>
                      </div>

                      {/* Live preview */}
                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-[10px] font-bold text-gray-400">Forhåndsvisning:</span>
                        <div className="h-12 w-28 bg-white border border-gray-200 rounded-lg p-1.5 flex items-center justify-center">
                          {partnerForm.logo ? (
                            <img
                              src={partnerForm.logo}
                              alt="Logo preview"
                              className="max-h-9 max-w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/agf-logo.svg';
                              }}
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Intet logo</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Website URL */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-gray-500 mb-1">
                        Hjemmeside URL
                      </label>
                      <input
                        type="url"
                        value={partnerForm.websiteUrl}
                        onChange={(e) =>
                          setPartnerForm((prev) => ({ ...prev, websiteUrl: e.target.value }))
                        }
                        placeholder="https://..."
                        className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-[#081326] focus:outline-hidden focus:border-blue-600"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Åbner automatisk i en ny fane for tilskuere ved klik.
                      </p>
                    </div>

                    {/* Short Description */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-gray-500 mb-1">
                        Kort Beskrivelse / Budskab (Valgfri)
                      </label>
                      <textarea
                        rows={2}
                        value={partnerForm.shortDescription}
                        onChange={(e) =>
                          setPartnerForm((prev) => ({
                            ...prev,
                            shortDescription: e.target.value,
                          }))
                        }
                        placeholder="Kort tekst om virksomheden eller partnerskabet..."
                        className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-[#081326] focus:outline-hidden focus:border-blue-600"
                      />
                    </div>

                    {/* Sort Order & Offer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-gray-500 mb-1">
                          Visningsrækkefølge (Tal)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={partnerForm.sortOrder}
                          onChange={(e) =>
                            setPartnerForm((prev) => ({
                              ...prev,
                              sortOrder: parseInt(e.target.value) || 1,
                            }))
                          }
                          className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-[#081326]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase text-gray-500 mb-1">
                          Valgfrit Kampdags-tilbud
                        </label>
                        <input
                          type="text"
                          value={partnerForm.offer}
                          onChange={(e) =>
                            setPartnerForm((prev) => ({ ...prev, offer: e.target.value }))
                          }
                          placeholder="F.eks. 15% rabat i dag"
                          className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-[#081326]"
                        />
                      </div>
                    </div>

                    {/* Checkboxes: Active & Featured */}
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <label className="flex items-center gap-2.5 text-xs text-[#081326] font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={partnerForm.active}
                          onChange={(e) =>
                            setPartnerForm((prev) => ({ ...prev, active: e.target.checked }))
                          }
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Aktiv (vises offentligt i appen)</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-[#081326] font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={partnerForm.featured}
                          onChange={(e) =>
                            setPartnerForm((prev) => ({ ...prev, featured: e.target.checked }))
                          }
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Fremhæv som Dagens Partner på forsiden</span>
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsPartnerModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        Annuller
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#081326] text-white hover:bg-black transition-colors cursor-pointer shadow-xs"
                      >
                        Gem Partner
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Handling ved klik (valgfri navigation)
                </label>
                <select
                  value={annActionTarget}
                  onChange={(e) => setAnnActionTarget(e.target.value as AnnouncementActionTarget)}
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs font-bold text-[#081326]"
                >
                  <option value="none">Ingen handling (kun info)</option>
                  <option value="program">Gå til Program</option>
                  <option value="stem">Gå til Kampens Spiller afstemning</option>
                  <option value="kiosk">Gå til Kiosk Menu</option>
                  <option value="tilbud">Gå til Kuponer & Tilbud</option>
                  <option value="konkurrencer">Gå til Konkurrencer</option>
                  <option value="partnere">Gå til Partnere</option>
                  <option value="tilmelding">Gå til Støt klubben / Looad</option>
                  <option value="del-matchday">Gå til Del Matchday</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Hvis valgt, gøres hele meddelelsen klikbar på forsiden og fører tilskueren direkte dertil.
                </p>
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
                    actionTarget: annActionTarget,
                    active: true,
                    createdAt: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
                  });
                  setAnnTitle('');
                  setAnnMessage('');
                  setAnnActionTarget('none');
                }}
                className="w-full py-2.5 bg-[#081326] text-white font-bold text-xs uppercase rounded-xl shadow-xs cursor-pointer hover:bg-black"
              >
                Udsend Besked Nu
              </button>
            </div>

            {/* List of announcements */}
            <div className="space-y-2">
              {db.announcements.map((ann) => (
                <div key={ann.id} className="p-3 bg-white rounded-xl border flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-[#081326]">{ann.title}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-gray-100 rounded">
                        {ann.priority}
                      </span>
                      {ann.actionTarget && ann.actionTarget !== 'none' && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 flex items-center gap-1">
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Link: {ann.actionTarget}</span>
                        </span>
                      )}
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
        </>
        )}
      </div>

      {/* ================= MODAL: NULSTIL MATCHDAY ================= */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-red-100">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black uppercase text-[#081326]">
                Nulstil Matchday?
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Er du sikker på, at du vil nulstille dagens data?
              </p>
            </div>

            <div className="bg-red-50/70 p-3.5 rounded-2xl border border-red-200 text-xs text-red-900 space-y-1.5">
              <p className="font-bold">Følgende Matchday-specifikke data nulstilles:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-800">
                <li>Kampe (stillinger og perioder nulstilles)</li>
                <li>Programpunkter (status sættes til kommende)</li>
                <li>Alle afgivne stemmer og vinder i Kampens Spiller</li>
                <li>Kuponaktiveringer, indløsninger og scanner-log</li>
                <li>Konkurrenceresultater fra fanzonen</li>
                <li>Matchday-beskeder og midlertidig hero-konfiguration</li>
                <li>Appens besøgstæller</li>
              </ul>
              <div className="pt-1.5 border-t border-red-200/60 text-[11px] text-gray-700">
                <span className="font-bold text-emerald-800">Bliver bevaret:</span> Partnerdatabase, sponsorkategorier, Looad-standardlink, branding og globale systemindstillinger.
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                Bekræft med ADMIN adgangskode:
              </label>
              <input
                type="password"
                value={resetAdminCode}
                onChange={(e) => {
                  setResetAdminCode(e.target.value);
                  if (resetError) setResetError(null);
                }}
                placeholder="Indtast din ADMIN adgangskode..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-600"
                autoFocus
              />
              {resetError && (
                <p className="text-[11px] text-red-600 font-bold">{resetError}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetAdminCode('');
                  setResetError(null);
                }}
                disabled={resetLoading}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Annuller
              </button>
              <button
                type="button"
                id="admin-confirm-reset-btn"
                onClick={handleConfirmReset}
                disabled={resetLoading || !resetAdminCode.trim()}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {resetLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Nulstiller...</span>
                  </>
                ) : (
                  <span>Bekræft Nulstilling</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REDIGER/OPRET PROGRAMPUNKT ================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-[#081326] uppercase tracking-wide">
                {editingScheduleItem ? 'Rediger Programpunkt' : 'Nyt Programpunkt'}
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScheduleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                    Tidspunkt
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
                    placeholder="14:00"
                    className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs font-mono font-bold text-[#081326]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                    Lokation / Venue
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.venue}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, venue: e.target.value }))}
                    placeholder="Ceres Arena Forplads"
                    className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Aktivitet / Overskrift
                </label>
                <input
                  type="text"
                  required
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="F.eks. Fanzone & Børnehjørne åbner"
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs font-bold text-[#081326]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Beskrivelse (valgfri)
                </label>
                <textarea
                  rows={2}
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Yderligere information til tilskuerne..."
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={scheduleForm.status}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      status: e.target.value as 'upcoming' | 'live' | 'completed',
                    }))
                  }
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs font-bold text-[#081326]"
                >
                  <option value="upcoming">Kommende</option>
                  <option value="live">I gang nu (LIVE)</option>
                  <option value="completed">Afsluttet</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#081326] hover:bg-black text-white font-black text-xs uppercase rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Gem Punkt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REDIGER/OPRET KONKURRENCE ================= */}
      {isCompetitionModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-[#081326] uppercase tracking-wide">
                {editingCompetition ? 'Rediger Konkurrence' : 'Ny Konkurrence'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCompetitionModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCompetitionSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Navn på konkurrence *
                </label>
                <input
                  type="text"
                  required
                  value={competitionForm.name}
                  onChange={(e) => setCompetitionForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="F.eks. Skudmåler, Præcisionskast, mv."
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs font-bold text-[#081326]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Beskrivelse
                </label>
                <textarea
                  rows={2}
                  value={competitionForm.description}
                  onChange={(e) =>
                    setCompetitionForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Beskriv konkurrencen og regler for tilskuerne..."
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Måleenhed *
                </label>
                <input
                  type="text"
                  required
                  value={competitionForm.scoringUnit}
                  onChange={(e) =>
                    setCompetitionForm((prev) => ({ ...prev, scoringUnit: e.target.value }))
                  }
                  placeholder="f.eks. km/t, point, træffere"
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs font-mono font-bold text-[#081326]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Vindermodel *
                </label>
                <select
                  value={competitionForm.higherScoreWins ? 'highest' : 'lowest'}
                  onChange={(e) =>
                    setCompetitionForm((prev) => ({
                      ...prev,
                      higherScoreWins: e.target.value === 'highest',
                      higherIsBetter: e.target.value === 'highest',
                    }))
                  }
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs font-bold text-[#081326]"
                >
                  <option value="highest">Højeste resultat vinder (f.eks. km/t, point, træffere)</option>
                  <option value="lowest">Laveste resultat vinder (f.eks. tid, sekunder)</option>
                </select>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <label className="flex items-center gap-2.5 text-xs text-[#081326] font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={competitionForm.active}
                    onChange={(e) =>
                      setCompetitionForm((prev) => ({ ...prev, active: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Aktiv på matchday</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompetitionModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#081326] hover:bg-black text-white font-black text-xs uppercase rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Gem Konkurrence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: OPRET / REDIGER MATCHDAY ================= */}
      {isMatchdayModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#C8102E] flex items-center justify-center font-black">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-[#081326]">
                    {editingMatchday ? 'Rediger Matchday' : 'Opret Ny Matchday'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Central container for kampdagens data
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMatchdayModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatchdaySubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Matchday Titel *
                </label>
                <input
                  type="text"
                  required
                  value={matchdayForm.title}
                  onChange={(e) => setMatchdayForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="F.eks. AGF Matchday – Dobbeltbrag i Ceres Arena"
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                    Dato
                  </label>
                  <input
                    type="text"
                    value={matchdayForm.date}
                    onChange={(e) => setMatchdayForm((prev) => ({ ...prev, date: e.target.value }))}
                    placeholder="Lørdag d. 10. oktober 2026"
                    className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                    Spillested
                  </label>
                  <input
                    type="text"
                    value={matchdayForm.venue}
                    onChange={(e) => setMatchdayForm((prev) => ({ ...prev, venue: e.target.value }))}
                    placeholder="Ceres Arena, Hal 1"
                    className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Velkomstbesked
                </label>
                <input
                  type="text"
                  value={matchdayForm.welcomeMessage}
                  onChange={(e) => setMatchdayForm((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder="Velkommen til AGF Håndbold i Ceres Arena!"
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                    Dagens Kampsponsor
                  </label>
                  <select
                    value={matchdayForm.kampdagssponsorId || ''}
                    onChange={(e) => setMatchdayForm((prev) => ({ ...prev, kampdagssponsorId: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                  >
                    <option value="">Ingen valgt (standard)</option>
                    {(db.partners || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                    Kampens Spiller Sponsor
                  </label>
                  <select
                    value={matchdayForm.kampensSpillerSponsorId || ''}
                    onChange={(e) => setMatchdayForm((prev) => ({ ...prev, kampensSpillerSponsorId: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                  >
                    <option value="">Ingen valgt (standard)</option>
                    {(db.partners || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Looad Kampagnelink
                </label>
                <input
                  type="url"
                  value={matchdayForm.looadUrl}
                  onChange={(e) => setMatchdayForm((prev) => ({ ...prev, looadUrl: e.target.value }))}
                  placeholder="https://looad.dk/pages/klub-agf-haandbold"
                  className="w-full p-2.5 bg-gray-50 rounded-xl border text-xs text-[#081326]"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2.5 text-xs text-[#081326] font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchdayForm.active}
                    onChange={(e) => setMatchdayForm((prev) => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Gør denne Matchday aktiv nu (synlig for alle tilskuere)</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMatchdayModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#C8102E] hover:bg-red-700 text-white font-black text-xs uppercase rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Gem Matchday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
