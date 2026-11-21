export interface AuthUser {
  id: string;
  username: string;
}

export interface SyncSavePayload {
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

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  coins: number;
  bestRun: number;
  curScooter: string;
  vip?: boolean;
  clanTag?: string;
  clanColor?: string;
  online?: boolean;
  isMe: boolean;
}

export interface AdminLoginLog {
  id: string;
  username: string;
  walletId: string;
  timestamp: number;
  device: string;
}

export type AdminRole = 'owner' | 'moderator' | 'helper' | 'tester';

export interface AdminSessionInfo {
  staffId: string;
  actor: string;
  role: AdminRole;
  roleLabel: string;
}

export interface OnlineAdminInfo {
  id: string;
  displayName: string;
  role: AdminRole;
  roleLabel: string;
  online: boolean;
  lastSeen: number;
}

export interface BugTicketReply {
  id: string;
  adminName: string;
  adminRole: AdminRole;
  adminRoleLabel: string;
  text: string;
  timestamp: number;
}

export interface BugTicket {
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

export interface KickNotice {
  reason: string;
  by: string;
  until: number;
}

export interface AdminUserSummary {
  id: string;
  username: string;
  coins: number;
  vip: boolean;
  curScooter: string;
  online?: boolean;
  updatedAt: number;
  kickedUntil?: number;
  kickReason?: string;
  kickedBy?: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalRegistered: number;
  onlineCount?: number;
  onlineRegisteredCount?: number;
  myRank: number | null;
  myEntry: LeaderboardEntry | null;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

const TOKEN_KEY = 'bs_auth_token_v1';
const USER_KEY = 'bs_auth_user_v1';
const LB_CACHE_KEY = 'bs_cached_lb_v1';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof parsed.id === 'string' && typeof parsed.username === 'string') {
      return { id: parsed.id, username: parsed.username };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: AuthUser) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore storage errors
  }
}

const GLOBAL_WIPE_FLAG = 'bs_wipe_20261121_v1';
const WIPE_CLIENT_KEYS = [
  'ss',
  'bs_local_accounts_v1',
  TOKEN_KEY,
  USER_KEY,
  LB_CACHE_KEY,
  'bs_clans_v1',
  'bs_admin_token_v1',
  'bs_admin_session_v1',
  'bs_used_checks_v1',
  'bs_used_promos_v1',
  'bs_bug_tickets_v1',
];

export function runGlobalClientWipeOnce(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    if (localStorage.getItem(GLOBAL_WIPE_FLAG) === '1') return false;
    for (const k of WIPE_CLIENT_KEYS) {
      localStorage.removeItem(k);
    }
    localStorage.setItem(GLOBAL_WIPE_FLAG, '1');
    return true;
  } catch {
    return false;
  }
}

export function getCachedLeaderboard(): LeaderboardResponse | null {
  try {
    const raw = localStorage.getItem(LB_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LeaderboardResponse>;
    if (Array.isArray(parsed.entries)) {
      return {
        entries: parsed.entries,
        totalRegistered: typeof parsed.totalRegistered === 'number' ? parsed.totalRegistered : parsed.entries.length,
        onlineCount: typeof parsed.onlineCount === 'number' ? parsed.onlineCount : undefined,
        onlineRegisteredCount:
          typeof parsed.onlineRegisteredCount === 'number' ? parsed.onlineRegisteredCount : undefined,
        myRank: typeof parsed.myRank === 'number' ? parsed.myRank : null,
        myEntry: parsed.myEntry ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function cacheLeaderboard(data: LeaderboardResponse) {
  try {
    localStorage.setItem(LB_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore cache write errors
  }
}

const LOCAL_ACCOUNTS_KEY = 'bs_local_accounts_v1';
const FALLBACK_API_ORIGIN =
  'https://ais-pre-m5koscwjvrn7gdvnqadrvf-890183634344.asia-northeast1.run.app';
const USERNAME_RE = /^[a-zA-Z0-9а-яА-ЯёЁ_-]{3,18}$/;

interface LocalStoredAccount {
  id: string;
  username: string;
  usernameLower: string;
  password: string;
  save: SyncSavePayload;
  createdAt: number;
  updatedAt: number;
}

function loadLocalAccounts(): LocalStoredAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalStoredAccount[]) : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(list: LocalStoredAccount[]) {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    // Ignore storage quota errors
  }
}

function isPackagedMobileOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  const proto = window.location?.protocol || '';
  if (proto !== 'http:' && proto !== 'https:') return true;
  const host = window.location?.hostname || '';
  if (host === 'appassets.androidplatform.net') return true;
  return false;
}

type JsonFetchOutcome =
  | { kind: 'json'; ok: boolean; status: number; body: unknown }
  | { kind: 'unreachable' };

async function tryJsonRequest(
  url: string,
  init?: RequestInit,
  timeoutMs = 7000
): Promise<JsonFetchOutcome> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      ...init,
      cache: 'no-store',
      ...(controller ? { signal: controller.signal } : {}),
    });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      return { kind: 'unreachable' };
    }
    const body = await res.json();
    return { kind: 'json', ok: res.ok, status: res.status, body };
  } catch {
    return { kind: 'unreachable' };
  } finally {
    if (timer !== null) window.clearTimeout(timer);
  }
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Fetches JSON from our Express API. Retries transient network/5xx errors with short backoff,
 * and if running inside a packaged Android APK/WebView falls back to the live backend origin.
 */
export async function apiJsonFetch(path: string, init?: RequestInit): Promise<JsonFetchOutcome> {
  const packaged = isPackagedMobileOrigin();
  const sameOrigin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';

  if (!packaged) {
    const delays = [0, 250, 600];
    for (let i = 0; i < delays.length; i++) {
      if (delays[i] > 0) await waitMs(delays[i]);
      const primary = await tryJsonRequest(path, init);
      if (primary.kind === 'json') {
        if (primary.status < 500 || i === delays.length - 1) {
          return primary;
        }
      }
    }
  }

  if (sameOrigin !== FALLBACK_API_ORIGIN) {
    const fallback = await tryJsonRequest(`${FALLBACK_API_ORIGIN}${path}`, init);
    if (fallback.kind === 'json') return fallback;
  }

  return { kind: 'unreachable' };
}

