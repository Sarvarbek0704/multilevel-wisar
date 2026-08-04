'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CheckIcon } from '@/components/icons';
import { SectionLabel } from '@/components/ui';
import { api } from '@/lib/api';
import { SKILL_LABEL } from '@/lib/format';
import type { AttemptResult, Skill } from '@/lib/types';

const ORDER: Skill[] = ['LISTENING', 'READING', 'WRITING', 'SPEAKING'];

/** Topshirilgandan keyingi kutish ekrani — AI baholash tugashini poll qiladi. */
export default function GradingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const attempt = useQuery({
    queryKey: ['attempt', id, 'result'],
    queryFn: () => api<AttemptResult>(`/mocks/attempts/${id}/result`),
    refetchInterval: (query) => (query.state.data?.status === 'SCORED' ? false : 4000),
  });

  useEffect(() => {
    if (attempt.data?.status === 'SCORED') {
      const timer = setTimeout(() => router.replace(`/mocks/attempts/${id}/result`), 800);
      return () => clearTimeout(timer);
    }
  }, [attempt.data?.status, id, router]);

  const data = attempt.data;
  const sections = data?.sectionScoresJson ?? [];
  const evaluations = data?.evaluations ?? [];

  const statusFor = (skill: Skill): 'ready' | 'processing' | 'queued' => {
    if (data?.status === 'SCORED') return 'ready';
    if (skill === 'LISTENING' || skill === 'READING') {
      return sections.some((section) => section.skill === skill) ? 'ready' : 'processing';
    }
    const own = evaluations.filter((evaluation) => evaluation.skill === skill);
    if (own.length === 0) return 'ready';
    if (own.every((evaluation) => evaluation.status === 'COMPLETED' || evaluation.status === 'FAILED')) {
      return 'ready';
    }
    return own.some((evaluation) => evaluation.status === 'PROCESSING') ? 'processing' : 'queued';
  };

  const present = ORDER.filter(
    (skill) =>
      sections.some((section) => section.skill === skill) ||
      evaluations.some((evaluation) => evaluation.skill === skill),
  );

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col items-center px-6 pb-10 pt-20 text-center">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Natijalar hisoblanmoqda
      </h1>
      <p className="mt-2.5 text-ui leading-relaxed text-ink-3">
        Listening va Reading darhol tayyor. Writing va Speaking javoblaringizni AI tahlil
        qilmoqda — odatda 1-2 daqiqa oladi.
      </p>

      <div className="mt-8 w-full border border-line">
        {(present.length > 0 ? present : ORDER).map((skill, index) => {
          const status = statusFor(skill);
          return (
            <div
              key={skill}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                index > 0 ? 'border-t border-line-2' : ''
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                  status === 'ready'
                    ? 'border-success bg-success text-white'
                    : 'border-line-3'
                }`}
              >
                {status === 'ready' && <CheckIcon size={12} />}
              </span>
              <span className="flex-1 text-left text-ui font-medium">{SKILL_LABEL[skill]}</span>
              <span className="text-sm text-ink-4">
                {status === 'ready'
                  ? 'tayyor'
                  : status === 'processing'
                    ? 'AI baholayapti…'
                    : 'navbatda'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 w-full border border-accent-border bg-accent-soft p-4 text-left">
        <SectionLabel className="text-accent">ESLATMA</SectionLabel>
        <p className="mt-2 text-base leading-relaxed text-accent-mid">
          Telegram ulangan bo‘lsa, natija botga ham yuboriladi. Bu sahifani yopsangiz ham
          baholash davom etadi.
        </p>
      </div>
    </div>
  );
}
