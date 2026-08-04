'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { OtpStep } from '@/components/auth/otp-step';
import { Button, Field, TextInput } from '@/components/ui';
import { api, authRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { OtpSentResponse } from '@/lib/types';

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [sent, setSent] = useState<OtpSentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await api<{ sent: boolean; message: string; devCode?: string }>(
        '/auth/password/forgot',
        { method: 'POST', body: { email }, auth: false },
      );
      // Backend hisob mavjudligini oshkor qilmaydi — har doim kod qadamiga o'tamiz
      setSent({
        sent: true,
        channel: 'EMAIL',
        target: email,
        expiresInSeconds: 300,
        devCode: response.devCode,
      });
      setStep('code');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kod yuborilmadi');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (password !== repeat) {
      setError('Parollar mos kelmadi');
      return;
    }
    if (password.length < 8) {
      setError('Parol kamida 8 belgidan iborat bo‘lishi kerak');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await authRequest('/auth/password/reset', {
        email,
        code,
        newPassword: password,
      });
      signIn(result);
      router.push('/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Parol tiklanmadi');
      setStep('code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-6">
      {step === 'email' && (
        <>
          <h1 className="font-display text-5xl font-bold tracking-tighter">Parolni tiklash</h1>
          <p className="mt-2.5 text-ui leading-relaxed text-ink-3">
            Hisobingizga bog‘langan emailni kiriting — tiklash kodini yuboramiz.
          </p>
          <div className="mt-7">
            <Field label="Email" error={error}>
              <TextInput
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="siz@gmail.com"
                inputMode="email"
                autoComplete="email"
              />
            </Field>
          </div>
          <Button full className="mt-5" disabled={!email.trim() || busy} onClick={requestCode}>
            {busy ? 'Yuborilmoqda…' : 'Kod yuborish'}
          </Button>
          <Link href="/login" className="mt-4 text-center text-base text-ink-4">
            ← Kirishga qaytish
          </Link>
        </>
      )}

      {step === 'code' && sent && (
        <OtpStep
          sent={sent}
          title="Tiklash kodi"
          submitLabel="Davom etish"
          onVerify={async (value) => {
            setCode(value);
            setStep('password');
          }}
          onResend={requestCode}
          onBack={() => setStep('email')}
        />
      )}

      {step === 'password' && (
        <>
          <h1 className="font-display text-5xl font-bold tracking-tighter">Yangi parol</h1>
          <p className="mt-2.5 text-ui leading-relaxed text-ink-3">
            Yangi parol o‘rnatilgach barcha qurilmalardagi sessiyalar yakunlanadi.
          </p>
          <div className="mt-7 flex flex-col gap-2.5">
            <Field label="Yangi parol">
              <TextInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Kamida 8 belgi"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Parolni takrorlang" error={error}>
              <TextInput
                type="password"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>
          <Button full className="mt-5" disabled={busy} onClick={resetPassword}>
            {busy ? 'Saqlanmoqda…' : 'Parolni saqlash va kirish'}
          </Button>
        </>
      )}
    </div>
  );
}
