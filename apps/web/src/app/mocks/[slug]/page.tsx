'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { AppFrame } from '@/components/app-frame';
import { ArrowLeft } from '@/components/icons';
import { Button, SectionLabel, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { SKILL_LABEL, formatDuration } from '@/lib/format';
import type { AttemptForTaking, ExamSection } from '@/lib/types';

interface ExamDetail {
  id: string;
  slug: string;
  titleUz: string;
  descriptionUz: string | null;
  kind: string;
  sections: Array<
    Pick<ExamSection, 'id' | 'skill' | 'durationMinutes'> & {
      parts: Array<{ id: string; _count: { questions: number } }>;
    }
  >;
}

const RULES = [
  'Audio faqat bir marta eshittiriladi — pauza yoki qayta ijro yo‘q.',
  'Timer to‘xtamaydi: bo‘lim vaqti tugasa, keyingisiga o‘tiladi.',
  'Yakunlangan bo‘limga qaytib bo‘lmaydi.',
  'Speaking uchun mikrofonga ruxsat kerak bo‘ladi.',
];

export default function MockStartPage() {
  return (
    <AppFrame tabBar={false}>
      <MockStartContent />
    </AppFrame>
  );
}

function MockStartContent() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const exam = useQuery({
    queryKey: ['mock', slug],
    queryFn: () => api<ExamDetail>(`/mocks/${slug}`),
  });

  const start = useMutation({
    mutationFn: () => api<AttemptForTaking>(`/mocks/${slug}/start`, { method: 'POST' }),
    onSuccess: (attempt) => router.push(`/mocks/attempts/${attempt.id}`),
  });

  if (exam.isLoading) {
    return (
      <div className="flex flex-col gap-3 px-5 py-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const data = exam.data;
  if (!data) return <p className="p-5 text-ui text-ink-4">Imtihon topilmadi.</p>;

  const totalMinutes = data.sections.reduce((sum, section) => sum + section.durationMinutes, 0);

  return (
    <div className="mx-auto w-full max-w-[680px] px-5 pb-8 pt-4 lg:pt-8">
      <button onClick={() => router.push('/mocks')} className="flex items-center gap-2 text-ink-4">
        <ArrowLeft size={18} />
        <span className="text-base">Mocklar</span>
      </button>

      <h1 className="mt-4 font-display text-5xl font-bold tracking-tighter">{data.titleUz}</h1>
      {data.descriptionUz && (
        <p className="mt-2.5 text-ui leading-relaxed text-ink-3">{data.descriptionUz}</p>
      )}

      <div className="mt-6 border border-line">
        <div className="flex bg-surface-alt px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
          <span className="flex-1">Bo‘lim</span>
          <span className="w-16 text-right">Savol</span>
          <span className="w-16 text-right">Vaqt</span>
        </div>
        {data.sections.map((section) => {
          const questions = section.parts.reduce(
            (sum, part) => sum + (part._count?.questions ?? 0),
            0,
          );
          return (
            <div
              key={section.id}
              className="flex border-t border-line-2 px-4 py-3.5 text-ui"
            >
              <span className="flex-1 font-medium">{SKILL_LABEL[section.skill]}</span>
              <span className="w-16 text-right font-mono text-ink-3">{questions}</span>
              <span className="w-16 text-right font-mono text-ink-3">
                {section.durationMinutes}‘
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-l-[3px] border-warn bg-warn-bg p-4">
        <SectionLabel className="text-warn">QOIDALAR</SectionLabel>
        <ul className="mt-2 flex flex-col gap-1.5">
          {RULES.map((rule) => (
            <li key={rule} className="text-base leading-relaxed text-warn-deep">
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <Button
        full
        className="mt-6"
        disabled={start.isPending}
        onClick={() => start.mutate()}
      >
        {start.isPending ? 'Boshlanmoqda…' : 'Imtihonni boshlash'}
      </Button>
      <p className="mt-2.5 text-center text-sm text-ink-5">
        Umumiy davomiyligi ~{formatDuration(totalMinutes)}
      </p>
      {start.isError && (
        <p className="mt-3 text-center text-sm text-error">
          {start.error instanceof Error ? start.error.message : 'Boshlab bo‘lmadi'}
        </p>
      )}
    </div>
  );
}