function extractBodyError(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const msg = (body as { error?: unknown }).error;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

function buildLocalLeaderboard(me: AuthUser | null): LeaderboardResponse {
  const cached = getCachedLeaderboard();
  const localAccounts = loadLocalAccounts();
  const merged = new Map<string, LeaderboardEntry>();

  if (cached) {
    for (const entry of cached.entries) {
      merged.set(entry.username.toLowerCase(), { ...entry, isMe: false });
    }
  }
  for (const acc of localAccounts) {
    merged.set(acc.usernameLower, {
      rank: 0,
      id: acc.id,
      username: acc.username,
      coins: Math.floor(acc.save.coins || 0),
      bestRun: Math.floor(acc.save.bestRun || 0),
      curScooter: acc.save.cur || 'c3',
      vip: Boolean(acc.save.vip),
      isMe: false,
    });
  }

  const sorted = Array.from(merged.values()).sort((a, b) => {
    if (b.coins !== a.coins) return b.coins - a.coins;
    return b.bestRun - a.bestRun;
  });

  const meLower = me?.username.toLowerCase() ?? null;
  let myRank: number | null = null;
  let myEntry: LeaderboardEntry | null = null;

  const entries = sorted.slice(0, 50).map((e, i) => {
    const isMe = Boolean(me && (e.id === me.id || e.username.toLowerCase() === meLower));
    const item: LeaderboardEntry = { ...e, rank: i + 1, isMe };
    if (isMe) {
      myRank = i + 1;
      myEntry = item;
    }
    return item;
  });

  return {
    entries,
    totalRegistered: sorted.length,
    myRank,
    myEntry,
  };
}

export async function registerAccount(
  username: string,
  password: string,
  save: SyncSavePayload
): Promise<ApiResult<{ token: string; user: AuthUser; save: SyncSavePayload }>> {
  const cleanUser = username.trim().replace(/^@+/, '');
  if (!USERNAME_RE.test(cleanUser)) {
    return {
      ok: false,
      error: 'Юз должен быть от 3 до 18 символов (буквы, цифры, _ или -).',
    };
  }
  if (password.length < 4 || password.length > 64) {
    return { ok: false, error: 'Пароль должен быть от 4 до 64 символов.' };
  }

  const out = await apiJsonFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: cleanUser, password, save }),
  });

  if (out.kind === 'json') {
    if (!out.ok) {
      return { ok: false, error: extractBodyError(out.body, 'Не удалось создать аккаунт.') };
    }
    const data = out.body as { token: string; user: AuthUser; save: SyncSavePayload };
    saveAuthSession(data.token, data.user);
    // Keep a local mirror so leaderboard & offline mode always see this account
    const locals = loadLocalAccounts();
    const lower = data.user.username.toLowerCase();
    const now = Date.now();
    const existingIdx = locals.findIndex((a) => a.usernameLower === lower);
    const rec: LocalStoredAccount = {
      id: data.user.id,
      username: data.user.username,
      usernameLower: lower,
      password,
      save: data.save,
      createdAt: existingIdx >= 0 ? locals[existingIdx].createdAt : now,
      updatedAt: now,
    };
    if (existingIdx >= 0) locals[existingIdx] = rec;
    else locals.push(rec);
    saveLocalAccounts(locals);
    return { ok: true, data };
  }

  // Offline / packaged mobile fallback: register locally so @юз & leaderboard always work!
  const locals = loadLocalAccounts();
  const lower = cleanUser.toLowerCase();
  if (locals.some((a) => a.usernameLower === lower)) {
    return { ok: false, error: 'Этот юз уже занят на этом устройстве! Войди в аккаунт.' };
  }
  const now = Date.now();
  const id = `loc_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const localAcc: LocalStoredAccount = {
    id,
    username: cleanUser,
    usernameLower: lower,
    password,
    save: { ...save },
    createdAt: now,
    updatedAt: now,
  };
  locals.push(localAcc);
  saveLocalAccounts(locals);
  const token = `local_tok_${id}`;
  const user: AuthUser = { id, username: cleanUser };
  saveAuthSession(token, user);
  return { ok: true, data: { token, user, save: localAcc.save } };
}

export async function loginAccount(
  username: string,
  password: string
): Promise<ApiResult<{ token: string; user: AuthUser; save: SyncSavePayload }>> {
  const cleanUser = username.trim().replace(/^@+/, '');
  if (!cleanUser || !password) {
    return { ok: false, error: 'Введи юз и пароль.' };
  }

  const out = await apiJsonFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: cleanUser, password }),
  });

  if (out.kind === 'json') {
    if (!out.ok) {
      return { ok: false, error: extractBodyError(out.body, 'Не удалось войти в аккаунт.') };
    }
    const data = out.body as { token: string; user: AuthUser; save: SyncSavePayload };
    saveAuthSession(data.token, data.user);
    return { ok: true, data };
  }

  // Offline / packaged mobile fallback
  const locals = loadLocalAccounts();
  const found = locals.find(
    (a) => a.usernameLower === cleanUser.toLowerCase() && a.password === password
  );
  if (found) {
    const token = `local_tok_${found.id}`;
    const user: AuthUser = { id: found.id, username: found.username };
    saveAuthSession(token, user);
    return { ok: true, data: { token, user, save: found.save } };
  }
  return { ok: false, error: 'Неверный юз/пароль или нет связи с сервером.' };
}

let upgradeInFlight: Promise<string | null> | null = null;

/**
 * If the player created an account while offline (`local_tok_...`), automatically
 * registers/logs them in on the live server as soon as connection is available so
 * Top, Clans, and online status work immediately without re-typing a password.
 */
export async function upgradeLocalAccountIfNeeded(): Promise<string | null> {
  const token = getStoredToken();
  if (!token) return null;
  if (!token.startsWith('local_tok_')) return token;

  if (upgradeInFlight) return upgradeInFlight;

  upgradeInFlight = (async () => {
    try {
      const storedUser = getStoredUser();
      const locals = loadLocalAccounts();
      const acc = locals.find(
        (a) =>
          a.id === storedUser?.id ||
          (storedUser && a.usernameLower === storedUser.username.toLowerCase())
      );
      if (!acc) return token;

      let out = await apiJsonFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: acc.username,
          password: acc.password,
          save: acc.save,
        }),
      });

      if (out.kind === 'json' && out.status === 409) {
        out = await apiJsonFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: acc.username,
            password: acc.password,
          }),
        });
      }

      if (out.kind === 'json' && out.ok) {
        const data = out.body as { token: string; user: AuthUser; save: SyncSavePayload };
        if (data?.token && data?.user) {
          saveAuthSession(data.token, data.user);
          const nextLocals = loadLocalAccounts();
          const idx = nextLocals.findIndex(
            (a) => a.id === acc.id || a.usernameLower === data.user.username.toLowerCase()
          );
          if (idx >= 0) {
            nextLocals[idx] = {
              ...nextLocals[idx],
              id: data.user.id,
              username: data.user.username,
              updatedAt: Date.now(),
            };
            saveLocalAccounts(nextLocals);
          }
          return data.token;
        }
      }
      return token;
    } finally {
      upgradeInFlight = null;
    }
  })();

  return upgradeInFlight;
}

async function resolveServerUserToken(): Promise<string | null> {
  const token = await upgradeLocalAccountIfNeeded();
  if (!token || token.startsWith('local_tok_')) return null;
  return token;
}

export async function fetchMe(): Promise<
  ApiResult<{
    user: AuthUser;
    save: SyncSavePayload;
    coinsOverride?: number;
    saveOverride?: SyncSavePayload;
  }> & {
    unauthorized?: boolean;
    kicked?: KickNotice;
  }
> {
  let token = getStoredToken();
  if (!token) {
    return { ok: false, error: 'Не авторизован', unauthorized: true };
  }
  if (token.startsWith('local_tok_')) {
    token = (await upgradeLocalAccountIfNeeded()) ?? token;
  }
  if (token.startsWith('local_tok_')) {
    const storedUser = getStoredUser();
    const locals = loadLocalAccounts();
    const acc = locals.find(
      (a) => a.id === storedUser?.id || (storedUser && a.usernameLower === storedUser.username.toLowerCase())
    );
    if (acc) {
      return {
        ok: true,
        data: { user: { id: acc.id, username: acc.username }, save: acc.save },
      };
    }
    return { ok: false, error: 'Офлайн-режим' };
  }

  const out = await apiJsonFetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (out.kind === 'unreachable') {
    return { ok: false, error: 'Офлайн-режим' };
  }
  if (out.status === 403 && out.body && typeof out.body === 'object' && (out.body as { kicked?: boolean }).kicked) {
    const b = out.body as { kickReason?: string; kickedBy?: string; kickUntil?: number; error?: string };
    clearAuthSession();
    return {
      ok: false,
      error: b.error || 'Тебя кикнул администратор.',
      unauthorized: true,
      kicked: {
        reason: b.kickReason || 'Нарушение правил игры',
        by: b.kickedBy || 'Администратор',
        until: typeof b.kickUntil === 'number' ? b.kickUntil : 0,
      },
    };
  }
  if (out.status === 401) {
    clearAuthSession();
    return { ok: false, error: 'Сессия истекла', unauthorized: true };
  }
  if (!out.ok) {
    return { ok: false, error: extractBodyError(out.body, 'Ошибка загрузки профиля.') };
  }
  const data = out.body as {
    user: AuthUser;
    save: SyncSavePayload;
    coinsOverride?: number;
    saveOverride?: SyncSavePayload;
  };
  saveAuthSession(token, data.user);
  return { ok: true, data };
}

export async function syncProfile(save: SyncSavePayload): Promise<{
  ok: boolean;
  vip?: boolean;
  coinsOverride?: number;
  saveOverride?: SyncSavePayload;
  unauthorized?: boolean;
  kicked?: KickNotice;
}> {
  let token = getStoredToken();
  const storedUser = getStoredUser();
  if (!token) return { ok: false };

  // Always update local mirror so local leaderboard & offline admin stay in sync
  if (storedUser) {
    const locals = loadLocalAccounts();
    const idx = locals.findIndex(
      (a) => a.id === storedUser.id || a.usernameLower === storedUser.username.toLowerCase()
    );
    if (idx >= 0) {
      locals[idx] = { ...locals[idx], save: { ...save }, updatedAt: Date.now() };
      saveLocalAccounts(locals);
    }
  }

  if (token.startsWith('local_tok_')) {
    token = (await upgradeLocalAccountIfNeeded()) ?? token;
  }

  if (token.startsWith('local_tok_')) {
    return { ok: true, vip: Boolean(save.vip) };
  }

  const out = await apiJsonFetch('/api/profile/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ save }),
  });
  if (out.kind === 'unreachable') return { ok: false };
  if (out.status === 403 && out.body && typeof out.body === 'object' && (out.body as { kicked?: boolean }).kicked) {
    const b = out.body as { kickReason?: string; kickedBy?: string; kickUntil?: number };
    clearAuthSession();
    return {
      ok: false,
      unauthorized: true,
      kicked: {
        reason: b.kickReason || 'Нарушение правил игры',
        by: b.kickedBy || 'Администратор',
        until: typeof b.kickUntil === 'number' ? b.kickUntil : 0,
      },
    };
  }
  if (out.status === 401) {
    clearAuthSession();
    return { ok: false, unauthorized: true };
  }
  if (!out.ok) return { ok: false };
  const data = out.body as {
    ok?: boolean;
    vip?: boolean;
    coinsOverride?: number;
    saveOverride?: SyncSavePayload;
  };
  return {
    ok: true,
    vip: typeof data.vip === 'boolean' ? data.vip : undefined,
    coinsOverride: typeof data.coinsOverride === 'number' ? data.coinsOverride : undefined,
    saveOverride: data.saveOverride,
  };
}

export async function fetchLeaderboard(): Promise<
  ApiResult<LeaderboardResponse> & { fromCache?: boolean }
> {
  const token = await resolveServerUserToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const out = await apiJsonFetch('/api/leaderboard', { headers });
  if (out.kind === 'json' && out.ok) {
    const data = out.body as LeaderboardResponse;
    cacheLeaderboard(data);
    return { ok: true, data };
  }
  // Always show merged cached + local registered leaderboard when offline / standalone APK
  const localLb = buildLocalLeaderboard(getStoredUser());
  return { ok: true, data: localLb, fromCache: true };
}

export interface PresenceStatusResponse {
  ok: boolean;
  onlinePlayersCount: number;
  onlineUsersCount: number;
  onlineAdminsCount: number;
  staff: OnlineAdminInfo[];
}

export async function pingPresenceHeartbeat(
  clientId: string,
  scooter: string
): Promise<PresenceStatusResponse | null> {
  const userToken = await resolveServerUserToken();
  const adminToken = getStoredAdminToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userToken) headers.Authorization = `Bearer ${userToken}`;
  if (adminToken && !adminToken.startsWith('local_unlocked_')) {
    headers['x-admin-token'] = adminToken;
  }
  const out = await apiJsonFetch('/api/presence/heartbeat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ clientId, scooter }),
  });
  if (out.kind === 'json' && out.ok) {
    const data = out.body as Partial<PresenceStatusResponse>;
    return {
      ok: true,
      onlinePlayersCount:
        typeof data.onlinePlayersCount === 'number' ? data.onlinePlayersCount : 1,
      onlineUsersCount: typeof data.onlineUsersCount === 'number' ? data.onlineUsersCount : 0,
      onlineAdminsCount: typeof data.onlineAdminsCount === 'number' ? data.onlineAdminsCount : 0,
      staff: Array.isArray(data.staff) ? data.staff : [],
    };
  }
  return null;
}

export async function fetchPresenceStatus(): Promise<PresenceStatusResponse | null> {
  const out = await apiJsonFetch('/api/presence');
  if (out.kind === 'json' && out.ok) {
    const data = out.body as Partial<PresenceStatusResponse>;
    return {
      ok: true,
      onlinePlayersCount:
        typeof data.onlinePlayersCount === 'number' ? data.onlinePlayersCount : 0,
      onlineUsersCount: typeof data.onlineUsersCount === 'number' ? data.onlineUsersCount : 0,
      onlineAdminsCount: typeof data.onlineAdminsCount === 'number' ? data.onlineAdminsCount : 0,
      staff: Array.isArray(data.staff) ? data.staff : [],
    };
  }
  return null;
}

// ── Persistent Admin Session & Audit Logs + Kick + Support Tickets ──

const ADMIN_TOKEN_KEY = 'bs_admin_token_v1';
const ADMIN_SESSION_KEY = 'bs_admin_session_v1';
const ADMIN_LOCAL_LOGS_KEY = 'bs_admin_local_logs_v1';
const LOCAL_TICKETS_KEY = 'bs_local_bug_tickets_v1';

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredAdminSession(): AdminSessionInfo | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminSessionInfo>;
    if (
      typeof parsed.staffId === 'string' &&
      typeof parsed.actor === 'string' &&
      (parsed.role === 'owner' ||
        parsed.role === 'moderator' ||
        parsed.role === 'helper' ||
        parsed.role === 'tester')
    ) {
      return {
        staffId: parsed.staffId,
        actor: parsed.actor,
        role: parsed.role,
        roleLabel: parsed.roleLabel || 'Администратор',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAdminToken(token: string, session?: AdminSessionInfo) {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    if (session) {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

export async function logoutAdminServer(): Promise<void> {
  const token = getStoredAdminToken();
  clearAdminToken();
  if (token && !token.startsWith('local_unlocked_')) {
    await apiJsonFetch('/api/admin/logout', {
      method: 'POST',
      headers: { 'x-admin-token': token },
    });
  }
}

function appendLocalAdminLog(entry: AdminLoginLog) {
  try {
    const existing = getLocalAdminLogs();
    const next = [entry, ...existing.filter((x) => x.id !== entry.id)].slice(0, 50);
    localStorage.setItem(ADMIN_LOCAL_LOGS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
}

export function getLocalAdminLogs(): AdminLoginLog[] {
  try {
    const raw = localStorage.getItem(ADMIN_LOCAL_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminLoginLog[]) : [];
  } catch {
    return [];
  }
}

function matchOfflineAdmin(usernameOrPass1: string, passwordOrPass2: string): AdminSessionInfo | null {
  const u = usernameOrPass1.trim().replace(/^@+/, '').toLowerCase();
  const p = passwordOrPass2.trim();
  if (
    (usernameOrPass1.trim() === 'BLACK7772' && p === 'B7772') ||
    ((u === 'black' || u === 'blackda4k') && (p === 'BLACK7772' || p === 'B7772'))
  ) {
    return {
      staffId: 'black',
      actor: 'BLACK',
      role: 'owner',
      roleLabel: 'Главный админ · Создатель',
    };
  }
  if ((u === 'shampyr' || u === 'shampyp') && p === 'yfyfyyfy') {
    return {
      staffId: 'shampyr',
      actor: 'Shampyr',
      role: 'moderator',
      roleLabel: 'Модератор · Тестер · Помощник',
    };
  }
  if (u === 'stantf1' && p === 'sixseven52') {
    return {
      staffId: 'stantf1',
      actor: 'StantF1',
      role: 'helper',
      roleLabel: 'Помощник · Тестер',
    };
  }
  if (
    (u === 'bmx_pidar' || u === 'bmxer_pidor' || u === 'bmx_pidor' || u === 'bmxer_pidar') &&
    p === '03082016'
  ) {
    return {
      staffId: 'bmx_pidar',
      actor: 'BMX_PIDAR',
      role: 'tester',
      roleLabel: 'Тестер',
    };
  }
  if (u === 'romanon' && p === '123o45po') {
    return {
      staffId: 'romanon',
      actor: 'Romanon',
      role: 'tester',
      roleLabel: 'Тестер',
    };
  }
  return null;
}

export async function loginAdmin(
  usernameOrPass1: string,
  passwordOrPass2: string,
  walletId: string
): Promise<ApiResult<{ adminToken: string; session: AdminSessionInfo; log: AdminLoginLog }>> {
  const userToken = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userToken && !userToken.startsWith('local_tok_')) {
    headers.Authorization = `Bearer ${userToken}`;
  }

  const out = await apiJsonFetch('/api/admin/login', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      username: usernameOrPass1,
      password: passwordOrPass2,
      pass1: usernameOrPass1,
      pass2: passwordOrPass2,
      walletId,
    }),
  });

  if (out.kind === 'json') {
    if (!out.ok) {
      return { ok: false, error: extractBodyError(out.body, 'Неверный юз или пароль администратора.') };
    }
    const data = out.body as {
      adminToken: string;
      session?: AdminSessionInfo;
      log: AdminLoginLog;
    };
    if (!data.session) {
      return { ok: false, error: 'Не удалось определить роль администратора.' };
    }
    const session: AdminSessionInfo = data.session;
    saveAdminToken(data.adminToken, session);
    if (data.log) appendLocalAdminLog(data.log);
    return { ok: true, data: { adminToken: data.adminToken, session, log: data.log } };
  }

  // Offline / PWA fallback for BLACK, Shampyr, StantF1, BMX_PIDAR
  const matched = matchOfflineAdmin(usernameOrPass1, passwordOrPass2);
  if (matched) {
    const roleShort =
      matched.role === 'owner'
        ? 'Главный'
        : matched.role === 'moderator'
          ? 'Модератор'
          : matched.role === 'helper'
            ? 'Помощник'
            : 'Тестер';
    const log: AdminLoginLog = {
      id: `local-${Date.now()}`,
      username: `${matched.actor} (${roleShort})`,
      walletId: walletId || '—',
      timestamp: Date.now(),
      device: 'Телефон (Офлайн)',
    };
    const localToken = `local_unlocked_${matched.staffId}_${Date.now()}`;
    saveAdminToken(localToken, matched);
    appendLocalAdminLog(log);
    return { ok: true, data: { adminToken: localToken, session: matched, log } };
  }
  return { ok: false, error: 'Неверный юз или пароль администратора.' };
}

export async function verifyStoredAdminToken(): Promise<AdminSessionInfo | null> {
  const token = getStoredAdminToken();
  if (!token) return null;
  const cachedSession = getStoredAdminSession();
  if (token.startsWith('local_unlocked_')) {
    return cachedSession;
  }
  const out = await apiJsonFetch('/api/admin/verify', {
    headers: { 'x-admin-token': token },
  });
  if (out.kind === 'unreachable') {
    return cachedSession;
  }
  if (out.status === 401) {
    clearAdminToken();
    return null;
  }
  if (out.ok && out.body && typeof out.body === 'object') {
    const body = out.body as { session?: AdminSessionInfo };
    const sess = body.session ?? cachedSession;
    if (!sess) return null;
    saveAdminToken(token, sess);
    return sess;
  }
  return null;
}

export async function pingAdminHeartbeat(): Promise<OnlineAdminInfo[] | null> {
  const token = getStoredAdminToken();
  if (!token || token.startsWith('local_unlocked_')) return null;
  const out = await apiJsonFetch('/api/admin/heartbeat', {
    method: 'POST',
    headers: { 'x-admin-token': token },
  });
  if (out.kind === 'json' && out.ok) {
    const body = out.body as { staff?: OnlineAdminInfo[] };
    return Array.isArray(body.staff) ? body.staff : null;
  }
  if (out.kind === 'json' && out.status === 401) {
    clearAdminToken();
  }
  return null;
}

export async function kickAdminUser(
  username: string,
  reason: string,
  durationMinutes = 0
): Promise<ApiResult<{ username: string; kickUntil: number; reason: string; kickedBy: string }>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (token.startsWith('local_unlocked_')) {
    return {
      ok: true,
      data: {
        username: username.replace(/^@+/, ''),
        kickUntil: durationMinutes > 0 ? Date.now() + durationMinutes * 60_000 : 0,
        reason: reason || 'Нарушение правил игры',
        kickedBy: getStoredAdminSession()?.actor || 'Админ',
      },
    };
  }
  const out = await apiJsonFetch('/api/admin/kick', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
    body: JSON.stringify({ username, reason, durationMinutes }),
  });
  if (out.kind === 'unreachable') {
    return { ok: false, error: 'Нет связи с сервером для кика.' };
  }
  if (!out.ok) {
    return { ok: false, error: extractBodyError(out.body, 'Не удалось кикнуть игрока.') };
  }
  return {
    ok: true,
    data: out.body as { username: string; kickUntil: number; reason: string; kickedBy: string },
  };
}

export async function unkickAdminUser(username: string): Promise<ApiResult<{ username: string }>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  const out = await apiJsonFetch('/api/admin/unkick', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
    body: JSON.stringify({ username }),
  });
  if (out.kind === 'unreachable') {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
  if (!out.ok) {
    return { ok: false, error: extractBodyError(out.body, 'Не удалось снять кик.') };
  }
  return { ok: true, data: out.body as { username: string } };
}

// ── Online Admins & In-Game Bug Support Tickets ──

function loadLocalBugTickets(): BugTicket[] {
  try {
    const raw = localStorage.getItem(LOCAL_TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BugTicket[]) : [];
  } catch {
    return [];
  }
}

function saveLocalBugTickets(list: BugTicket[]) {
  try {
    localStorage.setItem(LOCAL_TICKETS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // Ignore storage errors
  }
}

export async function fetchSupportStatus(): Promise<{
  staff: OnlineAdminInfo[];
  onlineCount: number;
}> {
  const out = await apiJsonFetch('/api/support/status');
  if (out.kind === 'json' && out.ok) {
    const data = out.body as { staff?: OnlineAdminInfo[]; onlineCount?: number };
    const staff = Array.isArray(data.staff) ? data.staff : [];
    return {
      staff,
      onlineCount: typeof data.onlineCount === 'number' ? data.onlineCount : staff.filter((s) => s.online).length,
    };
  }
  const localAdmin = getStoredAdminSession();
  const fallback: OnlineAdminInfo[] = [
    {
      id: 'black',
      displayName: 'BLACK',
      role: 'owner',
      roleLabel: 'Главный админ · Создатель',
      online: localAdmin?.staffId === 'black',
      lastSeen: 0,
    },
    {
      id: 'shampyr',
      displayName: 'Shampyr',
      role: 'moderator',
      roleLabel: 'Модератор · Тестер · Помощник',
      online: localAdmin?.staffId === 'shampyr',
      lastSeen: 0,
    },
    {
      id: 'stantf1',
      displayName: 'StantF1',
      role: 'helper',
      roleLabel: 'Помощник · Тестер',
      online: localAdmin?.staffId === 'stantf1',
      lastSeen: 0,
    },
    {
      id: 'bmx_pidar',
      displayName: 'BMX_PIDAR',
      role: 'tester',
      roleLabel: 'Тестер',
      online: localAdmin?.staffId === 'bmx_pidar',
      lastSeen: 0,
    },
    {
      id: 'romanon',
      displayName: 'Romanon',
      role: 'tester',
      roleLabel: 'Тестер',
      online: localAdmin?.staffId === 'romanon',
      lastSeen: 0,
    },
  ];
  return { staff: fallback, onlineCount: fallback.filter((s) => s.online).length };
}

export async function fetchMyBugTickets(clientId: string): Promise<BugTicket[]> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token && !token.startsWith('local_tok_')) {
    headers.Authorization = `Bearer ${token}`;
  }
  const out = await apiJsonFetch(
    `/api/support/tickets?clientId=${encodeURIComponent(clientId)}`,
    { headers }
  );
  if (out.kind === 'json' && out.ok) {
    const data = out.body as { tickets?: BugTicket[] };
    const list = Array.isArray(data.tickets) ? data.tickets : [];
    saveLocalBugTickets(list);
    return list;
  }
  return loadLocalBugTickets();
}

export async function submitBugTicket(params: {
  category: 'bug' | 'help' | 'idea';
  text: string;
  scooter: string;
  clientId: string;
  guestName?: string;
}): Promise<ApiResult<BugTicket>> {
  const token = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token && !token.startsWith('local_tok_')) {
    headers.Authorization = `Bearer ${token}`;
  }
  const out = await apiJsonFetch('/api/support/tickets', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (out.kind === 'json') {
    if (!out.ok) {
      return { ok: false, error: extractBodyError(out.body, 'Не удалось отправить обращение.') };
    }
    const data = out.body as { ticket: BugTicket };
    const prev = loadLocalBugTickets();
    saveLocalBugTickets([data.ticket, ...prev.filter((t) => t.id !== data.ticket.id)]);
    return { ok: true, data: data.ticket };
  }
  // Offline local save so user never loses their message
  const localTicket: BugTicket = {
    id: `local-${Date.now()}`,
    clientId: params.clientId,
    username: getStoredUser() ? `@${getStoredUser()!.username}` : params.guestName || 'Гость',
    category: params.category,
    text: params.text.trim(),
    scooter: params.scooter,
    device: 'Офлайн',
    status: 'open',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    replies: [],
  };
  saveLocalBugTickets([localTicket, ...loadLocalBugTickets()]);
  return { ok: true, data: localTicket };
}

export async function fetchAdminBugTickets(): Promise<ApiResult<BugTicket[]>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (token.startsWith('local_unlocked_')) {
    return { ok: true, data: loadLocalBugTickets() };
  }
  const out = await apiJsonFetch('/api/admin/tickets', {
    headers: { 'x-admin-token': token },
  });
  if (out.kind === 'json') {
    if (!out.ok) {
      return { ok: false, error: extractBodyError(out.body, 'Не удалось загрузить обращения.') };
    }
    const data = out.body as { tickets?: BugTicket[] };
    return { ok: true, data: Array.isArray(data.tickets) ? data.tickets : [] };
  }
  return { ok: true, data: loadLocalBugTickets() };
}

export async function replyAdminBugTicket(
  ticketId: string,
  text: string,
  markResolved = false
): Promise<ApiResult<BugTicket>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (token.startsWith('local_unlocked_')) {
    const sess = getStoredAdminSession();
    const list = loadLocalBugTickets();
    const target = list.find((t) => t.id === ticketId);
    if (!target) return { ok: false, error: 'Обращение не найдено.' };
    target.replies.push({
      id: `rep-${Date.now()}`,
      adminName: sess?.actor || 'Админ',
      adminRole: sess?.role || 'owner',
      adminRoleLabel: sess?.roleLabel || 'Администратор',
      text: text.trim(),
      timestamp: Date.now(),
    });
    if (markResolved) target.status = 'resolved';
    else if (target.status === 'open') target.status = 'in_progress';
    target.updatedAt = Date.now();
    saveLocalBugTickets(list);
    return { ok: true, data: target };
  }
  const out = await apiJsonFetch(`/api/admin/tickets/${encodeURIComponent(ticketId)}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
    body: JSON.stringify({ text, markResolved }),
  });
  if (out.kind === 'unreachable') {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
  if (!out.ok) {
    return { ok: false, error: extractBodyError(out.body, 'Не удалось отправить ответ.') };
  }
  const data = out.body as { ticket: BugTicket };
  return { ok: true, data: data.ticket };
}

