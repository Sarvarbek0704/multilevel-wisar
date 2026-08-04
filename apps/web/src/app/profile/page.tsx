'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AppFrame } from '@/components/app-frame';
import { OtpInput } from '@/components/auth/otp-input';
import { Heatmap } from '@/components/heatmap';
import { TelegramIcon } from '@/components/icons';
import { Button, Field, SectionLabel, Segmented, TextInput } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme';
import { formatDateFull, initials } from '@/lib/format';
import type { DashboardResponse, HeatmapDay, OtpRequestResponse, User } from '@/lib/types';
import { needsBotContact } from '@/lib/types';

export default function ProfilePage() {
  return (
    <AppFrame>
      <ProfileContent />
    </AppFrame>
  );
}

function ProfileContent() {
  const { user, signOut, setUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardResponse>('/progress/dashboard'),
  });
  const heatmap = useQuery({
    queryKey: ['heatmap'],
    queryFn: () => api<HeatmapDay[]>('/progress/heatmap?days=126'),
  });

  const link = useMutation({
    mutationFn: () => api<{ linkUrl: string | null }>('/telegram/link', { method: 'POST' }),
    onSuccess: (result) => {
      if (result.linkUrl) window.open(result.linkUrl, '_blank');
    },
  });

  if (!user) return null;

  return (
    <div className="px-5 pb-8 pt-5 lg:px-8 lg:pt-8">
      <div className="flex items-center gap-3.5">
        <span className="flex h-[52px] w-[52px] items-center justify-center bg-ink font-display text-2xl font-semibold text-bg">
          {initials(user.firstName, user.lastName)}
        </span>
        <div className="min-w-0">
          <p className="font-display text-2xl font-bold tracking-tight">
            {user.firstName} {user.lastName ?? ''}
          </p>
          <p className="truncate text-base text-ink-4">
            {user.email ?? user.phone ?? 'Kontakt biriktirilmagan'}
          </p>
        </div>
      </div>

      {/* O'quv ma'lumotlari */}
      <div className="mt-6 border border-line">
        {[
          ['Joriy daraja', user.currentLevel ?? 'aniqlanmagan'],
          ['Maqsad daraja', user.targetLevel ?? '—'],
          ['Imtihon sanasi', user.examDate ? formatDateFull(user.examDate) : 'kiritilmagan'],
          ['Kunlik maqsad', `${user.dailyGoalMinutes} daqiqa`],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={`flex items-center justify-between px-4 py-3.5 ${
              index > 0 ? 'border-t border-line-2' : ''
            }`}
          >
            <span className="text-ui text-ink-3">{label}</span>
            <span className="text-ui font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Bog'langan hisoblar */}
      <section className="mt-7">
        <SectionLabel>BOG‘LANGAN HISOBLAR</SectionLabel>
        <div className="mt-3 flex flex-col gap-2.5">
          <ContactRow
            kind="email"
            value={user.email}
            verified={!!user.emailVerifiedAt}
            onUpdated={setUser}
          />
          <ContactRow
            kind="phone"
            value={user.phone}
            verified={!!user.phoneVerifiedAt}
            onUpdated={setUser}
          />

          {user.telegramId ? (
            <div className="border border-success bg-success-bg p-4">
              <p className="text-ui font-semibold text-success-dark">✓ Telegram bot ulangan</p>
              <p className="mt-1 text-base text-ink-3">
                Natijalar, eslatmalar va kunlik so‘zlar botga keladi.
              </p>
            </div>
          ) : (
            <div className="border border-accent-border bg-accent-soft p-4">
              <p className="text-ui font-semibold text-accent-dark">Telegram bot ulanmagan</p>
              <p className="mt-1 text-base leading-relaxed text-accent-mid">
                Ulasangiz: kunlik so‘zlar, tezkor testlar, eslatmalar va mock natijalari
                to‘g‘ridan-to‘g‘ri Telegramga keladi.
              </p>
              <button
                onClick={() => link.mutate()}
                disabled={link.isPending}
                className="mt-3 flex items-center gap-2 bg-telegram px-4 py-2.5 text-base font-semibold text-white"
              >
                <TelegramIcon size={16} />
                {link.isPending ? 'Havola olinmoqda…' : 'Botni ulash'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Statistika */}
      {dashboard.data && (
        <section className="mt-7">
          <SectionLabel>STATISTIKA</SectionLabel>
          <div className="mt-3 grid grid-cols-3 border border-line">
            {[
              { value: dashboard.data.totals.xp.toLocaleString('uz-UZ'), label: 'XP' },
              { value: dashboard.data.totals.lessonsCompleted, label: 'DARS' },
              {
                value: `${Math.round(dashboard.data.totals.minutes / 60)}s`,
                label: 'JAMI VAQT',
              },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`p-4 text-center ${index > 0 ? 'border-l border-line' : ''}`}
              >
                <p className="font-display text-2xl font-bold tracking-tight">{item.value}</p>
                <p className="mt-1 text-2xs tracking-label text-ink-4">{item.label}</p>
              </div>
            ))}
          </div>
          {heatmap.data && heatmap.data.length > 0 && (
            <div className="mt-3">
              <Heatmap days={heatmap.data} />
            </div>
          )}
        </section>
      )}

      {/* Sozlamalar */}
      <section className="mt-7">
        <SectionLabel>SOZLAMALAR</SectionLabel>
        <div className="mt-3 flex items-center justify-between border border-line bg-surface p-4">
          <span className="text-ui text-ink-3">Tema</span>
          <Segmented
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'auto', label: 'Auto' },
            ]}
            value={theme}
            onChange={setTheme}
          />
        </div>
      </section>

      {user.role === 'ADMIN' && (
        <a
          href="/admin"
          className="mt-7 block border border-accent-border bg-accent-soft p-4 text-center text-ui font-semibold text-accent-dark"
        >
          Admin panel →
        </a>
      )}

      <Button variant="danger" full className="mt-8" onClick={() => void signOut()}>
        Chiqish
      </Button>
    </div>
  );
}

