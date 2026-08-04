'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { AiPanel } from '@/components/ai-panel';
import { AppFrame } from '@/components/app-frame';
import { AudioRecorder } from '@/components/audio-recorder';
import { Button, SectionLabel, Skeleton, TextArea } from '@/components/ui';
import { api } from '@/lib/api';
import { countWords, formatDateFull } from '@/lib/format';
import type { EvaluationResult, ExercisePublic, Skill, Subject } from '@/lib/types';

type Tab = 'writing' | 'speaking' | 'history';

interface EvaluationSummary {
  id: string;
  skill: Skill;
  subject: Subject;
  status: string;
  createdAt: string;
  resultJson: (EvaluationResult & { taskPrompt?: string }) | null;
}

export default function PracticePage() {
  return (
    <AppFrame>
      <PracticeContent />
    </AppFrame>
  );
}

function PracticeContent() {
  const [tab, setTab] = useState<Tab>('writing');

  return (
    <div className="px-5 pb-8 pt-4 lg:px-8 lg:pt-8">
      <h1 className="font-display text-4xl font-bold tracking-tighter">AI amaliyot</h1>
      <p className="mt-1.5 text-base leading-relaxed text-ink-3">
        Writing yoki Speaking javobingizni yuboring — AI rasmiy mezonlar bo‘yicha baholab,
        xatolaringizni o‘zbekcha tushuntiradi.
      </p>

      <div className="mt-5 flex border-b border-line">
        {(
          [
            ['writing', 'Writing'],
            ['speaking', 'Speaking'],
            ['history', 'Tarix'],
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

      <div className="pt-5">
        {tab === 'writing' && <WritingPractice />}
        {tab === 'speaking' && <SpeakingPractice />}
        {tab === 'history' && <History />}
      </div>
    </div>
  );
}

/** Kurslardagi haqiqiy topshiriqlardan mavzu tanlash */
function useTaskPrompts(type: 'WRITING_TASK' | 'SPEAKING_TASK') {
  return useQuery({
    queryKey: ['practice', 'prompts', type],
    queryFn: async () => {
      const exercises = await api<ExercisePublic[]>(
        `/exercises/practice?subject=ENGLISH&count=30`,
      ).catch(() => [] as ExercisePublic[]);
      return exercises.filter((exercise) => exercise.type === type);
    },
  });
}

const FALLBACK_WRITING = [
  {
    promptUz:
      'Do‘stingizga oxirgi ta’tilingiz haqida email yozing: qayerga bordingiz, nima qildingiz va nima uchun yoqdi.',
    promptEn:
      'Write an email to your friend about your last holiday: where you went, what you did, and why you liked it. Write at least 120 words.',
    minWords: 120,
  },
  {
    promptUz:
      'Ba’zilar texnologiya ta’limni yaxshilaydi deb hisoblaydi, boshqalar esa u diqqatni chalg‘itadi deydi. Ikkala fikrni muhokama qiling va o‘z fikringizni bildiring.',
    promptEn:
      'Some people believe technology improves education, while others think it distracts students. Discuss both views and give your own opinion. Write at least 180 words.',
    minWords: 180,
  },
  {
    promptUz:
      'Onlayn do‘konga buzuq mahsulot yetkazib berilgani haqida rasmiy shikoyat xati yozing.',
    promptEn:
      'Write a formal complaint email to an online shop about a damaged item you received. Write 120-150 words.',
    minWords: 120,
  },
];

const FALLBACK_SPEAKING = [
  {
    promptUz: 'Sevimli mashg‘ulotingiz haqida gapiring: nima, qachon boshlagansiz va nega yoqadi.',
    promptEn:
      'Talk about your favourite hobby: what it is, when you started, and why you enjoy it.',
    preparationSeconds: 30,
    recordSeconds: 60,
  },
  {
    promptUz:
      'Katta shaharda yashashning afzallik va kamchiliklarini tasvirlab bering. Siz qayerda yashashni afzal ko‘rasiz?',
    promptEn:
      'Describe the advantages and disadvantages of living in a big city. Where would you personally prefer to live and why?',
    preparationSeconds: 60,
    recordSeconds: 120,
  },
  {
    promptUz:
      '«Sun’iy intellekt ko‘p kasblarni yo‘q qiladi» — bu fikrga qo‘shilasizmi? Ikkala tomonni muhokama qiling.',
    promptEn:
      '"Artificial intelligence will eliminate many professions." Do you agree? Discuss both sides of the argument.',
    preparationSeconds: 60,
    recordSeconds: 120,
  },
];

function WritingPractice() {
  const queryClient = useQueryClient();
  const prompts = useTaskPrompts('WRITING_TASK');

  const [selected, setSelected] = useState(0);
  const [custom, setCustom] = useState(false);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = [
    ...FALLBACK_WRITING,
    ...(prompts.data ?? []).slice(0, 3).map((exercise) => ({
      promptUz: exercise.promptUz ?? '',
      promptEn: exercise.promptEn ?? exercise.promptUz ?? '',
      minWords: (exercise.dataJson as { minWords?: number }).minWords ?? 120,
    })),
  ];
  const task = list[selected] ?? list[0];
  const words = countWords(text);

  const evaluate = async () => {
    setPending(true);
    setError(null);
    try {
      setResult(
        await api<EvaluationResult>('/ai/writing/practice', {
          method: 'POST',
          body: {
            subject: 'ENGLISH',
            taskPrompt: custom ? 'Free topic chosen by the learner.' : task.promptEn,
            text,
          },
        }),
      );
      queryClient.invalidateQueries({ queryKey: ['practice', 'history'] });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Baholash muvaffaqiyatsiz');
    } finally {
      setPending(false);
    }
  };

  if (result) {
    return (
      <div>
        <AiPanel result={result} />
        <Button
          variant="secondary"
          full
          className="mt-4"
          onClick={() => {
            setResult(null);
            setText('');
          }}
        >
          Yana yozish
        </Button>
      </div>
    );
  }

  return (
    <>
      <SectionLabel>MAVZUNI TANLANG</SectionLabel>
      <div className="mt-3 flex flex-col gap-2">
        {list.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              setSelected(index);
              setCustom(false);
            }}
            className={clsx(
              'border bg-surface p-3.5 text-left',
              !custom && selected === index ? 'is-selected' : 'border-line',
            )}
          >
            <p className="text-base leading-relaxed">{item.promptUz}</p>
            <p className="mt-1 text-sm text-ink-4">Kamida {item.minWords} so‘z</p>
          </button>
        ))}
        <button
          onClick={() => setCustom(true)}
          className={clsx(
            'border bg-surface p-3.5 text-left',
            custom ? 'is-selected' : 'border-line',
          )}
        >
          <p className="text-base font-medium">Erkin mavzu</p>
          <p className="mt-1 text-sm text-ink-4">O‘zingiz tanlagan mavzuda yozing</p>
        </button>
      </div>

      <TextArea
        className="mt-4 h-[220px]"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Javobingizni ingliz tilida yozing…"
        disabled={pending}
      />
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className={words < (custom ? 50 : task.minWords) ? 'text-error' : 'text-success'}>
          {words} so‘z{custom ? '' : ` · kamida ${task.minWords}`}
        </span>
      </div>

      {pending ? (
        <div className="mt-4 border border-line-3 bg-surface p-4">
          <p className="text-ui font-medium">AI baholayapti…</p>
          <p className="mt-1 text-base text-ink-4">Odatda 20-40 soniya oladi</p>
          <div className="mt-3 h-[3px] w-full overflow-hidden bg-desk">
            <div className="h-full w-1/3 animate-pulse bg-accent" />
          </div>
        </div>
      ) : (
        <Button full className="mt-4" disabled={words < 20} onClick={evaluate}>
          AI&rsquo;ga yuborish
        </Button>
      )}
      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </>
  );
}

