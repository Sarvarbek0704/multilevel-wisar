'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from '@/components/icons';
import { Button, TextInput } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { CefrLevel, Subject, User } from '@/lib/types';

const LEVELS: Array<{ value: CefrLevel; body: string }> = [
  { value: 'B1', body: 'Sertifikat darajasi — 38-50 ball. Kundalik va o‘quv mavzularida erkin.' },
  { value: 'B2', body: 'Ko‘p OTM va ish o‘rinlari uchun yetarli — 51-64 ball.' },
  { value: 'C1', body: 'Eng yuqori daraja — 65-75 ball. Akademik va professional muhitda erkin.' },
];

const TIMES = [
  { value: 30, label: '30 daqiqa', note: 'sekin, lekin barqaror' },
  { value: 60, label: '1 soat', note: 'tavsiya etiladi' },
  { value: 120, label: '2 soat', note: 'tez natija' },
  { value: 180, label: '3 soat va ko‘proq', note: 'imtihon yaqin bo‘lsa' },
];

const SUBJECTS: Array<{ value: Subject; title: string; body: string }> = [
  { value: 'ENGLISH', title: 'Ingliz tili', body: 'UzBMB multilevel — Listening, Reading, Writing, Speaking' },
  { value: 'UZBEK', title: 'Ona tili', body: 'Milliy sertifikat — til qoidalari va insho' },
];

/** Sana kiritish: 24.12.2026 → ISO */
function parseDate(input: string): string | undefined {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(input.trim());
  if (!match) return undefined;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState<Subject>('ENGLISH');
  const [level, setLevel] = useState<CefrLevel>('B2');
  const [examDate, setExamDate] = useState('');
  const [minutes, setMinutes] = useState(60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (goPlacement: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const iso = parseDate(examDate);
      const updated = await api<User>('/users/me', {
        method: 'PATCH',
        body: {
          targetLevel: level,
          dailyGoalMinutes: minutes,
          ...(iso ? { examDate: iso } : {}),
        },
      });
      setUser(updated);

      // Reja darhol tuziladi — bo'sh dashboard ko'rsatmaslik uchun
      await api('/study-plan/generate', {
        method: 'POST',
        body: { subject, targetLevel: level, dailyMinutes: minutes, ...(iso ? { examDate: iso } : {}) },
      }).catch(() => undefined);

      router.push(goPlacement ? '/mocks/english-placement-test' : '/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Saqlanmadi');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
      <header className="flex items-center gap-3 px-5 pt-4">
        <button
          onClick={() => (step === 0 ? router.push('/dashboard') : setStep(step - 1))}
          className="text-ink"
          aria-label="Orqaga"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-1 gap-1.5">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={`h-[3px] flex-1 ${index <= step ? 'bg-accent' : 'bg-line'}`}
            />
          ))}
        </div>
      </header>

      <div className="flex-1 px-5 pb-5 pt-7">
        <p className="text-2xs font-semibold tracking-wider text-accent">{step + 1} / 4</p>

        {step === 0 && (
          <>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tighter">
              Qaysi fanga tayyorlanasiz?
            </h1>
            <div className="mt-6 flex flex-col gap-2.5">
              {SUBJECTS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setSubject(item.value)}
                  className={`border p-[18px] text-left ${
                    subject === item.value ? 'is-selected' : 'border-line'
                  }`}
                >
                  <p className="font-display text-xl font-semibold">{item.title}</p>
                  <p className="mt-1.5 text-base leading-relaxed text-ink-3">{item.body}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tighter">
              Maqsadingiz qaysi daraja?
            </h1>
            <div className="mt-6 flex flex-col gap-2.5">
              {LEVELS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setLevel(item.value)}
                  className={`flex gap-4 border p-4 text-left ${
                    level === item.value ? 'is-selected' : 'border-line'
                  }`}
                >
                  <span className="w-[26px] shrink-0 font-display text-lg font-bold">
                    {item.value}
                  </span>
                  <span className="text-base leading-relaxed text-ink-3">{item.body}</span>
                </button>
              ))}
            </div>
            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-ink-3">
                Imtihon sanasi (ixtiyoriy)
              </label>
              <TextInput
                value={examDate}
                onChange={(event) => setExamDate(event.target.value)}
                placeholder="24.12.2026"
                inputMode="numeric"
                className="font-mono"
              />
              <p className="mt-1.5 text-sm text-ink-5">
                Sanani kiritsangiz reja aynan shu kunga moslashtiriladi.
              </p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tighter">
              Kuniga qancha vaqt ajratasiz?
            </h1>
            <div className="mt-6 flex flex-col gap-2.5">
              {TIMES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setMinutes(item.value)}
                  className={`flex items-center justify-between border p-4 text-left ${
                    minutes === item.value ? 'is-selected' : 'border-line'
                  }`}
                >
                  <span className="font-display text-lg font-semibold">{item.label}</span>
                  <span className="text-sm text-ink-4">{item.note}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tighter">
              Darajangizni aniqlaymizmi?
            </h1>
            <p className="mt-3 text-ui leading-relaxed text-ink-3">
              20 savollik test (25 daqiqa) qaysi darajadan boshlashingizni aniqlaydi. Rejangiz
              natijaga qarab moslashtiriladi. Xohlasangiz keyinroq ham topshirishingiz mumkin.
            </p>
            <div className="mt-6 border border-line">
              {[
                ['Fan', SUBJECTS.find((s) => s.value === subject)?.title ?? ''],
                ['Maqsad daraja', level],
                ['Imtihon sanasi', examDate.trim() || 'kiritilmagan'],
                ['Kunlik vaqt', TIMES.find((t) => t.value === minutes)?.label ?? ''],
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
            {error && <p className="mt-3 text-sm text-error">{error}</p>}
          </>
        )}
      </div>

      <div className="px-5 pb-6">
        {step < 3 ? (
          <Button full onClick={() => setStep(step + 1)}>
            Davom etish
          </Button>
        ) : (
          <>
            <Button full disabled={busy} onClick={() => save(true)}>
              {busy ? 'Saqlanmoqda…' : 'Placement testni boshlash'}
            </Button>
            <button
              onClick={() => save(false)}
              disabled={busy}
              className="mt-3.5 w-full text-center text-base text-ink-4"
            >
              O‘tkazib yuborish
            </button>
          </>
        )}
      </div>
    </div>
  );
}
