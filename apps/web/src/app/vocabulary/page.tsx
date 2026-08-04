'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppFrame } from '@/components/app-frame';
import { Button, LevelBadge, SectionLabel, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import type { VocabStats, VocabTopic } from '@/lib/types';

export default function VocabularyPage() {
  return (
    <AppFrame>
      <VocabularyContent />
    </AppFrame>
  );
}

function VocabularyContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [added, setAdded] = useState<string | null>(null);

  const stats = useQuery({
    queryKey: ['vocab', 'stats'],
    queryFn: () => api<VocabStats>('/vocabulary/stats'),
  });

  const topics = useQuery({
    queryKey: ['vocab', 'topics'],
    queryFn: () => api<VocabTopic[]>('/vocabulary/topics?subject=ENGLISH'),
  });

  const addTopic = useMutation({
    mutationFn: (topic: VocabTopic) =>
      api('/vocabulary/learn', {
        method: 'POST',
        body: { subject: 'ENGLISH', level: topic.level, topic: topic.topic, count: 20 },
      }),
    onSuccess: (_result, topic) => {
      setAdded(topic.topic ?? null);
      queryClient.invalidateQueries({ queryKey: ['vocab'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const data = stats.data;

  return (
    <div className="px-5 pb-6 pt-4">
      <h1 className="font-display text-4xl font-bold tracking-tighter">Lug‘at</h1>
      <p className="mt-1.5 text-base text-ink-3">
        Har so‘z unutilishga yaqin paytda qaytadan chiqadi.
      </p>

      {stats.isLoading ? (
        <Skeleton className="mt-5 h-28 w-full" />
      ) : data ? (
        <>
          <div className="mt-5 grid grid-cols-2 border border-line">
            {[
              { value: data.total, label: 'JAMI SO‘Z', tone: '' },
              { value: data.learning, label: 'O‘RGANILMOQDA', tone: '' },
              { value: data.mature, label: 'PUXTA', tone: 'text-success' },
              { value: data.due, label: 'BUGUN KUTMOQDA', tone: 'text-accent' },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`p-4 ${index % 2 === 0 ? 'border-r border-line' : ''} ${
                  index < 2 ? 'border-b border-line' : ''
                }`}
              >
                <p className={`font-display text-3xl font-bold tracking-tight ${item.tone}`}>
                  {item.value}
                </p>
                <p className="mt-1 text-2xs tracking-label text-ink-4">{item.label}</p>
              </div>
            ))}
          </div>

          {data.due > 0 ? (
            <>
              <Button full className="mt-4" onClick={() => router.push('/vocabulary/review')}>
                {data.due} so‘zni takrorlash
              </Button>
              <p className="mt-2 text-center text-sm text-ink-5">
                Taxminan {Math.max(1, Math.round(data.due / 3))} daqiqa
              </p>
            </>
          ) : (
            <p className="mt-4 border border-success-border bg-success-bg p-4 text-ui text-success-dark">
              ✓ Bugungi takrorlash tugagan. Pastdan yangi mavzu qo‘shishingiz mumkin.
            </p>
          )}
        </>
      ) : null}

      <section className="mt-8">
        <SectionLabel>MAVZULAR</SectionLabel>
        {topics.isLoading ? (
          <Skeleton className="mt-3 h-40 w-full" />
        ) : (
          <div className="mt-3 border border-line">
            {(topics.data ?? [])
              .filter((topic) => topic.topic)
              .map((topic, index) => (
                <div
                  key={`${topic.topic}-${topic.level}`}
                  className={`flex items-center gap-3 p-3.5 ${
                    index > 0 ? 'border-t border-line-2' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui font-medium">{topic.topic}</p>
                    <p className="mt-0.5 text-sm text-ink-4">{topic.count} so‘z</p>
                  </div>
                  <LevelBadge level={topic.level} />
                  <button
                    onClick={() => addTopic.mutate(topic)}
                    disabled={addTopic.isPending}
                    className="shrink-0 text-sm font-semibold text-accent disabled:text-ink-5"
                  >
                    {added === topic.topic ? 'Qo‘shildi ✓' : 'Qo‘shish'}
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
