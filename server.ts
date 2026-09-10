import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

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

// Staff Authentication Endpoint
app.post('/api/staff/login', (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'Mangler PIN-kode' });
  }

  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ error: 'Database fejl' });

  const staffUsers = inMemoryDb.staffUsers || [];
  // Match user by PIN
  let user = staffUsers.find((u: any) => u.pin === pin.trim());

  // Master admin fallback PIN check
  if (!user && (pin.trim() === (inMemoryDb.adminPin || '1880'))) {
    user = {
      id: 'admin-master',
      name: 'AGF Administrator',
      role: 'ADMIN',
      pin: inMemoryDb.adminPin || '1880',
    };
  }

  if (!user) {
    return res.status(401).json({ error: 'Forkert PIN-kode' });
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      pin: user.pin,
    },
  });
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
  const { token, staffPin, staffId } = req.body;
  if (!token) {
    return res.status(400).json({ status: 'INVALID', error: 'UGYLDIG KUPON', message: 'Ingen QR-kode modtaget' });
  }

  if (!inMemoryDb) inMemoryDb = loadDb();
  if (!inMemoryDb) return res.status(500).json({ status: 'ERROR', error: 'Database fejl' });

  // 1. Authenticate staff user
  const staffUsers = inMemoryDb.staffUsers || [];
  let staffUser = staffUsers.find((u: any) => u.pin === staffPin);
  if (!staffUser && staffPin === (inMemoryDb.adminPin || '1880')) {
    staffUser = { id: 'admin-master', name: 'AGF Administrator', role: 'ADMIN', pin: inMemoryDb.adminPin || '1880' };
  }
  if (!staffUser && staffId) {
    staffUser = staffUsers.find((u: any) => u.id === staffId);
  }

  if (!staffUser) {
    return res.status(401).json({ status: 'UNAUTHORIZED', error: 'Ugyldig medarbejder-adgang' });
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

  // Helper for audit logging
  const logAudit = (status: string, couponId: string, couponTitle: string, deviceId = 'unknown') => {
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now.toISOString(),
      couponId,
      couponTitle,
      staffId: staffUser.id,
      staffName: staffUser.name,
      status,
      deviceId,
      tokenPreview: cleanToken.length > 8 ? `${cleanToken.slice(0, 4)}...${cleanToken.slice(-4)}` : cleanToken,
    };
    inMemoryDb.redemptionLogs = [entry, ...(inMemoryDb.redemptionLogs || [])];
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
      error: 'KUPON ALLEREDE BRUGT',
      couponTitle,
      redeemedAt: target.redeemedAt
        ? new Date(target.redeemedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Tidligere',
      redeemedBy: target.redeemedByStaffName || 'Kioskvagt',
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
      error: 'KUPON UDLØBET',
      message: 'Kuponens tidsbegrænsning er udløbet.',
      couponTitle,
    });
  }

  // 6. Check if offer is active in administration
  if (!coupon || !coupon.active) {
    logAudit('inactive_offer', target.couponId, couponTitle, target.deviceId);
    saveDb(inMemoryDb);
    return res.status(400).json({
      status: 'INACTIVE_OFFER',
      error: 'TILBUDDET ER IKKE AKTIVT',
      message: 'Dette tilbud er i øjeblikket deaktiveret i administrationen.',
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
    message: '✓ KUPON GODKENDT',
    couponName: coupon.title,
    offerDetails: `${coupon.offerPrice} kr.${coupon.originalPrice ? ` (før ${coupon.originalPrice} kr.)` : ''}`,
    redeemedTime: now.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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
