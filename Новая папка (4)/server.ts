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
  helmets: string[];
  curH: string;
  outfits: string[];
  curO: string;
  vip?: boolean;
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

interface ClanMessageReply {
  id: string;
  username: string;
  text: string;
}

interface ClanMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  system?: boolean;
  replyTo?: ClanMessageReply;
}

interface ClanInvite {
  userId: string;
  username: string;
  invitedBy: string;
  createdAt: number;
}

interface StoredClan {
  id: string;
  name: string;
  nameLower: string;
  tag: string;
  tagLower: string;
  description: string;
  color: string;
  avatar?: string;
  inviteOnly?: boolean;
  leaderId: string;
  memberIds: string[];
  invites?: ClanInvite[];
  mutedMembers?: Record<string, number>;
  messages: ClanMessage[];
  createdAt: number;
}

interface DatabaseSchema {
  secret: string;
  accounts: StoredAccount[];
  adminLogs: AdminLoginLog[];
  clans: StoredClan[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'blackstant-db.json');

const ADMIN_PASS_1 = 'BLACK7772';
const ADMIN_PASS_2 = 'B7772';

function ensureDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      if (parsed && typeof parsed.secret === 'string' && Array.isArray(parsed.accounts)) {
        return {
          secret: parsed.secret,
          accounts: parsed.accounts,
          adminLogs: Array.isArray(parsed.adminLogs) ? parsed.adminLogs : [],
          clans: Array.isArray(parsed.clans) ? parsed.clans : [],
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
    clans: [],
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

function verifyToken(token: string): string | null {
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
    };
    return typeof decoded.id === 'string' ? decoded.id : null;
  } catch {
    return null;
  }
}

function signAdminToken(actor: string): string {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', actor, iat: Date.now() }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', db.secret)
    .update(`adm:${payload}`)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', db.secret)
    .update(`adm:${payload}`)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
    };
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

function isAdminRequest(req: express.Request): boolean {
  const token = String(req.headers['x-admin-token'] || '').trim();
  if (!token) return false;
  return verifyAdminToken(token);
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

  const vip = typeof preserveVip === 'boolean' ? preserveVip : Boolean(s.vip);

  return { coins, bestRun, own, cur, helmets, curH, outfits, curO, vip };
}

function getAuthAccount(req: express.Request): StoredAccount | null {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const accountId = verifyToken(match[1].trim());
  if (!accountId) return null;
  return db.accounts.find((a) => a.id === accountId) ?? null;
}

const USERNAME_REGEX = /^[a-zA-Z0-9а-яА-ЯёЁ_-]{3,18}$/;
const CLAN_TAG_REGEX = /^[a-zA-Z0-9а-яА-ЯёЁ]{2,5}$/;
const CLAN_COLORS = ['#ff6a1a', '#22d3ee', '#ffd34d', '#4ade80', '#c084fc', '#f43f5e'];
const CLAN_CREATE_COST = 1_000_000;
const CLAN_AVATAR_PRESETS = [
  'shield',
  'flame',
  'crown',
  'zap',
  'skull',
  'wolf',
  'star',
  'sword',
  'diamond',
  'wheel',
  'ghost',
  'target',
];

function sanitizeClanAvatar(raw: unknown): string {
  if (typeof raw !== 'string') return 'shield';
  const trimmed = raw.trim();
  if (CLAN_AVATAR_PRESETS.includes(trimmed)) return trimmed;
  if (
    /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed) &&
    trimmed.length <= 65_000
  ) {
    return trimmed;
  }
  return 'shield';
}

function getFreshSave(): AccountSave {
  return {
    coins: 0,
    bestRun: 0,
    own: ['c3'],
    cur: 'c3',
    helmets: ['mx_start'],
    curH: 'mx_start',
    outfits: ['black_stant', 'street_white'],
    curO: 'black_stant',
    vip: false,
  };
}

function getClanMuteUntil(clan: StoredClan, userId: string): number {
  if (!clan.mutedMembers) return 0;
  const until = clan.mutedMembers[userId];
  if (typeof until !== 'number') return 0;
  if (until === -1) return -1;
  if (until <= Date.now()) {
    delete clan.mutedMembers[userId];
    return 0;
  }
  return until;
}

