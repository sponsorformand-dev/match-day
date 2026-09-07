import {
  MatchdayDatabase,
  Matchday,
  Match,
  ScheduleItem,
  Product,
  Coupon,
  CouponRedemption,
  StaffUser,
  RedemptionLogEntry,
  Competition,
  Score,
  VotingSession,
  Player,
  Partner,
  Announcement,
  FeaturedHero,
} from '../types.ts';
import { initialDatabase } from '../initialData.ts';

const DB_STORAGE_KEY = 'agf_matchday_db_v1';
const DEVICE_ID_KEY = 'agf_matchday_device_id';

// Anonymous persistent device ID
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// Local cache
let cachedDb: MatchdayDatabase = (() => {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not parse cached local database, using seed:', e);
  }
  return initialDatabase;
})();

// Subscribers for real-time reactive UI
type Listener = (db: MatchdayDatabase) => void;
const listeners = new Set<Listener>();

export function subscribeToDatabase(listener: Listener) {
  listeners.add(listener);
  // Send current cached data immediately
  listener(cachedDb);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(cachedDb));
  listeners.forEach(fn => fn({ ...cachedDb }));
}

// Sync with server
export async function syncFromServer(): Promise<MatchdayDatabase> {
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && serverData.matchdays) {
        cachedDb = serverData;
        notifyListeners();
        return cachedDb;
      } else {
        // Server empty or uninitialized, seed it with initialDatabase
        await pushToServer(cachedDb);
      }
    }
  } catch (err) {
    console.warn('Server sync offline or pending, using local cache:', err);
  }
  return cachedDb;
}

async function pushToServer(db: MatchdayDatabase) {
  try {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db),
    });
  } catch (e) {
    console.warn('Push to server failed (offline mode):', e);
  }
}

// Track visits
export function recordVisit() {
  try {
    fetch('/api/visit', { method: 'POST' }).catch(() => {});
  } catch {
    // Silent
  }
}

// Real-time synchronization (SSE + Polling fallback)
let pollInterval: any = null;
let sseConnection: EventSource | null = null;

export function startLiveSync() {
  syncFromServer();
  recordVisit();

  if (typeof window !== 'undefined' && 'EventSource' in window && !sseConnection) {
    try {
      sseConnection = new EventSource('/api/events');
      sseConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'db_updated' && data.payload) {
            cachedDb = data.payload;
            notifyListeners();
          } else if (data.type === 'coupon_redeemed') {
            syncFromServer();
          }
        } catch (e) {
          // ignore parsing error
        }
      };
      sseConnection.onerror = () => {
        // SSE temporary failure, standard polling below will continue keeping data fresh
      };
    } catch {
      // Ignore
    }
  }

  if (!pollInterval) {
    pollInterval = setInterval(() => {
      syncFromServer();
    }, 4000);
  }
}

const STAFF_SESSION_KEY = 'agf_staff_session_v1';

export interface ScanRedeemResult {
  status: 'SUCCESS' | 'ALREADY_USED' | 'EXPIRED' | 'INVALID' | 'INACTIVE_OFFER' | 'UNAUTHORIZED' | 'ERROR';
  message?: string;
  error?: string;
  couponName?: string;
  offerDetails?: string;
  redeemedTime?: string;
  redeemedBy?: string;
  redeemedAt?: string;
  couponTitle?: string;
  redemption?: CouponRedemption;
}

