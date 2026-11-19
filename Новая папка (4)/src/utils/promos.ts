export interface PromoHistoryItem {
  code: string;
  coins: number;
  label: string;
  redeemedAt: number;
}

export type PromoRedeemResult =
  | { ok: true; code: string; coins: number; label: string }
  | { ok: false; reason: 'empty' | 'already_used' | 'invalid'; message: string };

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
const NONCE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_PROMO_COINS = 10_000_000;

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
