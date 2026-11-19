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
  isMe: boolean;
}

export interface AdminLoginLog {
  id: string;
  username: string;
  walletId: string;
  timestamp: number;
  device: string;
}

export interface AdminUserSummary {
  id: string;
  username: string;
  coins: number;
  vip: boolean;
  curScooter: string;
  updatedAt: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalRegistered: number;
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

export function getCachedLeaderboard(): LeaderboardResponse | null {
  try {
    const raw = localStorage.getItem(LB_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LeaderboardResponse>;
    if (Array.isArray(parsed.entries)) {
      return {
        entries: parsed.entries,
        totalRegistered: typeof parsed.totalRegistered === 'number' ? parsed.totalRegistered : parsed.entries.length,
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

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (typeof body?.error === 'string' && body.error.trim()) {
      return body.error;
    }
  } catch {
    // Ignore non-JSON errors
  }
  return fallback;
}

export async function registerAccount(
  username: string,
  password: string,
  save: SyncSavePayload
): Promise<ApiResult<{ token: string; user: AuthUser; save: SyncSavePayload }>> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, save }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось создать аккаунт.') };
    }
    const data = (await res.json()) as { token: string; user: AuthUser; save: SyncSavePayload };
    saveAuthSession(data.token, data.user);
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Нет связи с сервером. Проверь интернет.' };
  }
}

export async function loginAccount(
  username: string,
  password: string
): Promise<ApiResult<{ token: string; user: AuthUser; save: SyncSavePayload }>> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось войти в аккаунт.') };
    }
    const data = (await res.json()) as { token: string; user: AuthUser; save: SyncSavePayload };
    saveAuthSession(data.token, data.user);
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Нет связи с сервером. Проверь интернет.' };
  }
}

export async function fetchMe(): Promise<
  ApiResult<{
    user: AuthUser;
    save: SyncSavePayload;
    coinsOverride?: number;
    saveOverride?: SyncSavePayload;
  }> & {
    unauthorized?: boolean;
  }
> {
  const token = getStoredToken();
  if (!token) {
    return { ok: false, error: 'Не авторизован', unauthorized: true };
  }
  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      clearAuthSession();
      return { ok: false, error: 'Сессия истекла', unauthorized: true };
    }
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Ошибка загрузки профиля.') };
    }
    const data = (await res.json()) as {
      user: AuthUser;
      save: SyncSavePayload;
      coinsOverride?: number;
      saveOverride?: SyncSavePayload;
    };
    saveAuthSession(token, data.user);
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Офлайн-режим' };
  }
}

export async function syncProfile(save: SyncSavePayload): Promise<{
  ok: boolean;
  vip?: boolean;
  coinsOverride?: number;
  saveOverride?: SyncSavePayload;
  unauthorized?: boolean;
}> {
  const token = getStoredToken();
  if (!token) return { ok: false };
  try {
    const res = await fetch('/api/profile/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ save }),
    });
    if (res.status === 401) {
      clearAuthSession();
      return { ok: false, unauthorized: true };
    }
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as {
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
  } catch {
    return { ok: false };
  }
}

export async function fetchLeaderboard(): Promise<
  ApiResult<LeaderboardResponse> & { fromCache?: boolean }
> {
  const token = getStoredToken();
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/leaderboard', { headers });
    if (!res.ok) {
      throw new Error(await parseError(res, 'Ошибка загрузки топа'));
    }
    const data = (await res.json()) as LeaderboardResponse;
    cacheLeaderboard(data);
    return { ok: true, data };
  } catch {
    const cached = getCachedLeaderboard();
    if (cached) {
      return { ok: true, data: cached, fromCache: true };
    }
    return { ok: false, error: 'Нет связи с сервером. Подключись к интернету, чтобы увидеть топ.' };
  }
}

// ── Persistent Admin Session & Audit Logs + VIP Management ──

const ADMIN_TOKEN_KEY = 'bs_admin_token_v1';
const ADMIN_LOCAL_LOGS_KEY = 'bs_admin_local_logs_v1';

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveAdminToken(token: string) {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors
  }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // Ignore storage errors
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