export async function updateBugTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved'
): Promise<ApiResult<BugTicket>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (token.startsWith('local_unlocked_')) {
    const list = loadLocalBugTickets();
    const target = list.find((t) => t.id === ticketId);
    if (!target) return { ok: false, error: 'Обращение не найдено.' };
    target.status = status;
    target.updatedAt = Date.now();
    saveLocalBugTickets(list);
    return { ok: true, data: target };
  }
  const out = await apiJsonFetch(`/api/admin/tickets/${encodeURIComponent(ticketId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
    body: JSON.stringify({ status }),
  });
  if (out.kind === 'unreachable') {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
  if (!out.ok) {
    return { ok: false, error: extractBodyError(out.body, 'Не удалось обновить статус.') };
  }
  const data = out.body as { ticket: BugTicket };
  return { ok: true, data: data.ticket };
}

export async function deleteBugTicket(ticketId: string): Promise<ApiResult<{ deletedId: string }>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (token.startsWith('local_unlocked_')) {
    saveLocalBugTickets(loadLocalBugTickets().filter((t) => t.id !== ticketId));
    return { ok: true, data: { deletedId: ticketId } };
  }
  const out = await apiJsonFetch(`/api/admin/tickets/${encodeURIComponent(ticketId)}`, {
    method: 'DELETE',
    headers: { 'x-admin-token': token },
  });
  if (out.kind === 'unreachable') {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
  if (!out.ok) {
    return { ok: false, error: extractBodyError(out.body, 'Не удалось удалить обращение.') };
  }
  return { ok: true, data: out.body as { deletedId: string } };
}

export async function fetchAdminLogs(): Promise<ApiResult<AdminLoginLog[]>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (token.startsWith('local_unlocked_')) {
    return { ok: true, data: getLocalAdminLogs() };
  }
  const out = await apiJsonFetch('/api/admin/logs', {
    headers: { 'x-admin-token': token },
  });
  if (out.kind === 'json' && out.ok) {
    const data = out.body as { logs?: AdminLoginLog[] };
    return { ok: true, data: Array.isArray(data.logs) ? data.logs : [] };
  }
  return { ok: true, data: getLocalAdminLogs() };
}

function listLocalAdminUsers(): AdminUserSummary[] {
  return loadLocalAccounts().map((a) => ({
    id: a.id,
    username: a.username,
    coins: Math.floor(a.save.coins || 0),
    vip: Boolean(a.save.vip),
    curScooter: a.save.cur || 'c3',
    updatedAt: a.updatedAt,
  }));
}

export async function fetchAdminUsers(): Promise<ApiResult<AdminUserSummary[]>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (token.startsWith('local_unlocked_')) {
    return { ok: true, data: listLocalAdminUsers() };
  }
  const out = await apiJsonFetch('/api/admin/users', {
    headers: { 'x-admin-token': token },
  });
  if (out.kind === 'json') {
    if (!out.ok) {
      return { ok: false, error: extractBodyError(out.body, 'Не удалось загрузить игроков.') };
    }
    const data = out.body as { users?: AdminUserSummary[] };
    return { ok: true, data: Array.isArray(data.users) ? data.users : [] };
  }
  return { ok: true, data: listLocalAdminUsers() };
}

function isStoredBlackOwner(): boolean {
  const sess = getStoredAdminSession();
  return Boolean(sess && sess.staffId === 'black' && sess.role === 'owner');
}

export async function setAdminUserVip(
  _username: string,
  _vip: boolean
): Promise<ApiResult<AdminUserSummary>> {
  return { ok: false, error: 'Выдача VIP ×2 отключена.' };
}

export async function adjustAdminUserCoins(
  username: string,
  mode: 'add' | 'remove' | 'set',
  amount: number
): Promise<ApiResult<AdminUserSummary>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (!isStoredBlackOwner()) {
    return { ok: false, error: 'Только главный админ BLACK может менять монеты.' };
  }
  if (!token.startsWith('local_unlocked_')) {
    const out = await apiJsonFetch('/api/admin/coins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ username, mode, amount }),
    });
    if (out.kind === 'json') {
      if (!out.ok) {
        return { ok: false, error: extractBodyError(out.body, 'Не удалось изменить баланс игрока.') };
      }
      const data = out.body as { user: AdminUserSummary };
      return { ok: true, data: data.user };
    }
  }
  const clean = username.trim().replace(/^@+/, '').toLowerCase();
  const locals = loadLocalAccounts();
  const acc = locals.find((a) => a.usernameLower === clean);
  if (!acc) return { ok: false, error: `Игрок @${username.replace(/^@+/, '')} не найден.` };
  if (mode === 'set') acc.save.coins = Math.max(0, Math.floor(amount));
  else if (mode === 'add') acc.save.coins = Math.min(999_999_999, Math.floor(acc.save.coins + amount));
  else acc.save.coins = Math.max(0, Math.floor(acc.save.coins - amount));
  acc.updatedAt = Date.now();
  saveLocalAccounts(locals);
  return {
    ok: true,
    data: {
      id: acc.id,
      username: acc.username,
      coins: acc.save.coins,
      vip: Boolean(acc.save.vip),
      curScooter: acc.save.cur,
      updatedAt: acc.updatedAt,
    },
  };
}

export async function resetAdminUser(
  username: string
): Promise<ApiResult<AdminUserSummary>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (!isStoredBlackOwner()) {
    return { ok: false, error: 'Только главный админ BLACK может обнулять аккаунты.' };
  }
  if (!token.startsWith('local_unlocked_')) {
    const out = await apiJsonFetch('/api/admin/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ username }),
    });
    if (out.kind === 'json') {
      if (!out.ok) {
        return { ok: false, error: extractBodyError(out.body, 'Не удалось обнулить аккаунт.') };
      }
      const data = out.body as { user: AdminUserSummary };
      return { ok: true, data: data.user };
    }
  }
  const clean = username.trim().replace(/^@+/, '').toLowerCase();
  const locals = loadLocalAccounts();
  const acc = locals.find((a) => a.usernameLower === clean);
  if (!acc) return { ok: false, error: `Игрок @${username.replace(/^@+/, '')} не найден.` };
  acc.save = {
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
  acc.updatedAt = Date.now();
  saveLocalAccounts(locals);
  return {
    ok: true,
    data: {
      id: acc.id,
      username: acc.username,
      coins: 0,
      vip: false,
      curScooter: 'c3',
      updatedAt: acc.updatedAt,
    },
  };
}

export async function wipeAllAdminUsers(): Promise<ApiResult<{ resetCount: number }>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (!isStoredBlackOwner()) {
    return { ok: false, error: 'Только главный админ BLACK может обнулить все аккаунты.' };
  }
  if (!token.startsWith('local_unlocked_')) {
    const out = await apiJsonFetch('/api/admin/wipe-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({}),
    });
    if (out.kind === 'json') {
      if (!out.ok) {
        return { ok: false, error: extractBodyError(out.body, 'Не удалось обнулить все аккаунты.') };
      }
      const data = out.body as { resetCount?: number };
      return { ok: true, data: { resetCount: typeof data.resetCount === 'number' ? data.resetCount : 0 } };
    }
  }
  const locals = loadLocalAccounts();
  const now = Date.now();
  for (const acc of locals) {
    acc.save = {
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
    acc.updatedAt = now;
  }
  saveLocalAccounts(locals);
  try {
    localStorage.removeItem('bs_clans_v1');
    localStorage.removeItem('bs_used_checks_v1');
    localStorage.removeItem('bs_bug_tickets_v1');
  } catch {
    // Ignore storage cleanup errors
  }
  return { ok: true, data: { resetCount: locals.length } };
}

export async function deleteAdminUser(
  userId: string
): Promise<ApiResult<{ deletedId: string; deletedUsername: string }>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  if (!isStoredBlackOwner()) {
    return { ok: false, error: 'Только главный админ BLACK может удалять аккаунты.' };
  }
  if (!token.startsWith('local_unlocked_')) {
    const out = await apiJsonFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-token': token,
      },
    });
    if (out.kind === 'json') {
      if (!out.ok) {
        return { ok: false, error: extractBodyError(out.body, 'Не удалось удалить аккаунт.') };
      }
      const data = out.body as { deletedId: string; deletedUsername: string };
      return { ok: true, data };
    }
  }
  const locals = loadLocalAccounts();
  const idx = locals.findIndex((a) => a.id === userId);
  if (idx === -1) return { ok: false, error: 'Аккаунт не найден.' };
  const removed = locals.splice(idx, 1)[0];
  saveLocalAccounts(locals);
  return { ok: true, data: { deletedId: removed.id, deletedUsername: removed.username } };
}

// ── CLANS API ──

export const CLAN_CREATE_COST = 1_000_000;

export interface ClanMember {
  id: string;
  username: string;
  coins: number;
  bestRun: number;
  curScooter: string;
  vip: boolean;
  isLeader: boolean;
  online?: boolean;
  mutedUntil: number; // 0 = not muted, -1 = forever, >0 = timestamp ms
}

export interface ClanMessageReply {
  id: string;
  username: string;
  text: string;
}

export interface ClanMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  system?: boolean;
  replyTo?: ClanMessageReply;
}

export interface ClanInvite {
  userId: string;
  username: string;
  invitedBy: string;
  createdAt: number;
}

export interface PendingClanInvite {
  clanId: string;
  clanName: string;
  clanTag: string;
  clanColor: string;
  clanAvatar: string;
  memberCount: number;
  totalCoins: number;
  invitedBy: string;
  createdAt: number;
}

export interface ClanSummary {
  id: string;
  name: string;
  tag: string;
  description: string;
  color: string;
  avatar: string;
  inviteOnly: boolean;
  leaderId: string;
  leaderUsername: string;
  memberCount: number;
  onlineCount?: number;
  totalCoins: number;
  isMember: boolean;
  isLeader: boolean;
  isInvited: boolean;
  createdAt: number;
}

export interface ClanDetail extends ClanSummary {
  members: ClanMember[];
  invites: ClanInvite[];
  myMutedUntil: number;
  messages: ClanMessage[];
}

export interface ClansResponse {
  clans: ClanSummary[];
  myClan: ClanDetail | null;
  myInvites: PendingClanInvite[];
  onlinePlayersCount?: number;
  createCost: number;
}

export async function fetchClans(): Promise<ApiResult<ClansResponse>> {
  const token = await resolveServerUserToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const out = await apiJsonFetch('/api/clans', { headers });
  if (out.kind === 'unreachable') {
    return { ok: false, error: 'Нет связи с сервером. Проверь интернет и нажми «Повторить».' };
  }
  if (!out.ok) {
    return { ok: false, error: extractBodyError(out.body, 'Не удалось загрузить кланы.') };
  }
  const data = out.body as ClansResponse;
  return {
    ok: true,
    data: {
      clans: Array.isArray(data.clans) ? data.clans : [],
      myClan: data.myClan ?? null,
      myInvites: Array.isArray(data.myInvites) ? data.myInvites : [],
      onlinePlayersCount:
        typeof data.onlinePlayersCount === 'number' ? data.onlinePlayersCount : undefined,
      createCost: typeof data.createCost === 'number' ? data.createCost : CLAN_CREATE_COST,
    },
  };
}

export async function createClan(params: {
  name: string;
  tag: string;
  description: string;
  color: string;
  avatar: string;
  inviteOnly: boolean;
}): Promise<ApiResult<{ clan: ClanDetail; newCoins: number }>> {
  if (!getStoredToken()) return { ok: false, error: 'Сначала войди или создай аккаунт (@юз).' };
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет связи с сервером для создания клана.' };
  const out = await apiJsonFetch('/api/clans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось создать клан.') };
  return { ok: true, data: out.body as { clan: ClanDetail; newCoins: number } };
}

export async function joinClan(clanId: string): Promise<ApiResult<ClanDetail>> {
  if (!getStoredToken()) return { ok: false, error: 'Сначала войди или создай аккаунт (@юз).' };
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет связи с сервером для входа в клан.' };
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось вступить в клан.') };
  return { ok: true, data: (out.body as { clan: ClanDetail }).clan };
}

export async function inviteToClan(
  clanId: string,
  username: string
): Promise<ApiResult<ClanDetail>> {
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет авторизации на сервере.' };
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось отправить приглашение.') };
  return { ok: true, data: (out.body as { clan: ClanDetail }).clan };
}

export async function cancelClanInvite(
  clanId: string,
  userId: string
): Promise<ApiResult<ClanDetail>> {
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет авторизации на сервере.' };
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}/invite/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось отменить приглашение.') };
  return { ok: true, data: (out.body as { clan: ClanDetail }).clan };
}

export async function acceptClanInvite(clanId: string): Promise<ApiResult<ClanDetail>> {
  if (!getStoredToken()) return { ok: false, error: 'Сначала войди в аккаунт.' };
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет связи с сервером.' };
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}/invite/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось принять приглашение.') };
  return { ok: true, data: (out.body as { clan: ClanDetail }).clan };
}

export async function declineClanInvite(clanId: string): Promise<ApiResult<true>> {
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет авторизации на сервере.' };
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}/invite/decline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось отклонить приглашение.') };
  return { ok: true, data: true };
}

export async function updateClanSettings(
  clanId: string,
  patch: {
    name?: string;
    description?: string;
    color?: string;
    avatar?: string;
    inviteOnly?: boolean;
  }
): Promise<ApiResult<ClanDetail>> {
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет авторизации на сервере.' };
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось сохранить настройки клана.') };
  return { ok: true, data: (out.body as { clan: ClanDetail }).clan };
}

export async function transferClanOwnership(
  clanId: string,
  memberId: string
): Promise<ApiResult<ClanDetail>> {
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет авторизации на сервере.' };
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ memberId }),
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось передать владение кланом.') };
  return { ok: true, data: (out.body as { clan: ClanDetail }).clan };
}

export async function muteClanMember(
  clanId: string,
  memberId: string,
  durationMinutes: number
): Promise<ApiResult<ClanDetail>> {
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет авторизации на сервере.' };
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}/mute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ memberId, durationMinutes }),
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось выдать мут.') };
  return { ok: true, data: (out.body as { clan: ClanDetail }).clan };
}

export async function leaveClan(): Promise<ApiResult<true>> {
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет авторизации на сервере.' };
  const out = await apiJsonFetch('/api/clans/leave', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось выйти из клана.') };
  return { ok: true, data: true };
}

export async function kickClanMember(
  clanId: string,
  memberId: string
): Promise<ApiResult<ClanDetail>> {
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет авторизации на сервере.' };
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}/kick`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ memberId }),
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось выгнать участника.') };
  return { ok: true, data: (out.body as { clan: ClanDetail }).clan };
}

