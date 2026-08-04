'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { formatClock } from '@/lib/format';
import type { OtpSentResponse } from '@/lib/types';
import { OtpInput } from './otp-input';

const RESEND_COOLDOWN = 60;

/**
 * Kod kiritish qadami — email va telefon uchun bir xil, parolni tiklashda ham
 * shu komponent ishlatiladi.
 */
export function OtpStep({
  sent,
  onVerify,
  onResend,
  onBack,
  title,
  submitLabel = 'Tasdiqlash',
  extra,
}: {
  sent: OtpSentResponse;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  title?: string;
  submitLabel?: string;
  extra?: React.ReactNode;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expiresIn, setExpiresIn] = useState(sent.expiresInSeconds);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const channelText =
    sent.channel === 'TELEGRAM'
      ? 'Telegram botga yubordik'
      : 'elektron pochtangizga yubordik';

  const submit = async (value: string) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onVerify(value);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kod tasdiqlanmadi');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      await onResend();
      setCooldown(RESEND_COOLDOWN);
      setExpiresIn(sent.expiresInSeconds);
      setCode('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kod yuborilmadi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-display text-5xl font-bold tracking-tighter">
        {title ?? 'Kodni kiriting'}
      </h1>
      <p className="mt-2.5 text-ui leading-relaxed text-ink-3">
        6 xonali kodni <b className="font-semibold text-ink">{sent.target}</b> {channelText}.
      </p>

      <div className="mt-6">
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value);
            if (error) setError(null);
          }}
          onComplete={submit}
          invalid={!!error}
          disabled={busy}
        />
        {error && <p className="mt-2 text-sm text-error">{error}</p>}

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-mono text-ink-4">
            {expiresIn > 0 ? `Kod amal qiladi: ${formatClock(expiresIn)}` : 'Kod muddati tugadi'}
          </span>
          <button
            onClick={resend}
            disabled={cooldown > 0 || busy}
            className="font-medium text-accent disabled:text-ink-5"
          >
            {cooldown > 0 ? `Qayta yuborish (${cooldown})` : 'Qayta yuborish'}
          </button>
        </div>

        {sent.devCode && (
          <p className="mt-3 border border-warn-border bg-warn-bg px-3 py-2 font-mono text-sm text-warn-text">
            DEV: kod {sent.devCode}
          </p>
        )}
      </div>

      {extra}

      <Button full className="mt-6" disabled={code.length !== 6 || busy} onClick={() => submit(code)}>
        {busy ? 'Tekshirilmoqda…' : submitLabel}
      </Button>
      <button onClick={onBack} className="mt-4 text-base text-ink-4">
        ← Orqaga
      </button>
    </div>
  );
}
