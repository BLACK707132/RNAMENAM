export interface WalletProfile {
  walletId: string; // 6-char raw ID, displayed as BS-XXXXXX
  nickname: string;
}

export interface TransferRecord {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  counterparty: string;
  targetWallet: string; // 'ALL' or 6-char walletId
  code: string;
  link: string;
  comment?: string;
  createdAt: number;
}

export interface ParsedCheck {
  code: string;
  targetWallet: string; // 'ALL' or 6-char walletId
  amount: number;
  nonce: string;
  sig: string;
  fromName?: string;
  comment?: string;
}

export interface ParsedRecipient {
  kind: 'wallet' | 'bot_link' | 'universal' | 'claim_code' | 'invalid';
  walletId?: string; // 6-char if specific BLACK STANT wallet
  label: string;
  requestedAmount?: number;
  claimCode?: string;
}

export type CheckValidationResult =
  | { ok: true; check: ParsedCheck; isOwnWalletTarget: boolean }
  | { ok: false; reason: 'invalid' | 'already_redeemed' | 'wrong_wallet'; message: string; expectedWallet?: string };

const WALLET_KEY = 'bs_wallet_v1';
const REDEEMED_KEY = 'bs_redeemed_checks_v1';
const HISTORY_KEY = 'bs_transfer_history_v1';

const ID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const NONCE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_TRANSFER_AMOUNT = 50_000_000;

// Keyed dual-round 32-bit avalanche hash for tamper-proof offline codes
const SIG_PEPPER_A = 'BS_OFFLINE_TX_V1_95K_ALPHA';
const SIG_PEPPER_B = 'STANT_WHEELIE_LIFE_CHECK_77';

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

function computeSignature(target: string, amt36: string, nonce: string): string {
  const payload = `BS1|${target}|${amt36}|${nonce}`;
  const h1 = hash32(`${payload}|${SIG_PEPPER_A}`, 0x811c9dc5);
  const h2 = hash32(`${SIG_PEPPER_B}|${payload}|${h1.toString(36)}`, 0x243f6a88);
  // Combine into 6 base36 chars (31+ bits of integrity check — ~2.1 billion combinations)
  const p1 = (h1 % 46656).toString(36).toUpperCase().padStart(3, '0'); // 36^3
  const p2 = (h2 % 46656).toString(36).toUpperCase().padStart(3, '0'); // 36^3
  return `${p1}${p2}`;
}

function randomChars(len: number, alphabet: string): string {
  let out = '';
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(len);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < len; i++) {
        out += alphabet[bytes[i] % alphabet.length];
      }
      return out;
    }
  } catch {
    // Fallback below
  }
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function formatWalletId(rawId: string): string {
  const clean = rawId.toUpperCase().replace(/^BS-/, '');
  return `BS-${clean}`;
}

export function getAppBaseUrl(): string {
  if (typeof window === 'undefined') return 'https://blackstant.app/';
  return `${window.location.origin}${window.location.pathname}`;
}

export function loadWalletProfile(): WalletProfile {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WalletProfile>;
      if (parsed.walletId && /^[A-Z0-9]{6}$/.test(parsed.walletId)) {
        return {
          walletId: parsed.walletId,
          nickname:
            typeof parsed.nickname === 'string' && parsed.nickname.trim()
              ? parsed.nickname.trim().slice(0, 16)
              : 'Райдер',
        };
      }
    }
  } catch {
    // Ignore storage read errors
  }
  const fresh: WalletProfile = {
    walletId: randomChars(6, ID_ALPHABET),
    nickname: 'Райдер',
  };
  saveWalletProfile(fresh);
  return fresh;
}

export function saveWalletProfile(profile: WalletProfile) {
  try {
    localStorage.setItem(
      WALLET_KEY,
      JSON.stringify({
        walletId: profile.walletId,
        nickname: profile.nickname.trim().slice(0, 16) || 'Райдер',
      })
    );
  } catch {
    // Ignore storage write errors
  }
}

