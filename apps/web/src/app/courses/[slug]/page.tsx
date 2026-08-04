'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppFrame } from '@/components/app-frame';
import { ArrowLeft } from '@/components/icons';
import { LevelBadge, ProgressBar, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { SKILL_LABEL } from '@/lib/format';
import type { CourseDetail, LessonSummary } from '@/lib/types';

export default function CourseDetailPage() {
  return (
    <AppFrame>
      <CourseContent />
    </AppFrame>
  );
}

function CourseContent() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const course = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api<CourseDetail>(`/courses/${slug}`),
  });

  if (course.isLoading) {
    return (
      <div className="flex flex-col gap-3 px-5 py-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const data = course.data;
  if (!data) return <p className="p-5 text-ui text-ink-4">Kurs topilmadi.</p>;

  const lessons = data.modules.flatMap((module) => module.lessons);
  const completed = lessons.filter((lesson) => lesson.progress?.status === 'COMPLETED').length;
  const firstUnfinished = lessons.find((lesson) => lesson.progress?.status !== 'COMPLETED');

  return (
    <div className="pb-8">
      <header className="flex items-center gap-3 px-5 pt-4">
        <button onClick={() => router.push('/courses')} aria-label="Orqaga">
          <ArrowLeft size={20} />
        </button>
        <span className="text-base text-ink-4">Kurslar</span>
      </header>

      <div className="px-5 pt-4">
        <div className="flex items-center gap-2">
          <LevelBadge level={data.level} />
          <span className="text-sm text-ink-4">
            {data.subject === 'ENGLISH' ? 'Ingliz tili' : 'Ona tili'}
          </span>
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tighter">{data.titleUz}</h1>
        {data.descriptionUz && (
          <p className="mt-2.5 text-ui leading-relaxed text-ink-3">{data.descriptionUz}</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <ProgressBar value={completed} max={lessons.length} className="flex-1" />
          <span className="font-mono text-sm text-ink-4">
            {completed}/{lessons.length}
          </span>
        </div>
      </div>

      {data.modules.map((module) => (
        <section key={module.id} className="mt-7 px-5">
          <h2 className="font-display text-2xl font-semibold">{module.titleUz}</h2>
          {module.descriptionUz && (
            <p className="mt-1.5 text-base leading-relaxed text-ink-3">{module.descriptionUz}</p>
          )}

          <div className="ml-[11px] mt-4 border-l border-line pl-[22px]">
            {module.lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                current={firstUnfinished?.id === lesson.id}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LessonRow({ lesson, current }: { lesson: LessonSummary; current: boolean }) {
  const done = lesson.progress?.status === 'COMPLETED';

  return (
    <div className="relative pb-2.5">
      <span
        className={`absolute -left-[29px] top-3.5 h-[13px] w-[13px] border ${
          done
            ? 'border-success bg-success'
            : current
              ? 'border-accent bg-accent'
              : 'border-line-4 bg-surface'
        }`}
      />
      <Link
        href={`/lessons/${lesson.id}`}
        className={`block border bg-surface p-3.5 ${
          current ? 'border-ink' : done ? 'border-line opacity-60' : 'border-line'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-md font-medium leading-snug">{lesson.titleUz}</p>
          <span className="shrink-0 font-mono text-xs text-ink-4">
            {lesson.estimatedMinutes} daq
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-4">
          {lesson.skill ? SKILL_LABEL[lesson.skill] : 'Dars'}
          {done ? ' · tugallandi' : current ? ' · joriy dars' : ''}
        </p>
      </Link>
    </div>
  );
}
