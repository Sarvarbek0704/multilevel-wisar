'use client';

import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { AppFrame } from '@/components/app-frame';
import { ArrowRight } from '@/components/icons';
import { Button, HatchPlaceholder, SectionLabel, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { SKILL_LABEL, formatDate } from '@/lib/format';
import type { ExercisePublic, Skill } from '@/lib/types';

interface MistakePattern {
  key: string;
  label: string;
  category: string;
  count: number;
  skills: Skill[];
  examples: Array<{
    original: string;
    corrected: string;
    explanationUz: string;
    at: string;
  }>;
}

interface MistakesResponse {
  total: number;
  patterns: MistakePattern[];
  byCategory: Array<{ category: string; label: string; count: number }>;
}

/**
 * Xatolar daftari — AI har baholashda topgan xatolar shu yerda takrorlanish
 * bo'yicha guruhlanadi. C1 ga chiqishning eng tez yo'li: takroriy xatolarni
 * yo'q qilish.
 */
export default function MistakesPage() {
  return (
    <AppFrame width="wide">
      <MistakesContent />
    </AppFrame>
  );
}

function MistakesContent() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const mistakes = useQuery({
    queryKey: ['mistakes'],
    queryFn: () => api<MistakesResponse>('/ai/mistakes'),
  });

  const drills = useQuery({
    queryKey: ['mistakes', 'drills'],
    queryFn: () =>
      api<{ patterns: MistakePattern[]; exercises: ExercisePublic[] }>('/ai/mistakes/drills'),
    enabled: (mistakes.data?.total ?? 0) > 0,
  });

  if (mistakes.isLoading) {
    return (
      <div className="flex flex-col gap-3 px-5 py-6 lg:px-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const data = mistakes.data;

  if (!data || data.total === 0) {
    return (
      <div className="px-5 pb-8 pt-4 lg:px-8 lg:pt-8">
        <h1 className="font-display text-4xl font-bold tracking-tighter">Xatolar daftari</h1>
        <div className="mt-6 border border-line-3 bg-surface p-5">
          <HatchPlaceholder />
          <h2 className="mt-4 font-display text-2xl font-semibold">Hali xato yig‘ilmagan</h2>
          <p className="mt-2 text-base leading-relaxed text-ink-3">
            Writing yoki Speaking javobingizni AI baholaganda, u topgan har bir xato shu yerga
            tushadi va takrorlanishi bo‘yicha guruhlanadi. Shunda qaysi qoida sizni doimiy
            ravishda ballsiz qoldirayotgani ko‘rinadi.
          </p>
          <Link href="/practice">
            <Button full className="mt-4">
              AI amaliyotni boshlash
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const worst = data.patterns[0];

  return (
    <div className="px-5 pb-8 pt-4 lg:px-8 lg:pt-8">
      <h1 className="font-display text-4xl font-bold tracking-tighter">Xatolar daftari</h1>
      <p className="mt-1.5 text-base leading-relaxed text-ink-3">
        AI baholashlaridan yig‘ilgan <b className="font-semibold text-ink">{data.total} ta</b>{' '}
        xato. Ular tur bo‘yicha guruhlangan — eng tepadagisi ballingizni eng ko‘p pasaytiryapti.
      </p>

      {worst && (
        <div className="mt-5 border-l-[3px] border-accent bg-accent-soft p-4">
          <SectionLabel className="text-accent">ENG KO‘P TAKRORLANGAN</SectionLabel>
          <p className="mt-2 font-display text-2xl font-semibold text-accent-dark">
            {worst.label}
          </p>
          <p className="mt-1 text-base leading-relaxed text-accent-mid">
            {worst.count} marta uchradi
            {worst.skills.length > 0 &&
              ` · ${worst.skills.map((skill) => SKILL_LABEL[skill]).join(', ')} bo‘limlarida`}
            . Shu bitta qoidani tuzatsangiz, har bir javobingiz bir necha ball yuqori
            baholanadi.
          </p>
        </div>
      )}

      <section className="mt-7">
        <SectionLabel>XATO TURLARI</SectionLabel>
        <div className="mt-3 flex flex-col gap-2">
          {data.patterns.map((pattern) => {
            const open = openKey === pattern.key;
            const share = Math.round((pattern.count / data.total) * 100);
            return (
              <div key={pattern.key} className="border border-line bg-surface">
                <button
                  onClick={() => setOpenKey(open ? null : pattern.key)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-ui font-medium">{pattern.label}</p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <span className="h-[5px] flex-1 bg-desk">
                        <span className="block h-full bg-accent" style={{ width: `${share}%` }} />
                      </span>
                      <span className="font-mono text-sm text-ink-4">{pattern.count}×</span>
                    </div>
                  </div>
                  <span className="text-ink-4">{open ? '−' : '+'}</span>
                </button>

                {open && (
                  <div className="border-t border-line-2 p-4">
                    <SectionLabel>MISOLLAR</SectionLabel>
                    <div className="mt-3 flex flex-col gap-3.5">
                      {pattern.examples.map((example, index) => (
                        <div key={index} className="border-l-2 border-error-border pl-3">
                          <p className="text-base leading-relaxed">
                            <span className="text-error line-through">{example.original}</span>
                            <span className="mx-1.5 text-ink-4">→</span>
                            <span className="font-medium text-success">{example.corrected}</span>
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-ink-4">
                            {example.explanationUz}
                          </p>
                          <p className="mt-1 font-mono text-xs text-ink-5">
                            {formatDate(example.at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {drills.data && drills.data.exercises.length > 0 && (
        <section className="mt-8">
          <SectionLabel>SHU XATOLAR BO‘YICHA MASHQ</SectionLabel>
          <p className="mt-2 text-base leading-relaxed text-ink-3">
            Eng ko‘p takrorlangan turlarga mos {drills.data.exercises.length} ta mashq tanlandi.
          </p>
          <Link
            href="/practice"
            className="mt-3 flex items-center gap-3 border border-line-3 bg-surface p-4"
          >
            <div className="flex-1">
              <p className="text-ui font-semibold">Mashqlarni boshlash</p>
              <p className="mt-1 text-base text-ink-3">
                {drills.data.patterns.map((pattern) => pattern.label).join(' · ')}
              </p>
            </div>
            <ArrowRight size={18} className="text-ink-4" />
          </Link>
        </section>
      )}

      <div className="mt-8 border border-line p-4">
        <SectionLabel>QANDAY ISHLATISH KERAK</SectionLabel>
        <ol className="mt-2 flex flex-col gap-1.5 text-base leading-relaxed text-ink-3">
          <li>1. Eng tepadagi bitta turni tanlang — hammasini birdan tuzatishga urinmang.</li>
          <li>2. Misollarni o‘qib, qoidani tushunib oling (kerak bo‘lsa tegishli darsni oching).</li>
          <li>3. Keyingi Writing javobingizni yozgach, aynan shu xatoni qidirib chiqing.</li>
          <li>4. Bir hafta davomida u ro‘yxatdan pastga tushganini kuzating.</li>
        </ol>
      </div>
    </div>
  );
}
