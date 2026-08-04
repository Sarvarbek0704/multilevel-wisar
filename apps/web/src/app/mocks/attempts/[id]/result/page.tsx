'use client';

import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AiPanel } from '@/components/ai-panel';
import { ArrowLeft } from '@/components/icons';
import { LevelBadge, SectionLabel, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { SKILL_LABEL, formatDateFull, pointsToNextLevel } from '@/lib/format';
import type { AttemptResult, Skill } from '@/lib/types';

type Tab = 'lr' | 'writing' | 'speaking';

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('lr');

  const attempt = useQuery({
    queryKey: ['attempt', id, 'result'],
    queryFn: () => api<AttemptResult>(`/mocks/attempts/${id}/result`),
  });

  if (attempt.isLoading) return <Spinner className="flex-1 items-center" />;
  const data = attempt.data;
  if (!data) return <p className="p-5 text-ui text-ink-4">Natija topilmadi.</p>;

  if (data.status !== 'SCORED') {
    router.replace(`/mocks/attempts/${id}/grading`);
    return <Spinner className="flex-1 items-center" />;
  }

  const sections = data.sectionScoresJson ?? [];
  const weakest = sections.reduce<(typeof sections)[number] | null>(
    (worst, section) =>
      !worst || (section.scaled ?? 0) < (worst.scaled ?? 0) ? section : worst,
    null,
  );
  const next = data.overallScore !== null ? pointsToNextLevel(data.overallScore) : null;

  const closedAnswers = data.answers.filter(
    (answer) =>
      answer.question.part.section.skill === 'LISTENING' ||
      answer.question.part.section.skill === 'READING',
  );
  const writingAnswers = data.answers.filter(
    (answer) => answer.question.part.section.skill === 'WRITING',
  );
  const speakingAnswers = data.answers.filter(
    (answer) => answer.question.part.section.skill === 'SPEAKING',
  );

  const evaluationFor = (questionId: string) =>
    data.evaluations.find((evaluation) => evaluation.questionId === questionId);

  return (
    <div className="pb-10">
      <header className="flex items-center gap-3 px-5 pt-4">
        <button onClick={() => router.push('/mocks')} aria-label="Orqaga">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{data.exam.titleUz}</p>
          <p className="text-sm text-ink-4">
            {data.scoredAt ? formatDateFull(data.scoredAt) : ''}
          </p>
        </div>
      </header>

      {/* Katta natija kartasi */}
      <div className="mx-5 mt-4 bg-panel p-5 text-on-dark">
        <p className="text-2xs tracking-label text-on-dark-4">UMUMIY BALL</p>
        <div className="mt-1.5 flex items-end justify-between gap-3">
          <p className="font-display text-8xl font-bold tracking-tightest">
            {data.overallScore}
            <span className="text-2xl font-medium text-on-dark-4">/75</span>
          </p>
          <div className="text-right">
            <LevelBadge level={data.estimatedLevel} onDark />
            {next && (
              <p className="mt-1.5 text-xs text-on-dark-4">
                {next.level} gacha {next.points} ball
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {sections.map((section) => (
            <div key={section.skill} className="flex items-center gap-3">
              <span className="w-[74px] shrink-0 text-sm text-on-dark-2">
                {SKILL_LABEL[section.skill]}
              </span>
              <span className="h-1.5 flex-1 bg-dark-line">
                <span
                  className={clsx(
                    'block h-full',
                    weakest?.skill === section.skill ? 'bg-gold-ondark' : 'bg-on-dark',
                  )}
                  style={{ width: `${Math.min(100, ((section.scaled ?? 0) / 75) * 100)}%` }}
                />
              </span>
              <span className="w-[34px] shrink-0 text-right font-mono text-sm">
                {section.scaled}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-on-dark-5">
          Har bo‘lim 0–75 ball; umumiy ball — bo‘limlar o‘rtachasi.
        </p>
      </div>

      {/* Tablar */}
      <div className="mt-5 flex border-b border-line px-5">
        {(
          [
            ['lr', 'L · R'],
            ['writing', 'Writing'],
            ['speaking', 'Speaking'],
          ] as Array<[Tab, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={clsx(
              'flex-1 border-b-2 px-1 py-2.5 text-base font-semibold',
              tab === value ? 'border-ink text-ink' : 'border-transparent text-ink-4',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 pt-5">
        {tab === 'lr' && (
          <>
            {closedAnswers.length === 0 ? (
              <p className="text-ui text-ink-4">Bu imtihonda yopiq savollar yo‘q.</p>
            ) : (
              <div className="border border-line">
                {closedAnswers.map((answer, index) => {
                  const given = (answer.answerJson as { value?: string } | null)?.value;
                  const correct = (answer.question.answerJson as { value?: string } | null)?.value;
                  return (
                    <div
                      key={answer.questionId}
                      className={`flex gap-3 p-3.5 ${index > 0 ? 'border-t border-line-2' : ''}`}
                    >
                      <span className="w-[22px] shrink-0 font-mono text-sm text-ink-4">
                        {answer.question.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base">
                          Sizning javob:{' '}
                          <b
                            className={clsx(
                              'font-semibold',
                              answer.isCorrect ? 'text-success' : 'text-error',
                            )}
                          >
                            {given ?? '—'}
                          </b>
                        </p>
                        {!answer.isCorrect && correct && (
                          <p className="mt-0.5 text-base text-ink-3">To‘g‘ri javob: {correct}</p>
                        )}
                      </div>
                      <span className={answer.isCorrect ? 'text-success' : 'text-error'}>
                        {answer.isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'writing' && (
          <div className="flex flex-col gap-6">
            {writingAnswers.length === 0 && (
              <p className="text-ui text-ink-4">Writing bo‘limi yo‘q.</p>
            )}
            {writingAnswers.map((answer) => {
              const evaluation = evaluationFor(answer.questionId);
              const text = (answer.answerJson as { text?: string } | null)?.text;
              return (
                <div key={answer.questionId}>
                  <SectionLabel>TASK {answer.question.number} · JAVOBINGIZ</SectionLabel>
                  <div className="mt-2 border border-line bg-surface p-4">
                    <p className="whitespace-pre-line text-ui leading-relaxed text-ink-2">
                      {text || 'Javob yozilmagan'}
                    </p>
                  </div>
                  {evaluation?.resultJson ? (
                    <div className="mt-3">
                      <AiPanel result={evaluation.resultJson} />
                    </div>
                  ) : (
                    <p className="mt-3 text-base text-ink-4">
                      {evaluation?.status === 'FAILED'
                        ? 'AI baholash muvaffaqiyatsiz tugadi.'
                        : 'AI tahlili mavjud emas.'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'speaking' && (
          <div className="flex flex-col gap-6">
            {speakingAnswers.length === 0 && (
              <p className="text-ui text-ink-4">Speaking bo‘limi yo‘q.</p>
            )}
            {speakingAnswers.map((answer) => {
              const evaluation = evaluationFor(answer.questionId);
              return (
                <div key={answer.questionId}>
                  <SectionLabel>PART {answer.question.number} · JAVOBINGIZ</SectionLabel>
                  {answer.audioUrl && (
                    <audio controls src={answer.audioUrl} className="mt-2 w-full">
                      <track kind="captions" />
                    </audio>
                  )}
                  {evaluation?.transcript && (
                    <div className="mt-3 border border-line bg-surface p-4">
                      <SectionLabel>TRANSKRIPT</SectionLabel>
                      <p className="mt-2 text-ui leading-relaxed text-ink-2">
                        {evaluation.transcript}
                      </p>
                    </div>
                  )}
                  {evaluation?.resultJson ? (
                    <div className="mt-3">
                      <AiPanel result={evaluation.resultJson} />
                    </div>
                  ) : (
                    <p className="mt-3 text-base text-ink-4">AI tahlili mavjud emas.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Keyingi qadam */}
      {weakest && (
        <div className="mx-5 mt-7 border border-accent-border bg-accent-soft p-4">
          <SectionLabel className="text-accent">
            ENG ZAIF BO‘LIM · {SKILL_LABEL[weakest.skill].toUpperCase()}
          </SectionLabel>
          <p className="mt-2 text-ui leading-relaxed text-accent-mid">
            Shu ko‘nikmaga ko‘proq vaqt ajrating — umumiy ball bo‘limlar o‘rtachasi bo‘lgani
            uchun eng zaif bo‘lim natijani eng ko‘p pasaytiradi.
          </p>
          <Link
            href={nextCourseFor(weakest.skill)}
            className="mt-3 inline-block bg-accent px-4 py-2.5 text-base font-semibold text-white"
          >
            Mashq qilishni boshlash
          </Link>
        </div>
      )}
    </div>
  );
}

function nextCourseFor(skill: Skill): string {
  switch (skill) {
    case 'WRITING':
      return '/courses/english-b1-writing-core';
    case 'SPEAKING':
      return '/courses/english-speaking-mastery';
    case 'LISTENING':
    case 'READING':
      return '/courses/multilevel-exam-strategy';
    default:
      return '/courses';
  }
}
