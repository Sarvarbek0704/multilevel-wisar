'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { AppFrame } from '@/components/app-frame';
import { LevelBadge, SectionLabel, Segmented, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { SKILL_LETTER, formatDate, formatDuration } from '@/lib/format';
import type { AttemptSummary, MockKind, MockSummary, Subject } from '@/lib/types';

const KINDS: Array<{ value: MockKind | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Hammasi' },
  { value: 'FULL', label: 'To‘liq' },
  { value: 'MINI', label: 'Mini' },
  { value: 'PLACEMENT', label: 'Placement' },
];

export default function MocksPage() {
  return (
    <AppFrame>
      <MocksContent />
    </AppFrame>
  );
}

function MocksContent() {
  const [subject, setSubject] = useState<Subject>('ENGLISH');
  const [kind, setKind] = useState<MockKind | 'ALL'>('ALL');

  const mocks = useQuery({
    queryKey: ['mocks', subject, kind],
    queryFn: () =>
      api<MockSummary[]>(
        `/mocks?subject=${subject}${kind === 'ALL' ? '' : `&kind=${kind}`}`,
      ),
  });

  const attempts = useQuery({
    queryKey: ['attempts', 'my'],
    queryFn: () => api<AttemptSummary[]>('/mocks/attempts/my'),
  });

  const unfinished = (attempts.data ?? []).find((attempt) => attempt.status === 'IN_PROGRESS');
  const scored = (attempts.data ?? []).filter((attempt) => attempt.status === 'SCORED');

  return (
    <div className="px-5 pb-6 pt-4">
      <h1 className="font-display text-4xl font-bold tracking-tighter">Mock imtihonlar</h1>
      <p className="mt-1.5 text-base text-ink-3">Haqiqiy format, haqiqiy vaqt, AI baholash.</p>

      <Segmented
        className="mt-4"
        options={[
          { value: 'ENGLISH', label: 'Ingliz tili' },
          { value: 'UZBEK', label: 'Ona tili' },
        ]}
        value={subject}
        onChange={setSubject}
      />

      <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {KINDS.map((item) => (
          <button
            key={item.value}
            onClick={() => setKind(item.value)}
            className={`shrink-0 border px-3.5 py-1.5 text-sm font-medium ${
              kind === item.value ? 'border-ink bg-ink text-bg' : 'border-line-4 text-ink-3'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {unfinished && (
        <Link
          href={`/mocks/attempts/${unfinished.id}`}
          className="mt-5 block border border-warn bg-warn-bg p-4"
        >
          <SectionLabel className="text-warn">TUGALLANMAGAN URINISH</SectionLabel>
          <p className="mt-2 text-ui font-medium">{unfinished.exam.titleUz}</p>
          <p className="mt-1 text-sm text-warn-text">
            {formatDate(unfinished.startedAt)} da boshlangan
          </p>
          <span className="mt-3 inline-block bg-warn px-4 py-2 text-base font-semibold text-white">
            Davom ettirish
          </span>
        </Link>
      )}

      {mocks.isLoading ? (
        <div className="mt-5 flex flex-col gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (mocks.data ?? []).length === 0 ? (
        <p className="mt-8 text-ui text-ink-4">Bu bo‘limda imtihonlar hali yo‘q.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          {mocks.data?.map((mock) => (
            <MockCard key={mock.id} mock={mock} />
          ))}
        </div>
      )}

      {scored.length > 0 && (
        <section className="mt-8">
          <SectionLabel>MENING NATIJALARIM</SectionLabel>
          <div className="mt-3 border border-line">
            {scored.map((attempt, index) => (
              <Link
                key={attempt.id}
                href={`/mocks/attempts/${attempt.id}/result`}
                className={`flex items-center gap-3 p-3.5 ${
                  index > 0 ? 'border-t border-line-2' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ui font-medium">{attempt.exam.titleUz}</p>
                  <p className="mt-0.5 text-sm text-ink-4">
                    {attempt.scoredAt ? formatDate(attempt.scoredAt) : ''}
                  </p>
                </div>
                <span className="font-display text-md font-bold">{attempt.overallScore}</span>
                <LevelBadge level={attempt.estimatedLevel} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MockCard({ mock }: { mock: MockSummary }) {
  const totalMinutes = mock.sections.reduce((sum, section) => sum + section.durationMinutes, 0);

  return (
    <Link href={`/mocks/${mock.slug}`} className="block border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg font-semibold leading-tight">{mock.titleUz}</h2>
        <span className="shrink-0 font-mono text-xs text-ink-4">
          {formatDuration(totalMinutes)}
        </span>
      </div>
      <div className="mt-2.5 flex gap-3.5 text-sm text-ink-3">
        {mock.sections.map((section) => (
          <span key={section.id} className="font-mono">
            {SKILL_LETTER[section.skill]}{' '}
            <span className="text-ink-4">{section.durationMinutes}‘</span>
          </span>
        ))}
      </div>
    </Link>
  );
}