export async function loginAdmin(
  pass1: string,
  pass2: string,
  walletId: string
): Promise<ApiResult<{ adminToken: string; log: AdminLoginLog }>> {
  const userToken = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userToken) headers.Authorization = `Bearer ${userToken}`;
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers,
      body: JSON.stringify({ pass1, pass2, walletId }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Неверный первый или второй пароль.') };
    }
    const data = (await res.json()) as { adminToken: string; log: AdminLoginLog };
    saveAdminToken(data.adminToken);
    if (data.log) appendLocalAdminLog(data.log);
    return { ok: true, data };
  } catch {
    // Offline fallback check so PWA still works without internet
    if (pass1.trim() === 'BLACK7772' && pass2.trim() === 'B7772') {
      const user = getStoredUser();
      const log: AdminLoginLog = {
        id: `local-${Date.now()}`,
        username: user ? `@${user.username}` : walletId ? `Гость (${walletId})` : 'Гость',
        walletId: walletId || '—',
        timestamp: Date.now(),
        device: 'Офлайн',
      };
      const localToken = `local_unlocked_${Date.now()}`;
      saveAdminToken(localToken);
      appendLocalAdminLog(log);
      return { ok: true, data: { adminToken: localToken, log } };
    }
    return { ok: false, error: 'Неверный первый или второй пароль.' };
  }
}

export async function verifyStoredAdminToken(): Promise<boolean> {
  const token = getStoredAdminToken();
  if (!token) return false;
  if (token.startsWith('local_unlocked_')) return true;
  try {
    const res = await fetch('/api/admin/verify', {
      headers: { 'x-admin-token': token },
    });
    if (res.status === 401) {
      clearAdminToken();
      return false;
    }
    return res.ok;
  } catch {
    // Keep remembered session while offline
    return true;
  }
}

export async function fetchAdminLogs(): Promise<ApiResult<AdminLoginLog[]>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  try {
    const res = await fetch('/api/admin/logs', {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось загрузить логи.') };
    }
    const data = (await res.json()) as { logs: AdminLoginLog[] };
    return { ok: true, data: Array.isArray(data.logs) ? data.logs : [] };
  } catch {
    return { ok: true, data: getLocalAdminLogs() };
  }
}

export async function fetchAdminUsers(): Promise<ApiResult<AdminUserSummary[]>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  try {
    const res = await fetch('/api/admin/users', {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось загрузить игроков.') };
    }
    const data = (await res.json()) as { users: AdminUserSummary[] };
    return { ok: true, data: Array.isArray(data.users) ? data.users : [] };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function setAdminUserVip(
  username: string,
  vip: boolean
): Promise<ApiResult<AdminUserSummary>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  try {
    const res = await fetch('/api/admin/vip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ username, vip }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось изменить VIP.') };
    }
    const data = (await res.json()) as { user: AdminUserSummary };
    return { ok: true, data: data.user };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function adjustAdminUserCoins(
  username: string,
  mode: 'add' | 'remove' | 'set',
  amount: number
): Promise<ApiResult<AdminUserSummary>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  try {
    const res = await fetch('/api/admin/coins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ username, mode, amount }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось изменить баланс игрока.') };
    }
    const data = (await res.json()) as { user: AdminUserSummary };
    return { ok: true, data: data.user };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function resetAdminUser(
  username: string
): Promise<ApiResult<AdminUserSummary>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  try {
    const res = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось обнулить аккаунт.') };
    }
    const data = (await res.json()) as { user: AdminUserSummary };
    return { ok: true, data: data.user };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function deleteAdminUser(
  userId: string
): Promise<ApiResult<{ deletedId: string; deletedUsername: string }>> {
  const token = getStoredAdminToken();
  if (!token) return { ok: false, error: 'Нет доступа администратора.' };
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-token': token,
      },
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось удалить аккаунт.') };
    }
    const data = (await res.json()) as { deletedId: string; deletedUsername: string };
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
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
  createCost: number;
}

export async function fetchClans(): Promise<ApiResult<ClansResponse>> {
  const token = getStoredToken();
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/clans', { headers });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось загрузить кланы.') };
    }
    const data = (await res.json()) as ClansResponse;
    return {
      ok: true,
      data: {
        clans: Array.isArray(data.clans) ? data.clans : [],
        myClan: data.myClan ?? null,
        myInvites: Array.isArray(data.myInvites) ? data.myInvites : [],
        createCost: typeof data.createCost === 'number' ? data.createCost : CLAN_CREATE_COST,
      },
    };
  } catch {
    return { ok: false, error: 'Нет связи с сервером. Проверь интернет.' };
  }
}

