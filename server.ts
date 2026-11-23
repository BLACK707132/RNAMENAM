import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';

interface AccountSave {
  coins: number;
  bestRun: number;
  own: string[];
  cur: string;
  vesc?: string[];
  helmets: string[];
  curH: string;
  outfits: string[];
  curO: string;
  vip?: boolean;
  paints?: Record<string, { primary?: string; secondary?: string }>;
  lights?: string[];
  curLight?: string;
  motors?: string[];
  flipped?: string[];
}

interface StoredAccount {
  id: string;
  username: string;
  usernameLower: string;
  passwordHash: string;
  salt: string;
  save: AccountSave;
  pendingCoinsSync?: number;
  pendingFullReset?: boolean;
  kickedAt?: number;
  kickUntil?: number;
  kickReason?: string;
  kickedBy?: string;
  createdAt: number;
  updatedAt: number;
}

interface AdminLoginLog {
  id: string;
  username: string;
  walletId: string;
  timestamp: number;
  device: string;
}

interface StoredCustomPromo {
  code: string;
  coins: number;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  createdAt: number;
}

type AdminRole = 'owner' | 'moderator' | 'helper' | 'tester';

interface BugTicketReply {
  id: string;
  adminName: string;
  adminRole: AdminRole;
  adminRoleLabel: string;
  text: string;
  timestamp: number;
}

interface StoredBugTicket {
  id: string;
  userId?: string;
  clientId?: string;
  username: string;
  category: 'bug' | 'help' | 'idea';
  text: string;
  scooter: string;
  device: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: number;
  updatedAt: number;
  replies: BugTicketReply[];
}

interface RedeemedCheckEntry {
  amount: number;
  targetWallet: string;
  claimedBy: string;
  claimedAt: number;
}

interface DatabaseSchema {
  secret: string;
  accounts: StoredAccount[];
  adminLogs: AdminLoginLog[];
  promos: StoredCustomPromo[];
  bugTickets: StoredBugTicket[];
  redeemedChecks: Record<string, RedeemedCheckEntry>;
  totalVisits: number;
  visitedClientIds: string[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'blackstant-db.json');

const ADMIN_PASS_1 = 'BLACK7772';
const ADMIN_PASS_2 = 'B7772';

interface StaffDefinition {
  id: string;
  displayName: string;
  aliases: string[];
  password: string | null;
  role: AdminRole;
  roleLabel: string;
}

const STAFF_ROSTER: StaffDefinition[] = [
  {
    id: 'black',
    displayName: 'BLACK',
    aliases: ['black', 'blackda4k'],
    password: ADMIN_PASS_1,
    role: 'owner',
    roleLabel: 'Главный админ · Создатель',
  },
  {
    id: 'shampyr',
    displayName: 'Shampyr',
    aliases: ['shampyr', 'shampyp'],
    password: 'yfyfyyfy',
    role: 'moderator',
    roleLabel: 'Модератор · Тестер · Помощник',
  },
  {
    id: 'stantf1',
    displayName: 'StantF1',
    aliases: ['stantf1'],
    password: 'sixseven52',
    role: 'helper',
    roleLabel: 'Помощник · Тестер',
  },
  {
    id: 'bmx_pidar',
    displayName: 'BMX_PIDAR',
    aliases: ['bmx_pidar', 'bmxer_pidor', 'bmx_pidor', 'bmxer_pidar'],
    password: '03082016',
    role: 'tester',
    roleLabel: 'Тестер',
  },
  {
    id: 'romanon',
    displayName: 'Romanon',
    aliases: ['romanon'],
    password: '123o45po',
    role: 'tester',
    roleLabel: 'Тестер',
  },
];

const ADMIN_ONLINE_TTL_MS = 95_000;
const adminPresence = new Map<
  string,
  { id: string; displayName: string; role: AdminRole; roleLabel: string; lastSeen: number }
>();

function touchAdminPresence(staffId: string) {
  const def = STAFF_ROSTER.find((s) => s.id === staffId);
  if (!def || !def.password) return;
  adminPresence.set(def.id, {
    id: def.id,
    displayName: def.displayName,
    role: def.role,
    roleLabel: def.roleLabel,
    lastSeen: Date.now(),
  });
}

function getStaffOnlineStatus() {
  const now = Date.now();
  return STAFF_ROSTER.filter((s) => Boolean(s.password)).map((s) => {
    const p = adminPresence.get(s.id);
    const online = Boolean(p && now - p.lastSeen <= ADMIN_ONLINE_TTL_MS);
    return {
      id: s.id,
      displayName: s.displayName,
      role: s.role,
      roleLabel: s.roleLabel,
      online,
      lastSeen: p?.lastSeen ?? 0,
    };
  });
}

const PLAYER_ONLINE_TTL_MS = 95_000;
const playerPresence = new Map<
  string,
  { key: string; userId?: string; username?: string; scooter: string; lastSeen: number }
>();

function prunePlayerPresence(now = Date.now()) {
  for (const [k, v] of playerPresence.entries()) {
    if (now - v.lastSeen > PLAYER_ONLINE_TTL_MS) {
      playerPresence.delete(k);
    }
  }
}

function getReqFallbackVisitorKey(req: express.Request): string {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = fwd || req.ip || 'unknown';
  const ua = String(req.headers['user-agent'] || '');
  const hash = crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 20);
  return `ip:${hash}`;
}

function touchPlayerPresence(opts: {
  userId?: string;
  username?: string;
  clientId?: string;
  fallbackKey?: string;
  scooter?: string;
}) {
  const now = Date.now();
  const cleanClient = typeof opts.clientId === 'string' ? opts.clientId.trim().slice(0, 64) : '';
  const cleanScooter = typeof opts.scooter === 'string' ? opts.scooter.trim().slice(0, 40) : '';
  if (opts.userId) {
    if (cleanClient) {
      playerPresence.delete(`c:${cleanClient}`);
    }
    if (opts.fallbackKey) {
      playerPresence.delete(opts.fallbackKey);
    }
    const existing = playerPresence.get(`u:${opts.userId}`);
    playerPresence.set(`u:${opts.userId}`, {
      key: `u:${opts.userId}`,
      userId: opts.userId,
      username: opts.username || existing?.username,
      scooter: cleanScooter || existing?.scooter || '',
      lastSeen: now,
    });
  } else if (cleanClient) {
    if (opts.fallbackKey) {
      playerPresence.delete(opts.fallbackKey);
    }
    const existing = playerPresence.get(`c:${cleanClient}`);
    playerPresence.set(`c:${cleanClient}`, {
      key: `c:${cleanClient}`,
      scooter: cleanScooter || existing?.scooter || '',
      lastSeen: now,
    });
  } else if (opts.fallbackKey) {
    const existing = playerPresence.get(opts.fallbackKey);
    playerPresence.set(opts.fallbackKey, {
      key: opts.fallbackKey,
      scooter: cleanScooter || existing?.scooter || '',
      lastSeen: now,
    });
  }
}

function getOnlinePlayerStats() {
  const now = Date.now();
  prunePlayerPresence(now);
  const onlineUserIds = new Set<string>();
  for (const v of playerPresence.values()) {
    if (v.userId && now - v.lastSeen <= PLAYER_ONLINE_TTL_MS) {
      onlineUserIds.add(v.userId);
    }
  }
  return {
    onlinePlayersCount: playerPresence.size,
    onlineUsersCount: onlineUserIds.size,
    onlineUserIds,
  };
}

function ensureDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      if (parsed && typeof parsed.secret === 'string' && Array.isArray(parsed.accounts)) {
        const redeemedChecks =
          parsed.redeemedChecks && typeof parsed.redeemedChecks === 'object' && !Array.isArray(parsed.redeemedChecks)
            ? (parsed.redeemedChecks as Record<string, RedeemedCheckEntry>)
            : {};
        const visitedClientIds = Array.isArray(parsed.visitedClientIds)
          ? parsed.visitedClientIds.filter((x): x is string => typeof x === 'string').slice(-50000)
          : [];
        const rawVisits =
          typeof parsed.totalVisits === 'number' && Number.isFinite(parsed.totalVisits)
            ? Math.floor(parsed.totalVisits)
            : 0;
        const totalVisits = Math.max(1, rawVisits, parsed.accounts.length, visitedClientIds.length);
        return {
          secret: parsed.secret,
          accounts: parsed.accounts,
          adminLogs: Array.isArray(parsed.adminLogs) ? parsed.adminLogs : [],
          promos: Array.isArray(parsed.promos) ? parsed.promos : [],
          bugTickets: Array.isArray(parsed.bugTickets) ? parsed.bugTickets : [],
          redeemedChecks,
          totalVisits,
          visitedClientIds,
        };
      }
    }
  } catch (err) {
    console.error('[DB] Failed to load database, initializing fresh:', err);
  }
  const fresh: DatabaseSchema = {
    secret: crypto.randomBytes(32).toString('hex'),
    accounts: [],
    adminLogs: [],
    promos: [],
    bugTickets: [],
    redeemedChecks: {},
    totalVisits: 1,
    visitedClientIds: [],
  };
  saveDb(fresh);
  return fresh;
}

function saveDb(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.error('[DB] Failed to persist database:', err);
  }
}

const db = ensureDb();

function registerVisitor(visitorKey: string): boolean {
  const clean = visitorKey.trim().slice(0, 80);
  if (!clean) return false;
  if (db.visitedClientIds.includes(clean)) return false;
  db.visitedClientIds.push(clean);
  if (db.visitedClientIds.length > 50000) {
    db.visitedClientIds = db.visitedClientIds.slice(-50000);
  }
  db.totalVisits = Math.max(db.totalVisits + 1, db.accounts.length, db.visitedClientIds.length);
  saveDb(db);
  return true;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const derived = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function signToken(accountId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ id: accountId, iat: Date.now() }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', db.secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyTokenPayload(token: string): { id: string; iat: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', db.secret)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      id?: string;
      iat?: number;
    };
    if (typeof decoded.id !== 'string') return null;
    return { id: decoded.id, iat: typeof decoded.iat === 'number' ? decoded.iat : 0 };
  } catch {
    return null;
  }
}

interface AdminSessionPayload {
  staffId: string;
  actor: string;
  role: AdminRole;
  roleLabel: string;
}

