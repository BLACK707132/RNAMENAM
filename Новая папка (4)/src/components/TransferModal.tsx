import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Send,
  Download,
  History,
  Copy,
  Check,
  Share2,
  Wallet,
  Link2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  MessageSquare,
} from 'lucide-react';
import {
  appendTransferHistory,
  buildReceiveLink,
  buildReceiveShortCode,
  checkTransferStatusOnline,
  createOfflineTransferCheck,
  formatWalletId,
  loadTransferHistory,
  loadWalletProfile,
  parseRecipientInput,
  redeemTransferCheckOnline,
  saveWalletProfile,
  validateIncomingCheck,
  type TransferRecord,
  type WalletProfile,
} from '../utils/transfers';
import { sound } from '../utils/sound';

export type TransferTab = 'send' | 'receive' | 'history';

interface TransferModalProps {
  coins: number;
  initialTab?: TransferTab;
  initialPrefill?: string;
  receiveOnly?: boolean;
  onDeductCoins: (amount: number) => boolean;
  onCreditCoins: (amount: number) => void;
  onClose: () => void;
}

const QUICK_SEND_AMOUNTS = [1000, 5000, 10000, 25000];

export function TransferModal({
  coins,
  initialTab = 'receive',
  initialPrefill = '',
  receiveOnly = false,
  onDeductCoins,
  onCreditCoins,
  onClose,
}: TransferModalProps) {
  const [wallet, setWallet] = useState<WalletProfile>(() => loadWalletProfile());
  const [editingNick, setEditingNick] = useState(false);
  const [nickDraft, setNickDraft] = useState(wallet.nickname);

  const [tab, setTab] = useState<TransferTab>(
    receiveOnly && initialTab === 'send' ? 'receive' : initialTab
  );

  // Send tab state
  const [recipientInput, setRecipientInput] = useState(
    initialTab === 'send' ? initialPrefill : ''
  );
  const [amountInput, setAmountInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [sendError, setSendError] = useState('');
  const [createdTransfer, setCreatedTransfer] = useState<{
    code: string;
    link: string;
    amount: number;
    recipientLabel: string;
    targetWallet: string;
    comment?: string;
  } | null>(null);

  // Receive tab state
  const [claimInput, setClaimInput] = useState(
    initialTab === 'receive' ? initialPrefill : ''
  );
  const [claimSuccess, setClaimSuccess] = useState<{
    amount: number;
    fromName?: string;
    comment?: string;
  } | null>(null);
  const [claimError, setClaimError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [serverClaimedStatus, setServerClaimedStatus] = useState<'idle' | 'checking' | 'redeemed'>('idle');
  const [requestAmountInput, setRequestAmountInput] = useState('');

  // History state
  const [history, setHistory] = useState<TransferRecord[]>(() => loadTransferHistory());

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const lastPrefilledAmtInputRef = useRef<string>('');

  const parsedRecipient = useMemo(
    () => parseRecipientInput(recipientInput),
    [recipientInput]
  );

  // Auto-fill requested amount when pasting a friend/bot link that includes ?amt=...
  useEffect(() => {
    if (
      parsedRecipient.requestedAmount &&
      recipientInput !== lastPrefilledAmtInputRef.current
    ) {
      lastPrefilledAmtInputRef.current = recipientInput;
      setAmountInput(String(parsedRecipient.requestedAmount));
      setSendError('');
    }
  }, [parsedRecipient.requestedAmount, recipientInput]);

  // Live check validation on Receive tab
  const liveClaimCheck = useMemo(() => {
    if (!claimInput.trim()) return null;
    return validateIncomingCheck(claimInput, wallet.walletId);
  }, [claimInput, wallet.walletId]);

  const liveCheckCode = liveClaimCheck?.ok ? liveClaimCheck.check.code : '';

  // Verify on server whether a pasted/opened link has already been claimed globally
  useEffect(() => {
    if (!liveCheckCode) {
      setServerClaimedStatus('idle');
      return;
    }
    let active = true;
    setServerClaimedStatus('checking');
    checkTransferStatusOnline(liveCheckCode).then((res) => {
      if (!active) return;
      if (res.checked && res.redeemed) {
        setServerClaimedStatus('redeemed');
        setClaimError('Этот перевод уже забрали! Одна ссылка работает только 1 раз.');
      } else {
        setServerClaimedStatus('idle');
      }
    });
    return () => {
      active = false;
    };
  }, [liveCheckCode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, [onClose]);

  const flashCopied = (key: string) => {
    setCopiedKey(key);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedKey(null);
      copyTimerRef.current = null;
    }, 1800);
  };

  const copyText = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        flashCopied(key);
        return;
      }
    } catch {
      // Fallback below
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flashCopied(key);
    } catch {
      // Ignore copy failure
    }
  };

  const shareText = async (title: string, text: string, url: string, fallbackKey: string) => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }
    await copyText(`${text}\n${url}`, fallbackKey);
  };

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nickDraft.trim().slice(0, 16) || 'Райдер';
    const next: WalletProfile = { ...wallet, nickname: cleaned };
    setWallet(next);
    setNickDraft(cleaned);
    saveWalletProfile(next);
    setEditingNick(false);
  };

  const parsedSendAmount = Math.floor(Number(amountInput.replace(/\s+/g, '')) || 0);
  const availableCoins = Math.floor(coins);

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');

    if (parsedRecipient.kind === 'claim_code' && parsedRecipient.claimCode) {
      setClaimInput(parsedRecipient.claimCode);
      setTab('receive');
      return;
    }

    if (parsedRecipient.kind !== 'wallet' || !parsedRecipient.walletId) {
      setSendError('Сначала вставь ссылку на получение (?pay=BS-...) или ID BS-XXXXXX того, кто её кинул!');
      return;
    }

    if (!Number.isFinite(parsedSendAmount) || parsedSendAmount < 1) {
      setSendError('Введи сумму перевода (минимум 1 монета).');
      return;
    }

    if (parsedSendAmount > availableCoins) {
      setSendError(
        `Недостаточно монет! У тебя ${availableCoins.toLocaleString('ru-RU')} 🪙.`
      );
      return;
    }

    const deducted = onDeductCoins(parsedSendAmount);
    if (!deducted) {
      setSendError('Недостаточно монет на балансе.');
      return;
    }

    const created = createOfflineTransferCheck({
      amount: parsedSendAmount,
      targetWalletId: parsedRecipient.walletId,
      senderName: wallet.nickname,
      comment: commentInput,
    });

    sound.playBuy();

    const record: TransferRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'sent',
      amount: created.amount,
      counterparty: parsedRecipient.label,
      targetWallet: created.targetWallet,
      code: created.code,
      link: created.link,
      comment: created.comment,
      createdAt: Date.now(),
    };
    setHistory(appendTransferHistory(record));
    setCreatedTransfer({
      code: created.code,
      link: created.link,
      amount: created.amount,
      recipientLabel: parsedRecipient.label,
      targetWallet: created.targetWallet,
      comment: created.comment,
    });
    setAmountInput('');
    setCommentInput('');
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (claiming) return;
    setClaimError('');
    setClaimSuccess(null);
    setClaiming(true);

    const res = await redeemTransferCheckOnline(claimInput, wallet.walletId);
    setClaiming(false);

    if (!res.ok) {
      if (res.reason === 'already_redeemed') {
        setServerClaimedStatus('redeemed');
      }
      setClaimError(res.message);
      return;
    }

    onCreditCoins(res.check.amount);
    sound.playBuy();

    const record: TransferRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'received',
      amount: res.check.amount,
      counterparty: res.check.fromName || 'Перевод монет',
      targetWallet: res.check.targetWallet,
      code: res.check.code,
      link: '',
      comment: res.check.comment,
      createdAt: Date.now(),
    };
    setHistory(appendTransferHistory(record));
    setClaimSuccess({
      amount: res.check.amount,
      fromName: res.check.fromName,
      comment: res.check.comment,
    });
    setClaimInput('');
    setServerClaimedStatus('idle');
  };

  const reqAmtNum = Math.floor(Number(requestAmountInput.replace(/\s+/g, '')) || 0);
  const myReceiveLink = buildReceiveLink(wallet, reqAmtNum > 0 ? reqAmtNum : undefined);
  const myReceiveCode = buildReceiveShortCode(wallet, reqAmtNum > 0 ? reqAmtNum : undefined);

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center p-3 sm:p-4 bg-[#0a0d12]/82 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-[#161c24]/98 border border-white/10 p-4 sm:p-5 shadow-2xl my-auto text-left">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl sm:text-2xl font-black text-white leading-tight">
                Переводы монет
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/25 text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
                <ShieldCheck className="w-3 h-3" />
                1 активация
              </span>
            </div>
            <div className="text-xs sm:text-sm text-[#ffd34d] font-bold font-mono-num mt-0.5">
              Баланс: 🪙 {availableCoins.toLocaleString('ru-RU')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть переводы"
            className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* My Wallet ID bar */}
        <div className="rounded-xl bg-[#1d2530] border border-white/8 px-3 py-2.5 mb-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#ff6a1a]/15 text-[#ff8b4a] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-white/55 flex items-center gap-1.5">
                  <span>Твой кошелёк</span>
                  {!editingNick && (
                    <button
                      type="button"
                      onClick={() => {
                        setNickDraft(wallet.nickname);
                        setEditingNick(true);
                      }}
                      className="inline-flex items-center gap-0.5 text-white/75 hover:text-white transition"
                      title="Изменить имя"
                    >
                      · <span className="truncate max-w-[90px]">{wallet.nickname}</span>
                      <Pencil className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                    </button>
                  )}
                </div>
                <div className="font-mono-num text-sm font-extrabold text-white tracking-wider">
                  {formatWalletId(wallet.walletId)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyText(formatWalletId(wallet.walletId), 'wallet_id')}
              className="h-8 px-2.5 rounded-lg bg-white/6 hover:bg-white/12 text-white/90 text-xs font-bold flex items-center gap-1 transition shrink-0"
            >
              {copiedKey === 'wallet_id' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Скоп.</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>ID</span>
                </>
              )}
            </button>
          </div>

          {editingNick && (
            <form onSubmit={handleSaveNickname} className="mt-2 pt-2 border-t border-white/8 flex gap-2">
              <input
                type="text"
                maxLength={16}
                value={nickDraft}
                onChange={(e) => setNickDraft(e.target.value)}
                placeholder="Твоё имя"
                autoFocus
                className="flex-1 h-8 px-2.5 rounded-lg bg-[#141a22] border border-white/12 focus:border-[#ff6a1a] outline-none text-xs text-white"
              />
              <button
                type="submit"
                className="h-8 px-3 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] text-white text-xs font-bold transition"
              >
                Ок
              </button>
            </form>
          )}
        </div>

        {/* Tab Switcher */}
        <div
          className={`grid ${receiveOnly ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5 p-1 rounded-xl bg-[#11161d] border border-white/8 mb-4`}
        >
          {!receiveOnly && (
            <button
              type="button"
              onClick={() => {
                setTab('send');
                setSendError('');
              }}
              className={`h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                tab === 'send'
                  ? 'bg-[#ff6a1a] text-white shadow'
                  : 'text-white/65 hover:text-white hover:bg-white/5'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Отправить
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setTab('receive');
              setClaimError('');
            }}
            className={`h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              tab === 'receive'
                ? 'bg-[#ff6a1a] text-white shadow'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Получить
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              tab === 'history'
                ? 'bg-[#ff6a1a] text-white shadow'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            История
          </button>
        </div>

        {/* TAB 1: SEND */}
        {tab === 'send' && (
          <div className="space-y-3.5">
            {createdTransfer ? (
              <div className="rounded-xl bg-[#1a241f] border border-emerald-400/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-display font-bold text-base text-white leading-tight">
                      Перевод готов: {createdTransfer.amount.toLocaleString('ru-RU')} 🪙
                    </div>
                    <div className="text-xs text-emerald-200/80">
                      Для: {createdTransfer.recipientLabel}
                    </div>
                  </div>
                </div>

                {createdTransfer.comment && (
                  <div className="rounded-lg bg-white/6 border border-white/10 px-3 py-2 flex items-start gap-2 text-xs text-white/90">
                    <MessageSquare className="w-3.5 h-3.5 text-[#ffd34d] shrink-0 mt-0.5" />
                    <span className="break-words">«{createdTransfer.comment}»</span>
                  </div>
                )}

                <p className="text-xs text-white/75 leading-relaxed">
                  Отправь эту ссылку или короткий код получателю. Перевод строго привязан к <b>{formatWalletId(createdTransfer.targetWallet)}</b> и работает ровно <b>1 раз</b> — никто другой забрать его не сможет!
                </p>

                {/* Short offline code */}
                <div className="rounded-xl bg-[#10161b] border border-white/10 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">
                    Короткий код (работает без интернета)
                  </div>
                  <div className="font-mono-num text-sm sm:text-base font-extrabold text-[#ffd34d] tracking-wider break-all select-all">
                    {createdTransfer.code}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(createdTransfer.link, 'tx_link')}
                    className="h-10 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    {copiedKey === 'tx_link' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Ссылка скоп.!
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        Копировать ссылку
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        createdTransfer.comment
                          ? `${createdTransfer.code} | ${createdTransfer.comment}`
                          : createdTransfer.code,
                        'tx_code'
                      )
                    }
                    className="h-10 rounded-xl bg-[#242e3b] hover:bg-[#2f3c4d] text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition"
                  >
                    {copiedKey === 'tx_code' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Код скоп.!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Копировать код
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      shareText(
                        'Перевод в BLACK STANT',
                        `Лови ${createdTransfer.amount.toLocaleString('ru-RU')} 🪙 в BLACK STANT!${
                          createdTransfer.comment ? ` Комментарий: «${createdTransfer.comment}».` : ''
                        } Код без интернета: ${createdTransfer.code}`,
                        createdTransfer.link,
                        'tx_share'
                      )
                    }
                    className="h-9 rounded-xl bg-white/8 hover:bg-white/14 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    {copiedKey === 'tx_share' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Скопировано!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        Поделиться
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedTransfer(null);
                      setRecipientInput('');
                      setAmountInput('');
                      setCommentInput('');
                    }}
                    className="h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-semibold text-xs transition"
                  >
                    Новый перевод
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateTransfer} className="space-y-3.5">
                {/* Recipient link / bot link / wallet ID */}
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    Ссылка от друга / бота или ID кошелька
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipientInput}
                      onChange={(e) => {
                        setRecipientInput(e.target.value);
                        setSendError('');
                      }}
                      placeholder="Вставь ссылку друга, бота или BS-XXXXXX..."
                      className="w-full h-11 pl-3 pr-9 rounded-xl bg-[#1d2530] border border-white/12 focus:border-[#ff6a1a] outline-none text-sm text-white placeholder:text-white/35"
                    />
                    {recipientInput && (
                      <button
                        type="button"
                        onClick={() => setRecipientInput('')}
                        aria-label="Очистить"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/70"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Live recognition badge */}
                  <div className="mt-1.5">
                    {parsedRecipient.kind === 'claim_code' && (
                      <button
                        type="button"
                        onClick={() => {
                          setClaimInput(parsedRecipient.claimCode || recipientInput);
                          setRecipientInput('');
                          setTab('receive');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg bg-[#ff6a1a]/15 border border-[#ff6a1a]/40 text-xs font-bold text-[#ffb178] hover:bg-[#ff6a1a]/25 transition"
                      >
                        Это чек на получение ({parsedRecipient.label})! Нажми сюда, чтобы забрать →
                      </button>
                    )}

                    {parsedRecipient.kind === 'wallet' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Получатель: {parsedRecipient.label}</span>
                        </div>
                        <div className="text-[11px] text-emerald-200/75">
                          Защита активна: забрать перевод сможет ТОЛЬКО владелец этой ссылки ({formatWalletId(parsedRecipient.walletId || '')}).
                        </div>
                      </div>
                    )}

                    {parsedRecipient.kind === 'bot_link' && (
                      <div className="flex items-center gap-1.5 text-xs text-[#ff938b] font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          Нужна ссылка на получение от игрока (?pay=BS-...) или его ID BS-XXXXXX
                        </span>
                      </div>
                    )}

                    {parsedRecipient.kind === 'universal' && (
                      <p className="text-[11px] text-white/55">
                        Вставь ссылку на получение (?pay=BS-...) или ID BS-XXXXXX друга — забрать перевод сможет только он.
                      </p>
                    )}

                    {parsedRecipient.kind === 'invalid' && (
                      <p className="text-xs text-[#ff7b72] font-semibold">
                        {parsedRecipient.label}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-white/80">
                      Сумма перевода
                    </label>
                    <button
                      type="button"
                      disabled={availableCoins <= 0}
                      onClick={() => {
                        setAmountInput(String(availableCoins));
                        setSendError('');
                      }}
                      className="text-[11px] font-bold text-[#ff8b4a] hover:text-[#ffa570] disabled:opacity-40 transition"
                    >
                      Всё ({availableCoins.toLocaleString('ru-RU')})
                    </button>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={Math.max(1, availableCoins)}
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      setSendError('');
                    }}
                    placeholder="Например: 5000"
                    className="w-full h-11 px-3 rounded-xl bg-[#1d2530] border border-white/12 focus:border-[#ff6a1a] outline-none text-base font-bold text-white font-mono-num placeholder:text-white/30 placeholder:font-normal"
                  />

                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {QUICK_SEND_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        disabled={availableCoins < amt}
                        onClick={() => {
                          setAmountInput(String(amt));
                          setSendError('');
                        }}
                        className="h-8 rounded-lg bg-[#242e3b] hover:bg-[#2f3c4d] disabled:opacity-35 text-white font-mono-num font-bold text-[11px] border border-white/8 transition"
                      >
                        {amt.toLocaleString('ru-RU')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    Комментарий (необязательно)
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Например: На новый самокат!"
                    className="w-full h-10 px-3 rounded-xl bg-[#1d2530] border border-white/12 focus:border-[#ff6a1a] outline-none text-xs sm:text-sm text-white placeholder:text-white/35"
                  />
                </div>

                {sendError && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ff7b72]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    parsedRecipient.kind !== 'wallet' ||
                    parsedSendAmount < 1 ||
                    parsedSendAmount > availableCoins
                  }
                  className="w-full h-12 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 disabled:hover:bg-[#ff6a1a] text-white font-display font-bold text-base flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Send className="w-4 h-4" />
                  {parsedSendAmount > 0
                    ? `Перевести ${parsedSendAmount.toLocaleString('ru-RU')} 🪙`
                    : 'Создать перевод по ссылке'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: RECEIVE */}
        {tab === 'receive' && (
          <div className="space-y-4">
            {/* Claim incoming transfer check */}
            <form
              onSubmit={handleClaimSubmit}
              className="rounded-xl bg-[#1a222c] border border-white/10 p-3.5 space-y-2.5"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                Забрать монеты по ссылке или коду
              </div>

              <input
                type="text"
                value={claimInput}
                onChange={(e) => {
                  setClaimInput(e.target.value);
                  setClaimError('');
                  setClaimSuccess(null);
                }}
                placeholder="Вставь ссылку или код BS1-..."
                className="w-full h-10 px-3 rounded-xl bg-[#121820] border border-white/12 focus:border-emerald-400 outline-none text-xs sm:text-sm text-white font-mono-num placeholder:font-sans placeholder:text-white/35"
              />

              {/* Live preview */}
              {liveClaimCheck && liveClaimCheck.ok && serverClaimedStatus !== 'redeemed' && (
                <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/35 px-3 py-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-emerald-200 font-semibold">
                      {liveClaimCheck.check.fromName
                        ? `Перевод от ${liveClaimCheck.check.fromName}`
                        : 'Действительный чек (1 активация)'}
                    </div>
                    <div className="font-mono-num text-sm font-black text-emerald-300">
                      +{liveClaimCheck.check.amount.toLocaleString('ru-RU')} 🪙
                    </div>
                  </div>
                  {liveClaimCheck.check.comment && (
                    <div className="flex items-start gap-1.5 text-[11px] text-white/90 pt-1 border-t border-emerald-400/20">
                      <MessageSquare className="w-3.5 h-3.5 text-[#ffd34d] shrink-0 mt-0.5" />
                      <span className="break-words">«{liveClaimCheck.check.comment}»</span>
                    </div>
                  )}
                </div>
              )}

              {liveClaimCheck && !liveClaimCheck.ok && claimInput.trim().length > 6 && (
                <div className="flex items-start gap-1.5 text-xs text-[#ff7b72] font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{liveClaimCheck.message}</span>
                </div>
              )}

              {claimError && (
                <div className="flex items-start gap-1.5 text-xs text-[#ff7b72] font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{claimError}</span>
                </div>
              )}

              {claimSuccess && (
                <div className="rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-3 py-2.5 space-y-1 text-emerald-300 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      +{claimSuccess.amount.toLocaleString('ru-RU')} 🪙 зачислено на твой баланс!
                    </span>
                  </div>
                  {claimSuccess.comment && (
                    <div className="flex items-start gap-1.5 text-[11px] font-medium text-white/90 pl-6">
                      <MessageSquare className="w-3 h-3 text-[#ffd34d] shrink-0 mt-0.5" />
                      <span className="break-words">«{claimSuccess.comment}»</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  claiming ||
                  serverClaimedStatus === 'redeemed' ||
                  !liveClaimCheck ||
                  !liveClaimCheck.ok
                }
                className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-[#07160f] font-display font-black text-sm transition"
              >
                {claiming
                  ? 'Проверяем и зачисляем...'
                  : serverClaimedStatus === 'redeemed'
                    ? 'Уже забрали'
                    : serverClaimedStatus === 'checking'
                      ? 'Проверяем ссылку...'
                      : liveClaimCheck && liveClaimCheck.ok
                        ? `Забрать +${liveClaimCheck.check.amount.toLocaleString('ru-RU')} 🪙`
                        : 'Забрать монеты'}
              </button>
            </form>

            {/* Generate my receive link for friends / bots */}
            <div className="rounded-xl bg-[#1a222c] border border-white/10 p-3.5 space-y-2.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#ff8b4a]" />
                Моя ссылка, чтобы мне скинули монеты
              </div>
              <p className="text-[11px] text-white/60 leading-snug">
                Отправь эту ссылку другу или добавь в бота — при открытии у друга сразу подставится твой кошелёк.
              </p>

              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={50000000}
                value={requestAmountInput}
                onChange={(e) => setRequestAmountInput(e.target.value)}
                placeholder="Запросить сумму (необязательно)"
                className="w-full h-9 px-3 rounded-lg bg-[#121820] border border-white/10 focus:border-[#ff6a1a] outline-none text-xs text-white font-mono-num placeholder:font-sans placeholder:text-white/35"
              />

              <div className="rounded-lg bg-[#121820] border border-white/8 px-2.5 py-2 text-[11px] font-mono-num text-white/80 break-all select-all">
                {myReceiveLink}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => copyText(myReceiveLink, 'my_link')}
                  className="h-9 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-bold text-[11px] flex items-center justify-center gap-1 transition"
                >
                  {copiedKey === 'my_link' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Скоп.
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      Ссылка
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => copyText(myReceiveCode, 'my_code')}
                  className="h-9 rounded-lg bg-[#242e3b] hover:bg-[#2f3c4d] text-white font-bold text-[11px] flex items-center justify-center gap-1 border border-white/8 transition"
                >
                  {copiedKey === 'my_code' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Скоп.
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Код
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    shareText(
                      'Скинь монеты в BLACK STANT',
                      `Переведи мне монеты в BLACK STANT! Код кошелька: ${myReceiveCode}`,
                      myReceiveLink,
                      'my_share'
                    )
                  }
                  className="h-9 rounded-lg bg-[#242e3b] hover:bg-[#2f3c4d] text-white font-bold text-[11px] flex items-center justify-center gap-1 border border-white/8 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Кинуть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HISTORY */}
        {tab === 'history' && (
          <div className="space-y-2 max-h-[46dvh] overflow-y-auto pr-0.5 mobile-scroll">
            {history.length === 0 ? (
              <div className="rounded-xl bg-[#1a222c] border border-white/8 p-6 text-center text-xs text-white/55">
                Переводов пока нет. Отправь монеты другу или активируй полученный код!
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-[#1a222c] border border-white/8 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          item.type === 'sent'
                            ? 'bg-[#ff6a1a]/15 text-[#ff8b4a]'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {item.type === 'sent' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {item.type === 'sent' ? `Кому: ${item.counterparty}` : `От: ${item.counterparty}`}
                        </div>
                        <div className="text-[10px] text-white/45 font-mono-num">
                          {new Date(item.createdAt).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-mono-num text-sm font-black shrink-0 ${
                        item.type === 'sent' ? 'text-[#ff8b4a]' : 'text-emerald-300'
                      }`}
                    >
                      {item.type === 'sent' ? '−' : '+'}
                      {item.amount.toLocaleString('ru-RU')} 🪙
                    </div>
                  </div>

                  {item.comment && (
                    <div className="flex items-start gap-1.5 text-[11px] text-white/80 bg-white/[0.04] rounded-lg px-2.5 py-1.5">
                      <MessageSquare className="w-3 h-3 text-[#ffd34d] shrink-0 mt-0.5" />
                      <span className="break-words">«{item.comment}»</span>
                    </div>
                  )}

                  {item.type === 'sent' && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-white/6">
                      <button
                        type="button"
                        onClick={() => copyText(item.link, `h_link_${item.id}`)}
                        className="flex-1 h-7 rounded-lg bg-white/6 hover:bg-white/12 text-white/85 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        {copiedKey === `h_link_${item.id}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Link2 className="w-3 h-3" />
                        )}
                        Ссылка
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            item.comment ? `${item.code} | ${item.comment}` : item.code,
                            `h_code_${item.id}`
                          )
                        }
                        className="flex-1 h-7 rounded-lg bg-white/6 hover:bg-white/12 text-white/85 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        {copiedKey === `h_code_${item.id}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Код
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
