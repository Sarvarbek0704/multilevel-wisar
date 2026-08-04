'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { AppFrame } from '@/components/app-frame';
import { LevelBadge, SectionLabel, Segmented, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import type { CourseSummary, Subject } from '@/lib/types';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function CoursesPage() {
  return (
    <AppFrame>
      <CoursesContent />
    </AppFrame>
  );
}

function CoursesContent() {
  const [subject, setSubject] = useState<Subject>('ENGLISH');

  const courses = useQuery({
    queryKey: ['courses', subject],
    queryFn: () => api<CourseSummary[]>(`/courses?subject=${subject}`, { auth: true }),
  });

  const all = courses.data ?? [];
  // "Alohida" — daraja ketma-ketligiga kirmaydigan yordamchi kurslar
  const special = all.filter((course) => course.order >= 6);
  const ladder = all
    .filter((course) => course.order < 6)
    .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));

  return (
    <div className="px-5 pb-6 pt-4">
      <h1 className="font-display text-4xl font-bold tracking-tighter">Kurslar</h1>
      <p className="mt-1.5 text-base text-ink-3">Hammasi ochiq — istagan joydan boshlang.</p>

      <Segmented
        className="mt-4"
        options={[
          { value: 'ENGLISH', label: 'Ingliz tili' },
          { value: 'UZBEK', label: 'Ona tili' },
        ]}
        value={subject}
        onChange={setSubject}
      />

      {courses.isLoading ? (
        <div className="mt-5 flex flex-col gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : all.length === 0 ? (
        <p className="mt-8 text-ui text-ink-4">Bu fan uchun kurslar hali qo‘shilmagan.</p>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-2">
            {ladder.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {special.length > 0 && (
            <section className="mt-7">
              <SectionLabel>ALOHIDA</SectionLabel>
              <div className="mt-3 flex flex-col gap-2">
                {special.map((course) => (
                  <CourseCard key={course.id} course={course} accent />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function CourseCard({ course, accent }: { course: CourseSummary; accent?: boolean }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className={`block border p-4 ${
        accent ? 'border-accent-border bg-accent-soft' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg font-semibold leading-tight">{course.titleUz}</h2>
        <LevelBadge level={course.level} className="shrink-0" />
      </div>
      {course.descriptionUz && (
        <p className="mt-2 line-clamp-2 text-base leading-relaxed text-ink-3">
          {course.descriptionUz}
        </p>
      )}
      <p className="mt-2 text-sm text-ink-4">{course._count.modules} modul</p>
    </Link>
  );
}
