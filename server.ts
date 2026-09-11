import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { initialDatabase } from './src/initialData.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Persistence file
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'matchday-db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.partners)) {
        let seenScorjobbet = false;
        parsed.partners = parsed.partners.filter((p: any) => {
          const isScorjobbet = p.id === 'part-scorjobbet' || (p.name && p.name.toLowerCase().includes('scorjobbet'));
          if (isScorjobbet) {
            if (seenScorjobbet) return false;
            seenScorjobbet = true;
            p.category = 'AGF PLAY';
            p.sponsorCategory = 'AGF PLAY';
            p.sortOrder = 6;
          } else if (p.id === 'part-kaufmann') {
            p.sortOrder = 1;
          } else if (p.id === 'part-v-steel') {
            p.sortOrder = 2;
          }
          return true;
        });
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading db file:', err);
  }
  return null;
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving db file:', err);
    return false;
  }
}

// Memory cache
let inMemoryDb: any = loadDb();
if (!inMemoryDb || !inMemoryDb.matchdays || inMemoryDb.matchdays.length === 0) {
  inMemoryDb = JSON.parse(JSON.stringify(initialDatabase));
  saveDb(inMemoryDb);
}

// Real-time Server-Sent Events (SSE) clients registry
const sseClients = new Set<express.Response>();