function SpeakingPractice() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(0);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const task = FALLBACK_SPEAKING[selected];

  const evaluate = async (audioUrl: string) => {
    setPending(true);
    setError(null);
    try {
      setResult(
        await api<EvaluationResult>('/ai/speaking/practice', {
          method: 'POST',
          body: { subject: 'ENGLISH', taskPrompt: task.promptEn, audioUrl },
        }),
      );
      queryClient.invalidateQueries({ queryKey: ['practice', 'history'] });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Baholash muvaffaqiyatsiz');
    } finally {
      setPending(false);
    }
  };

  if (result) {
    return (
      <div>
        {result.transcript && (
          <div className="mb-3 border border-line bg-surface p-4">
            <SectionLabel>TRANSKRIPT</SectionLabel>
            <p className="mt-2 text-ui leading-relaxed text-ink-2">{result.transcript}</p>
          </div>
        )}
        <AiPanel result={result} />
        <Button variant="secondary" full className="mt-4" onClick={() => setResult(null)}>
          Yana gapirish
        </Button>
      </div>
    );
  }

  return (
    <>
      <SectionLabel>MAVZUNI TANLANG</SectionLabel>
      <div className="mt-3 flex flex-col gap-2">
        {FALLBACK_SPEAKING.map((item, index) => (
          <button
            key={index}
            onClick={() => setSelected(index)}
            className={clsx(
              'border bg-surface p-3.5 text-left',
              selected === index ? 'is-selected' : 'border-line',
            )}
          >
            <p className="text-base leading-relaxed">{item.promptUz}</p>
            <p className="mt-1 text-sm text-ink-4">
              {item.preparationSeconds}s tayyorgarlik · {item.recordSeconds}s javob
            </p>
          </button>
        ))}
      </div>

      <div className="mt-4 border border-line-3 bg-surface p-4">
        <SectionLabel>TOPSHIRIQ</SectionLabel>
        <p className="mt-2 text-md leading-relaxed text-ink-2">{task.promptEn}</p>
      </div>

      <div className="mt-4">
        <AudioRecorder
          key={selected}
          preparationSeconds={task.preparationSeconds}
          recordSeconds={task.recordSeconds}
          onUploaded={evaluate}
          busy={pending}
        />
      </div>
      {pending && <p className="mt-3 text-ui text-ink-4">AI baholayapti…</p>}
      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </>
  );
}