export function loadRedeemedChecks(): Set<string> {
  try {
    const raw = localStorage.getItem(REDEEMED_KEY);
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

function saveRedeemedChecks(set: Set<string>) {
  try {
    const list = Array.from(set).slice(-300);
    localStorage.setItem(REDEEMED_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

export function markCheckRedeemed(check: ParsedCheck) {
  const set = loadRedeemedChecks();
  set.add(`${check.nonce}:${check.sig}`);
  saveRedeemedChecks(set);
}

export function loadTransferHistory(): TransferRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr.slice(0, 25);
      }
    }
  } catch {
    // Ignore
  }
  return [];
}

export function appendTransferHistory(record: TransferRecord): TransferRecord[] {
  const list = [record, ...loadTransferHistory()].slice(0, 25);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
  return list;
}

export function buildReceiveLink(wallet: WalletProfile, requestedAmount?: number): string {
  const params = new URLSearchParams();
  params.set('pay', formatWalletId(wallet.walletId));
  if (requestedAmount && Number.isFinite(requestedAmount) && requestedAmount > 0) {
    params.set('amt', String(Math.floor(requestedAmount)));
  }
  if (wallet.nickname.trim() && wallet.nickname.trim() !== 'Райдер') {
    params.set('name', wallet.nickname.trim().slice(0, 16));
  }
  return `${getAppBaseUrl()}?${params.toString()}`;
}

export function buildReceiveShortCode(wallet: WalletProfile, requestedAmount?: number): string {
  const base = `PAY-${wallet.walletId}`;
  if (requestedAmount && Number.isFinite(requestedAmount) && requestedAmount > 0) {
    return `${base}-${Math.floor(requestedAmount)}`;
  }
  return base;
}

export function createOfflineTransferCheck(params: {
  amount: number;
  targetWalletId?: string; // 6-char walletId or undefined for universal 'ALL'
  senderName?: string;
  comment?: string;
}): { code: string; link: string; targetWallet: string; amount: number; comment?: string } {
  const cleanAmount = Math.max(1, Math.min(MAX_TRANSFER_AMOUNT, Math.floor(params.amount)));
  const target =
    params.targetWalletId && /^[A-Z0-9]{6}$/i.test(params.targetWalletId)
      ? params.targetWalletId.toUpperCase()
      : 'ALL';

  const cleanComment =
    typeof params.comment === 'string' && params.comment.trim()
      ? params.comment.trim().replace(/\s+/g, ' ').slice(0, 80)
      : undefined;

  const amt36 = cleanAmount.toString(36).toUpperCase();
  const timeChar = NONCE_ALPHABET[Math.floor(Date.now() / 1000) % NONCE_ALPHABET.length];
  const nonce = `${timeChar}${randomChars(3, NONCE_ALPHABET)}`;
  const sig = computeSignature(target, amt36, nonce);
  const code = `BS1-${target}-${amt36}-${nonce}-${sig}`;

  const urlParams = new URLSearchParams();
  urlParams.set('claim', code);
  if (params.senderName && params.senderName.trim()) {
    urlParams.set('from', params.senderName.trim().slice(0, 16));
  }
  if (cleanComment) {
    urlParams.set('msg', cleanComment);
  }
  const link = `${getAppBaseUrl()}?${urlParams.toString()}`;

  return { code, link, targetWallet: target, amount: cleanAmount, comment: cleanComment };
}

const CHECK_CODE_REGEX = /\b(BS1-(?:ALL|[A-Z0-9]{6})-[A-Z0-9]{1,8}-[A-Z0-9]{4}-[A-Z0-9]{6})\b/i;

export function parseCheckFromInput(rawInput: string): ParsedCheck | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  let fromName: string | undefined;
  let comment: string | undefined;
  let candidate = trimmed;

  // Try extracting query params if it's a URL
  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    try {
      const url = new URL(urlMatch[0]);
      const claimParam = url.searchParams.get('claim') || url.searchParams.get('code') || url.searchParams.get('tx');
      if (claimParam) candidate = claimParam;
      const fromParam = url.searchParams.get('from') || url.searchParams.get('sender');
      if (fromParam) fromName = fromParam.trim().slice(0, 16);
      const msgParam = url.searchParams.get('msg') || url.searchParams.get('comment');
      if (msgParam && msgParam.trim()) {
        comment = msgParam.trim().replace(/\s+/g, ' ').slice(0, 80);
      }
    } catch {
      // Fall back to regex extraction
    }
  } else if (trimmed.includes('|')) {
    // Support plain offline paste like "BS1-... | На новый самокат!"
    const pipeIdx = trimmed.indexOf('|');
    candidate = trimmed.slice(0, pipeIdx).trim();
    const afterPipe = trimmed.slice(pipeIdx + 1).trim();
    if (afterPipe) {
      comment = afterPipe.replace(/\s+/g, ' ').slice(0, 80);
    }
  }

  // Normalize accidental spaces around hyphens
  const normalized = candidate.replace(/\s*-\s*/g, '-').toUpperCase();
  const match = normalized.match(CHECK_CODE_REGEX) || trimmed.toUpperCase().match(CHECK_CODE_REGEX);
  if (!match) return null;

  const code = match[1].toUpperCase();
  const parts = code.split('-');
  if (parts.length !== 5 || parts[0] !== 'BS1') return null;

  const [, targetWallet, amt36, nonce, sig] = parts;
  const expectedSig = computeSignature(targetWallet, amt36, nonce);
  if (sig !== expectedSig) return null;

  const amount = parseInt(amt36, 36);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_TRANSFER_AMOUNT) return null;

  return {
    code,
    targetWallet,
    amount,
    nonce,
    sig,
    fromName,
    comment,
  };
}