/** Email yoki telefonni OTP orqali biriktirish */
function ContactRow({
  kind,
  value,
  verified,
  onUpdated,
}: {
  kind: 'email' | 'phone';
  value: string | null;
  verified: boolean;
  onUpdated: (user: User) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'input' | 'code' | 'bot'>('input');
  const [botUrl, setBotUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const label = kind === 'email' ? 'Email' : 'Telefon raqam';

  const request = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await api<OtpRequestResponse>(`/auth/attach/${kind}/request`, {
        method: 'POST',
        body: kind === 'email' ? { email: input } : { phone: input },
      });
      if (needsBotContact(response)) {
        setBotUrl(response.botUrl);
        setStage('bot');
      } else {
        setStage('code');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kod yuborilmadi');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await api<User>(`/auth/attach/${kind}/verify`, {
        method: 'POST',
        body: kind === 'email' ? { email: input, code: value } : { phone: input, code: value },
      });
      onUpdated(updated);
      setOpen(false);
      setStage('input');
      setInput('');
      setCode('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Tasdiqlanmadi');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-4">{label}</p>
          <p className="mt-0.5 truncate text-ui font-medium">
            {value ?? 'biriktirilmagan'}
            {value && verified && <span className="ml-1.5 text-success">✓</span>}
          </p>
        </div>
        <button
          onClick={() => {
            setOpen(!open);
            setStage('input');
            setError(null);
          }}
          className="shrink-0 text-sm font-semibold text-accent"
        >
          {open ? 'Yopish' : value ? 'O‘zgartirish' : 'Biriktirish'}
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-line-2 pt-4">
          {stage === 'input' && (
            <>
              <Field label={`Yangi ${label.toLowerCase()}`} error={error}>
                <TextInput
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={kind === 'email' ? 'siz@gmail.com' : '+998 90 123 45 67'}
                  inputMode={kind === 'email' ? 'email' : 'tel'}
                />
              </Field>
              <Button
                full
                className="mt-3"
                disabled={!input.trim() || busy}
                onClick={request}
              >
                {busy ? 'Yuborilmoqda…' : 'Kod olish'}
              </Button>
            </>
          )}

          {stage === 'code' && (
            <>
              <p className="text-base text-ink-3">
                {kind === 'email' ? 'Emailingizga' : 'Telegram botga'} yuborilgan 6 xonali kodni
                kiriting.
              </p>
              <div className="mt-3">
                <OtpInput value={code} onChange={setCode} onComplete={verify} invalid={!!error} />
              </div>
              {error && <p className="mt-2 text-sm text-error">{error}</p>}
              <Button
                full
                className="mt-3"
                disabled={code.length !== 6 || busy}
                onClick={() => verify(code)}
              >
                Tasdiqlash
              </Button>
            </>
          )}

          {stage === 'bot' && (
            <>
              <p className="text-base leading-relaxed text-ink-3">
                Bu raqam hali botga ulanmagan. Botni oching va «📱 Telefon raqamni yuborish»
                tugmasini bosing, so‘ng qaytib kod so‘rang.
              </p>
              <a
                href={botUrl ? `${botUrl}?start=phone` : '#'}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-2 bg-telegram py-3 text-base font-semibold text-white"
              >
                <TelegramIcon size={16} />
                Botni ochish
              </a>
              <Button variant="secondary" full className="mt-2.5" onClick={request} disabled={busy}>
                Ulandim — kodni yuboring
              </Button>
              {error && <p className="mt-2 text-sm text-error">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