// CRUD actions
export const dataService = {
  getDb: () => ({ ...cachedDb }),
  getDatabase: () => ({ ...cachedDb }),
  subscribeToDatabase,
  recordVisit,
  startLiveSync,

  async updateDatabase(newDb: MatchdayDatabase) {
    cachedDb = newDb;
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Matchdays
  async setActiveMatchday(matchdayId: string) {
    cachedDb.matchdays = cachedDb.matchdays.map(m => ({
      ...m,
      active: m.id === matchdayId
    }));
    cachedDb.activeMatchdayId = matchdayId;
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async saveMatchday(matchday: Matchday) {
    const idx = cachedDb.matchdays.findIndex(m => m.id === matchday.id);
    if (idx >= 0) {
      cachedDb.matchdays[idx] = matchday;
    } else {
      cachedDb.matchdays.push(matchday);
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async deleteMatchday(matchdayId: string) {
    cachedDb.matchdays = cachedDb.matchdays.filter(m => m.id !== matchdayId);
    if (cachedDb.activeMatchdayId === matchdayId && cachedDb.matchdays.length > 0) {
      cachedDb.activeMatchdayId = cachedDb.matchdays[0].id;
      cachedDb.matchdays[0].active = true;
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Featured Hero
  async updateFeaturedHero(matchdayId: string, hero: FeaturedHero) {
    const matchday = cachedDb.matchdays.find(m => m.id === matchdayId);
    if (matchday) {
      matchday.featuredHero = hero;
      notifyListeners();
      await pushToServer(cachedDb);
    }
  },

  // Matches
  async saveMatch(match: Match) {
    const idx = cachedDb.matches.findIndex(m => m.id === match.id);
    if (idx >= 0) {
      cachedDb.matches[idx] = match;
    } else {
      cachedDb.matches.push(match);
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async deleteMatch(matchId: string) {
    cachedDb.matches = cachedDb.matches.filter(m => m.id !== matchId);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Schedule
  async saveScheduleItem(item: ScheduleItem) {
    const idx = cachedDb.schedule.findIndex(s => s.id === item.id);
    if (idx >= 0) {
      cachedDb.schedule[idx] = item;
    } else {
      cachedDb.schedule.push(item);
    }
    cachedDb.schedule.sort((a, b) => a.order - b.order);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async deleteScheduleItem(itemId: string) {
    cachedDb.schedule = cachedDb.schedule.filter(s => s.id !== itemId);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async reorderScheduleItems(orderedIds: string[]) {
    cachedDb.schedule.forEach(item => {
      const index = orderedIds.indexOf(item.id);
      if (index >= 0) {
        item.order = index + 1;
      }
    });
    cachedDb.schedule.sort((a, b) => a.order - b.order);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Products
  async saveProduct(product: Product) {
    const idx = cachedDb.products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      cachedDb.products[idx] = product;
    } else {
      cachedDb.products.push(product);
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async toggleProductAvailability(productId: string) {
    const product = cachedDb.products.find(p => p.id === productId);
    if (product) {
      product.available = !product.available;
      notifyListeners();
      await pushToServer(cachedDb);
    }
  },

  async deleteProduct(productId: string) {
    cachedDb.products = cachedDb.products.filter(p => p.id !== productId);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Coupons
  async saveCoupon(coupon: Coupon) {
    const idx = cachedDb.coupons.findIndex(c => c.id === coupon.id);
    if (idx >= 0) {
      cachedDb.coupons[idx] = coupon;
    } else {
      cachedDb.coupons.push(coupon);
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async deleteCoupon(couponId: string) {
    cachedDb.coupons = cachedDb.coupons.filter(c => c.id !== couponId);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async activateCoupon(couponId: string): Promise<{ success: boolean; redemption?: any; error?: string }> {
    const deviceId = getOrCreateDeviceId();
    try {
      const res = await fetch('/api/coupon/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Fejl under aktivering af kupon' };
      }
      // Update local state
      cachedDb.couponRedemptions = [
        ...(cachedDb.couponRedemptions || []).filter(
          r => !(r.couponId === couponId && r.deviceId === deviceId)
        ),
        data.redemption,
      ];
      notifyListeners();
      return { success: true, redemption: data.redemption };
    } catch (e) {
      // Local fallback
      const coupon = cachedDb.coupons.find(c => c.id === couponId);
      if (!coupon) return { success: false, error: 'Kupon ikke fundet' };
      const durationMs = (coupon.activationDurationMinutes || 10) * 60 * 1000;
      const redemption: CouponRedemption = {
        id: `red-${Date.now()}`,
        couponId,
        matchdayId: cachedDb.activeMatchdayId || 'md-1',
        deviceId,
        redemptionToken: Math.random().toString(36).substring(2) + Date.now().toString(36),
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + durationMs).toISOString(),
        redeemed: false,
        status: 'active',
        redemptionCode: `AGF-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      cachedDb.couponRedemptions.push(redemption);
      notifyListeners();
      return { success: true, redemption };
    }
  },

  async redeemCoupon(redemptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Kunne ikke indløse kupon' };
      }
      const target = cachedDb.couponRedemptions.find(r => r.id === redemptionId);
      if (target) {
        target.status = 'redeemed';
        target.redeemedAt = new Date().toISOString();
        const coupon = cachedDb.coupons.find(c => c.id === target.couponId);
        if (coupon) coupon.redemptionsCount = (coupon.redemptionsCount || 0) + 1;
        notifyListeners();
      }
      return { success: true };
    } catch (e) {
      const target = cachedDb.couponRedemptions.find(r => r.id === redemptionId);
      if (target) {
        target.status = 'redeemed';
        target.redeemedAt = new Date().toISOString();
        const coupon = cachedDb.coupons.find(c => c.id === target.couponId);
        if (coupon) coupon.redemptionsCount = (coupon.redemptionsCount || 0) + 1;
        notifyListeners();
        return { success: true };
      }
      return { success: false, error: 'Kupon ikke fundet' };
    }
  },

  // Competitions & Scores
  async saveCompetition(comp: Competition) {
    const idx = cachedDb.competitions.findIndex(c => c.id === comp.id);
    if (idx >= 0) {
      cachedDb.competitions[idx] = comp;
    } else {
      cachedDb.competitions.push(comp);
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async deleteCompetition(compId: string) {
    cachedDb.competitions = cachedDb.competitions.filter(c => c.id !== compId);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async addScore(competitionId: string, participantName: string, score: number): Promise<{ success: boolean; isNewRecord?: boolean; error?: string }> {
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          matchdayId: cachedDb.activeMatchdayId,
          participantName,
          score,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      
      cachedDb.scores = [data.score, ...(cachedDb.scores || [])];
      notifyListeners();
      return { success: true, isNewRecord: data.isNewRecord };
    } catch (e) {
      // Local fallback
      const comp = cachedDb.competitions.find(c => c.id === competitionId);
      const prevScores = cachedDb.scores.filter(s => s.competitionId === competitionId);
      let isNew = false;
      if (prevScores.length === 0) {
        isNew = true;
      } else if (comp) {
        const best = comp.higherScoreWins ? Math.max(...prevScores.map(s => s.score)) : Math.min(...prevScores.map(s => s.score));
        isNew = comp.higherScoreWins ? score > best : score < best;
      }
      const newScore: Score = {
        id: `score-${Date.now()}`,
        competitionId,
        matchdayId: cachedDb.activeMatchdayId,
        participantName,
        score,
        timestamp: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
        isNewRecord: isNew,
      };
      cachedDb.scores = [newScore, ...cachedDb.scores];
      notifyListeners();
      return { success: true, isNewRecord: isNew };
    }
  },

  async deleteScore(scoreId: string) {
    cachedDb.scores = cachedDb.scores.filter(s => s.id !== scoreId);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Voting
  async saveVotingSession(session: VotingSession) {
    const idx = cachedDb.votingSessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      cachedDb.votingSessions[idx] = session;
    } else {
      cachedDb.votingSessions.push(session);
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async savePlayer(player: Player) {
    const idx = cachedDb.players.findIndex(p => p.id === player.id);
    if (idx >= 0) {
      cachedDb.players[idx] = player;
    } else {
      cachedDb.players.push(player);
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async deletePlayer(playerId: string) {
    cachedDb.players = cachedDb.players.filter(p => p.id !== playerId);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async resetVoting(sessionId: string) {
    cachedDb.votes = cachedDb.votes.filter(v => v.sessionId !== sessionId);
    const session = cachedDb.votingSessions.find(s => s.id === sessionId);
    if (session) {
      session.winnerPlayerId = undefined;
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async submitVote(sessionId: string, playerId: string): Promise<{ success: boolean; error?: string }> {
    const deviceId = getOrCreateDeviceId();
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, playerId, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Fejl ved afgivelse af stemme' };
      }
      cachedDb.votes.push(data.vote);
      notifyListeners();
      return { success: true };
    } catch (e) {
      // Local fallback check
      const existing = cachedDb.votes.find(v => v.sessionId === sessionId && v.deviceId === deviceId);
      if (existing) {
        return { success: false, error: 'Du har allerede stemt i denne afstemning' };
      }
      const newVote = {
        id: `v-${Date.now()}`,
        sessionId,
        playerId,
        deviceId,
        timestamp: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
      };
      cachedDb.votes.push(newVote);
      notifyListeners();
      return { success: true };
    }
  },

  // Partners
  async savePartner(partner: Partner) {
    const idx = cachedDb.partners.findIndex(p => p.id === partner.id);
    if (idx >= 0) {
      cachedDb.partners[idx] = partner;
    } else {
      cachedDb.partners.push(partner);
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async deletePartner(partnerId: string) {
    cachedDb.partners = cachedDb.partners.filter(p => p.id !== partnerId);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Announcements
  async saveAnnouncement(ann: Announcement) {
    const idx = cachedDb.announcements.findIndex(a => a.id === ann.id);
    if (idx >= 0) {
      cachedDb.announcements[idx] = ann;
    } else {
      cachedDb.announcements.push(ann);
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async deleteAnnouncement(annId: string) {
    cachedDb.announcements = cachedDb.announcements.filter(a => a.id !== annId);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Looad settings
  async updateLooadSettings(matchdayId: string, url: string, title?: string, description?: string) {
    const m = cachedDb.matchdays.find(item => item.id === matchdayId);
    if (m) {
      m.looadUrl = url;
      if (title) m.looadTitle = title;
      if (description) m.looadDescription = description;
      notifyListeners();
      await pushToServer(cachedDb);
    }
  },

  // Canonical share URL for Del Matchday
  async updateCanonicalUrl(url: string) {
    cachedDb.canonicalAppUrl = url.trim();
    const active = cachedDb.matchdays.find(m => m.id === cachedDb.activeMatchdayId);
    if (active) {
      active.shareUrl = url.trim();
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Staff Authentication & Session
  getCurrentStaffUser(): StaffUser | null {
    try {
      const raw = sessionStorage.getItem(STAFF_SESSION_KEY) || localStorage.getItem(STAFF_SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return null;
  },

  setStaffSession(user: StaffUser | null) {
    try {
      if (user) {
        sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(user));
        localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(STAFF_SESSION_KEY);
        localStorage.removeItem(STAFF_SESSION_KEY);
      }
    } catch {
      // Ignore
    }
  },

  async staffLogin(pin: string): Promise<{ success: boolean; user?: StaffUser; error?: string }> {
    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Ugyldig PIN-kode' };
      }
      this.setStaffSession(data.user);
      return { success: true, user: data.user };
    } catch (e) {
      // Local fallback check
      const staffList = cachedDb.staffUsers || [];
      const match = staffList.find(u => u.pin === pin.trim());
      if (match) {
        this.setStaffSession(match);
        return { success: true, user: match };
      }
      if (pin.trim() === (cachedDb.adminPin || '1880')) {
        const adminUser: StaffUser = {
          id: 'admin-master',
          name: 'AGF Administrator',
          role: 'ADMIN',
          pin: cachedDb.adminPin || '1880',
          createdAt: new Date().toISOString(),
        };
        this.setStaffSession(adminUser);
        return { success: true, user: adminUser };
      }
      return { success: false, error: 'Forkert PIN-kode' };
    }
  },

  logoutStaff() {
    this.setStaffSession(null);
  },

  // Staff User Management
  async saveStaffUser(user: StaffUser) {
    if (!cachedDb.staffUsers) cachedDb.staffUsers = [];
    const idx = cachedDb.staffUsers.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      cachedDb.staffUsers[idx] = user;
    } else {
      cachedDb.staffUsers.push(user);
    }
    notifyListeners();
    await pushToServer(cachedDb);
  },

  async deleteStaffUser(userId: string) {
    if (!cachedDb.staffUsers) return;
    cachedDb.staffUsers = cachedDb.staffUsers.filter(u => u.id !== userId);
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Secure Staff QR Scanner Redemption (Server-side Atomic)
  async redeemScan(token: string, staffPin?: string, staffId?: string): Promise<ScanRedeemResult> {
    const currentStaff = this.getCurrentStaffUser();
    const pin = staffPin || currentStaff?.pin || cachedDb.adminPin || '1880';
    const id = staffId || currentStaff?.id || 'staff-scanner';

    try {
      const res = await fetch('/api/coupon/redeem-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          staffPin: pin,
          staffId: id,
        }),
      });
      const data = await res.json();
      await syncFromServer();
      return data;
    } catch (e: any) {
      // Local fallback validation if offline
      const cleanToken = token.trim();
      const redemptions = cachedDb.couponRedemptions || [];
      const target = redemptions.find(
        r => r.redemptionToken === cleanToken || r.id === cleanToken || r.redemptionCode === cleanToken
      );

      if (!target) {
        return { status: 'INVALID', error: 'UGYLDIG KUPON', message: 'Kuponkoden findes ikke.' };
      }

      if (target.redeemed || target.status === 'redeemed') {
        return {
          status: 'ALREADY_USED',
          error: 'KUPON ALLEREDE BRUGT',
          redeemedAt: target.redeemedAt
            ? new Date(target.redeemedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
            : undefined,
          redeemedBy: target.redeemedByStaffName || 'Tidligere scannet',
        };
      }

      const now = new Date();
      if (now > new Date(target.expiresAt)) {
        target.status = 'expired';
        notifyListeners();
        return { status: 'EXPIRED', error: 'KUPON UDLØBET' };
      }

      const coupon = cachedDb.coupons.find(c => c.id === target.couponId);
      if (!coupon || !coupon.active) {
        return { status: 'INACTIVE_OFFER', error: 'TILBUDDET ER IKKE AKTIVT' };
      }

      // Mark redeemed
      target.redeemed = true;
      target.status = 'redeemed';
      target.redeemedAt = now.toISOString();
      target.redeemedByStaffId = currentStaff?.id || 'staff-local';
      target.redeemedByStaffName = currentStaff?.name || 'Kioskvagt';
      coupon.redemptionsCount = (coupon.redemptionsCount || 0) + 1;

      notifyListeners();
      await pushToServer(cachedDb);

      return {
        status: 'SUCCESS',
        message: '✓ KUPON GODKENDT',
        couponName: coupon.title,
        offerDetails: `${coupon.offerPrice} kr.`,
        redeemedTime: now.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
        redeemedBy: target.redeemedByStaffName,
        redemption: target,
      };
    }
  }
};
