'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { AppFrame } from '@/components/app-frame';
import { CheckIcon } from '@/components/icons';
import { Button, HatchPlaceholder, SectionLabel, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, weekdayShort } from '@/lib/format';
import type { ActivePlan, PlanTask } from '@/lib/types';

export default function PlanPage() {
  return (
    <AppFrame width="wide">
      <PlanContent />
    </AppFrame>
  );
}

function PlanContent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const plan = useQuery({
    queryKey: ['plan', 'active'],
    queryFn: () => api<ActivePlan | null>('/study-plan/active'),
  });

  const complete = useMutation({
    mutationFn: (taskId: string) =>
      api(`/study-plan/tasks/${taskId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (plan.isLoading) {
    return (
      <div className="flex flex-col gap-3 px-5 py-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const data = plan.data;

  if (!data) {
    return (
      <div className="px-5 pb-8 pt-4 lg:px-8 lg:pt-8">
        <h1 className="font-display text-4xl font-bold tracking-tighter">O‘quv reja</h1>
        <div className="mt-6 border border-line-3 bg-surface p-5">
          <HatchPlaceholder />
          <h2 className="mt-4 font-display text-2xl font-semibold">Hali reja yo‘q</h2>
          <p className="mt-2 text-base leading-relaxed text-ink-3">
            Maqsad darajangiz va imtihon sanangizni kiritsangiz, har kun uchun aniq vazifalar
            tuzib beramiz: darslar, mocklar va so‘z takrorlash.
          </p>
          <Button full className="mt-4" onClick={() => router.push('/onboarding')}>
            Reja tuzish
          </Button>
        </div>
      </div>
    );
  }

  const today = data.todayTasks;
  const doneToday = today.filter((task) => task.status === 'DONE').length;
  const totalMinutes = today.reduce((sum, task) => sum + task.durationMinutes, 0);

  // Hafta kalendari: bugundan boshlab 7 kun
  const weekDays = Array.from({ length: 7 }).map((_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const key = date.toISOString().slice(0, 10);
    const tasks =
      offset === 0
        ? today
        : data.weekTasks.filter((task) => task.date.slice(0, 10) === key);
    return { date, key, tasks, isToday: offset === 0 };
  });

  return (
    <div className="px-5 pb-8 pt-4 lg:px-8 lg:pt-8">
      <h1 className="font-display text-4xl font-bold tracking-tighter">O‘quv reja</h1>
      <p className="mt-1.5 text-base text-ink-3">
        {data.plan.startLevel} → {data.plan.targetLevel}
        {data.plan.examDate
          ? ` · imtihon ${formatDate(data.plan.examDate)}`
          : ' · imtihon sanasi kiritilmagan'}
      </p>

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <SectionLabel>BUGUN · {formatDate(new Date()).toUpperCase()}</SectionLabel>
          <span className="text-sm text-ink-4">
            {doneToday}/{today.length} · {totalMinutes} daqiqa
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {today.length === 0 && (
            <p className="text-ui text-ink-4">Bugunga vazifa yo‘q — dam oling 🙂</p>
          )}
          {today.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={() => complete.mutate(task.id)}
              onOpen={() => openTask(task, router)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel>BU HAFTA</SectionLabel>
        <div className="mt-3 grid grid-cols-7 border border-line">
          {weekDays.map((day, index) => {
            const allDone = day.tasks.length > 0 && day.tasks.every((t) => t.status === 'DONE');
            return (
              <div
                key={day.key}
                className={`flex flex-col items-center gap-1.5 py-3 ${
                  index > 0 ? 'border-l border-line-2' : ''
                }`}
              >
                <span className="text-2xs text-ink-5">{weekdayShort(day.date.getDay())}</span>
                <span
                  className={clsx(
                    'font-display text-ui font-semibold',
                    day.isToday ? 'text-accent' : 'text-ink',
                  )}
                >
                  {day.date.getDate()}
                </span>
                <span
                  className={clsx(
                    'h-[7px] w-[7px]',
                    allDone ? 'bg-success' : day.tasks.length > 0 ? 'bg-accent-border' : 'bg-line',
                  )}
                />
              </div>
            );
          })}
        </div>
      </section>

      {data.plan.metaJson?.phases && (
        <section className="mt-8">
          <SectionLabel>BOSQICHLAR</SectionLabel>
          <div className="mt-3 flex items-center gap-2">
            {data.plan.metaJson.phases.map((phase, index) => (
              <div key={phase.level} className="flex flex-1 items-center gap-2">
                <span
                  className={clsx(
                    'text-xs font-semibold',
                    index === 0 ? 'text-accent' : 'text-ink-5',
                  )}
                >
                  {phase.level}
                </span>
                {index < data.plan.metaJson!.phases.length - 1 && (
                  <span className="h-[3px] flex-1 bg-line" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="border border-line p-4">
          <p className="text-ui text-ink-3">
            O‘tgan kunlar: <b className="font-semibold text-ink">{data.pastStats.done}</b>{' '}
            bajarilgan · <b className="font-semibold text-ink">{data.pastStats.missed}</b>{' '}
            qoldirilgan
          </p>
        </div>
        <Button
          variant="secondary"
          full
          className="mt-3"
          onClick={() => router.push('/onboarding')}
        >
          Rejani qayta tuzish
        </Button>
      </section>
    </div>
  );
}

function TaskRow({
  task,
  onComplete,
  onOpen,
}: {
  task: PlanTask;
  onComplete: () => void;
  onOpen: () => void;
}) {
  const done = task.status === 'DONE';
  return (
    <div
      className={`flex items-center gap-3 border border-line bg-surface p-4 ${
        done ? 'opacity-55' : ''
      }`}
    >
      <button
        onClick={onComplete}
        disabled={done}
        aria-label="Bajarildi deb belgilash"
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border ${
          done ? 'border-success bg-success text-white' : 'border-line-4'
        }`}
      >
        {done && <CheckIcon size={12} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-ui font-medium ${done ? 'line-through' : ''}`}>
          {task.titleUz}
        </p>
        <p className="mt-0.5 text-sm text-ink-4">{task.durationMinutes} daqiqa</p>
      </div>
      {!done && (
        <Button size="sm" variant="secondary" onClick={onOpen} className="shrink-0">
          Ochish
        </Button>
      )}
    </div>
  );
}

function openTask(task: PlanTask, router: ReturnType<typeof useRouter>) {
  if (task.lesson) router.push(`/lessons/${task.lesson.id}`);
  else if (task.mockExam) router.push(`/mocks/${task.mockExam.slug}`);
  else if (task.kind === 'VOCAB_REVIEW') router.push('/vocabulary/review');
  else router.push('/courses');
}
