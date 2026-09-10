export type ActiveTab = 'hjem' | 'program' | 'stem' | 'kiosk' | 'mere' | 'tilbud' | 'konkurrencer' | 'tilmelding' | 'partnere' | 'del-matchday' | 'staff';

export interface FeaturedHero {
  enabled: boolean;
  badge: string; // e.g. "LIVE NU", "PAUSETILBUD", "VELKOMMEN"
  title: string; // e.g. "STEM PÅ KAMPENS SPILLER"
  subtitle?: string;
  actionText: string;
  actionTarget: 'stem' | 'program' | 'kiosk' | 'tilbud' | 'konkurrencer' | 'tilmelding' | 'partnere' | 'del-matchday';
}

export interface Matchday {
  id: string;
  title: string;
  date: string;
  venue: string;
  active: boolean;
  featuredHero: FeaturedHero;
  looadUrl: string;
  looadTitle?: string;
  looadDescription?: string;
  welcomeMessage?: string;
  shareUrl?: string;
  createdAt: string;
}

export type MatchCategory = 'DAMER' | 'HERRER' | 'UNGDOM';
export type MatchStatus = 'upcoming' | 'live' | 'first_half' | 'halftime' | 'second_half' | 'finished';

export interface Match {
  id: string;
  matchdayId: string;
  category: MatchCategory;
  league: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  partner?: string;
  liveMatchUrl?: string;
}

export type ScheduleStatus = 'upcoming' | 'live' | 'completed';

export interface ScheduleItem {
  id: string;
  matchdayId: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
  icon?: string;
  status: ScheduleStatus;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  promotionalLabel?: string;
  description?: string;
}

export interface Coupon {
  id: string;
  matchdayId: string;
  title: string;
  description: string;
  originalPrice?: number;
  offerPrice: number;
  active: boolean;
  activationDurationMinutes: number;
  maxRedemptions?: number;
  redemptionsCount: number;
  sponsor?: string;
  sponsorLogo?: string;
}

export interface CouponRedemption {
  id: string; // activation ID
  couponId: string;
  matchdayId: string;
  deviceId: string; // anonymous customer ID
  redemptionToken: string; // secure cryptographically random token
  tokenHash?: string;
  activatedAt: string;
  expiresAt: string;
  redeemed: boolean;
  redeemedAt?: string;
  redeemedByStaffId?: string;
  redeemedByStaffName?: string;
  status: 'active' | 'redeemed' | 'expired';
  redemptionCode?: string; // friendly backup reference code
}

export type StaffRole = 'ADMIN' | 'STAFF';

export interface StaffUser {
  id: string;
  name: string;
  pin: string;
  role: StaffRole;
  createdAt: string;
}

export interface RedemptionLogEntry {
  id: string;
  timestamp: string;
  couponId: string;
  couponTitle: string;
  staffId: string;
  staffName: string;
  status: 'success' | 'already_used' | 'expired' | 'invalid' | 'inactive_offer';
  deviceId: string;
  tokenPreview: string;
}

export interface Competition {
  id: string;
  name: string;
  description: string;
  scoringUnit: string;
  higherScoreWins: boolean;
  active: boolean;
  maxLeaderboardEntries: number;
  sponsor?: string;
}

export interface Score {
  id: string;
  competitionId: string;
  matchdayId: string;
  participantName: string;
  score: number;
  timestamp: string;
  isNewRecord?: boolean;
}

export type VotingSessionStatus = 'pending' | 'open' | 'closed';

export interface VotingSession {
  id: string;
  matchdayId: string;
  category: 'DAMER' | 'HERRER';
  title: string;
  status: VotingSessionStatus;
  sponsor?: string;
  sponsorLogo?: string;
  winnerPlayerId?: string;
  publicResultsEnabled?: boolean;
}

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  number: number;
  position: string;
  photoUrl?: string;
}

export interface Vote {
  id: string;
  sessionId: string;
  playerId: string;
  deviceId: string;
  timestamp: string;
}

export type SponsorCategory =
  | 'HOVEDSPONSOR'
  | 'AGF PLAY'
  | 'AGF MATCH'
  | 'AGF FORDEL'
  | 'ØVRIGE MATCHDAY-PARTNERE';

export interface Partner {
  id: string;
  name: string; // companyName
  companyName?: string;
  logo?: string; // logoUrl / logoAsset
  logoUrl?: string;
  websiteUrl?: string;
  category: SponsorCategory | string; // sponsorCategory
  sponsorCategory?: SponsorCategory;
  shortDescription?: string;
  message?: string;
  offer?: string;
  optionalMatchdayOffer?: string;
  active: boolean;
  sortOrder?: number;
  featured?: boolean;
  attachedTo?: string;
}

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export interface Announcement {
  id: string;
  matchdayId: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  active: boolean;
  createdAt: string;
}

export interface MatchdayDatabase {
  matchdays: Matchday[];
  activeMatchdayId: string;
  matches: Match[];
  schedule: ScheduleItem[];
  products: Product[];
  coupons: Coupon[];
  couponRedemptions: CouponRedemption[];
  competitions: Competition[];
  scores: Score[];
  votingSessions: VotingSession[];
  players: Player[];
  votes: Vote[];
  partners: Partner[];
  announcements: Announcement[];
  visits: number;
  adminPin: string;
  staffUsers?: StaffUser[];
  redemptionLogs?: RedemptionLogEntry[];
  canonicalAppUrl?: string;
}
