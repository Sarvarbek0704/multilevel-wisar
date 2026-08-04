'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppFrame } from '@/components/app-frame';
import { Heatmap } from '@/components/heatmap';
import { ArrowRight, CheckIcon } from '@/components/icons';
import {
  Button,
  Card,
  HatchPlaceholder,
  LevelBadge,
  ProgressRing,
  SectionLabel,
  Skeleton,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate, initials, weekdayShort } from '@/lib/format';
import type { ActivePlan, DashboardResponse, HeatmapDay, PlanTask } from '@/lib/types';

export default function DashboardPage() {
  return (
    <AppFrame>
      <DashboardContent />
    </AppFrame>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardResponse>('/progress/dashboard'),
  });
  const plan = useQuery({
    queryKey: ['plan', 'active'],
    queryFn: () => api<ActivePlan | null>('/study-plan/active'),
  });
  const heatmap = useQuery({
    queryKey: ['heatmap'],
    queryFn: () => api<HeatmapDay[]>('/progress/heatmap?days=126'),
  });

  if (dashboard.isLoading) {
    return (
      <div className="flex flex-col gap-3 px-5 py-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const data = dashboard.data;
  if (!data) return null;

  const todayTasks = plan.data?.todayTasks ?? [];
  const doneCount = todayTasks.filter((task) => task.status === 'DONE').length;
  const hasPlan = todayTasks.length > 0;

  return (
    <div className="px-5 pb-6 pt-2">
      {/* Salomlashish */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Salom, {data.user.firstName}
          </h1>
          <p className="mt-1 text-base text-ink-3">
            {data.daysToExam !== null ? (
              <>
                Imtihongacha <b className="font-semibold text-accent">{data.daysToExam} kun</b>
                {data.user.targetLevel ? ` · maqsad ${data.user.targetLevel}` : ''}
              </>
            ) : data.user.targetLevel ? (
              <>Maqsad: {data.user.targetLevel} · imtihon sanasi kiritilmagan</>
            ) : (
              'Maqsadingizni belgilang'
            )}
          </p>
        </div>
        <Link
          href="/profile"
          className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink font-display text-ui font-semibold text-bg"
        >
          {initials(user?.firstName ?? '', user?.lastName)}
        </Link>
      </div>

      {/* Streak + kunlik maqsad */}
      <div className="mt-6 flex border border-line">
        <div className="w-[118px] border-r border-line p-4">
          <SectionLabel>KETMA-KET</SectionLabel>
          <p className="mt-1.5 font-display text-3xl font-bold tracking-tight">
            {data.streak}
            <span className="ml-1 text-base font-medium text-ink-3">kun</span>
          </p>
        </div>
        <div className="flex flex-1 items-center gap-2 p-4">
          {Array.from({ length: 7 }).map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const key = date.toISOString().slice(0, 10);
            const active = (heatmap.data ?? []).some(
              (day) => day.date.slice(0, 10) === key && day.xp > 0,
            );
            const isToday = index === 6;
            return (
              <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-2xs text-ink-5">{weekdayShort(date.getDay())}</span>
                <span
                  className={`h-[9px] w-[9px] ${
                    active ? 'bg-accent' : isToday ? 'bg-accent-border' : 'bg-line'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bugungi maqsad */}
      <Card className="mt-2.5 flex items-center gap-4 p-4">
        <ProgressRing value={data.today.minutes} max={data.today.goalMinutes} />
        <div>
          <p className="font-display text-2xl font-semibold">
            {data.today.minutes} / {data.today.goalMinutes} daqiqa
          </p>
          <p className="mt-1 text-sm text-ink-4">
            Bugun +{data.today.xp} XP · jami {data.totals.xp.toLocaleString('uz-UZ')} XP
          </p>
        </div>
      </Card>

      {/* Bugungi reja */}
      {hasPlan ? (
        <section className="mt-7">
          <div className="flex items-baseline justify-between">
            <SectionLabel>BUGUNGI REJA</SectionLabel>
            <span className="text-sm text-ink-4">
              {doneCount}/{todayTasks.length} bajarildi
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {todayTasks.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                primary={index === todayTasks.findIndex((t) => t.status === 'PENDING')}
                onOpen={() => openTask(task, router)}
              />
            ))}
          </div>
        </section>
      ) : (
        <Card className="mt-7 p-5" strong>
          <HatchPlaceholder />
          <h2 className="mt-4 font-display text-2xl font-semibold">Reja hali tuzilmagan</h2>
          <p className="mt-2 text-base leading-relaxed text-ink-3">
            Darajangizni aniqlasak, imtihon sanangizgacha har kun uchun aniq vazifalar tuzib
            beramiz.
          </p>
          <Button full className="mt-4" onClick={() => router.push('/onboarding')}>
            Darajamni aniqlash
          </Button>
        </Card>
      )}

      {/* Lug'at CTA */}
      {data.vocabDue > 0 && (
        <div className="mt-2.5 border border-accent bg-accent-soft p-4">
          <p className="text-ui font-semibold text-accent-dark">
            {data.vocabDue} ta so‘z takrorlashni kutmoqda
          </p>
          <p className="mt-1 text-base leading-relaxed text-accent-mid">
            Bugun o‘tkazib yuborsangiz, ertaga ro‘yxat uzayadi.
          </p>
          <Button variant="accent" className="mt-3 px-4 py-2.5 text-base" onClick={() => router.push('/vocabulary/review')}>
            Takrorlash
          </Button>
        </div>
      )}

      {/* AI amaliyot */}
      <Link href="/practice" className="mt-2.5 flex items-center gap-3 border border-line p-4">
        <div className="flex-1">
          <p className="text-ui font-semibold">AI amaliyot</p>
          <p className="mt-1 text-base leading-relaxed text-ink-3">
            Writing yozing yoki mikrofonga gapiring — AI darhol baholaydi.
          </p>
        </div>
        <ArrowRight size={18} className="text-ink-4" />
      </Link>

      {/* Oxirgi mock */}
      {data.lastMockResult && (
        <Link href="/mocks" className="mt-2.5 flex items-center gap-3 border border-line-3 p-4">
          <div className="flex-1">
            <p className="font-display text-3xl font-bold tracking-tight">
              {data.lastMockResult.overallScore}
              <span className="text-md font-medium text-ink-4">/75</span>
            </p>
            <p className="mt-1 text-sm text-ink-4">
              {data.lastMockResult.scoredAt ? formatDate(data.lastMockResult.scoredAt) : ''} ·{' '}
              {data.lastMockResult.exam.titleUz}
            </p>
          </div>
          <LevelBadge level={data.lastMockResult.estimatedLevel} />
          <ArrowRight size={18} className="text-ink-4" />
        </Link>
      )}

      {/* Faollik */}
      {heatmap.data && heatmap.data.length > 0 && (
        <section className="mt-7">
          <SectionLabel>FAOLLIK</SectionLabel>
          <div className="mt-3">
            <Heatmap days={heatmap.data} />
          </div>
        </section>
      )}
    </div>
  );
}

function TaskRow({
  task,
  primary,
  onOpen,
}: {
  task: PlanTask;
  primary: boolean;
  onOpen: () => void;
}) {
  const done = task.status === 'DONE';
  return (
    <div
      className={`flex items-center gap-3 border border-line bg-surface p-4 ${
        done ? 'opacity-55' : ''
      }`}
    >
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border ${
          done ? 'border-success bg-success text-white' : 'border-line-4'
        }`}
      >
        {done && <CheckIcon size={12} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-ui font-medium ${done ? 'line-through' : ''}`}>
          {task.titleUz}
        </p>
        <p className="mt-0.5 text-sm text-ink-4">
          {taskKindLabel(task.kind)} · {task.durationMinutes} daqiqa
        </p>
      </div>
      {!done && (
        <Button
          size="sm"
          variant={primary ? 'primary' : 'secondary'}
          onClick={onOpen}
          className="shrink-0"
        >
          Boshlash
        </Button>
      )}
    </div>
  );
}

function taskKindLabel(kind: PlanTask['kind']): string {
  switch (kind) {
    case 'LESSON':
      return 'Dars';
    case 'EXERCISE_SET':
      return 'Mashqlar';
    case 'VOCAB_REVIEW':
      return 'Lug‘at';
    case 'MOCK_FULL':
      return 'To‘liq mock';
    case 'MOCK_SECTION':
      return 'Mock bo‘limi';
    default:
      return 'Vazifa';
  }
}

function openTask(task: PlanTask, router: ReturnType<typeof useRouter>) {
  if (task.lesson) router.push(`/lessons/${task.lesson.id}`);
  else if (task.mockExam) router.push(`/mocks/${task.mockExam.slug}`);
  else if (task.kind === 'VOCAB_REVIEW') router.push('/vocabulary/review');
  else router.push('/courses');
}
