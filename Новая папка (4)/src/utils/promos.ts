import { apiJsonFetch, getStoredAdminToken, getStoredToken } from './accountApi';

export interface PromoHistoryItem {
  code: string;
  coins: number;
  label: string;
  redeemedAt: number;
}

export interface CustomPromoItem {
  code: string;
  coins: number;
  maxUses: number;
  usedCount: number;
  createdAt: number;
  localOnly?: boolean;
}

export type PromoRedeemResult =
  | { ok: true; code: string; coins: number; label: string }
  | { ok: false; reason: 'empty' | 'already_used' | 'invalid' | 'exhausted'; message: string };

interface StaticPromoDef {
  code: string;
  coins: number;
  label: string;
}

// Built-in official promo codes (case-insensitive)
const STATIC_PROMOS: StaticPromoDef[] = [
  {
    code: 'BLACKDA4K',
    coins: 20000,
    label: 'Промокод BLACKDA4K',
  },
];

const USED_PROMOS_KEY = 'bs_used_promos_v1';
const PROMO_HISTORY_KEY = 'bs_promo_history_v1';
const CUSTOM_PROMOS_LOCAL_KEY = 'bs_custom_promos_v1';
const DEVICE_CLIENT_ID_KEY = 'bs_device_client_id_v1';
const NONCE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_PROMO_COINS = 10_000_000;
const CUSTOM_PROMO_RE = /^[A-ZА-ЯЁ0-9_-]{2,24}$/u;

const PROMO_PEPPER_A = 'BS_PROMO_V1_BLACKDA4K_95';
const PROMO_PEPPER_B = 'STANT_REWARD_CHECK_7772';

function hash32(input: string, seed: number): number {
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

function computePromoSig(amt36: string, nonce: string): string {
  const payload = `BSP1|${amt36}|${nonce}`;
  const h1 = hash32(`${payload}|${PROMO_PEPPER_A}`, 0x811c9dc5);
  const h2 = hash32(`${PROMO_PEPPER_B}|${payload}|${h1.toString(36)}`, 0x1b873593);
  const p1 = (h1 % 1296).toString(36).toUpperCase().padStart(2, '0'); // 36^2
  const p2 = (h2 % 46656).toString(36).toUpperCase().padStart(3, '0'); // 36^3
  return `${p1}${p2}`;
}

function randomChars(len: number): string {
  let out = '';
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(len);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < len; i++) {
        out += NONCE_ALPHABET[bytes[i] % NONCE_ALPHABET.length];
      }
      return out;
    }
  } catch {
    // Fallback
  }
  for (let i = 0; i < len; i++) {
    out += NONCE_ALPHABET[Math.floor(Math.random() * NONCE_ALPHABET.length)];
  }
  return out;
}

function getDeviceClientId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_CLIENT_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const fresh = `dev_${Date.now().toString(36)}_${randomChars(8)}`;
    localStorage.setItem(DEVICE_CLIENT_ID_KEY, fresh);
    return fresh;
  } catch {
    return `dev_${randomChars(10)}`;
  }
}

function loadLocalCustomPromos(): CustomPromoItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PROMOS_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CustomPromoItem =>
        Boolean(x) && typeof x.code === 'string' && typeof x.coins === 'number'
    );
  } catch {
    return [];
  }
}