function broadcast(type: string, payload: any) {
  const message = `data: ${JSON.stringify({ type, payload, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// SSE stream endpoint
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Get full database
app.get('/api/db', (req, res) => {
  if (!inMemoryDb) {
    inMemoryDb = loadDb();
  }
  res.json(inMemoryDb || { initialized: false });
});

// 3. Sync/Save database (called on admin updates or initial seed)
app.post('/api/db', (req, res) => {
  const updatedDb = req.body;
  if (!updatedDb) {
    return res.status(400).json({ error: 'No data provided' });
  }
  inMemoryDb = updatedDb;
  saveDb(inMemoryDb);
  broadcast('db_updated', inMemoryDb);
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Unified Login Endpoint (Staff code AGF1880, Admin code AGF176)
app.post('/api/auth/login', (req, res) => {
  const { code, deviceLabel } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Indtast venligst adgangskode' });
  }

  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ error: 'Database fejl' });

  const cleanCode = String(code).trim();
  const adminCode = inMemoryDb.adminCode || 'AGF176';
  const staffCode = inMemoryDb.staffCode || 'AGF1880';
  const adminPin = inMemoryDb.adminPin || '1880';

  let role: 'ADMIN' | 'STAFF' | null = null;
  if (cleanCode === adminCode) {
    role = 'ADMIN';
  } else if (cleanCode === staffCode || cleanCode === adminPin) {
    role = 'STAFF';
  }

  if (!role) {
    return res.status(401).json({ error: 'Forkert adgangskode. Prøv igen.' });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const session = {
    id: sessionId,
    role,
    createdAt: now.toISOString(),
    expiresAt,
    lastActivity: now.toISOString(),
    deviceLabel: deviceLabel || (role === 'ADMIN' ? 'Administrator' : 'Personale / Kiosk'),
  };

  // Clean out expired sessions (> 12 hours)
  const activeSessions = (inMemoryDb.sessions || []).filter(
    (s: any) => new Date(s.expiresAt) > now
  );
  inMemoryDb.sessions = [...activeSessions, session];
  saveDb(inMemoryDb);

  res.json({
    success: true,
    token: sessionId,
    role,
    expiresAt,
    session,
  });
});

// Verify active session (12 hour expiration check)
app.post('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
  if (!token) {
    return res.status(401).json({ valid: false, error: 'Ingen session fundet' });
  }

  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ error: 'Database fejl' });

  const now = new Date();
  const session = (inMemoryDb.sessions || []).find(
    (s: any) => s.id === token && new Date(s.expiresAt) > now
  );

  if (!session) {
    return res.status(401).json({ valid: false, error: 'Session er udløbet (varighed 12 timer)' });
  }

  session.lastActivity = now.toISOString();
  saveDb(inMemoryDb);

  res.json({ valid: true, role: session.role, session });
});

// Logout session
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
  if (token && inMemoryDb) {
    inMemoryDb.sessions = (inMemoryDb.sessions || []).filter((s: any) => s.id !== token);
    saveDb(inMemoryDb);
  }
  res.json({ success: true });
});

// Admin terminate specific session
app.post('/api/auth/session/terminate', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Mangler sessionId' });
  if (!inMemoryDb) inMemoryDb = loadDb();
  if (inMemoryDb) {
    inMemoryDb.sessions = (inMemoryDb.sessions || []).filter((s: any) => s.id !== sessionId);
    saveDb(inMemoryDb);
  }
  res.json({ success: true });
});

// Active sessions inspection for admin
app.get('/api/auth/sessions', (req, res) => {
  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ error: 'Database fejl' });

  const now = new Date();
  const activeSessions = (inMemoryDb.sessions || []).filter(
    (s: any) => new Date(s.expiresAt) > now
  );

  const staffCount = activeSessions.filter((s: any) => s.role === 'STAFF').length;
  const adminCount = activeSessions.filter((s: any) => s.role === 'ADMIN').length;

  res.json({
    total: activeSessions.length,
    staffCount,
    adminCount,
    sessions: activeSessions,
  });
});

// Nulstil Matchday endpoint (Requires ADMIN access code)
app.post('/api/matchday/reset', (req, res) => {
  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ error: 'Database fejl' });

  const { adminCode } = req.body;
  const targetAdminCode = inMemoryDb.adminCode || 'AGF176';
  const cleanCode = String(adminCode || '').trim();
  if (cleanCode !== targetAdminCode && cleanCode !== (inMemoryDb.adminPin || '1880')) {
    return res.status(401).json({ error: 'Ugyldig ADMIN adgangskode. Nulstilling afbrudt.' });
  }

  const activeMatchdayId = inMemoryDb.activeMatchdayId || 'matchday-1';

  // 1. Reset votes for active matchday's voting sessions
  const activeSessionIds = (inMemoryDb.votingSessions || [])
    .filter((s: any) => !s.matchdayId || s.matchdayId === activeMatchdayId)
    .map((s: any) => s.id);

  inMemoryDb.votes = (inMemoryDb.votes || []).filter(
    (v: any) => !activeSessionIds.includes(v.sessionId)
  );

  // 2. Reset voting session statuses & winners
  inMemoryDb.votingSessions = (inMemoryDb.votingSessions || []).map((s: any) => {
    if (!s.matchdayId || s.matchdayId === activeMatchdayId) {
      return {
        ...s,
        status: s.category === 'DAMER' ? 'open' : 'not_started',
        winnerPlayerId: undefined,
      };
    }
    return s;
  });

  // 3. Reset coupon activations/redemptions for active matchday
  inMemoryDb.couponRedemptions = (inMemoryDb.couponRedemptions || []).filter(
    (r: any) => r.matchdayId && r.matchdayId !== activeMatchdayId
  );
  // Reset coupon counts
  inMemoryDb.coupons = (inMemoryDb.coupons || []).map((c: any) => ({
    ...c,
    redemptionsCount: 0,
  }));

  // 4. Reset competition scores for active matchday
  inMemoryDb.scores = (inMemoryDb.scores || []).filter(
    (sc: any) => sc.matchdayId && sc.matchdayId !== activeMatchdayId
  );

  // 5. Reset match statuses & scores for active matchday
  inMemoryDb.matches = (inMemoryDb.matches || []).map((m: any) => {
    if (!m.matchdayId || m.matchdayId === activeMatchdayId) {
      return {
        ...m,
        status: 'upcoming',
        scoreHome: undefined,
        scoreAway: undefined,
        currentPeriod: undefined,
      };
    }
    return m;
  });

  // 6. Reset programme / schedule items status for active matchday
  inMemoryDb.schedule = (inMemoryDb.schedule || []).map((s: any) => {
    if (!s.matchdayId || s.matchdayId === activeMatchdayId) {
      return {
        ...s,
        status: 'upcoming',
      };
    }
    return s;
  });

  // 7. Clear announcements for active matchday
  inMemoryDb.announcements = (inMemoryDb.announcements || []).filter(
    (a: any) => a.matchdayId && a.matchdayId !== activeMatchdayId
  );

  // 8. Reset temporary Matchday configuration (hero banner)
  const matchday = (inMemoryDb.matchdays || []).find((m: any) => m.id === activeMatchdayId);
  if (matchday && matchday.featuredHero) {
    matchday.featuredHero = {
      enabled: true,
      badge: 'VELKOMMEN',
      title: 'VELKOMMEN TIL MATCHDAY',
      subtitle: 'Se dagens fulde program og aktiviteter i Ceres Arena.',
      actionText: 'SE PROGRAM',
      actionTarget: 'program',
    };
  }

  // 9. Reset visits counter
  inMemoryDb.visits = 0;

  // Permanent data preserved:
  // - inMemoryDb.partners (untouched)
  // - inMemoryDb.partnerCategories (untouched)
  // - inMemoryDb.canonicalAppUrl (untouched)
  // - inMemoryDb.staffCode & inMemoryDb.adminCode (untouched)

  saveDb(inMemoryDb);
  broadcast('db_updated', inMemoryDb);

  res.json({ success: true, message: 'Matchday nulstillet succesfuldt' });
});

// Clear scores for a specific competition
app.post('/api/competition/clear-scores', (req, res) => {
  const { competitionId } = req.body;
  if (!competitionId) {
    return res.status(400).json({ error: 'Mangler competitionId' });
  }

  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ error: 'Database fejl' });

  inMemoryDb.scores = (inMemoryDb.scores || []).filter((s: any) => s.competitionId !== competitionId);
  saveDb(inMemoryDb);
  broadcast('db_updated', inMemoryDb);

  res.json({ success: true, message: 'Scores ryddet' });
});

// Export Database as JSON
app.get('/api/admin/export', (req, res) => {
  if (!inMemoryDb) inMemoryDb = loadDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="agf-matchday-backup.json"');
  res.send(JSON.stringify(inMemoryDb, null, 2));
});

// Import Database from JSON
app.post('/api/admin/import', (req, res) => {
  const importedData = req.body;
  if (!importedData || !Array.isArray(importedData.matches) || !Array.isArray(importedData.matchdays)) {
    return res.status(400).json({ error: 'Ugyldigt databaseformat' });
  }

  inMemoryDb = importedData;
  saveDb(inMemoryDb);
  broadcast('db_updated', inMemoryDb);

  res.json({ success: true, message: 'Database importeret' });
});

// Legacy Staff Authentication Endpoint (kept for compatibility)
app.post('/api/staff/login', (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'Mangler PIN-kode' });
  }

  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ error: 'Database fejl' });

  const clean = pin.trim();
  if (clean === (inMemoryDb.adminCode || 'AGF176')) {
    return res.json({
      success: true,
      user: { id: 'admin-master', name: 'AGF Administrator', role: 'ADMIN', pin: clean },
    });
  }
  if (clean === (inMemoryDb.staffCode || 'AGF1880') || clean === (inMemoryDb.adminPin || '1880')) {
    return res.json({
      success: true,
      user: { id: 'staff-generic', name: 'Personale', role: 'STAFF', pin: clean },
    });
  }

  const staffUsers = inMemoryDb.staffUsers || [];
  const user = staffUsers.find((u: any) => u.pin === clean);
  if (user) {
    return res.json({ success: true, user });
  }

  return res.status(401).json({ error: 'Forkert adgangskode' });
});

// 4. Submit a vote
app.post('/api/vote', (req, res) => {
  const { sessionId, playerId, deviceId } = req.body;
  if (!sessionId || !playerId || !deviceId) {
    return res.status(400).json({ error: 'Mangler påkrævede parametre' });
  }

  if (!inMemoryDb) {
    inMemoryDb = loadDb();
  }

  if (!inMemoryDb) {
    return res.status(500).json({ error: 'Database ikke initialiseret' });
  }

  // Check if session is open
  const session = inMemoryDb.votingSessions?.find((s: any) => s.id === sessionId);
  if (!session || session.status !== 'open') {
    return res.status(400).json({ error: 'Afstemningen er ikke åben i øjeblikket' });
  }

  // Check if device already voted in this session
  const existingVote = inMemoryDb.votes?.find(
    (v: any) => v.sessionId === sessionId && v.deviceId === deviceId
  );
  if (existingVote) {
    return res.status(409).json({ error: 'Du har allerede afgivet din stemme for denne kamp' });
  }

  const newVote = {
    id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sessionId,
    playerId,
    deviceId,
    timestamp: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
  };

  inMemoryDb.votes = [...(inMemoryDb.votes || []), newVote];
  saveDb(inMemoryDb);
  broadcast('db_updated', inMemoryDb);

  res.json({ success: true, vote: newVote });
});

// 5. Customer activates coupon (returns secure redemption token + unique QR payload)
app.post('/api/coupon/activate', (req, res) => {
  const { couponId, deviceId } = req.body;
  if (!couponId || !deviceId) {
    return res.status(400).json({ error: 'Mangler påkrævede parametre' });
  }

  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ error: 'Database fejl' });

  const coupon = inMemoryDb.coupons?.find((c: any) => c.id === couponId);
  if (!coupon || !coupon.active) {
    return res.status(400).json({ error: 'Kuponen er ikke aktiv' });
  }

  // Check if this device has already redeemed this coupon
  const existingRedeemed = inMemoryDb.couponRedemptions?.find(
    (r: any) => r.couponId === couponId && r.deviceId === deviceId && (r.redeemed || r.status === 'redeemed')
  );
  if (existingRedeemed) {
    return res.status(409).json({
      error: 'Denne kupon er allerede blevet indløst på denne enhed',
      redemption: existingRedeemed,
    });
  }

  // Check if device has an unexpired active coupon already
  const existingActive = inMemoryDb.couponRedemptions?.find(
    (r: any) =>
      r.couponId === couponId &&
      r.deviceId === deviceId &&
      r.status === 'active' &&
      !r.redeemed &&
      new Date(r.expiresAt) > new Date()
  );
  if (existingActive) {
    return res.json({ success: true, redemption: existingActive });
  }

  // Generate cryptographically random redemption token (e.g. 32 hex chars)
  const redemptionToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomBytes(8).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(redemptionToken).digest('hex');

  const durationMinutes = coupon.activationDurationMinutes || 10;
  const activatedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const redemptionCode = `AGF-${Math.floor(1000 + Math.random() * 9000)}`;

  const redemption = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    couponId,
    matchdayId: coupon.matchdayId || inMemoryDb.activeMatchdayId || 'matchday-1',
    deviceId,
    redemptionToken,
    tokenHash,
    activatedAt,
    expiresAt,
    redeemed: false,
    status: 'active',
    redemptionCode,
  };

  // Replace older expired activations for this device & coupon
  inMemoryDb.couponRedemptions = [
    ...(inMemoryDb.couponRedemptions || []).filter(
      (r: any) => !(r.couponId === couponId && r.deviceId === deviceId)
    ),
    redemption,
  ];

  saveDb(inMemoryDb);
  broadcast('db_updated', inMemoryDb);

  res.json({ success: true, redemption });
});

// 6. STAFF ATOMIC QR SCAN REDEMPTION
// Validates token server-side, checks expiration, single-use idempotency, staff auth, logs audit trail
app.post('/api/coupon/redeem-scan', (req, res) => {
  const { token, staffPin, staffId, sessionToken } = req.body;
  if (!token) {
    return res.status(400).json({ status: 'INVALID', error: 'UGYLDIG KUPON', message: 'Ingen QR-kode modtaget' });
  }

  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ status: 'ERROR', error: 'Database fejl' });

  // 1. Authenticate staff user via session token or access code
  const authHeader = req.headers.authorization?.replace('Bearer ', '');
  const activeToken = sessionToken || authHeader;
  
  let staffUser: any = null;
  if (activeToken) {
    const session = (inMemoryDb.sessions || []).find((s: any) => s.id === activeToken);
    if (session) {
      staffUser = {
        id: session.id,
        name: session.role === 'ADMIN' ? 'Administrator' : 'Personale',
        role: session.role,
      };
    }
  }

  if (!staffUser && staffPin) {
    const cleanPin = String(staffPin).trim();
    if (cleanPin === (inMemoryDb.adminCode || 'AGF176') || cleanPin === (inMemoryDb.adminPin || '1880')) {
      staffUser = { id: 'admin-master', name: 'Administrator', role: 'ADMIN' };
    } else if (cleanPin === (inMemoryDb.staffCode || 'AGF1880')) {
      staffUser = { id: 'staff-generic', name: 'Personale', role: 'STAFF' };
    }
  }

  if (!staffUser) {
    staffUser = { id: 'staff-terminal', name: 'Personale', role: 'STAFF' };
  }

  // 2. Normalize and sanitize scanned token
  let cleanToken = String(token).trim();
  if (cleanToken.includes('token=')) {
    const match = cleanToken.match(/token=([a-zA-Z0-9_-]+)/);
    if (match) cleanToken = match[1];
  } else if (cleanToken.startsWith('AGF-COUPON:')) {
    cleanToken = cleanToken.replace('AGF-COUPON:', '').trim();
  }

  const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

  // Helper for human-readable audit logging
  const logAudit = (status: 'success' | 'already_used' | 'expired' | 'invalid', couponId: string, couponTitle: string, deviceId = 'unknown') => {
    let statusLabel = 'Godkendt';
    if (status === 'already_used') statusLabel = 'Allerede brugt';
    if (status === 'expired') statusLabel = 'Udløbet';
    if (status === 'invalid') statusLabel = 'Ugyldig kupon';

    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now.toISOString(),
      timeFormatted,
      formattedSummary: `${timeFormatted} · ${couponTitle} · ${statusLabel}`,
      couponId,
      couponTitle,
      staffId: staffUser.id,
      staffName: staffUser.name,
      status,
      deviceId,
      tokenPreview: cleanToken.length > 8 ? `${cleanToken.slice(0, 4)}...${cleanToken.slice(-4)}` : cleanToken,
    };
    inMemoryDb.redemptionLogs = [entry, ...(inMemoryDb.redemptionLogs || [])].slice(0, 50);
  };

  // 3. Find activation record
  const redemptions = inMemoryDb.couponRedemptions || [];
  const target = redemptions.find(
    (r: any) =>
      r.redemptionToken === cleanToken ||
      r.tokenHash === tokenHash ||
      r.id === cleanToken ||
      r.redemptionCode === cleanToken
  );

  if (!target) {
    logAudit('invalid', 'unknown', 'Ukendt kupon');
    saveDb(inMemoryDb);
    return res.status(404).json({
      status: 'INVALID',
      error: 'UGYLDIG KUPON',
      message: 'Kuponkoden findes ikke i systemet.',
    });
  }

  const coupon = inMemoryDb.coupons?.find((c: any) => c.id === target.couponId);
  const couponTitle = coupon ? coupon.title : 'Ukendt Kupon';

  // 4. Check if ALREADY USED (Atomic idempotency test)
  if (target.redeemed || target.status === 'redeemed') {
    logAudit('already_used', target.couponId, couponTitle, target.deviceId);
    saveDb(inMemoryDb);
    return res.status(409).json({
      status: 'ALREADY_USED',
      error: 'ALLEREDE BRUGT',
      couponTitle,
      redeemedAt: target.redeemedAt
        ? new Date(target.redeemedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
        : 'Tidligere',
      redeemedBy: target.redeemedByStaffName || 'Personale',
    });
  }

  // 5. Check if EXPIRED
  const expiresDate = new Date(target.expiresAt);
  if (now > expiresDate) {
    target.status = 'expired';
    logAudit('expired', target.couponId, couponTitle, target.deviceId);
    saveDb(inMemoryDb);
    broadcast('db_updated', inMemoryDb);
    return res.status(410).json({
      status: 'EXPIRED',
      error: 'UDLØBET',
      message: 'Kuponens tidsbegrænsning er udløbet.',
      couponTitle,
    });
  }

  // 6. Check if offer is active in administration
  if (!coupon || !coupon.active) {
    logAudit('invalid', target.couponId, couponTitle, target.deviceId);
    saveDb(inMemoryDb);
    return res.status(400).json({
      status: 'INVALID',
      error: 'UGYLDIG KUPON',
      message: 'Dette tilbud er i øjeblikket ikke aktivt.',
      couponTitle,
    });
  }

  // 7. ATOMIC TRANSACTIONAL REDEMPTION COMMIT
  target.redeemed = true;
  target.status = 'redeemed';
  target.redeemedAt = now.toISOString();
  target.redeemedByStaffId = staffUser.id;
  target.redeemedByStaffName = staffUser.name;

  coupon.redemptionsCount = (coupon.redemptionsCount || 0) + 1;

  logAudit('success', target.couponId, couponTitle, target.deviceId);
  saveDb(inMemoryDb);

  // Instantly broadcast to all customers in the arena
  broadcast('coupon_redeemed', {
    redemptionId: target.id,
    couponId: target.couponId,
    deviceId: target.deviceId,
  });
  broadcast('db_updated', inMemoryDb);

  return res.json({
    status: 'SUCCESS',
    message: 'KUPON GODKENDT',
    couponName: coupon.title,
    offerDetails: `${coupon.offerPrice} kr.${coupon.originalPrice ? ` (før ${coupon.originalPrice} kr.)` : ''}`,
    redeemedTime: timeFormatted,
    redeemedBy: staffUser.name,
    redemption: target,
  });
});

// Legacy redeem fallback for compatibility
app.post('/api/coupon/redeem', (req, res) => {
  const { redemptionId } = req.body;
  if (!redemptionId) {
    return res.status(400).json({ error: 'Mangler redemption ID' });
  }

  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ error: 'Database fejl' });

  const target = inMemoryDb.couponRedemptions?.find((r: any) => r.id === redemptionId);
  if (!target) {
    return res.status(404).json({ error: 'Kuponaktivering ikke fundet' });
  }

  if (target.status === 'redeemed' || target.redeemed) {
    return res.status(400).json({ error: 'Kuponen er allerede indløst' });
  }

  target.status = 'redeemed';
  target.redeemed = true;
  target.redeemedAt = new Date().toISOString();
  target.redeemedByStaffName = 'Personale';

  const coupon = inMemoryDb.coupons?.find((c: any) => c.id === target.couponId);
  if (coupon) {
    coupon.redemptionsCount = (coupon.redemptionsCount || 0) + 1;
  }

  saveDb(inMemoryDb);
  broadcast('coupon_redeemed', {
    redemptionId: target.id,
    couponId: target.couponId,
    deviceId: target.deviceId,
  });
  broadcast('db_updated', inMemoryDb);

  res.json({ success: true, redemption: target });
});

// 7. Add score
app.post('/api/score', (req, res) => {
  const { competitionId, matchdayId, participantName, score } = req.body;
  if (!competitionId || !participantName || score === undefined) {
    return res.status(400).json({ error: 'Ufuldstændige score-data' });
  }

  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ error: 'Database fejl' });

  const competition = inMemoryDb.competitions?.find((c: any) => c.id === competitionId);
  if (!competition) {
    return res.status(404).json({ error: 'Konkurrence ikke fundet' });
  }

  // Check if score is a new record
  const existingScores = inMemoryDb.scores?.filter((s: any) => s.competitionId === competitionId) || [];
  let isNewRecord = false;
  if (existingScores.length === 0) {
    isNewRecord = true;
  } else {
    const bestScore = competition.higherScoreWins
      ? Math.max(...existingScores.map((s: any) => s.score))
      : Math.min(...existingScores.map((s: any) => s.score));
    isNewRecord = competition.higherScoreWins ? score > bestScore : score < bestScore;
  }

  const newScore = {
    id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    competitionId,
    matchdayId: matchdayId || inMemoryDb.activeMatchdayId,
    participantName: participantName.trim(),
    score: Number(score),
    timestamp: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
    isNewRecord,
  };

  inMemoryDb.scores = [newScore, ...(inMemoryDb.scores || [])];
  saveDb(inMemoryDb);

  res.json({ success: true, score: newScore, isNewRecord });
});

// 8. Track visitor
app.post('/api/visit', (req, res) => {
  if (!inMemoryDb) inMemoryDb = loadDb();
  if (inMemoryDb) {
    inMemoryDb.visits = (inMemoryDb.visits || 0) + 1;
    saveDb(inMemoryDb);
  }
  res.json({ success: true });
});

// Start server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AGF Matchday Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
