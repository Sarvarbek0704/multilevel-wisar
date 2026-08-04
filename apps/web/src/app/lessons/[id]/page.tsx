'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, CloseIcon } from '@/components/icons';
import { LessonContentBlock } from '@/components/lesson/content-block';
import { ExerciseView } from '@/components/lesson/exercise-view';
import { Button, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { LessonDetail } from '@/lib/types';

type Step =
  | { kind: 'content'; index: number }
  | { kind: 'exercise'; index: number };

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [stepIndex, setStepIndex] = useState(0);
  const [answered, setAnswered] = useState<Record<number, boolean>>({});
  const [showFinish, setShowFinish] = useState(false);

  const lesson = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => api<LessonDetail>(`/courses/lessons/${id}`),
  });

  const complete = useMutation({
    mutationFn: (score: number) =>
      api(`/progress/lessons/${id}/complete`, { method: 'POST', body: { score } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['plan', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['course'] });
    },
  });

  const steps = useMemo<Step[]>(() => {
    if (!lesson.data) return [];
    return [
      ...lesson.data.contentJson.map((_, index) => ({ kind: 'content' as const, index })),
      ...lesson.data.exercises.map((_, index) => ({ kind: 'exercise' as const, index })),
    ];
  }, [lesson.data]);

  if (lesson.isLoading) return <Spinner className="flex-1 items-center" />;
  const data = lesson.data;
  if (!data) return <p className="p-5 text-ui text-ink-4">Dars topilmadi.</p>;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const exerciseCount = data.exercises.length;
  const correctCount = Object.values(answered).filter(Boolean).length;
  const canAdvance = step?.kind === 'content' || answered[step?.index ?? -1] !== undefined;

  const finish = async () => {
    const score = exerciseCount > 0 ? Math.round((correctCount / exerciseCount) * 100) : 100;
    await complete.mutateAsync(score).catch(() => undefined);
    setShowFinish(true);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sticky header */}
      <header className="shrink-0 border-b border-line bg-bg">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button
            onClick={() => (stepIndex === 0 ? router.back() : setStepIndex(stepIndex - 1))}
            aria-label="Orqaga"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink-4">{data.module.course.titleUz}</p>
            <p className="truncate text-base font-semibold">{data.titleUz}</p>
          </div>
          <button onClick={() => router.push(`/courses/${data.module.course.slug}`)} aria-label="Yopish">
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="h-[3px] w-full bg-desk">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${((stepIndex + 1) / Math.max(1, steps.length)) * 100}%` }}
          />
        </div>
        <p className="px-4 py-1.5 font-mono text-xs text-ink-4">
          Blok {stepIndex + 1}/{steps.length}
        </p>
      </header>

      {/* Kontent */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
        {step?.kind === 'content' && (
          <LessonContentBlock block={data.contentJson[step.index]} />
        )}
        {step?.kind === 'exercise' && (
          <ExerciseView
            key={data.exercises[step.index].id}
            exercise={data.exercises[step.index]}
            onAnswered={(correct) =>
              setAnswered((current) => ({ ...current, [step.index]: correct }))
            }
          />
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-line px-4 pb-4 pt-3.5">
        <Button
          full
          disabled={!canAdvance || complete.isPending}
          onClick={() => (isLast ? finish() : setStepIndex(stepIndex + 1))}
        >
          {isLast ? 'Darsni yakunlash' : 'Davom etish'}
        </Button>
      </div>

      {showFinish && (
        <FinishModal
          title={data.titleUz}
          correct={correctCount}
          total={exerciseCount}
          onClose={() => router.push(`/courses/${data.module.course.slug}`)}
          onDashboard={() => router.push('/dashboard')}
        />
      )}
    </div>
  );
}

function FinishModal({
  title,
  correct,
  total,
  onClose,
  onDashboard,
}: {
  title: string;
  correct: number;
  total: number;
  onClose: () => void;
  onDashboard: () => void;
}) {
  const percent = total > 0 ? Math.round((correct / total) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)]">
      <div className="w-full max-w-phone animate-fadeUp bg-bg p-5 pb-7">
        <p className="text-2xs font-semibold tracking-label text-accent">DARS TUGALLANDI</p>
        <h2 className="mt-2 font-display text-4xl font-bold tracking-tighter">{title}</h2>

        <div className="mt-5 grid grid-cols-3 border border-line">
          {[
            { value: `${percent}%`, label: 'TO‘G‘RI JAVOB' },
            { value: '+50', label: 'XP' },
            { value: `${correct}/${total}`, label: 'MASHQLAR' },
          ].map((item, index) => (
            <div
              key={item.label}
              className={`p-4 text-center ${index > 0 ? 'border-l border-line' : ''}`}
            >
              <p className="font-display text-3xl font-bold tracking-tight">{item.value}</p>
              <p className="mt-1 text-2xs tracking-label text-ink-4">{item.label}</p>
            </div>
          ))}
        </div>

        <Button full className="mt-5" onClick={onClose}>
          Kursga qaytish
        </Button>
        <button onClick={onDashboard} className="mt-3.5 w-full text-base text-ink-4">
          Bosh sahifaga
        </button>
      </div>
    </div>
  );
}