export function validateIncomingCheck(
  rawInput: string,
  myWalletId: string
): CheckValidationResult {
  const parsed = parseCheckFromInput(rawInput);
  if (!parsed) {
    return {
      ok: false,
      reason: 'invalid',
      message: 'Неверный или повреждённый код перевода. Проверь ссылку или код.',
    };
  }

  const redeemed = loadRedeemedChecks();
  if (redeemed.has(`${parsed.nonce}:${parsed.sig}`)) {
    return {
      ok: false,
      reason: 'already_redeemed',
      message: 'Этот перевод уже был активирован на этом устройстве!',
    };
  }

  if (parsed.targetWallet !== 'ALL' && parsed.targetWallet !== myWalletId.toUpperCase()) {
    return {
      ok: false,
      reason: 'wrong_wallet',
      expectedWallet: formatWalletId(parsed.targetWallet),
      message: `Этот перевод закрыт для кошелька ${formatWalletId(parsed.targetWallet)} (твой: ${formatWalletId(myWalletId)}).`,
    };
  }

  return {
    ok: true,
    check: parsed,
    isOwnWalletTarget: parsed.targetWallet === myWalletId.toUpperCase(),
  };
}

/**
 * Parses a friend's receive link, Telegram bot link, PAY-code, or BS-wallet ID.
 * Returns structured info so the Send screen can prefill recipient & requested amount.
 */
