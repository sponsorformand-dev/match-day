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

function normalizePartnersList(partners: any[]): { partners: any[]; updated: boolean } {
  if (!partners || !Array.isArray(partners)) {
    return { partners: initialDatabase.partners, updated: true };
  }

  let updated = false;
  // Deduplicate Scorjobbet.dk so it only ever exists once
  let seenScorjobbet = false;
  const deduped: any[] = [];

  for (const p of partners) {
    const isScorjobbet = p.id === 'part-scorjobbet' || (p.name && p.name.toLowerCase().includes('scorjobbet'));
    if (isScorjobbet) {
      if (seenScorjobbet) {
        updated = true;
        continue; // Skip duplicate
      }
      seenScorjobbet = true;
      let pCopy = { ...p };
      if (pCopy.category !== 'AGF PLAY' || pCopy.sponsorCategory !== 'AGF PLAY' || pCopy.sortOrder !== 6) {
        pCopy.category = 'AGF PLAY';
        pCopy.sponsorCategory = 'AGF PLAY';
        pCopy.sortOrder = 6;
        updated = true;
      }
      deduped.push(pCopy);
    } else {
      let pCopy = { ...p };
      if (pCopy.id === 'part-kaufmann' && pCopy.sortOrder !== 1) {
        pCopy.sortOrder = 1;
        updated = true;
      } else if (pCopy.id === 'part-v-steel' && pCopy.sortOrder !== 2) {
        pCopy.sortOrder = 2;
        updated = true;
      }
      // Ensure placeholder logos are updated with official assets
      const defaultPartner = initialDatabase.partners.find((dp) => dp.id === pCopy.id);
      if (defaultPartner && (pCopy.logo === '/agf-logo.svg' || !pCopy.logo)) {
        pCopy.logo = defaultPartner.logo;
        pCopy.logoUrl = defaultPartner.logoUrl;
        updated = true;
      }
      deduped.push(pCopy);
    }
  }

  // If Scorjobbet was missing, add it from initialDatabase
  if (!seenScorjobbet) {
    const defaultScorjobbet = initialDatabase.partners.find((dp) => dp.id === 'part-scorjobbet');
    if (defaultScorjobbet) {
      deduped.push(defaultScorjobbet);
      updated = true;
    }
  }

  return { partners: deduped, updated };
}

