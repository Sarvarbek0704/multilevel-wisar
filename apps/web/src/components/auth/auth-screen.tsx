'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { OtpStep } from '@/components/auth/otp-step';
import { SocialButtons } from '@/components/auth/social-buttons';
import { TelegramIcon } from '@/components/icons';
import { Button, Field, Segmented, TextInput } from '@/components/ui';
import { api, authRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { needsBotContact, type AuthResult, type BotContactRequired, type OtpRequestResponse, type OtpSentResponse } from '@/lib/types';

type Channel = 'phone' | 'email';
type Step = 'form' | 'otp' | 'botContact';

export function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useAuth();

  const [step, setStep] = useState<Step>('form');
  const [channel, setChannel] = useState<Channel>('phone');
  const [usePassword, setUsePassword] = useState(false);

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');

  const [sent, setSent] = useState<OtpSentResponse | null>(null);
  const [botContact, setBotContact] = useState<BotContactRequired | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finish = useCallback(
    (result: AuthResult) => {
      signIn(result);
      const next = params.get('next');
      if (next === 'placement') router.push('/mocks/english-placement-test');
      else if (mode === 'register' && !result.user.targetLevel) router.push('/onboarding');
      else router.push('/dashboard');
    },
    [signIn, params, router, mode],
  );

  const requestOtp = async () => {
    setBusy(true);
    setError(null);
    try {
      if (channel === 'phone') {
        const response = await api<OtpRequestResponse>('/auth/otp/phone/request', {
          method: 'POST',
          body: { phone },
          auth: false,
        });
        if (needsBotContact(response)) {
          setBotContact(response);
          setStep('botContact');
        } else {
          setSent(response);
          setStep('otp');
        }
      } else {
        const response = await api<OtpSentResponse>('/auth/otp/email/request', {
          method: 'POST',
          body: { email },
          auth: false,
        });
        setSent(response);
        setStep('otp');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kod yuborilmadi');
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (code: string) => {
    const path = channel === 'phone' ? '/auth/otp/phone/verify' : '/auth/otp/email/verify';
    const body =
      channel === 'phone'
        ? { phone, code, firstName: firstName.trim() || undefined }
        : { email, code, firstName: firstName.trim() || undefined };
    finish(await authRequest(path, body));
  };

  const submitPassword = async () => {
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === 'register'
          ? await authRequest('/auth/register', { email, password, firstName: firstName.trim() })
          : await authRequest('/auth/login', { email, password });
      finish(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kirish muvaffaqiyatsiz');
    } finally {
      setBusy(false);
    }
  };

  // ---------- Kod kiritish qadami ----------

  if (step === 'otp' && sent) {
    return (
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-5 pb-8 pt-6 lg:justify-center lg:pt-0">
        <OtpStep
          sent={sent}
          onVerify={verifyOtp}
          onResend={requestOtp}
          onBack={() => {
            setStep('form');
            setSent(null);
          }}
          submitLabel={mode === 'register' ? 'Hisob yaratish' : 'Kirish'}
        />
      </div>
    );
  }

  // ---------- Raqam botga ulanmagan ----------

  if (step === 'botContact' && botContact) {
    return (
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-5 pb-8 pt-6 lg:justify-center lg:pt-0">
        <h1 className="font-display text-4xl font-bold tracking-tighter">
          Raqamni Telegram bot orqali tasdiqlaymiz
        </h1>
        <p className="mt-2.5 text-ui leading-relaxed text-ink-3">
          SMS o‘rniga kodni <b className="font-semibold text-ink">Telegram bot</b> yuboradi — bu
          bepul va xavfsizroq. Bir marta ulash kifoya.
        </p>

        <ol className="mt-6">
          {[
            'Botni oching (pastdagi tugma)',
            '«📱 Telefon raqamni yuborish» tugmasini bosing',
            'Shu sahifaga qayting va kodni oling',
          ].map((text, index) => (
            <li key={text} className="flex gap-3.5 border-t border-line py-3.5">
              <span className="font-mono text-sm text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-ui leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>

        <a
          href={botContact.botUrl ? `${botContact.botUrl}?start=phone` : '#'}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex items-center justify-center gap-2.5 bg-telegram py-4 font-display text-md font-semibold text-white"
        >
          <TelegramIcon size={18} />
          Telegram botni ochish
        </a>
        <Button variant="secondary" full className="mt-2.5" onClick={requestOtp} disabled={busy}>
          {busy ? 'Tekshirilmoqda…' : 'Ulandim — kodni yuboring'}
        </Button>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <button onClick={() => setStep('form')} className="mt-4 text-base text-ink-4">
          ← Boshqa usul bilan kirish
        </button>
      </div>
    );
  }

  // ---------- Asosiy forma ----------

  const isRegister = mode === 'register';

  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-5 pb-8 pt-6 lg:justify-center lg:pt-0">
      <Link href="/" className="mb-9 flex items-baseline gap-1">
        <span className="font-display text-[17px] font-bold tracking-tight">multilevel</span>
        <span className="text-sm text-ink-4">.wisar.uz</span>
      </Link>

      <h1 className="font-display text-5xl font-bold tracking-tighter">
        {isRegister ? 'Bepul hisob yarating' : 'Xush kelibsiz'}
      </h1>
      <p className="mt-2.5 text-ui leading-relaxed text-ink-3">
        {isRegister
          ? 'Bir daqiqada boshlang — kurslar, mocklar va AI baholash butunlay bepul.'
          : 'Hisobingizga kiring va o‘qishni davom ettiring.'}
      </p>

      <div className="mt-7">
        <SocialButtons onSuccess={finish} onError={setError} />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs tracking-wide text-ink-5">YOKI</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Segmented
        className="mb-4 w-full [&>button]:flex-1"
        options={[
          { value: 'phone', label: 'Telefon raqam' },
          { value: 'email', label: 'Email' },
        ]}
        value={channel}
        onChange={(value) => {
          setChannel(value);
          setError(null);
          setUsePassword(false);
        }}
      />

      <div className="flex flex-col gap-2.5">
        {isRegister && (
          <Field label="Ismingiz">
            <TextInput
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Aziza"
              autoComplete="given-name"
            />
          </Field>
        )}

        {channel === 'phone' ? (
          <Field label="Telefon raqam" hint={<span className="text-sm text-ink-5">Kod botga keladi</span>}>
            <TextInput
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+998 90 123 45 67"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>
        ) : (
          <>
            <Field label="Email">
              <TextInput
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="siz@gmail.com"
                inputMode="email"
                autoComplete="email"
              />
            </Field>
            {usePassword && (
              <Field
                label="Parol"
                hint={
                  !isRegister ? (
                    <Link href="/forgot" className="text-sm text-accent">
                      Unutdingizmi?
                    </Link>
                  ) : undefined
                }
              >
                <TextInput
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Kamida 8 belgi"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
              </Field>
            )}
          </>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <Button
        full
        className="mt-5"
        disabled={busy || (channel === 'phone' ? !phone.trim() : !email.trim())}
        onClick={usePassword ? submitPassword : requestOtp}
      >
        {busy
          ? 'Kutilmoqda…'
          : usePassword
            ? isRegister
              ? 'Hisob yaratish'
              : 'Kirish'
            : 'Kod olish'}
      </Button>

      {channel === 'email' && (
        <button
          onClick={() => {
            setUsePassword(!usePassword);
            setError(null);
          }}
          className="mt-3.5 text-base text-accent"
        >
          {usePassword ? 'Kod bilan kirish (parolsiz)' : 'Parol bilan kirish'}
        </button>
      )}

      <div className="flex-1" />

      <p className="mt-8 text-center text-base text-ink-3">
        {isRegister ? 'Hisobingiz bormi? ' : 'Hisobingiz yo‘qmi? '}
        <Link href={isRegister ? '/login' : '/register'} className="font-semibold text-ink underline">
          {isRegister ? 'Kirish' : 'Ro‘yxatdan o‘tish'}
        </Link>
      </p>
    </div>
  );
}