function signAdminToken(staffId: string, actor: string, role: AdminRole, roleLabel: string): string {
  const payload = Buffer.from(
    JSON.stringify({ kind: 'admin', staffId, actor, role, roleLabel, iat: Date.now() }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', db.secret)
    .update(`adm:${payload}`)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): AdminSessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', db.secret)
    .update(`adm:${payload}`)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      kind?: string;
      role?: string;
      staffId?: string;
      actor?: string;
      roleLabel?: string;
    };
    // Support legacy owner tokens issued before multi-admin upgrade
    if (decoded.role === 'admin' && !decoded.kind) {
      return {
        staffId: 'black',
        actor: 'BLACK',
        role: 'owner',
        roleLabel: 'Главный админ · Создатель',
      };
    }
    if (
      decoded.kind === 'admin' &&
      (decoded.role === 'owner' ||
        decoded.role === 'moderator' ||
        decoded.role === 'helper' ||
        decoded.role === 'tester') &&
      typeof decoded.staffId === 'string' &&
      typeof decoded.actor === 'string'
    ) {
      return {
        staffId: decoded.staffId,
        actor: decoded.actor,
        role: decoded.role,
        roleLabel: decoded.roleLabel || 'Администратор',
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getAdminSession(req: express.Request): AdminSessionPayload | null {
  const token = String(req.headers['x-admin-token'] || '').trim();
  if (!token) return null;
  const session = verifyAdminToken(token);
  if (session) {
    touchAdminPresence(session.staffId);
  }
  return session;
}

function isBlackOwner(session: AdminSessionPayload | null): boolean {
  return Boolean(session && session.staffId === 'black' && session.role === 'owner');
}

function parseDeviceLabel(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Браузер';
}

function sanitizeSave(raw: unknown, preserveVip?: boolean): AccountSave {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<AccountSave>;
  const coins =
    typeof s.coins === 'number' && Number.isFinite(s.coins)
      ? Math.max(0, Math.min(999_999_999, Math.floor(s.coins)))
      : 0;
  const bestRun =
    typeof s.bestRun === 'number' && Number.isFinite(s.bestRun)
      ? Math.max(0, Math.min(999_999_999, Math.floor(s.bestRun)))
      : 0;
  const own = Array.isArray(s.own)
    ? Array.from(new Set(s.own.filter((x): x is string => typeof x === 'string'))).slice(0, 30)
    : ['c3'];
  if (!own.includes('c3')) own.unshift('c3');
  const cur = typeof s.cur === 'string' && own.includes(s.cur) ? s.cur : 'c3';

  const helmets = Array.isArray(s.helmets)
    ? Array.from(new Set(s.helmets.filter((x): x is string => typeof x === 'string'))).slice(0, 30)
    : ['mx_start'];
  if (!helmets.includes('mx_start')) helmets.unshift('mx_start');
  const curH = typeof s.curH === 'string' && helmets.includes(s.curH) ? s.curH : 'mx_start';

  const outfits = Array.isArray(s.outfits)
    ? Array.from(new Set(s.outfits.filter((x): x is string => typeof x === 'string'))).slice(0, 30)
    : ['black_stant', 'street_white'];
  if (!outfits.includes('black_stant')) outfits.unshift('black_stant');
  const curO = typeof s.curO === 'string' && outfits.includes(s.curO) ? s.curO : 'black_stant';

  const vesc = Array.isArray(s.vesc)
    ? Array.from(new Set(s.vesc.filter((x): x is string => typeof x === 'string'))).slice(0, 30)
    : [];

  const vip = typeof preserveVip === 'boolean' ? preserveVip : Boolean(s.vip);
  const paints: Record<string, { primary?: string; secondary?: string }> = {};
  if (s.paints && typeof s.paints === 'object') {
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    for (const [k, v] of Object.entries(s.paints).slice(0, 30)) {
      if (!v || typeof v !== 'object') continue;
      const p = typeof v.primary === 'string' && hexRe.test(v.primary) ? v.primary : undefined;
      const sec = typeof v.secondary === 'string' && hexRe.test(v.secondary) ? v.secondary : undefined;
      if (p || sec) {
        paints[k] = { ...(p ? { primary: p } : {}), ...(sec ? { secondary: sec } : {}) };
      }
    }
  }

  const validLights = new Set([
    'stock',
    'amber',
    'xenon',
    'cyan',
    'lime',
    'purple',
    'red',
    'pink',
    'gold',
  ]);
  const lights = Array.isArray(s.lights)
    ? Array.from(
        new Set(s.lights.filter((x): x is string => typeof x === 'string' && validLights.has(x)))
      ).slice(0, 20)
    : ['stock'];
  if (!lights.includes('stock')) lights.unshift('stock');
  const curLight =
    typeof s.curLight === 'string' && lights.includes(s.curLight) ? s.curLight : 'stock';

  const motors = Array.isArray(s.motors)
    ? Array.from(new Set(s.motors.filter((x): x is string => typeof x === 'string'))).slice(0, 30)
    : [];

  return {
    coins,
    bestRun,
    own,
    cur,
    vesc,
    helmets,
    curH,
    outfits,
    curO,
    vip,
    paints,
    lights,
    curLight,
    motors,
  };
}

function getAuthCheck(req: express.Request): {
  account: StoredAccount | null;
  kicked?: { reason: string; by: string; until: number };
} {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { account: null };
  const verified = verifyTokenPayload(match[1].trim());
  if (!verified) return { account: null };
  const acc = db.accounts.find((a) => a.id === verified.id) ?? null;
  if (!acc) return { account: null };

  const now = Date.now();
  const isTimedBan = typeof acc.kickUntil === 'number' && acc.kickUntil > now;
  const isTokenKicked = typeof acc.kickedAt === 'number' && verified.iat < acc.kickedAt;
  if (isTimedBan || isTokenKicked) {
    return {
      account: null,
      kicked: {
        reason: acc.kickReason || 'Нарушение правил игры',
        by: acc.kickedBy || 'Администратор',
        until: isTimedBan ? acc.kickUntil! : 0,
      },
    };
  }
  touchPlayerPresence({ userId: acc.id, username: acc.username });
  return { account: acc };
}

function getAuthAccount(req: express.Request): StoredAccount | null {
  return getAuthCheck(req).account;
}

const USERNAME_REGEX = /^[a-zA-Z0-9а-яА-ЯёЁ_-]{3,18}$/;

function getFreshSave(): AccountSave {
  return {
    coins: 0,
    bestRun: 0,
    own: ['c3'],
    cur: 'c3',
    vesc: [],
    helmets: ['mx_start'],
    curH: 'mx_start',
    outfits: ['black_stant', 'street_white'],
    curO: 'black_stant',
    vip: false,
    paints: {},
    lights: ['stock'],
    curLight: 'stock',
    motors: [],
  };
}



// ── Server-side Transfer Check Verification (enforces strictly 1 global activation) ──
const TRANSFER_MAX_AMOUNT = 50_000_000;
const TRANSFER_PEPPER_A = 'BS_OFFLINE_TX_V1_95K_ALPHA';
const TRANSFER_PEPPER_B = 'STANT_WHEELIE_LIFE_CHECK_77';
const TRANSFER_CODE_RE = /\b(BS1-(?:ALL|[A-Z0-9]{6})-[A-Z0-9]{1,8}-[A-Z0-9]{4}-[A-Z0-9]{6})\b/i;

function transferHash32(input: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0x85ebca6b) >>> 0;
  }
  h ^= h >>> 16;
  return h >>> 0;
}

function computeTransferSignature(target: string, amt36: string, nonce: string): string {
  const payload = `BS1|${target}|${amt36}|${nonce}`;
  const h1 = transferHash32(`${payload}|${TRANSFER_PEPPER_A}`, 0x811c9dc5);
  const h2 = transferHash32(`${TRANSFER_PEPPER_B}|${payload}|${h1.toString(36)}`, 0x243f6a88);
  const p1 = (h1 % 46656).toString(36).toUpperCase().padStart(3, '0');
  const p2 = (h2 % 46656).toString(36).toUpperCase().padStart(3, '0');
  return `${p1}${p2}`;
}

function verifyTransferCheckCode(rawInput: string): {
  code: string;
  targetWallet: string;
  amount: number;
  nonce: string;
  sig: string;
  key: string;
} | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      const claimParam =
        url.searchParams.get('claim') || url.searchParams.get('code') || url.searchParams.get('tx');
      if (claimParam) candidate = claimParam;
    }
  } catch {
    // Fall through to regex extraction
  }
  const normalized = candidate.replace(/\s*-\s*/g, '-').toUpperCase();
  const match = normalized.match(TRANSFER_CODE_RE) || trimmed.toUpperCase().match(TRANSFER_CODE_RE);
  if (!match) return null;
  const code = match[1].toUpperCase();
  const parts = code.split('-');
  if (parts.length !== 5 || parts[0] !== 'BS1') return null;
  const [, targetWallet, amt36, nonce, sig] = parts;
  if (sig !== computeTransferSignature(targetWallet, amt36, nonce)) return null;
  const amount = parseInt(amt36, 36);
  if (!Number.isFinite(amount) || amount <= 0 || amount > TRANSFER_MAX_AMOUNT) return null;
  return {
    code,
    targetWallet,
    amount,
    nonce,
    sig,
    key: `${nonce}:${sig}`,
  };
}