// Local cache
let cachedDb: MatchdayDatabase = (() => {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.partners || !parsed.partners.some((p: any) => p.category === 'HOVEDSPONSOR')) {
        parsed.partners = initialDatabase.partners;
      } else {
        const { partners: normPartners } = normalizePartnersList(parsed.partners);
        parsed.partners = normPartners;
      }
      if (parsed.matchdays) {
        parsed.matchdays = parsed.matchdays.map((m: any) => {
          if (!m.looadUrl || !m.looadUrl.includes('klub-agf-haandbold')) {
            return {
              ...m,
              looadUrl: 'https://looad.dk/pages/klub-agf-haandbold',
              looadTitle: 'STØT AGF HÅNDBOLD MED LOOAD',
              looadDescription: 'Skift elselskab til Looad og støt samtidig AGF Håndbold.',
            };
          }
          return m;
        });
      }
      return parsed;
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
        if (!serverData.partners || !serverData.partners.some((p: any) => p.category === 'HOVEDSPONSOR')) {
          serverData.partners = initialDatabase.partners;
          await pushToServer(serverData);
        } else {
          let updated = false;
          const { partners: normPartners, updated: partnersUpdated } = normalizePartnersList(serverData.partners);
          if (partnersUpdated) {
            serverData.partners = normPartners;
            updated = true;
          }
          if (serverData.matchdays) {
            serverData.matchdays = serverData.matchdays.map((m: any) => {
              if (!m.looadUrl || !m.looadUrl.includes('klub-agf-haandbold')) {
                updated = true;
                return {
                  ...m,
                  looadUrl: 'https://looad.dk/pages/klub-agf-haandbold',
                  looadTitle: 'STØT AGF HÅNDBOLD MED LOOAD',
                  looadDescription: 'Skift elselskab til Looad og støt samtidig AGF Håndbold.',
                };
              }
              return m;
            });
          }
          if (updated) {
            await pushToServer(serverData);
          }
        }
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

    // Keep schedule item opponent names in sync with match data
    if (match.category && match.awayTeam) {
      cachedDb.schedule = cachedDb.schedule.map(item => {
        if (match.category === 'DAMER' && (item.title.toLowerCase().includes('damer') || item.id === 'sched-2')) {
          return {
            ...item,
            title: `AGF Damer vs. ${match.awayTeam}`,
          };
        }
        if (match.category === 'HERRER' && (item.title.toLowerCase().includes('herrer') || item.id === 'sched-4')) {
          return {
            ...item,
            title: `AGF Herrer vs. ${match.awayTeam}`,
          };
        }
        return item;
      });
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

  async clearCompetitionScores(competitionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/competition/clear-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId }),
      });
      const data = await res.json();
      await syncFromServer();
      return data;
    } catch (e: any) {
      cachedDb.scores = cachedDb.scores.filter(s => s.competitionId !== competitionId);
      notifyListeners();
      return { success: true };
    }
  },

  async resetMatchday(adminCode: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/matchday/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminCode: adminCode.trim() }),
      });
      const data = await res.json();
      await syncFromServer();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Kunne ikke nulstille matchday' };
    }
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
      const cleanUrl = url.trim() || 'https://looad.dk/pages/klub-agf-haandbold';
      m.looadUrl = (!cleanUrl || cleanUrl.includes('event')) ? 'https://looad.dk/pages/klub-agf-haandbold' : cleanUrl;
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

  // Unified Staff & Admin Authentication & Session Management (12-hour duration)
  getCurrentSession(): { id: string; role: 'ADMIN' | 'STAFF'; expiresAt: string; deviceLabel?: string } | null {
    try {
      const raw = localStorage.getItem('agf_auth_session_12h') || sessionStorage.getItem('agf_auth_session_12h');
      if (raw) {
        const session = JSON.parse(raw);
        if (new Date(session.expiresAt) > new Date()) {
          return session;
        } else {
          // Expired
          localStorage.removeItem('agf_auth_session_12h');
          sessionStorage.removeItem('agf_auth_session_12h');
        }
      }
    } catch {
      // Ignore
    }
    return null;
  },

  setSession(session: { id: string; role: 'ADMIN' | 'STAFF'; expiresAt: string; deviceLabel?: string } | null) {
    try {
      if (session) {
        localStorage.setItem('agf_auth_session_12h', JSON.stringify(session));
        sessionStorage.setItem('agf_auth_session_12h', JSON.stringify(session));
      } else {
        localStorage.removeItem('agf_auth_session_12h');
        sessionStorage.removeItem('agf_auth_session_12h');
      }
    } catch {
      // Ignore
    }
  },

  async login(code: string, deviceLabel?: string): Promise<{ success: boolean; role?: 'ADMIN' | 'STAFF'; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), deviceLabel }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Forkert adgangskode' };
      }
      const sessionObj = {
        id: data.token,
        role: data.role as 'ADMIN' | 'STAFF',
        expiresAt: data.expiresAt,
        deviceLabel: data.session?.deviceLabel,
      };
      this.setSession(sessionObj);
      // Also maintain legacy staff user for backwards compatibility
      this.setStaffSession({
        id: sessionObj.id,
        name: sessionObj.role === 'ADMIN' ? 'Administrator' : 'Personale',
        role: sessionObj.role,
        pin: code.trim(),
        createdAt: new Date().toISOString(),
      });
      return { success: true, role: data.role };
    } catch {
      // Local fallback check if offline
      const clean = code.trim();
      const adminCode = cachedDb.adminCode || 'AGF176';
      const staffCode = cachedDb.staffCode || 'AGF1880';
      const adminPin = cachedDb.adminPin || '1880';

      let role: 'ADMIN' | 'STAFF' | null = null;
      if (clean === adminCode) role = 'ADMIN';
      else if (clean === staffCode || clean === adminPin) role = 'STAFF';

      if (role) {
        const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
        const sessionObj = {
          id: `local-sess-${Date.now()}`,
          role,
          expiresAt,
          deviceLabel: deviceLabel || (role === 'ADMIN' ? 'Administrator' : 'Personale'),
        };
        this.setSession(sessionObj);
        return { success: true, role };
      }
      return { success: false, error: 'Forkert adgangskode. Prøv igen.' };
    }
  },

  async logout(): Promise<void> {
    const session = this.getCurrentSession();
    if (session) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: session.id }),
        });
      } catch {
        // Ignore
      }
    }
    this.setSession(null);
    this.setStaffSession(null);
  },

  async verifySession(): Promise<{ valid: boolean; role?: 'ADMIN' | 'STAFF' }> {
    const session = this.getCurrentSession();
    if (!session) return { valid: false };

    // Check expiration (12 hours)
    if (new Date(session.expiresAt) <= new Date()) {
      await this.logout();
      return { valid: false };
    }

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: session.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        await this.logout();
        return { valid: false };
      }
      return { valid: true, role: data.role };
    } catch {
      // Offline fallback: verify local expiration
      return { valid: true, role: session.role };
    }
  },

  async getActiveSessions(): Promise<{ total: number; staffCount: number; adminCount: number; sessions: any[] }> {
    try {
      const res = await fetch('/api/auth/sessions');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    const current = this.getCurrentSession();
    return {
      total: current ? 1 : 0,
      staffCount: current?.role === 'STAFF' ? 1 : 0,
      adminCount: current?.role === 'ADMIN' ? 1 : 0,
      sessions: current ? [current] : [],
    };
  },

  async terminateSession(sessionId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/session/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Access Codes Management
  async updateAccessCodes(staffCode: string, adminCode: string) {
    cachedDb.staffCode = staffCode.trim();
    cachedDb.adminCode = adminCode.trim();
    notifyListeners();
    await pushToServer(cachedDb);
  },

  // Export full database as JSON
  exportDatabaseJson(): string {
    return JSON.stringify(cachedDb, null, 2);
  },

  // Import full database from JSON
  async importDatabaseJson(jsonData: any): Promise<boolean> {
    if (!jsonData || !Array.isArray(jsonData.matches) || !Array.isArray(jsonData.matchdays)) {
      throw new Error('Ugyldigt databaseformat');
    }
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });
      if (res.ok) {
        await syncFromServer();
        return true;
      }
    } catch {
      cachedDb = jsonData;
      notifyListeners();
      await pushToServer(cachedDb);
      return true;
    }
    return false;
  },

  // Staff Authentication & Session (Legacy wrappers)
  getCurrentStaffUser(): StaffUser | null {
    const session = this.getCurrentSession();
    if (session) {
      return {
        id: session.id,
        name: session.role === 'ADMIN' ? 'Administrator' : 'Personale',
        role: session.role,
        pin: '',
        createdAt: new Date().toISOString(),
      };
    }
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
    const res = await this.login(pin);
    if (res.success && res.role) {
      const u: StaffUser = {
        id: 'sess-' + Date.now(),
        name: res.role === 'ADMIN' ? 'Administrator' : 'Personale',
        role: res.role,
        pin,
        createdAt: new Date().toISOString(),
      };
      return { success: true, user: u };
    }
    return { success: false, error: res.error || 'Forkert adgangskode' };
  },

  logoutStaff() {
    this.logout();
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
    const session = this.getCurrentSession();
    const currentStaff = this.getCurrentStaffUser();
    const pin = staffPin || currentStaff?.pin || cachedDb.adminPin || '1880';
    const id = staffId || currentStaff?.id || session?.id || 'staff-scanner';

    try {
      const res = await fetch('/api/coupon/redeem-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          staffPin: pin,
          staffId: id,
          sessionToken: session?.id,
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
          error: 'ALLEREDE BRUGT',
          redeemedAt: target.redeemedAt
            ? new Date(target.redeemedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
            : undefined,
          redeemedBy: target.redeemedByStaffName || 'Personale',
        };
      }

      const now = new Date();
      if (now > new Date(target.expiresAt)) {
        target.status = 'expired';
        notifyListeners();
        return { status: 'EXPIRED', error: 'UDLØBET' };
      }

      const coupon = cachedDb.coupons.find(c => c.id === target.couponId);
      if (!coupon || !coupon.active) {
        return { status: 'INVALID', error: 'UGYLDIG KUPON' };
      }

      // Mark redeemed
      target.redeemed = true;
      target.status = 'redeemed';
      target.redeemedAt = now.toISOString();
      target.redeemedByStaffId = currentStaff?.id || session?.id || 'staff-local';
      target.redeemedByStaffName = session?.role === 'ADMIN' ? 'Administrator' : 'Personale';
      coupon.redemptionsCount = (coupon.redemptionsCount || 0) + 1;

      notifyListeners();
      await pushToServer(cachedDb);

      return {
        status: 'SUCCESS',
        message: 'KUPON GODKENDT',
        couponName: coupon.title,
        offerDetails: `${coupon.offerPrice} kr.`,
        redeemedTime: now.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
        redeemedBy: target.redeemedByStaffName,
        redemption: target,
      };
    }
  }
};
