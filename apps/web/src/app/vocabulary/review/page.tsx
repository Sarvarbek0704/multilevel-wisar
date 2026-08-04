'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppFrame } from '@/components/app-frame';
import { CloseIcon, PlayIcon } from '@/components/icons';
import { Button, SectionLabel, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { VocabCard } from '@/lib/types';

const GRADES = [
  { grade: 0, label: 'Bilmadim', note: '10 daqiqa', className: 'border-error text-error' },
  { grade: 3, label: 'Qiyin', note: '1 kun', className: 'border-warn text-warn' },
  { grade: 4, label: 'Yaxshi', note: '4 kun', className: 'border-success text-success' },
  { grade: 5, label: 'Oson', note: '9 kun', className: 'border-accent text-accent' },
];

export default function VocabularyReviewPage() {
  return (
    <AppFrame tabBar={false} scroll={false}>
      <ReviewContent />
    </AppFrame>
  );
}

function ReviewContent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grades, setGrades] = useState<number[]>([]);

  const cards = useQuery({
    queryKey: ['vocab', 'due'],
    queryFn: () => api<VocabCard[]>('/vocabulary/due?limit=20'),
  });

  const review = useMutation({
    mutationFn: ({ cardId, grade }: { cardId: string; grade: number }) =>
      api(`/vocabulary/cards/${cardId}/review`, { method: 'POST', body: { grade } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocab'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (cards.isLoading) return <Spinner className="flex-1 items-center" />;

  const list = cards.data ?? [];
  const card = list[index];
  const done = !card;

  if (list.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-ui text-ink-3">Hozircha takrorlash uchun so‘z yo‘q.</p>
        <Button className="mt-4" onClick={() => router.push('/vocabulary')}>
          Lug‘atga qaytish
        </Button>
      </div>
    );
  }

  if (done) {
    const known = grades.filter((grade) => grade >= 4).length;
    const hard = grades.filter((grade) => grade === 3).length;
    const unknown = grades.filter((grade) => grade === 0).length;

    return (
      <div className="flex flex-1 flex-col px-5 pb-8 pt-16">
        <h1 className="font-display text-5xl font-bold tracking-tighter">Sessiya tugadi</h1>
        <p className="mt-2.5 text-ui text-ink-3">{grades.length} ta so‘z takrorlandi.</p>

        <div className="mt-6 grid grid-cols-3 border border-line">
          {[
            { value: known, label: 'BILDIM', tone: 'text-success' },
            { value: hard, label: 'QIYIN', tone: 'text-warn' },
            { value: unknown, label: 'BILMADIM', tone: 'text-error' },
          ].map((item, position) => (
            <div
              key={item.label}
              className={`p-4 text-center ${position > 0 ? 'border-l border-line' : ''}`}
            >
              <p className={`font-display text-3xl font-bold ${item.tone}`}>{item.value}</p>
              <p className="mt-1 text-2xs tracking-label text-ink-4">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 border border-accent-border bg-accent-soft p-4">
          <p className="text-ui leading-relaxed text-accent-mid">
            Bilmagan so‘zlaringiz bugun yana chiqadi, qolganlari algoritm hisoblagan kunda
            qaytadi.
          </p>
        </div>

        <div className="flex-1" />
        <Button full onClick={() => router.push('/vocabulary')}>
          Lug‘atga qaytish
        </Button>
      </div>
    );
  }

  const grade = (value: number) => {
    review.mutate({ cardId: card.id, grade: value });
    setGrades([...grades, value]);
    setFlipped(false);
    setIndex(index + 1);
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => router.push('/vocabulary')} aria-label="Yopish">
          <CloseIcon size={20} />
        </button>
        <div className="h-[3px] flex-1 bg-desk">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${(index / list.length) * 100}%` }}
          />
        </div>
        <span className="font-mono text-xs text-ink-4">
          {index + 1}/{list.length}
        </span>
      </header>

      <button
        onClick={() => setFlipped(!flipped)}
        className="mx-5 flex flex-1 flex-col justify-center border border-line-3 bg-surface p-6 text-left"
      >
        {!flipped ? (
          <>
            <p className="font-display text-7xl font-bold tracking-tighter">{card.word.word}</p>
            {card.word.phonetic && (
              <p className="mt-2 font-mono text-ui text-ink-4">{card.word.phonetic}</p>
            )}
            {card.word.partOfSpeech && (
              <p className="mt-1 text-base italic text-ink-4">{card.word.partOfSpeech}</p>
            )}
            <p className="mt-6 text-sm text-ink-5">Javobni ko‘rish uchun kartani bosing</p>
          </>
        ) : (
          <>
            <p className="font-display text-3xl font-bold tracking-tight">{card.word.word}</p>
            <p className="mt-2 text-2xl font-semibold text-accent">{card.word.translation}</p>
            {card.word.definitionEn && (
              <p className="mt-3 border-t border-line-2 pt-3 text-ui leading-relaxed text-ink-3">
                {card.word.definitionEn}
              </p>
            )}
            {card.word.exampleEn && (
              <div className="mt-3">
                <p className="text-md leading-relaxed">{card.word.exampleEn}</p>
                {card.word.exampleUz && (
                  <p className="mt-1 text-base text-ink-4">{card.word.exampleUz}</p>
                )}
              </div>
            )}
          </>
        )}
      </button>

      <div className="px-5 pb-6 pt-4">
        {!flipped ? (
          <Button full onClick={() => setFlipped(true)}>
            Javobni ko‘rsatish
          </Button>
        ) : (
          <>
            <SectionLabel className="mb-2">QANCHALIK YAXSHI ESLADINGIZ?</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {GRADES.map((item) => (
                <button
                  key={item.grade}
                  onClick={() => grade(item.grade)}
                  className={`border bg-surface px-2 py-3.5 ${item.className}`}
                >
                  <span className="block text-base font-semibold">{item.label}</span>
                  <span className="mt-0.5 block text-2xs opacity-70">{item.note}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