async function startServer() {
  const app = express();
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json({ limit: '1mb' }));

  // Live availability check for username (@юз) during registration
  app.get('/api/auth/check-username', (req, res) => {
    const rawUser =
      typeof req.query.username === 'string'
        ? req.query.username.trim().replace(/^@+/, '')
        : '';
    const valid = USERNAME_REGEX.test(rawUser);
    const exists = valid && db.accounts.some((a) => a.usernameLower === rawUser.toLowerCase());
    res.json({ ok: true, valid, exists });
  });

  // Register a new account with username (юз) + password
  app.post('/api/auth/register', (req, res) => {
    const rawUser = typeof req.body?.username === 'string' ? req.body.username.trim().replace(/^@+/, '') : '';
    const rawPass = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!USERNAME_REGEX.test(rawUser)) {
      res.status(400).json({
        error: 'Юз должен быть от 3 до 18 символов (буквы, цифры, _ или -).',
      });
      return;
    }
    if (rawPass.length < 4 || rawPass.length > 64) {
      res.status(400).json({
        error: 'Пароль должен быть от 4 до 64 символов.',
      });
      return;
    }

    const lower = rawUser.toLowerCase();
    if (db.accounts.some((a) => a.usernameLower === lower)) {
      res.status(409).json({
        error: 'Этот юз уже существует! Выбери другой или войди в аккаунт.',
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const account: StoredAccount = {
      id: crypto.randomBytes(12).toString('hex'),
      username: rawUser,
      usernameLower: lower,
      passwordHash: hashPassword(rawPass, salt),
      salt,
      save: sanitizeSave(req.body?.save, false),
      createdAt: now,
      updatedAt: now,
    };

    db.accounts.push(account);
    registerVisitor(`u:${account.id}`);
    saveDb(db);

    const token = signToken(account.id);
    res.json({
      token,
      user: {
        id: account.id,
        username: account.username,
      },
      save: account.save,
    });
  });

  // Login with username (юз) + password
  app.post('/api/auth/login', (req, res) => {
    const rawUser = typeof req.body?.username === 'string' ? req.body.username.trim().replace(/^@+/, '') : '';
    const rawPass = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!rawUser || !rawPass) {
      res.status(400).json({ error: 'Введи юз и пароль.' });
      return;
    }

    const account = db.accounts.find((a) => a.usernameLower === rawUser.toLowerCase());
    if (!account || !verifyPassword(rawPass, account.salt, account.passwordHash)) {
      res.status(401).json({ error: 'Неверный юз или пароль.' });
      return;
    }

    if (typeof account.kickUntil === 'number' && account.kickUntil > Date.now()) {
      const minsLeft = Math.max(1, Math.ceil((account.kickUntil - Date.now()) / 60_000));
      res.status(403).json({
        kicked: true,
        error: `Тебя кикнул админ ${account.kickedBy || 'Администратор'}. Причина: ${account.kickReason || 'Нарушение правил'}. Подожди ${minsLeft} мин.`,
        kickReason: account.kickReason || 'Нарушение правил',
        kickedBy: account.kickedBy || 'Администратор',
        kickUntil: account.kickUntil,
      });
      return;
    }

    const token = signToken(account.id);
    res.json({
      token,
      user: {
        id: account.id,
        username: account.username,
      },
      save: account.save,
    });
  });

  // Validate session token & fetch current profile
  app.get('/api/auth/me', (req, res) => {
    const check = getAuthCheck(req);
    if (check.kicked) {
      res.status(403).json({
        kicked: true,
        error: `Тебя кикнул админ ${check.kicked.by}: ${check.kicked.reason}`,
        kickReason: check.kicked.reason,
        kickedBy: check.kicked.by,
        kickUntil: check.kicked.until,
      });
      return;
    }
    const account = check.account;
    if (!account) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }
    let coinsOverride: number | undefined;
    let saveOverride: AccountSave | undefined;
    if (account.pendingFullReset) {
      saveOverride = account.save;
      delete account.pendingFullReset;
      delete account.pendingCoinsSync;
      saveDb(db);
    } else if (typeof account.pendingCoinsSync === 'number') {
      coinsOverride = account.pendingCoinsSync;
      account.save.coins = coinsOverride;
      delete account.pendingCoinsSync;
      saveDb(db);
    }
    res.json({
      user: {
        id: account.id,
        username: account.username,
      },
      save: account.save,
      ...(typeof coinsOverride === 'number' ? { coinsOverride } : {}),
      ...(saveOverride ? { saveOverride } : {}),
    });
  });

  // Self-delete account & wipe leaderboard presence
  app.delete('/api/auth/me', (req, res) => {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }
    const verified = verifyTokenPayload(match[1].trim());
    if (!verified) {
      res.status(401).json({ error: 'Сессия недействительна' });
      return;
    }
    const idx = db.accounts.findIndex((a) => a.id === verified.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Аккаунт не найден' });
      return;
    }
    const [removed] = db.accounts.splice(idx, 1);
    playerPresence.delete(`u:${removed.id}`);
    saveDb(db);
    res.json({ ok: true, deletedUsername: removed.username });
  });

  // Sync player coins, best run & garage to account + Wealth Leaderboard
  app.post('/api/profile/sync', (req, res) => {
    const check = getAuthCheck(req);
    if (check.kicked) {
      res.status(403).json({
        kicked: true,
        error: `Тебя кикнул админ ${check.kicked.by}: ${check.kicked.reason}`,
        kickReason: check.kicked.reason,
        kickedBy: check.kicked.by,
        kickUntil: check.kicked.until,
      });
      return;
    }
    const account = check.account;
    if (!account) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }
    // If admin triggered a full account reset, enforce it instead of accepting stale client save
    if (account.pendingFullReset) {
      const resetSave = account.save;
      delete account.pendingFullReset;
      delete account.pendingCoinsSync;
      account.updatedAt = Date.now();
      saveDb(db);
      res.json({
        ok: true,
        vip: Boolean(resetSave.vip),
        saveOverride: resetSave,
      });
      return;
    }
    // Preserve server-authoritative VIP flag and pending admin coin adjustments
    const currentVip = Boolean(account.save.vip);
    const pendingCoins = account.pendingCoinsSync;
    account.save = sanitizeSave(req.body?.save, currentVip);
    let coinsOverride: number | undefined;
    if (typeof pendingCoins === 'number') {
      account.save.coins = pendingCoins;
      coinsOverride = pendingCoins;
      delete account.pendingCoinsSync;
    }
    account.updatedAt = Date.now();
    saveDb(db);
    res.json({
      ok: true,
      vip: currentVip,
      ...(typeof coinsOverride === 'number' ? { coinsOverride } : {}),
    });
  });

  // Wealth Leaderboard (Top 50 richest registered players + live online flags)
  app.get('/api/leaderboard', (req, res) => {
    const me = getAuthAccount(req);
    const { onlinePlayersCount, onlineUsersCount, onlineUserIds } = getOnlinePlayerStats();
    const sorted = [...db.accounts].sort((a, b) => {
      if (b.save.coins !== a.save.coins) return b.save.coins - a.save.coins;
      if (b.save.bestRun !== a.save.bestRun) return b.save.bestRun - a.save.bestRun;
      return a.createdAt - b.createdAt;
    });

    const entries = sorted.slice(0, 50).map((acc, idx) => ({
      rank: idx + 1,
      id: acc.id,
      username: acc.username,
      coins: acc.save.coins,
      bestRun: acc.save.bestRun,
      curScooter: acc.save.cur,
      vip: Boolean(acc.save.vip),
      online: onlineUserIds.has(acc.id),
      isMe: me ? acc.id === me.id : false,
    }));

    let myRank: number | null = null;
    if (me) {
      const idx = sorted.findIndex((a) => a.id === me.id);
      if (idx >= 0) myRank = idx + 1;
    }

    res.json({
      entries,
      totalRegistered: db.accounts.length,
      onlineCount: Math.max(onlinePlayersCount, me ? 1 : 0),
      onlineRegisteredCount: onlineUsersCount,
      myRank,
      myEntry: me
        ? {
            rank: myRank,
            id: me.id,
            username: me.username,
            coins: me.save.coins,
            bestRun: me.save.bestRun,
            curScooter: me.save.cur,
            vip: Boolean(me.save.vip),
            online: true,
            isMe: true,
          }
        : null,
    });
  });

  // Live Player & Staff Presence Heartbeat
  app.post('/api/presence/heartbeat', (req, res) => {
    const me = getAuthAccount(req);
    const clientId =
      typeof req.body?.clientId === 'string' ? req.body.clientId.trim().slice(0, 64) : '';
    const scooter =
      typeof req.body?.scooter === 'string' ? req.body.scooter.trim().slice(0, 40) : '';
    const fallbackKey = getReqFallbackVisitorKey(req);
    touchPlayerPresence({
      userId: me?.id,
      username: me?.username,
      clientId,
      fallbackKey,
      scooter,
    });
    const visitorKey = me?.id ? `u:${me.id}` : clientId ? `c:${clientId}` : fallbackKey;
    registerVisitor(visitorKey);
    const adminSession = getAdminSession(req);
    if (adminSession) {
      touchAdminPresence(adminSession.staffId);
    }
    const { onlinePlayersCount, onlineUsersCount } = getOnlinePlayerStats();
    const staff = getStaffOnlineStatus();
    const onlineAdminsCount = staff.filter((s) => s.online).length;
    res.json({
      ok: true,
      onlinePlayersCount: Math.max(1, onlinePlayersCount),
      onlineUsersCount,
      onlineAdminsCount,
      totalVisits: Math.max(1, db.totalVisits, db.accounts.length),
      staff,
    });
  });

  app.get('/api/presence', (_req, res) => {
    const { onlinePlayersCount, onlineUsersCount } = getOnlinePlayerStats();
    const staff = getStaffOnlineStatus();
    const onlineAdminsCount = staff.filter((s) => s.online).length;
    res.json({
      ok: true,
      onlinePlayersCount: Math.max(0, onlinePlayersCount),
      onlineUsersCount,
      onlineAdminsCount,
      totalVisits: Math.max(1, db.totalVisits, db.accounts.length),
      staff,
    });
  });

  // Check whether a transfer link/code has already been claimed (non-mutating preview check)
  app.get('/api/transfers/status', (req, res) => {
    const rawCode = typeof req.query.code === 'string' ? req.query.code : '';
    const parsed = verifyTransferCheckCode(rawCode);
    if (!parsed) {
      res.status(400).json({ ok: false, error: 'Неверный код перевода.' });
      return;
    }
    const existing = db.redeemedChecks[parsed.key];
    res.json({
      ok: true,
      redeemed: Boolean(existing),
      claimedAt: existing?.claimedAt ?? 0,
      amount: parsed.amount,
      targetWallet: parsed.targetWallet,
    });
  });

  // Atomically redeem a transfer link/code — strictly 1 global activation across all devices/players!
  app.post('/api/transfers/redeem', (req, res) => {
    const rawCode = typeof req.body?.code === 'string' ? req.body.code : '';
    const rawWalletId =
      typeof req.body?.walletId === 'string' ? req.body.walletId.trim().toUpperCase() : '';
    const parsed = verifyTransferCheckCode(rawCode);
    if (!parsed) {
      res.status(400).json({
        ok: false,
        error: 'Неверный или повреждённый код перевода. Проверь ссылку или код.',
      });
      return;
    }

    if (parsed.targetWallet === 'ALL') {
      res.status(403).json({
        ok: false,
        wrongWallet: true,
        error: 'Общие переводы отключены. Забрать перевод может только владелец ссылки получателя.',
      });
      return;
    }

    if (!rawWalletId || parsed.targetWallet !== rawWalletId) {
      res.status(403).json({
        ok: false,
        wrongWallet: true,
        error: `Этот перевод закрыт для кошелька BS-${parsed.targetWallet} (твой: BS-${rawWalletId || '------'}).`,
      });
      return;
    }

    if (db.redeemedChecks[parsed.key]) {
      res.status(409).json({
        ok: false,
        alreadyRedeemed: true,
        error: 'Этот перевод уже забрали! Одна ссылка работает только 1 раз.',
      });
      return;
    }

    const me = getAuthAccount(req);
    db.redeemedChecks[parsed.key] = {
      amount: parsed.amount,
      targetWallet: parsed.targetWallet,
      claimedBy: me ? `@${me.username}` : rawWalletId ? `BS-${rawWalletId}` : 'player',
      claimedAt: Date.now(),
    };
    const keys = Object.keys(db.redeemedChecks);
    if (keys.length > 8000) {
      for (const oldKey of keys.slice(0, keys.length - 8000)) {
        delete db.redeemedChecks[oldKey];
      }
    }
    saveDb(db);

    res.json({
      ok: true,
      check: {
        code: parsed.code,
        amount: parsed.amount,
        targetWallet: parsed.targetWallet,
        nonce: parsed.nonce,
        sig: parsed.sig,
      },
    });
  });

  // Admin Login: supports username+password (BLACK, Shampyr/shampyp, StantF1) AND legacy dual-pass (BLACK7772 + B7772)
  app.post('/api/admin/login', (req, res) => {
    const rawUser =
      typeof req.body?.username === 'string'
        ? req.body.username.trim().replace(/^@+/, '')
        : '';
    const rawPassword =
      typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    const p1 = typeof req.body?.pass1 === 'string' ? req.body.pass1.trim() : '';
    const p2 = typeof req.body?.pass2 === 'string' ? req.body.pass2.trim() : '';

    let matchedStaff: StaffDefinition | undefined;

    // 1) Legacy dual-password shortcut for BLACK owner (BLACK7772 + B7772)
    if (
      (p1 === ADMIN_PASS_1 && p2 === ADMIN_PASS_2) ||
      (rawUser === ADMIN_PASS_1 && rawPassword === ADMIN_PASS_2)
    ) {
      matchedStaff = STAFF_ROSTER.find((s) => s.id === 'black');
    } else {
      const loginName = (rawUser || p1).toLowerCase();
      const loginPass = rawPassword || p2;

      if (!loginName || !loginPass) {
        res.status(400).json({ error: 'Введи юз администратора и пароль!' });
        return;
      }

      const staff = STAFF_ROSTER.find((s) => s.aliases.includes(loginName));
      if (!staff) {
        res.status(401).json({ error: 'Неверный юз администратора или пароль.' });
        return;
      }
      if (!staff.password) {
        res.status(403).json({
          error: `Админ-доступ для ${staff.displayName} пока не активирован.`,
        });
        return;
      }
      const validPass =
        staff.id === 'black'
          ? loginPass === ADMIN_PASS_1 || loginPass === ADMIN_PASS_2
          : loginPass === staff.password;

      if (!validPass) {
        res.status(401).json({ error: 'Неверный пароль администратора.' });
        return;
      }
      matchedStaff = staff;
    }

    if (!matchedStaff) {
      res.status(401).json({ error: 'Неверные данные администратора.' });
      return;
    }

    const me = getAuthAccount(req);
    const walletId =
      typeof req.body?.walletId === 'string' ? req.body.walletId.trim().slice(0, 24) : '';
    const roleShort =
      matchedStaff.role === 'owner'
        ? 'Главный'
        : matchedStaff.role === 'moderator'
          ? 'Модератор'
          : matchedStaff.role === 'helper'
            ? 'Помощник'
            : 'Тестер';
    const actorTag = `${matchedStaff.displayName} (${roleShort})`;
    const actorName = me ? `${actorTag} · @${me.username}` : actorTag;
    const device = parseDeviceLabel(String(req.headers['user-agent'] || ''));

    const logEntry: AdminLoginLog = {
      id: crypto.randomBytes(8).toString('hex'),
      username: actorName,
      walletId: walletId || '—',
      timestamp: Date.now(),
      device,
    };
    db.adminLogs.unshift(logEntry);
    if (db.adminLogs.length > 100) {
      db.adminLogs = db.adminLogs.slice(0, 100);
    }
    saveDb(db);

    touchAdminPresence(matchedStaff.id);

    const adminToken = signAdminToken(
      matchedStaff.id,
      matchedStaff.displayName,
      matchedStaff.role,
      matchedStaff.roleLabel
    );
    res.json({
      ok: true,
      adminToken,
      session: {
        staffId: matchedStaff.id,
        actor: matchedStaff.displayName,
        role: matchedStaff.role,
        roleLabel: matchedStaff.roleLabel,
      },
      log: logEntry,
    });
  });

  // Verify saved adminToken & return role info
  app.get('/api/admin/verify', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ ok: false });
      return;
    }
    res.json({ ok: true, session });
  });

  // Admin online heartbeat (keeps admin visible in "Админы в сети")
  app.post('/api/admin/heartbeat', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ ok: false });
      return;
    }
    touchAdminPresence(session.staffId);
    res.json({ ok: true, staff: getStaffOnlineStatus() });
  });

  // Admin logout (immediately removes from "Админы в сети")
  app.post('/api/admin/logout', (req, res) => {
    const token = String(req.headers['x-admin-token'] || '').trim();
    const session = token ? verifyAdminToken(token) : null;
    if (session) {
      adminPresence.delete(session.staffId);
    }
    res.json({ ok: true });
  });

  // View who entered the admin panel
  app.get('/api/admin/logs', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    res.json({ logs: db.adminLogs });
  });

  // List registered users (for kick, VIP, and player moderation)
  app.get('/api/admin/users', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    const now = Date.now();
    const { onlineUserIds } = getOnlinePlayerStats();
    const users = [...db.accounts]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((acc) => ({
        id: acc.id,
        username: acc.username,
        coins: acc.save.coins,
        vip: Boolean(acc.save.vip),
        curScooter: acc.save.cur,
        online: onlineUserIds.has(acc.id),
        updatedAt: acc.updatedAt,
        kickedUntil: typeof acc.kickUntil === 'number' && acc.kickUntil > now ? acc.kickUntil : 0,
        kickReason: acc.kickReason || '',
        kickedBy: acc.kickedBy || '',
      }));
    res.json({ users });
  });

  // Admin (ALL roles: owner, moderator, helper): Kick a player out of session / temporary kick
  app.post('/api/admin/kick', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    const rawUser =
      typeof req.body?.username === 'string'
        ? req.body.username.trim().replace(/^@+/, '')
        : '';
    const reason =
      typeof req.body?.reason === 'string' && req.body.reason.trim()
        ? req.body.reason.trim().slice(0, 120)
        : 'Нарушение правил игры';
    const durationMin = Math.max(0, Math.min(43200, Math.floor(Number(req.body?.durationMinutes) || 0)));

    if (!rawUser) {
      res.status(400).json({ error: 'Введи @юз игрока для кика.' });
      return;
    }
    const targetLower = rawUser.toLowerCase();
    // Protect BLACK (creator / head admin) from ever being kicked by anyone!
    if (targetLower === 'black' || targetLower === 'blackda4k') {
      res.status(403).json({ error: 'Нельзя кикнуть главного админа BLACK!' });
      return;
    }
    // Lower admins cannot kick other staff members
    if (
      session.role !== 'owner' &&
      [
        'shampyr',
        'shampyp',
        'stantf1',
        'bmx_pidar',
        'bmxer_pidor',
        'bmx_pidor',
        'bmxer_pidar',
        'romanon',
      ].includes(targetLower)
    ) {
      res.status(403).json({ error: 'Только главный админ BLACK может кикать других админов.' });
      return;
    }

    const target = db.accounts.find((a) => a.usernameLower === targetLower);
    if (!target) {
      res.status(404).json({ error: `Игрок @${rawUser} не найден.` });
      return;
    }

    const now = Date.now();
    target.kickedAt = now;
    target.kickReason = reason;
    target.kickedBy = session.actor;
    target.kickUntil = durationMin > 0 ? now + durationMin * 60_000 : 0;
    target.updatedAt = now;
    saveDb(db);

    res.json({
      ok: true,
      username: target.username,
      kickUntil: target.kickUntil,
      reason: target.kickReason,
      kickedBy: session.actor,
    });
  });

  // Admin: Remove active timed kick (разбанить)
  app.post('/api/admin/unkick', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    const rawUser =
      typeof req.body?.username === 'string'
        ? req.body.username.trim().replace(/^@+/, '')
        : '';
    const target = db.accounts.find((a) => a.usernameLower === rawUser.toLowerCase());
    if (!target) {
      res.status(404).json({ error: `Игрок @${rawUser} не найден.` });
      return;
    }
    delete target.kickUntil;
    delete target.kickReason;
    delete target.kickedBy;
    target.updatedAt = Date.now();
    saveDb(db);
    res.json({ ok: true, username: target.username });
  });

  // Admin: Toggle VIP x2 status on any player account (OWNER BLACK ONLY)
  app.post('/api/admin/vip', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    if (!isBlackOwner(session)) {
      res.status(403).json({ error: 'Только главный админ BLACK может выдавать VIP ×2.' });
      return;
    }
    const rawUser =
      typeof req.body?.username === 'string'
        ? req.body.username.trim().replace(/^@+/, '')
        : '';
    if (!rawUser) {
      res.status(400).json({ error: 'Введи @юз игрока.' });
      return;
    }
    const target = db.accounts.find((a) => a.usernameLower === rawUser.toLowerCase());
    if (!target) {
      res.status(404).json({ error: `Игрок @${rawUser} не найден.` });
      return;
    }
    target.save.vip = Boolean(req.body?.vip);
    target.updatedAt = Date.now();
    saveDb(db);
    res.json({
      ok: true,
      user: {
        id: target.id,
        username: target.username,
        coins: target.save.coins,
        vip: Boolean(target.save.vip),
        curScooter: target.save.cur,
        updatedAt: target.updatedAt,
      },
    });
  });

  // Admin: add, remove, or set coins for any registered player (OWNER BLACK ONLY)
  app.post('/api/admin/coins', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    if (!isBlackOwner(session)) {
      res.status(403).json({ error: 'Только главный админ BLACK может менять монеты.' });
      return;
    }
    const rawUser =
      typeof req.body?.username === 'string'
        ? req.body.username.trim().replace(/^@+/, '')
        : '';
    const mode = req.body?.mode === 'add' || req.body?.mode === 'set' ? req.body.mode : 'remove';
    const rawAmount = Number(req.body?.amount);

    if (!rawUser) {
      res.status(400).json({ error: 'Введи @юз игрока.' });
      return;
    }
    if (!Number.isFinite(rawAmount) || rawAmount < 0) {
      res.status(400).json({ error: 'Введи корректную сумму монет.' });
      return;
    }

    const target = db.accounts.find((a) => a.usernameLower === rawUser.toLowerCase());
    if (!target) {
      res.status(404).json({ error: `Игрок @${rawUser} не найден.` });
      return;
    }

    const cleanAmt = Math.min(999_999_999, Math.floor(rawAmount));
    let nextCoins = target.save.coins;
    if (mode === 'add') {
      nextCoins = Math.min(999_999_999, target.save.coins + cleanAmt);
    } else if (mode === 'set') {
      nextCoins = cleanAmt;
    } else {
      nextCoins = Math.max(0, target.save.coins - cleanAmt);
    }

    target.save.coins = nextCoins;
    target.pendingCoinsSync = nextCoins;
    target.updatedAt = Date.now();
    saveDb(db);

    res.json({
      ok: true,
      user: {
        id: target.id,
        username: target.username,
        coins: target.save.coins,
        vip: Boolean(target.save.vip),
        curScooter: target.save.cur,
        updatedAt: target.updatedAt,
      },
    });
  });

  // Admin: full account reset by @username (OWNER BLACK ONLY)
  app.post('/api/admin/reset', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    if (!isBlackOwner(session)) {
      res.status(403).json({ error: 'Только главный админ BLACK может обнулять аккаунты.' });
      return;
    }
    const rawUser =
      typeof req.body?.username === 'string'
        ? req.body.username.trim().replace(/^@+/, '')
        : '';
    if (!rawUser) {
      res.status(400).json({ error: 'Введи @юз игрока для обнуления.' });
      return;
    }
    const target = db.accounts.find((a) => a.usernameLower === rawUser.toLowerCase());
    if (!target) {
      res.status(404).json({ error: `Игрок @${rawUser} не найден.` });
      return;
    }

    target.save = getFreshSave();
    target.pendingFullReset = true;
    delete target.pendingCoinsSync;
    target.updatedAt = Date.now();
    saveDb(db);

    res.json({
      ok: true,
      user: {
        id: target.id,
        username: target.username,
        coins: target.save.coins,
        vip: Boolean(target.save.vip),
        curScooter: target.save.cur,
        updatedAt: target.updatedAt,
      },
    });
  });

  // Admin: reset ALL registered accounts at once (OWNER BLACK ONLY)
  app.post('/api/admin/wipe-all', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    if (!isBlackOwner(session)) {
      res.status(403).json({ error: 'Только главный админ BLACK может обнулить все аккаунты.' });
      return;
    }
    const now = Date.now();
    for (const acc of db.accounts) {
      acc.save = getFreshSave();
      acc.pendingFullReset = true;
      delete acc.pendingCoinsSync;
      acc.updatedAt = now;
    }
    db.redeemedChecks = {};
    db.bugTickets = [];
    saveDb(db);

    res.json({ ok: true, resetCount: db.accounts.length });
  });

  // Admin: delete a registered player account (OWNER BLACK ONLY)
  app.delete('/api/admin/users/:id', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    if (!isBlackOwner(session)) {
      res.status(403).json({ error: 'Только главный админ BLACK может удалять аккаунты.' });
      return;
    }
    const id = String(req.params.id || '').trim();
    const idx = db.accounts.findIndex((a) => a.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Аккаунт не найден.' });
      return;
    }
    const [removed] = db.accounts.splice(idx, 1);
    saveDb(db);
    res.json({
      ok: true,
      deletedId: removed.id,
      deletedUsername: removed.username,
    });
  });

  // ── ONLINE ADMINS & BUG SUPPORT TICKETS API ──

  // Public: live online status of all active admins (BLACK, Shampyr, StantF1)
  app.get('/api/support/status', (_req, res) => {
    const staff = getStaffOnlineStatus();
    const onlineCount = staff.filter((s) => s.online).length;
    res.json({ ok: true, staff, onlineCount });
  });

  // Public/Player: list current player's own bug/help tickets & admin replies
  app.get('/api/support/tickets', (req, res) => {
    const me = getAuthAccount(req);
    const clientId =
      typeof req.query.clientId === 'string' ? req.query.clientId.trim().slice(0, 64) : '';
    const mine = db.bugTickets
      .filter((t) => (me && t.userId === me.id) || (clientId && t.clientId === clientId))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 30);
    res.json({ ok: true, tickets: mine });
  });

  // Public/Player: submit a new bug report / support message
  app.post('/api/support/tickets', (req, res) => {
    const me = getAuthAccount(req);
    const clientId =
      typeof req.body?.clientId === 'string' ? req.body.clientId.trim().slice(0, 64) : '';
    const guestName =
      typeof req.body?.guestName === 'string' ? req.body.guestName.trim().slice(0, 24) : '';
    const rawCat = req.body?.category;
    const category: 'bug' | 'help' | 'idea' =
      rawCat === 'help' || rawCat === 'idea' ? rawCat : 'bug';
    const text =
      typeof req.body?.text === 'string' ? req.body.text.trim().replace(/\s+/g, ' ').slice(0, 400) : '';
    const scooter =
      typeof req.body?.scooter === 'string' ? req.body.scooter.trim().slice(0, 40) : '';

    if (text.length < 4) {
      res.status(400).json({ error: 'Опиши баг или вопрос подробнее (минимум 4 символа).' });
      return;
    }

    const now = Date.now();
    // Simple spam throttle: 15s between tickets from the same player
    const recent = db.bugTickets.find(
      (t) =>
        ((me && t.userId === me.id) || (clientId && t.clientId === clientId)) &&
        now - t.createdAt < 15_000
    );
    if (recent) {
      res.status(429).json({ error: 'Подожди пару секунд перед следующей отправкой.' });
      return;
    }

    const ticket: StoredBugTicket = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: me?.id,
      clientId: clientId || undefined,
      username: me ? `@${me.username}` : guestName || 'Гость',
      category,
      text,
      scooter: scooter || '—',
      device: parseDeviceLabel(String(req.headers['user-agent'] || '')),
      status: 'open',
      createdAt: now,
      updatedAt: now,
      replies: [],
    };
    db.bugTickets.unshift(ticket);
    if (db.bugTickets.length > 300) {
      db.bugTickets = db.bugTickets.slice(0, 300);
    }
    saveDb(db);
    res.json({ ok: true, ticket });
  });

  // Admin (ALL roles): view all player bug reports & support requests
  app.get('/api/admin/tickets', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    const order = { open: 0, in_progress: 1, resolved: 2 };
    const tickets = [...db.bugTickets].sort((a, b) => {
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return b.updatedAt - a.updatedAt;
    });
    res.json({ ok: true, tickets });
  });

  // Admin (ALL roles): reply to a player's bug report / support ticket
  app.post('/api/admin/tickets/:id/reply', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    const ticket = db.bugTickets.find((t) => t.id === req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Обращение не найдено.' });
      return;
    }
    const text =
      typeof req.body?.text === 'string' ? req.body.text.trim().replace(/\s+/g, ' ').slice(0, 400) : '';
    if (text.length < 2) {
      res.status(400).json({ error: 'Введи текст ответа.' });
      return;
    }

    const reply: BugTicketReply = {
      id: crypto.randomBytes(6).toString('hex'),
      adminName: session.actor,
      adminRole: session.role,
      adminRoleLabel: session.roleLabel,
      text,
      timestamp: Date.now(),
    };
    ticket.replies.push(reply);
    if (ticket.replies.length > 30) {
      ticket.replies = ticket.replies.slice(-30);
    }
    if (req.body?.markResolved) {
      ticket.status = 'resolved';
    } else if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    ticket.updatedAt = Date.now();
    saveDb(db);
    res.json({ ok: true, ticket });
  });

  // Admin (ALL roles): update bug ticket status (open / in_progress / resolved)
  app.patch('/api/admin/tickets/:id/status', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    const ticket = db.bugTickets.find((t) => t.id === req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Обращение не найдено.' });
      return;
    }
    const st = req.body?.status;
    if (st !== 'open' && st !== 'in_progress' && st !== 'resolved') {
      res.status(400).json({ error: 'Некорректный статус.' });
      return;
    }
    ticket.status = st;
    ticket.updatedAt = Date.now();
    saveDb(db);
    res.json({ ok: true, ticket });
  });

  // Admin (ALL roles): delete spam/old bug ticket
  app.delete('/api/admin/tickets/:id', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    const idx = db.bugTickets.findIndex((t) => t.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Обращение не найдено.' });
      return;
    }
    db.bugTickets.splice(idx, 1);
    saveDb(db);
    res.json({ ok: true, deletedId: req.params.id });
  });

  // ── CUSTOM PROMO CODES API ──
  const CUSTOM_PROMO_RE = /^[A-ZА-ЯЁ0-9_-]{2,24}$/u;

  // Admin: list all custom-named promo codes (OWNER BLACK ONLY)
  app.get('/api/admin/promos', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    if (!isBlackOwner(session)) {
      res.status(403).json({ error: 'Только главный админ BLACK имеет доступ к промокодам.' });
      return;
    }
    const list = [...db.promos]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((p) => ({
        code: p.code,
        coins: p.coins,
        maxUses: p.maxUses,
        usedCount: p.usedCount,
        createdAt: p.createdAt,
      }));
    res.json({ ok: true, promos: list });
  });

  // Admin: create a custom-named promo code for all players (OWNER BLACK ONLY)
  app.post('/api/admin/promos', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    if (!isBlackOwner(session)) {
      res.status(403).json({ error: 'Только главный админ BLACK может создавать промокоды.' });
      return;
    }
    const rawCode =
      typeof req.body?.code === 'string'
        ? req.body.code.trim().toUpperCase().replace(/\s+/g, '')
        : '';
    const rawCoins = Number(req.body?.coins);
    const rawMaxUses = Number(req.body?.maxUses ?? 0);

    if (!rawCode || !CUSTOM_PROMO_RE.test(rawCode)) {
      res.status(400).json({
        error: 'Название промокода: от 2 до 24 символов (буквы, цифры, _ или -).',
      });
      return;
    }
    if (rawCode === 'BLACKDA4K') {
      res.status(400).json({ error: 'Промокод BLACKDA4K уже встроен в игру.' });
      return;
    }
    if (!Number.isFinite(rawCoins) || rawCoins < 100 || rawCoins > 10_000_000) {
      res.status(400).json({ error: 'Сумма монет должна быть от 100 до 10 000 000.' });
      return;
    }
    const maxUses =
      Number.isFinite(rawMaxUses) && rawMaxUses > 0 ? Math.min(100_000, Math.floor(rawMaxUses)) : 0;

    if (db.promos.some((p) => p.code === rawCode)) {
      res.status(409).json({
        error: `Промокод «${rawCode}» уже существует. Удали старый или придумай другое название.`,
      });
      return;
    }

    const promo: StoredCustomPromo = {
      code: rawCode,
      coins: Math.floor(rawCoins),
      maxUses,
      usedCount: 0,
      usedBy: [],
      createdAt: Date.now(),
    };
    db.promos.unshift(promo);
    if (db.promos.length > 200) db.promos.length = 200;
    saveDb(db);

    res.json({
      ok: true,
      promo: {
        code: promo.code,
        coins: promo.coins,
        maxUses: promo.maxUses,
        usedCount: promo.usedCount,
        createdAt: promo.createdAt,
      },
    });
  });

  // Admin: delete a custom-named promo code (OWNER BLACK ONLY)
  app.delete('/api/admin/promos/:code', (req, res) => {
    const session = getAdminSession(req);
    if (!session) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    if (!isBlackOwner(session)) {
      res.status(403).json({ error: 'Только главный админ BLACK может удалять промокоды.' });
      return;
    }
    let rawCode = '';
    try {
      rawCode = decodeURIComponent(String(req.params.code || ''))
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');
    } catch {
      rawCode = String(req.params.code || '').trim().toUpperCase();
    }
    const idx = db.promos.findIndex((p) => p.code === rawCode);
    if (idx === -1) {
      res.status(404).json({ error: 'Промокод не найден.' });
      return;
    }
    db.promos.splice(idx, 1);
    saveDb(db);
    res.json({ ok: true, deletedCode: rawCode });
  });

  // Public: redeem a custom-named promo code
  app.post('/api/promos/redeem', (req, res) => {
    const rawCode =
      typeof req.body?.code === 'string'
        ? req.body.code.trim().toUpperCase().replace(/\s+/g, '')
        : '';
    if (!rawCode) {
      res.status(400).json({ error: 'Введи промокод!' });
      return;
    }

    const promo = db.promos.find((p) => p.code === rawCode);
    if (!promo) {
      res.status(404).json({ error: 'Такого промокода нет. Проверь буквы и цифры!' });
      return;
    }

    const me = getAuthAccount(req);
    const clientId =
      typeof req.body?.clientId === 'string' ? req.body.clientId.trim().slice(0, 64) : '';
    const redeemerKeys: string[] = [];
    if (me) redeemerKeys.push(`u:${me.id}`);
    if (clientId) redeemerKeys.push(`d:${clientId}`);

    if (redeemerKeys.some((k) => promo.usedBy.includes(k))) {
      res.status(409).json({ error: 'Этот промокод уже активирован!' });
      return;
    }
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      res.status(410).json({ error: 'Лимит активаций этого промокода уже закончился!' });
      return;
    }

    promo.usedCount += 1;
    for (const k of redeemerKeys) {
      if (!promo.usedBy.includes(k)) promo.usedBy.push(k);
    }
    if (promo.usedBy.length > 5000) {
      promo.usedBy = promo.usedBy.slice(-5000);
    }
    saveDb(db);

    res.json({
      ok: true,
      code: promo.code,
      coins: promo.coins,
      label: `Промокод ${promo.code}`,
    });
  });

  // Android APK direct download endpoints (serves public/BLACK_STANT.apk if present)
  const apkFilePath = path.resolve(process.cwd(), 'public', 'BLACK_STANT.apk');

  app.get('/api/apk/status', (_req, res) => {
    try {
      if (fs.existsSync(apkFilePath)) {
        const stat = fs.statSync(apkFilePath);
        if (stat.isFile() && stat.size > 1024) {
          res.json({ available: true, sizeBytes: stat.size, filename: 'BLACK_STANT.apk' });
          return;
        }
      }
    } catch {
      // Ignore stat errors
    }
    res.json({ available: false, filename: 'BLACK_STANT.apk' });
  });

  app.get('/api/apk/download', (_req, res) => {
    try {
      if (fs.existsSync(apkFilePath)) {
        const stat = fs.statSync(apkFilePath);
        if (stat.isFile() && stat.size > 1024) {
          res.setHeader('Content-Type', 'application/vnd.android.package-archive');
          res.setHeader('Content-Disposition', 'attachment; filename="BLACK_STANT.apk"');
          res.setHeader('Content-Length', String(stat.size));
          fs.createReadStream(apkFilePath).pipe(res);
          return;
        }
      }
    } catch {
      // Fall through to 404
    }
    res.status(404).json({ error: 'Файл BLACK_STANT.apk ещё не загружен на сервер.' });
  });

  // Ensure /api/* always returns JSON errors (never HTML error pages)
  app.use('/api', (err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    const status =
      err && typeof err === 'object' && 'status' in err && typeof (err as { status?: unknown }).status === 'number'
        ? (err as { status: number }).status
        : 500;
    const message =
      status === 413
        ? 'Файл или запрос слишком большой.'
        : err instanceof SyntaxError
          ? 'Некорректный формат запроса.'
          : 'Ошибка сервера. Попробуй ещё раз.';
    res.status(status).json({ error: message });
  });

  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API маршрут не найден.' });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    // Fast immutable caching for versioned sprite/icon assets in dev mode too
    const publicAssetsDir = path.resolve(process.cwd(), 'public', 'assets');
    app.use(
      '/assets',
      express.static(publicAssetsDir, {
        maxAge: '7d',
        immutable: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
          }
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        },
      })
    );
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(
      express.static(distDir, {
        setHeaders: (res, filePath) => {
          const base = path.basename(filePath);
          if (base === 'manifest.webmanifest') {
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else if (
            base === 'index.html' ||
            base === 'sw.js' ||
            base === 'registerSW.js'
          ) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api/') ||
        req.path.startsWith('/assets/') ||
        /\.(js|mjs|css|png|jpg|jpeg|webp|svg|ico|woff2?|json|apk)$/i.test(req.path)
      ) {
        res.status(404).end();
        return;
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BLACK STANT server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