function saveLocalCustomPromos(list: CustomPromoItem[]) {
  try {
    localStorage.setItem(CUSTOM_PROMOS_LOCAL_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadUsedPromos(): Set<string> {
  try {
    const raw = localStorage.getItem(USED_PROMOS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.filter((x): x is string => typeof x === 'string'));
      }
    }
  } catch {
    // Ignore
  }
  return new Set();
}

function saveUsedPromos(set: Set<string>) {
  try {
    localStorage.setItem(USED_PROMOS_KEY, JSON.stringify(Array.from(set).slice(-200)));
  } catch {
    // Ignore
  }
}

export function loadPromoHistory(): PromoHistoryItem[] {
  try {
    const raw = localStorage.getItem(PROMO_HISTORY_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.slice(0, 20);
    }
  } catch {
    // Ignore
  }
  return [];
}

function appendPromoHistory(item: PromoHistoryItem) {
  const next = [item, ...loadPromoHistory()].slice(0, 20);
  try {
    localStorage.setItem(PROMO_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore
  }
}

/**
 * Generates an offline tamper-proof promo code in the Admin Panel
 * that ANY player can redeem once on their device (e.g. STANT-50000-7K2A-9F3C1).
 */
export function createAdminPromoCode(amount: number): { code: string; coins: number } {
  const clean = Math.max(100, Math.min(MAX_PROMO_COINS, Math.floor(amount)));
  const amt36 = clean.toString(36).toUpperCase();
  const nonce = randomChars(3);
  const sig = computePromoSig(amt36, nonce);
  return {
    code: `STANT-${amt36}-${nonce}-${sig}`,
    coins: clean,
  };
}

export function normalizeCustomPromoName(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export async function fetchAdminCustomPromos(): Promise<CustomPromoItem[]> {
  const adminToken = getStoredAdminToken();
  const local = loadLocalCustomPromos();
  if (!adminToken) return local;

  const outcome = await apiJsonFetch('/api/admin/promos', {
    headers: { 'x-admin-token': adminToken },
  });
  if (outcome.kind === 'json' && outcome.ok) {
    const body = outcome.body as { promos?: CustomPromoItem[] };
    const serverList = Array.isArray(body.promos) ? body.promos : [];
    const serverCodes = new Set(serverList.map((p) => p.code));
    const merged = [
      ...serverList,
      ...local.filter((p) => p.localOnly && !serverCodes.has(p.code)),
    ];
    saveLocalCustomPromos(merged);
    return merged;
  }
  return local;
}

export async function createCustomPromoCode(
  rawName: string,
  amount: number,
  maxUses = 0
): Promise<{ ok: true; promo: CustomPromoItem } | { ok: false; error: string }> {
  const code = normalizeCustomPromoName(rawName);
  if (!code || !CUSTOM_PROMO_RE.test(code)) {
    return {
      ok: false,
      error: 'Название: от 2 до 24 символов (буквы, цифры, _ или -).',
    };
  }
  if (code === 'BLACKDA4K') {
    return { ok: false, error: 'BLACKDA4K уже встроен в игру — придумай другое имя!' };
  }
  const cleanCoins = Math.floor(amount);
  if (!Number.isFinite(cleanCoins) || cleanCoins < 100 || cleanCoins > MAX_PROMO_COINS) {
    return { ok: false, error: 'Сумма монет должна быть от 100 до 10 000 000.' };
  }
  const cleanMaxUses =
    Number.isFinite(maxUses) && maxUses > 0 ? Math.min(100_000, Math.floor(maxUses)) : 0;

  const adminToken = getStoredAdminToken();
  if (adminToken) {
    const outcome = await apiJsonFetch('/api/admin/promos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({ code, coins: cleanCoins, maxUses: cleanMaxUses }),
    });
    if (outcome.kind === 'json') {
      if (outcome.ok) {
        const body = outcome.body as { promo: CustomPromoItem };
        const promo = body.promo;
        const nextLocal = [promo, ...loadLocalCustomPromos().filter((p) => p.code !== promo.code)];
        saveLocalCustomPromos(nextLocal);
        return { ok: true, promo };
      }
      const errMsg =
        outcome.body &&
        typeof outcome.body === 'object' &&
        'error' in outcome.body &&
        typeof (outcome.body as { error?: unknown }).error === 'string'
          ? (outcome.body as { error: string }).error
          : 'Не удалось создать промокод.';
      return { ok: false, error: errMsg };
    }
  }

  // Offline / local fallback so admin can still create named promos without network
  const existing = loadLocalCustomPromos();
  if (existing.some((p) => p.code === code)) {
    return { ok: false, error: `Промокод «${code}» уже есть в списке.` };
  }
  const localPromo: CustomPromoItem = {
    code,
    coins: cleanCoins,
    maxUses: cleanMaxUses,
    usedCount: 0,
    createdAt: Date.now(),
    localOnly: true,
  };
  saveLocalCustomPromos([localPromo, ...existing]);
  return { ok: true, promo: localPromo };
}

export async function deleteCustomPromoCode(code: string): Promise<boolean> {
  const normalized = normalizeCustomPromoName(code);
  const adminToken = getStoredAdminToken();
  if (adminToken) {
    await apiJsonFetch(`/api/admin/promos/${encodeURIComponent(normalized)}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': adminToken },
    });
  }
  const nextLocal = loadLocalCustomPromos().filter((p) => p.code !== normalized);
  saveLocalCustomPromos(nextLocal);
  return true;
}

const ADMIN_PROMO_REGEX = /^STANT-([A-Z0-9]{1,7})-([A-Z0-9]{3})-([A-Z0-9]{5})$/;

export function redeemPromoCode(rawInput: string): PromoRedeemResult {
  const normalized = rawInput.trim().toUpperCase().replace(/\s+/g, '');
  if (!normalized) {
    return { ok: false, reason: 'empty', message: 'Введи промокод!' };
  }

  const used = loadUsedPromos();
  if (used.has(normalized)) {
    return {
      ok: false,
      reason: 'already_used',
      message: 'Этот промокод уже активирован на этом устройстве!',
    };
  }

  // 1) Check built-in official promo codes (e.g. BLACKDA4K)
  const staticMatch = STATIC_PROMOS.find((p) => p.code === normalized);
  if (staticMatch) {
    used.add(normalized);
    saveUsedPromos(used);
    appendPromoHistory({
      code: staticMatch.code,
      coins: staticMatch.coins,
      label: staticMatch.label,
      redeemedAt: Date.now(),
    });
    return {
      ok: true,
      code: staticMatch.code,
      coins: staticMatch.coins,
      label: staticMatch.label,
    };
  }

  // 2) Check signed offline admin-generated promo codes (STANT-...)
  const dynMatch = normalized.match(ADMIN_PROMO_REGEX);
  if (dynMatch) {
    const [, amt36, nonce, sig] = dynMatch;
    const expected = computePromoSig(amt36, nonce);
    if (sig === expected) {
      const coins = parseInt(amt36, 36);
      if (Number.isFinite(coins) && coins >= 100 && coins <= MAX_PROMO_COINS) {
        used.add(normalized);
        saveUsedPromos(used);
        appendPromoHistory({
          code: normalized,
          coins,
          label: 'Промокод от Админа',
          redeemedAt: Date.now(),
        });
        return {
          ok: true,
          code: normalized,
          coins,
          label: 'Промокод от Админа',
        };
      }
    }
  }

  return {
    ok: false,
    reason: 'invalid',
    message: 'Такого промокода нет. Проверь буквы и цифры!',
  };
}

/**
 * Full async promo redemption: checks built-in & offline signed codes first,
 * then validates custom-named admin promo codes via server API (with offline local fallback).
 */
export async function redeemPromoCodeAsync(rawInput: string): Promise<PromoRedeemResult> {
  const localSync = redeemPromoCode(rawInput);
  if (localSync.ok || localSync.reason !== 'invalid') {
    return localSync;
  }

  const normalized = normalizeCustomPromoName(rawInput);
  const used = loadUsedPromos();
  const token = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const outcome = await apiJsonFetch('/api/promos/redeem', {
    method: 'POST',
    headers,
    body: JSON.stringify({ code: normalized, clientId: getDeviceClientId() }),
  });

  if (outcome.kind === 'json') {
    if (outcome.ok) {
      const body = outcome.body as { code: string; coins: number; label?: string };
      const finalCode = body.code || normalized;
      const finalCoins = Math.floor(body.coins);
      const finalLabel = body.label || `Промокод ${finalCode}`;
      used.add(finalCode);
      saveUsedPromos(used);
      appendPromoHistory({
        code: finalCode,
        coins: finalCoins,
        label: finalLabel,
        redeemedAt: Date.now(),
      });
      return { ok: true, code: finalCode, coins: finalCoins, label: finalLabel };
    }

    const msg =
      outcome.body &&
      typeof outcome.body === 'object' &&
      'error' in outcome.body &&
      typeof (outcome.body as { error?: unknown }).error === 'string'
        ? (outcome.body as { error: string }).error
        : 'Такого промокода нет. Проверь буквы и цифры!';

    if (outcome.status === 409) {
      used.add(normalized);
      saveUsedPromos(used);
      return { ok: false, reason: 'already_used', message: msg };
    }
    if (outcome.status === 410) {
      return { ok: false, reason: 'exhausted', message: msg };
    }
  }

  // Offline / local fallback only when server is unreachable OR the promo was created locally offline
  const localCustom = loadLocalCustomPromos();
  const found = localCustom.find((p) => p.code === normalized);
  if (found && (outcome.kind !== 'json' || found.localOnly)) {
    if (found.maxUses > 0 && found.usedCount >= found.maxUses) {
      return {
        ok: false,
        reason: 'exhausted',
        message: 'Лимит активаций этого промокода уже закончился!',
      };
    }
    found.usedCount += 1;
    saveLocalCustomPromos(localCustom);
    used.add(found.code);
    saveUsedPromos(used);
    appendPromoHistory({
      code: found.code,
      coins: found.coins,
      label: `Промокод ${found.code}`,
      redeemedAt: Date.now(),
    });
    return {
      ok: true,
      code: found.code,
      coins: found.coins,
      label: `Промокод ${found.code}`,
    };
  }

  return localSync;
}