function pushClanSystemMessage(clan: StoredClan, text: string) {
  clan.messages.push({
    id: crypto.randomBytes(6).toString('hex'),
    userId: 'system',
    username: 'Система',
    text,
    timestamp: Date.now(),
    system: true,
  });
  if (clan.messages.length > 80) {
    clan.messages = clan.messages.slice(-80);
  }
}

function clearUserInvitesEverywhere(userId: string) {
  for (const c of db.clans) {
    if (Array.isArray(c.invites)) {
      c.invites = c.invites.filter((inv) => inv.userId !== userId);
    }
  }
}

function findUserClan(userId: string): StoredClan | undefined {
  return db.clans.find((c) => c.memberIds.includes(userId));
}

function removeUserFromClans(userId: string) {
  const acc = db.accounts.find((a) => a.id === userId);
  clearUserInvitesEverywhere(userId);
  for (let i = db.clans.length - 1; i >= 0; i--) {
    const clan = db.clans[i];
    if (!clan.memberIds.includes(userId)) continue;
    clan.memberIds = clan.memberIds.filter((id) => id !== userId);
    if (clan.mutedMembers) delete clan.mutedMembers[userId];
    if (clan.memberIds.length === 0) {
      db.clans.splice(i, 1);
    } else {
      if (clan.leaderId === userId) {
        clan.leaderId = clan.memberIds[0];
        if (clan.mutedMembers) delete clan.mutedMembers[clan.leaderId];
        const nextLeader = db.accounts.find((a) => a.id === clan.leaderId);
        pushClanSystemMessage(
          clan,
          `👑 ${acc ? `@${acc.username}` : 'Лидер'} покинул клан. Новый глава: @${nextLeader?.username ?? 'Игрок'}`
        );
      } else if (acc) {
        pushClanSystemMessage(clan, `@${acc.username} покинул клан.`);
      }
    }
  }
}

function buildClanSummary(clan: StoredClan, meId: string | null) {
  const members = clan.memberIds
    .map((id) => db.accounts.find((a) => a.id === id))
    .filter((a): a is StoredAccount => Boolean(a));
  const totalCoins = members.reduce((sum, a) => sum + a.save.coins, 0);
  const leader = db.accounts.find((a) => a.id === clan.leaderId) ?? members[0];
  const invites = Array.isArray(clan.invites) ? clan.invites : [];
  return {
    id: clan.id,
    name: clan.name,
    tag: clan.tag,
    description: clan.description,
    color: clan.color,
    avatar: clan.avatar || 'shield',
    inviteOnly: Boolean(clan.inviteOnly),
    leaderId: clan.leaderId,
    leaderUsername: leader ? leader.username : 'Лидер',
    memberCount: members.length,
    totalCoins,
    isMember: meId ? clan.memberIds.includes(meId) : false,
    isLeader: meId ? clan.leaderId === meId : false,
    isInvited: meId ? invites.some((inv) => inv.userId === meId) : false,
    createdAt: clan.createdAt,
  };
}