function History() {
  const history = useQuery({
    queryKey: ['practice', 'history'],
    queryFn: () => api<EvaluationSummary[]>('/ai/evaluations/my?limit=30'),
  });

  const [openId, setOpenId] = useState<string | null>(null);

  if (history.isLoading) return <Skeleton className="h-40 w-full" />;
  const list = (history.data ?? []).filter((item) => item.resultJson);

  if (list.length === 0) {
    return <p className="text-ui text-ink-4">Hali baholash tarixi yo‘q.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map((item) => (
        <div key={item.id} className="border border-line bg-surface">
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="flex w-full items-center gap-3 p-3.5 text-left"
          >
            <div className="min-w-0 flex-1">
              <p className="text-ui font-medium">
                {item.skill === 'WRITING' ? 'Writing' : 'Speaking'}
              </p>
              <p className="mt-0.5 text-sm text-ink-4">{formatDateFull(item.createdAt)}</p>
            </div>
            <span className="font-display text-lg font-bold">
              {item.resultJson?.overallScore}
              <span className="text-sm font-medium text-ink-4">/75</span>
            </span>
            <span className="text-ink-4">{openId === item.id ? '−' : '+'}</span>
          </button>
          {openId === item.id && item.resultJson && (
            <div className="border-t border-line-2 p-3">
              <AiPanel result={item.resultJson} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