export async function createClan(params: {
  name: string;
  tag: string;
  description: string;
  color: string;
  avatar: string;
  inviteOnly: boolean;
}): Promise<ApiResult<{ clan: ClanDetail; newCoins: number }>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Сначала войди или создай аккаунт (@юз).' };
  try {
    const res = await fetch('/api/clans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось создать клан.') };
    }
    const data = (await res.json()) as { clan: ClanDetail; newCoins: number };
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function joinClan(clanId: string): Promise<ApiResult<ClanDetail>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Сначала войди или создай аккаунт (@юз).' };
  try {
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось вступить в клан.') };
    }
    const data = (await res.json()) as { clan: ClanDetail };
    return { ok: true, data: data.clan };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function inviteToClan(
  clanId: string,
  username: string
): Promise<ApiResult<ClanDetail>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Не авторизован.' };
  try {
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось отправить приглашение.') };
    }
    const data = (await res.json()) as { clan: ClanDetail };
    return { ok: true, data: data.clan };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function cancelClanInvite(
  clanId: string,
  userId: string
): Promise<ApiResult<ClanDetail>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Не авторизован.' };
  try {
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}/invite/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось отменить приглашение.') };
    }
    const data = (await res.json()) as { clan: ClanDetail };
    return { ok: true, data: data.clan };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function acceptClanInvite(clanId: string): Promise<ApiResult<ClanDetail>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Сначала войди в аккаунт.' };
  try {
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}/invite/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось принять приглашение.') };
    }
    const data = (await res.json()) as { clan: ClanDetail };
    return { ok: true, data: data.clan };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function declineClanInvite(clanId: string): Promise<ApiResult<true>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Не авторизован.' };
  try {
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}/invite/decline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось отклонить приглашение.') };
    }
    return { ok: true, data: true };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
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
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Не авторизован.' };
  try {
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось сохранить настройки клана.') };
    }
    const data = (await res.json()) as { clan: ClanDetail };
    return { ok: true, data: data.clan };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function transferClanOwnership(
  clanId: string,
  memberId: string
): Promise<ApiResult<ClanDetail>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Не авторизован.' };
  try {
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ memberId }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось передать владение кланом.') };
    }
    const data = (await res.json()) as { clan: ClanDetail };
    return { ok: true, data: data.clan };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function muteClanMember(
  clanId: string,
  memberId: string,
  durationMinutes: number
): Promise<ApiResult<ClanDetail>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Не авторизован.' };
  try {
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}/mute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ memberId, durationMinutes }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось выдать мут.') };
    }
    const data = (await res.json()) as { clan: ClanDetail };
    return { ok: true, data: data.clan };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function leaveClan(): Promise<ApiResult<true>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Не авторизован.' };
  try {
    const res = await fetch('/api/clans/leave', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось выйти из клана.') };
    }
    return { ok: true, data: true };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function kickClanMember(
  clanId: string,
  memberId: string
): Promise<ApiResult<ClanDetail>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Не авторизован.' };
  try {
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}/kick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ memberId }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось выгнать участника.') };
    }
    const data = (await res.json()) as { clan: ClanDetail };
    return { ok: true, data: data.clan };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function sendClanMessage(
  clanId: string,
  text: string,
  replyToId?: string
): Promise<ApiResult<ClanDetail>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Не авторизован.' };
  try {
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, ...(replyToId ? { replyToId } : {}) }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось отправить сообщение.') };
    }
    const data = (await res.json()) as { clan: ClanDetail };
    return { ok: true, data: data.clan };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function deleteClanMessage(
  clanId: string,
  msgId: string
): Promise<ApiResult<ClanDetail>> {
  const token = getStoredToken();
  if (!token) return { ok: false, error: 'Не авторизован.' };
  try {
    const res = await fetch(
      `/api/clans/${encodeURIComponent(clanId)}/chat/${encodeURIComponent(msgId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось удалить сообщение.') };
    }
    const data = (await res.json()) as { clan: ClanDetail };
    return { ok: true, data: data.clan };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}

export async function deleteClan(clanId: string): Promise<ApiResult<true>> {
  const token = getStoredToken();
  const adminToken = getStoredAdminToken();
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (adminToken) headers['x-admin-token'] = adminToken;
    const res = await fetch(`/api/clans/${encodeURIComponent(clanId)}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      return { ok: false, error: await parseError(res, 'Не удалось удалить клан.') };
    }
    return { ok: true, data: true };
  } catch {
    return { ok: false, error: 'Нет связи с сервером.' };
  }
}