export async function sendClanMessage(
  clanId: string,
  text: string,
  replyToId?: string
): Promise<ApiResult<ClanDetail>> {
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет авторизации на сервере.' };
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text, ...(replyToId ? { replyToId } : {}) }),
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось отправить сообщение.') };
  return { ok: true, data: (out.body as { clan: ClanDetail }).clan };
}

export async function deleteClanMessage(
  clanId: string,
  msgId: string
): Promise<ApiResult<ClanDetail>> {
  const token = await resolveServerUserToken();
  if (!token) return { ok: false, error: 'Нет авторизации на сервере.' };
  const out = await apiJsonFetch(
    `/api/clans/${encodeURIComponent(clanId)}/chat/${encodeURIComponent(msgId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось удалить сообщение.') };
  return { ok: true, data: (out.body as { clan: ClanDetail }).clan };
}

export async function deleteClan(clanId: string): Promise<ApiResult<true>> {
  const token = await resolveServerUserToken();
  const adminToken = getStoredAdminToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (adminToken && !adminToken.startsWith('local_unlocked_')) {
    headers['x-admin-token'] = adminToken;
  }
  const out = await apiJsonFetch(`/api/clans/${encodeURIComponent(clanId)}`, {
    method: 'DELETE',
    headers,
  });
  if (out.kind === 'unreachable') return { ok: false, error: 'Нет связи с сервером.' };
  if (!out.ok) return { ok: false, error: extractBodyError(out.body, 'Не удалось удалить клан.') };
  return { ok: true, data: true };
}