function buildClanDetail(clan: StoredClan, meId: string | null) {
  const summary = buildClanSummary(clan, meId);
  const members = clan.memberIds
    .map((id) => db.accounts.find((a) => a.id === id))
    .filter((a): a is StoredAccount => Boolean(a))
    .sort((a, b) => {
      if (a.id === clan.leaderId) return -1;
      if (b.id === clan.leaderId) return 1;
      return b.save.coins - a.save.coins;
    })
    .map((a) => ({
      id: a.id,
      username: a.username,
      coins: a.save.coins,
      bestRun: a.save.bestRun,
      curScooter: a.save.cur,
      vip: Boolean(a.save.vip),
      isLeader: a.id === clan.leaderId,
      mutedUntil: getClanMuteUntil(clan, a.id),
    }));
  const invites = Array.isArray(clan.invites)
    ? clan.invites.filter((inv) => db.accounts.some((a) => a.id === inv.userId))
    : [];
  return {
    ...summary,
    members,
    invites: summary.isLeader ? invites : [],
    myMutedUntil: meId ? getClanMuteUntil(clan, meId) : 0,
    messages: clan.messages.slice(-80),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '300kb' }));

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
        error: 'Этот юз уже занят! Выбери другой или войди в аккаунт.',
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
      save: sanitizeSave(req.body?.save),
      createdAt: now,
      updatedAt: now,
    };

    db.accounts.push(account);
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
    const account = getAuthAccount(req);
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

  // Sync player coins, best run & garage to account + Wealth Leaderboard
  app.post('/api/profile/sync', (req, res) => {
    const account = getAuthAccount(req);
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

  // Wealth Leaderboard (Top 50 richest registered players)
  app.get('/api/leaderboard', (req, res) => {
    const me = getAuthAccount(req);
    const sorted = [...db.accounts].sort((a, b) => {
      if (b.save.coins !== a.save.coins) return b.save.coins - a.save.coins;
      if (b.save.bestRun !== a.save.bestRun) return b.save.bestRun - a.save.bestRun;
      return a.createdAt - b.createdAt;
    });

    const entries = sorted.slice(0, 50).map((acc, idx) => {
      const clan = findUserClan(acc.id);
      return {
        rank: idx + 1,
        id: acc.id,
        username: acc.username,
        coins: acc.save.coins,
        bestRun: acc.save.bestRun,
        curScooter: acc.save.cur,
        vip: Boolean(acc.save.vip),
        clanTag: clan?.tag,
        clanColor: clan?.color,
        isMe: me ? acc.id === me.id : false,
      };
    });

    let myRank: number | null = null;
    if (me) {
      const idx = sorted.findIndex((a) => a.id === me.id);
      if (idx >= 0) myRank = idx + 1;
    }

    const myClan = me ? findUserClan(me.id) : undefined;
    res.json({
      entries,
      totalRegistered: db.accounts.length,
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
            clanTag: myClan?.tag,
            clanColor: myClan?.color,
            isMe: true,
          }
        : null,
    });
  });

  // Admin Login: validates both passwords, records who logged in, returns persistent signed adminToken
  app.post('/api/admin/login', (req, res) => {
    const p1 = typeof req.body?.pass1 === 'string' ? req.body.pass1.trim() : '';
    const p2 = typeof req.body?.pass2 === 'string' ? req.body.pass2.trim() : '';
    if (!p1 || !p2) {
      res.status(400).json({ error: 'Обязательно введи оба пароля!' });
      return;
    }
    if (p1 !== ADMIN_PASS_1 || p2 !== ADMIN_PASS_2) {
      res.status(401).json({ error: 'Неверный первый или второй пароль.' });
      return;
    }

    const me = getAuthAccount(req);
    const walletId =
      typeof req.body?.walletId === 'string' ? req.body.walletId.trim().slice(0, 24) : '';
    const actorName = me ? `@${me.username}` : walletId ? `Гость (${walletId})` : 'Гость';
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

    const adminToken = signAdminToken(actorName);
    res.json({ ok: true, adminToken, log: logEntry });
  });

  // Verify saved adminToken so admin opens panel without re-entering password
  app.get('/api/admin/verify', (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ ok: false });
      return;
    }
    res.json({ ok: true });
  });

  // View who entered the admin panel
  app.get('/api/admin/logs', (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    res.json({ logs: db.adminLogs });
  });

  // List registered users for admin VIP management
  app.get('/api/admin/users', (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    const users = [...db.accounts]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((acc) => ({
        id: acc.id,
        username: acc.username,
        coins: acc.save.coins,
        vip: Boolean(acc.save.vip),
        curScooter: acc.save.cur,
        updatedAt: acc.updatedAt,
      }));
    res.json({ users });
  });

  // Grant or revoke VIP x2 for any registered player by username
  app.post('/api/admin/vip', (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    const rawUser =
      typeof req.body?.username === 'string'
        ? req.body.username.trim().replace(/^@+/, '')
        : '';
    const vip = Boolean(req.body?.vip);

    if (!rawUser) {
      res.status(400).json({ error: 'Введи @юз игрока.' });
      return;
    }

    const target = db.accounts.find((a) => a.usernameLower === rawUser.toLowerCase());
    if (!target) {
      res.status(404).json({ error: `Игрок @${rawUser} не найден.` });
      return;
    }

    target.save.vip = vip;
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

  // Admin: add, remove, or set coins for any registered player
  app.post('/api/admin/coins', (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
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

  // Admin: full account reset by @username (wipes coins, bestRun, scooters, helmets, outfits, VIP)
  app.post('/api/admin/reset', (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
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

  // Admin: delete a registered player account
  app.delete('/api/admin/users/:id', (req, res) => {
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: 'Нет доступа администратора.' });
      return;
    }
    const id = String(req.params.id || '').trim();
    const idx = db.accounts.findIndex((a) => a.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Аккаунт не найден.' });
      return;
    }
    const [removed] = db.accounts.splice(idx, 1);
    removeUserFromClans(removed.id);
    saveDb(db);
    res.json({
      ok: true,
      deletedId: removed.id,
      deletedUsername: removed.username,
    });
  });

  // ── CLANS API ──

  // List all clans sorted by total wealth + current user's clan details + pending invites
  app.get('/api/clans', (req, res) => {
    const me = getAuthAccount(req);
    const meId = me ? me.id : null;
    const summaries = db.clans
      .map((c) => buildClanSummary(c, meId))
      .filter((c) => c.memberCount > 0)
      .sort((a, b) => {
        if (b.totalCoins !== a.totalCoins) return b.totalCoins - a.totalCoins;
        return b.memberCount - a.memberCount;
      });
    const myClanRaw = meId ? findUserClan(meId) : undefined;
    const myInvites = meId
      ? db.clans
          .filter(
            (c) =>
              c.memberIds.length > 0 &&
              !c.memberIds.includes(meId) &&
              Array.isArray(c.invites) &&
              c.invites.some((inv) => inv.userId === meId)
          )
          .map((c) => {
            const summary = buildClanSummary(c, meId);
            const inv = c.invites!.find((x) => x.userId === meId)!;
            return {
              clanId: c.id,
              clanName: c.name,
              clanTag: c.tag,
              clanColor: c.color,
              clanAvatar: c.avatar || 'shield',
              memberCount: summary.memberCount,
              totalCoins: summary.totalCoins,
              invitedBy: inv.invitedBy,
              createdAt: inv.createdAt,
            };
          })
      : [];

    res.json({
      clans: summaries,
      myClan: myClanRaw ? buildClanDetail(myClanRaw, meId) : null,
      myInvites,
      createCost: CLAN_CREATE_COST,
    });
  });

  // Create a new clan (costs 1,000,000 coins)
  app.post('/api/clans', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Сначала войди или создай аккаунт (@юз).' });
      return;
    }
    if (findUserClan(me.id)) {
      res.status(400).json({ error: 'Ты уже состоишь в клане. Сначала выйди из него.' });
      return;
    }
    if (me.save.coins < CLAN_CREATE_COST) {
      const missing = CLAN_CREATE_COST - Math.floor(me.save.coins);
      res.status(400).json({
        error: `Создание клана стоит 1 000 000 🪙. Не хватает ещё ${missing.toLocaleString('ru-RU')} 🪙.`,
      });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim().replace(/\s+/g, ' ') : '';
    const tag = typeof req.body?.tag === 'string' ? req.body.tag.trim().toUpperCase() : '';
    const description =
      typeof req.body?.description === 'string'
        ? req.body.description.trim().replace(/\s+/g, ' ').slice(0, 80)
        : '';
    const color =
      typeof req.body?.color === 'string' && CLAN_COLORS.includes(req.body.color)
        ? req.body.color
        : CLAN_COLORS[0];
    const avatar = sanitizeClanAvatar(req.body?.avatar);
    const inviteOnly = Boolean(req.body?.inviteOnly);

    if (name.length < 3 || name.length > 20) {
      res.status(400).json({ error: 'Название клана должно быть от 3 до 20 символов.' });
      return;
    }
    if (!CLAN_TAG_REGEX.test(tag)) {
      res.status(400).json({ error: 'Тег клана: от 2 до 5 букв или цифр (например STANT).' });
      return;
    }

    if (db.clans.some((c) => c.nameLower === name.toLowerCase())) {
      res.status(409).json({ error: 'Клан с таким названием уже существует.' });
      return;
    }
    if (db.clans.some((c) => c.tagLower === tag.toLowerCase())) {
      res.status(409).json({ error: `Тег [${tag}] уже занят другим кланом.` });
      return;
    }

    // Deduct 1,000,000 coins server-side
    me.save.coins = Math.max(0, Math.floor(me.save.coins) - CLAN_CREATE_COST);
    me.pendingCoinsSync = me.save.coins;
    me.updatedAt = Date.now();
    clearUserInvitesEverywhere(me.id);

    const clan: StoredClan = {
      id: crypto.randomBytes(10).toString('hex'),
      name,
      nameLower: name.toLowerCase(),
      tag,
      tagLower: tag.toLowerCase(),
      description,
      color,
      avatar,
      inviteOnly,
      leaderId: me.id,
      memberIds: [me.id],
      invites: [],
      mutedMembers: {},
      messages: [
        {
          id: crypto.randomBytes(6).toString('hex'),
          userId: 'system',
          username: 'Система',
          text: `Клан [${tag}] ${name} создан игроком @${me.username}! Добро пожаловать!`,
          timestamp: Date.now(),
          system: true,
        },
      ],
      createdAt: Date.now(),
    };

    db.clans.push(clan);
    saveDb(db);
    res.json({ ok: true, clan: buildClanDetail(clan, me.id), newCoins: me.save.coins });
  });

  // Join an existing clan (or join via pending invite)
  app.post('/api/clans/:id/join', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Сначала войди или создай аккаунт (@юз).' });
      return;
    }
    if (findUserClan(me.id)) {
      res.status(400).json({ error: 'Ты уже состоишь в клане. Сначала выйди из текущего.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (!clan) {
      res.status(404).json({ error: 'Клан не найден.' });
      return;
    }
    const invites = Array.isArray(clan.invites) ? clan.invites : [];
    const hasInvite = invites.some((inv) => inv.userId === me.id);
    if (clan.inviteOnly && !hasInvite) {
      res.status(403).json({ error: 'В этот клан можно вступить только по приглашению лидера.' });
      return;
    }
    if (clan.memberIds.length >= 30) {
      res.status(400).json({ error: 'В клане уже максимум участников (30).' });
      return;
    }
    clan.memberIds.push(me.id);
    clearUserInvitesEverywhere(me.id);
    pushClanSystemMessage(
      clan,
      hasInvite
        ? `@${me.username} принял приглашение и вступил в клан!`
        : `@${me.username} вступил в клан!`
    );
    saveDb(db);
    res.json({ ok: true, clan: buildClanDetail(clan, me.id) });
  });

  // Leader invites a player by @username
  app.post('/api/clans/:id/invite', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Не авторизован.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (!clan) {
      res.status(404).json({ error: 'Клан не найден.' });
      return;
    }
    if (clan.leaderId !== me.id) {
      res.status(403).json({ error: 'Приглашать игроков может только владелец клана.' });
      return;
    }
    if (clan.memberIds.length >= 30) {
      res.status(400).json({ error: 'В клане уже максимум участников (30).' });
      return;
    }
    const rawUser =
      typeof req.body?.username === 'string'
        ? req.body.username.trim().replace(/^@+/, '')
        : '';
    if (!rawUser) {
      res.status(400).json({ error: 'Введи @юз игрока для приглашения.' });
      return;
    }
    const target = db.accounts.find((a) => a.usernameLower === rawUser.toLowerCase());
    if (!target) {
      res.status(404).json({ error: `Игрок @${rawUser} не найден.` });
      return;
    }
    if (clan.memberIds.includes(target.id)) {
      res.status(400).json({ error: `Игрок @${target.username} уже состоит в твоём клане.` });
      return;
    }
    const otherClan = findUserClan(target.id);
    if (otherClan) {
      res.status(400).json({ error: `Игрок @${target.username} уже состоит в клане [${otherClan.tag}].` });
      return;
    }
    if (!Array.isArray(clan.invites)) clan.invites = [];
    if (clan.invites.some((inv) => inv.userId === target.id)) {
      res.status(400).json({ error: `Приглашение для @${target.username} уже отправлено.` });
      return;
    }
    clan.invites.unshift({
      userId: target.id,
      username: target.username,
      invitedBy: me.username,
      createdAt: Date.now(),
    });
    if (clan.invites.length > 30) clan.invites = clan.invites.slice(0, 30);
    saveDb(db);
    res.json({ ok: true, clan: buildClanDetail(clan, me.id) });
  });

  // Leader cancels a pending invite
  app.post('/api/clans/:id/invite/cancel', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Не авторизован.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (!clan || clan.leaderId !== me.id) {
      res.status(403).json({ error: 'Нет прав на отмену приглашения.' });
      return;
    }
    const targetUserId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    if (Array.isArray(clan.invites)) {
      clan.invites = clan.invites.filter((inv) => inv.userId !== targetUserId);
    }
    saveDb(db);
    res.json({ ok: true, clan: buildClanDetail(clan, me.id) });
  });

  // Invited player accepts an invite
  app.post('/api/clans/:id/invite/accept', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Сначала войди в аккаунт.' });
      return;
    }
    if (findUserClan(me.id)) {
      res.status(400).json({ error: 'Ты уже состоишь в клане. Сначала выйди из текущего.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (!clan) {
      res.status(404).json({ error: 'Клан не найден.' });
      return;
    }
    const invites = Array.isArray(clan.invites) ? clan.invites : [];
    if (!invites.some((inv) => inv.userId === me.id)) {
      res.status(403).json({ error: 'Приглашение не найдено или уже отменено.' });
      return;
    }
    if (clan.memberIds.length >= 30) {
      res.status(400).json({ error: 'В клане уже максимум участников (30).' });
      return;
    }
    clan.memberIds.push(me.id);
    clearUserInvitesEverywhere(me.id);
    pushClanSystemMessage(clan, `@${me.username} принял приглашение и вступил в клан!`);
    saveDb(db);
    res.json({ ok: true, clan: buildClanDetail(clan, me.id) });
  });

  // Invited player declines an invite
  app.post('/api/clans/:id/invite/decline', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Не авторизован.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (clan && Array.isArray(clan.invites)) {
      clan.invites = clan.invites.filter((inv) => inv.userId !== me.id);
      saveDb(db);
    }
    res.json({ ok: true });
  });

  // Leader updates clan settings (name, description, color, avatar, inviteOnly)
  app.post('/api/clans/:id/settings', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Не авторизован.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (!clan) {
      res.status(404).json({ error: 'Клан не найден.' });
      return;
    }
    if (clan.leaderId !== me.id) {
      res.status(403).json({ error: 'Настройки клана доступны только владельцу.' });
      return;
    }

    if (typeof req.body?.name === 'string') {
      const nextName = req.body.name.trim().replace(/\s+/g, ' ');
      if (nextName.length < 3 || nextName.length > 20) {
        res.status(400).json({ error: 'Название клана должно быть от 3 до 20 символов.' });
        return;
      }
      if (
        nextName.toLowerCase() !== clan.nameLower &&
        db.clans.some((c) => c.id !== clan.id && c.nameLower === nextName.toLowerCase())
      ) {
        res.status(409).json({ error: 'Клан с таким названием уже существует.' });
        return;
      }
      clan.name = nextName;
      clan.nameLower = nextName.toLowerCase();
    }

    if (typeof req.body?.description === 'string') {
      clan.description = req.body.description.trim().replace(/\s+/g, ' ').slice(0, 80);
    }

    if (typeof req.body?.color === 'string' && CLAN_COLORS.includes(req.body.color)) {
      clan.color = req.body.color;
    }

    if (typeof req.body?.avatar === 'string') {
      clan.avatar = sanitizeClanAvatar(req.body.avatar);
    }

    if (typeof req.body?.inviteOnly === 'boolean') {
      clan.inviteOnly = req.body.inviteOnly;
    }

    saveDb(db);
    res.json({ ok: true, clan: buildClanDetail(clan, me.id) });
  });

  // Leader transfers clan ownership to another member
  app.post('/api/clans/:id/transfer', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Не авторизован.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (!clan) {
      res.status(404).json({ error: 'Клан не найден.' });
      return;
    }
    if (clan.leaderId !== me.id) {
      res.status(403).json({ error: 'Передать владение может только текущий глава клана.' });
      return;
    }
    const memberId = typeof req.body?.memberId === 'string' ? req.body.memberId.trim() : '';
    if (!memberId || memberId === me.id || !clan.memberIds.includes(memberId)) {
      res.status(400).json({ error: 'Выбери другого участника клана.' });
      return;
    }
    const nextLeader = db.accounts.find((a) => a.id === memberId);
    if (!nextLeader) {
      res.status(404).json({ error: 'Участник не найден.' });
      return;
    }
    clan.leaderId = nextLeader.id;
    if (clan.mutedMembers) delete clan.mutedMembers[nextLeader.id];
    pushClanSystemMessage(
      clan,
      `👑 @${me.username} передал владение кланом игроку @${nextLeader.username}!`
    );
    saveDb(db);
    res.json({ ok: true, clan: buildClanDetail(clan, me.id) });
  });

  // Leader mutes or unmutes a clan member in clan chat
  app.post('/api/clans/:id/mute', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Не авторизован.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (!clan) {
      res.status(404).json({ error: 'Клан не найден.' });
      return;
    }
    if (clan.leaderId !== me.id) {
      res.status(403).json({ error: 'Выдавать мут может только владелец клана.' });
      return;
    }
    const memberId = typeof req.body?.memberId === 'string' ? req.body.memberId.trim() : '';
    const durationMinutes = Number(req.body?.durationMinutes);
    if (!memberId || memberId === me.id || !clan.memberIds.includes(memberId)) {
      res.status(400).json({ error: 'Нельзя выдать мут самому себе или не участнику.' });
      return;
    }
    const target = db.accounts.find((a) => a.id === memberId);
    if (!clan.mutedMembers) clan.mutedMembers = {};

    if (!Number.isFinite(durationMinutes) || durationMinutes === 0) {
      delete clan.mutedMembers[memberId];
      pushClanSystemMessage(
        clan,
        `🔊 @${me.username} снял мут с @${target?.username ?? 'игрока'}.`
      );
    } else if (durationMinutes < 0) {
      clan.mutedMembers[memberId] = -1;
      pushClanSystemMessage(
        clan,
        `🔇 @${me.username} выдал мут @${target?.username ?? 'игроку'} навсегда.`
      );
    } else {
      const clampedMins = Math.min(43200, Math.max(1, Math.floor(durationMinutes)));
      clan.mutedMembers[memberId] = Date.now() + clampedMins * 60_000;
      const durLabel =
        clampedMins >= 60
          ? `${Math.round(clampedMins / 60)} ч.`
          : `${clampedMins} мин.`;
      pushClanSystemMessage(
        clan,
        `🔇 @${me.username} выдал мут @${target?.username ?? 'игроку'} на ${durLabel}`
      );
    }

    saveDb(db);
    res.json({ ok: true, clan: buildClanDetail(clan, me.id) });
  });

  // Leave current clan
  app.post('/api/clans/leave', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Не авторизован.' });
      return;
    }
    const clan = findUserClan(me.id);
    if (!clan) {
      res.status(400).json({ error: 'Ты не состоишь в клане.' });
      return;
    }
    removeUserFromClans(me.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Leader kicks a member
  app.post('/api/clans/:id/kick', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Не авторизован.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (!clan) {
      res.status(404).json({ error: 'Клан не найден.' });
      return;
    }
    if (clan.leaderId !== me.id) {
      res.status(403).json({ error: 'Выгонять участников может только лидер клана.' });
      return;
    }
    const memberId = typeof req.body?.memberId === 'string' ? req.body.memberId.trim() : '';
    if (!memberId || memberId === me.id) {
      res.status(400).json({ error: 'Нельзя выгнать самого себя.' });
      return;
    }
    const target = db.accounts.find((a) => a.id === memberId);
    clan.memberIds = clan.memberIds.filter((id) => id !== memberId);
    if (clan.mutedMembers) delete clan.mutedMembers[memberId];
    if (target) {
      pushClanSystemMessage(clan, `@${me.username} исключил @${target.username} из клана.`);
    }
    saveDb(db);
    res.json({ ok: true, clan: buildClanDetail(clan, me.id) });
  });

  // Post a message to clan chat (respects mutes + supports replyToId)
  app.post('/api/clans/:id/chat', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Не авторизован.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (!clan || !clan.memberIds.includes(me.id)) {
      res.status(403).json({ error: 'Ты не участник этого клана.' });
      return;
    }
    const mutedUntil = getClanMuteUntil(clan, me.id);
    if (mutedUntil === -1) {
      res.status(403).json({ error: 'Тебе выдан мут в чате клана навсегда.' });
      return;
    }
    if (mutedUntil > Date.now()) {
      const minsLeft = Math.max(1, Math.ceil((mutedUntil - Date.now()) / 60_000));
      res.status(403).json({ error: `Ты в муте! Осталось примерно ${minsLeft} мин.` });
      return;
    }

    const text =
      typeof req.body?.text === 'string'
        ? req.body.text.trim().replace(/\s+/g, ' ').slice(0, 240)
        : '';
    if (!text) {
      res.status(400).json({ error: 'Напиши сообщение.' });
      return;
    }

    let replyTo: ClanMessageReply | undefined;
    const replyToId = typeof req.body?.replyToId === 'string' ? req.body.replyToId.trim() : '';
    if (replyToId) {
      const orig = clan.messages.find((m) => m.id === replyToId && !m.system);
      if (orig) {
        replyTo = {
          id: orig.id,
          username: orig.username,
          text: orig.text.slice(0, 80),
        };
      }
    }

    const msg: ClanMessage = {
      id: crypto.randomBytes(6).toString('hex'),
      userId: me.id,
      username: me.username,
      text,
      timestamp: Date.now(),
      ...(replyTo ? { replyTo } : {}),
    };
    clan.messages.push(msg);
    if (clan.messages.length > 80) clan.messages = clan.messages.slice(-80);
    saveDb(db);
    res.json({ ok: true, message: msg, clan: buildClanDetail(clan, me.id) });
  });

  // Delete a message in clan chat (leader or message author)
  app.delete('/api/clans/:id/chat/:msgId', (req, res) => {
    const me = getAuthAccount(req);
    if (!me) {
      res.status(401).json({ error: 'Не авторизован.' });
      return;
    }
    const clan = db.clans.find((c) => c.id === req.params.id);
    if (!clan || !clan.memberIds.includes(me.id)) {
      res.status(403).json({ error: 'Нет доступа.' });
      return;
    }
    const msgId = String(req.params.msgId || '').trim();
    const targetMsg = clan.messages.find((m) => m.id === msgId);
    if (!targetMsg) {
      res.status(404).json({ error: 'Сообщение не найдено.' });
      return;
    }
    if (clan.leaderId !== me.id && targetMsg.userId !== me.id) {
      res.status(403).json({ error: 'Можно удалить только своё сообщение.' });
      return;
    }
    clan.messages = clan.messages.filter((m) => m.id !== msgId);
    saveDb(db);
    res.json({ ok: true, clan: buildClanDetail(clan, me.id) });
  });

  // Delete clan (leader or admin)
  app.delete('/api/clans/:id', (req, res) => {
    const me = getAuthAccount(req);
    const admin = isAdminRequest(req);
    const idx = db.clans.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Клан не найден.' });
      return;
    }
    const clan = db.clans[idx];
    if (!admin && (!me || clan.leaderId !== me.id)) {
      res.status(403).json({ error: 'Удалить клан может только его лидер или админ.' });
      return;
    }
    db.clans.splice(idx, 1);
    saveDb(db);
    res.json({ ok: true });
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

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
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