export function parseRecipientInput(rawInput: string): ParsedRecipient {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      kind: 'universal',
      label: 'Любой игрок (по ссылке или коду)',
    };
  }

  // Detect if user accidentally pasted a Claim Check code into the Send input
  const maybeCheck = parseCheckFromInput(trimmed);
  if (maybeCheck) {
    return {
      kind: 'claim_code',
      label: `Чек на +${maybeCheck.amount.toLocaleString('ru-RU')} 🪙`,
      claimCode: maybeCheck.code,
    };
  }

  // 1) Check for URL (app link, Telegram bot link, or custom bot link)
  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i) || (/^(t\.me|telegram\.me)\//i.test(trimmed) ? [`https://${trimmed.split(/\s+/)[0]}`] : null);
  if (urlMatch) {
    try {
      const url = new URL(urlMatch[0]);
      const sp = url.searchParams;
      const payRaw = sp.get('pay') || sp.get('to') || sp.get('wallet') || '';
      const amtRaw = sp.get('amt') || sp.get('amount') || sp.get('sum') || '';
      const nameRaw = sp.get('name') || sp.get('user') || sp.get('nick') || '';
      const startRaw = sp.get('start') || sp.get('startapp') || '';

      let requestedAmount: number | undefined;
      if (amtRaw) {
        const parsedAmt = parseInt(amtRaw.replace(/\D+/g, ''), 10);
        if (Number.isFinite(parsedAmt) && parsedAmt > 0 && parsedAmt <= MAX_TRANSFER_AMOUNT) {
          requestedAmount = parsedAmt;
        }
      }

      // Check if query params or Telegram bot ?start= embeds a BLACK STANT wallet ID
      const embeddedSearch = `${payRaw} ${startRaw} ${url.pathname}`;
      const walletMatch =
        embeddedSearch.match(/(?:BS-|PAY[-_]|PAY_)([A-Z0-9]{6})/i) ||
        (payRaw && /^[A-Z0-9]{6}$/i.test(payRaw.trim()) ? [payRaw, payRaw.trim()] : null);

      if (walletMatch) {
        const walletId = walletMatch[1].toUpperCase();
        // Also check start=pay_XXXXXX_5000 pattern from bots
        if (!requestedAmount && startRaw) {
          const startAmtMatch = startRaw.match(new RegExp(`${walletId}[_-](\\d{1,8})`, 'i'));
          if (startAmtMatch) {
            const n = parseInt(startAmtMatch[1], 10);
            if (Number.isFinite(n) && n > 0 && n <= MAX_TRANSFER_AMOUNT) {
              requestedAmount = n;
            }
          }
        }
        const nick = nameRaw.trim().slice(0, 16);
        return {
          kind: 'wallet',
          walletId,
          label: nick ? `${nick} (${formatWalletId(walletId)})` : formatWalletId(walletId),
          requestedAmount,
        };
      }

      // Generic bot / external link (e.g. https://t.me/MyBot?start=12345 or custom URL)
      const isTelegram = /(^|\.)(t\.me|telegram\.me)$/i.test(url.hostname);
      const pathSlug = url.pathname.replace(/^\/+|\/+$/g, '');
      let botLabel = url.hostname;
      if (isTelegram && pathSlug) {
        botLabel = `@${pathSlug.split('/')[0]}${startRaw ? ` · #${startRaw.slice(0, 12)}` : ''}`;
      } else if (nameRaw) {
        botLabel = nameRaw.trim().slice(0, 20);
      } else if (startRaw) {
        botLabel = `Ссылка бота (#${startRaw.slice(0, 12)})`;
      } else if (pathSlug) {
        botLabel = `${url.hostname}/${pathSlug.slice(0, 14)}`;
      }

      return {
        kind: 'bot_link',
        label: botLabel,
        requestedAmount,
      };
    } catch {
      // Fall through to text parsing
    }
  }

  // 2) Short offline receive code: PAY-XXXXXX or PAY-XXXXXX-5000
  const payCodeMatch = trimmed.toUpperCase().match(/^PAY-([A-Z0-9]{6})(?:-(\d{1,8}))?$/);
  if (payCodeMatch) {
    const walletId = payCodeMatch[1];
    const amt = payCodeMatch[2] ? parseInt(payCodeMatch[2], 10) : undefined;
    return {
      kind: 'wallet',
      walletId,
      label: formatWalletId(walletId),
      requestedAmount: amt && amt > 0 && amt <= MAX_TRANSFER_AMOUNT ? amt : undefined,
    };
  }

  // 3) Wallet ID: BS-XXXXXX or bare 6-char ID
  const bsIdMatch = trimmed.toUpperCase().match(/^(?:BS-)?([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6})$/);
  if (bsIdMatch) {
    const walletId = bsIdMatch[1];
    return {
      kind: 'wallet',
      walletId,
      label: formatWalletId(walletId),
    };
  }

  // 4) Plain friend name / @username (creates open offline check addressed to them)
  if (trimmed.length >= 2 && trimmed.length <= 40) {
    return {
      kind: 'bot_link',
      label: trimmed.slice(0, 24),
    };
  }

  return {
    kind: 'invalid',
    label: 'Не удалось распознать ссылку или ID',
  };
}

export interface IncomingUrlAction {
  tab: 'send' | 'receive';
  prefillInput: string;
}

/**
 * Checks window.location.search / hash on app startup for ?claim=... or ?pay=...
 * and cleans the URL so reloads don't re-trigger the modal.
 */
export function consumeIncomingUrlAction(): IncomingUrlAction | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const sp = url.searchParams;
    const claim = sp.get('claim') || sp.get('code') || sp.get('tx');
    const pay = sp.get('pay') || sp.get('to') || sp.get('wallet');

    if (claim) {
      const fullHref = window.location.href;
      window.history.replaceState({}, '', window.location.pathname);
      return { tab: 'receive', prefillInput: fullHref };
    }
    if (pay) {
      const fullHref = window.location.href;
      window.history.replaceState({}, '', window.location.pathname);
      return { tab: 'send', prefillInput: fullHref };
    }
  } catch {
    // Ignore URL errors
  }
  return null;
}
