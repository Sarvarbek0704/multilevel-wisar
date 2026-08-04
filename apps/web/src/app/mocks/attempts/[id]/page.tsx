'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioRecorder } from '@/components/audio-recorder';
import { PlayIcon } from '@/components/icons';
import { Button, Spinner, TextArea } from '@/components/ui';
import { api } from '@/lib/api';
import { SKILL_LABEL, countWords, formatLongClock } from '@/lib/format';
import type { AttemptForTaking, ExamPart, ExamSection, QuestionPublic } from '@/lib/types';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface StoredTiming {
  [sectionId: string]: number; // boshlangan vaqt (ms)
}

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const attempt = useQuery({
    queryKey: ['attempt', id],
    queryFn: () => api<AttemptForTaking>(`/mocks/attempts/${id}`),
    refetchOnMount: 'always',
  });

  if (attempt.isLoading) return <Spinner className="flex-1 items-center" />;
  const data = attempt.data;
  if (!data) return <p className="p-5 text-ui text-ink-4">Urinish topilmadi.</p>;

  if (data.status !== 'IN_PROGRESS') {
    router.replace(`/mocks/attempts/${id}/result`);
    return <Spinner className="flex-1 items-center" />;
  }

  return <ExamRunner attempt={data} />;
}

function ExamRunner({ attempt }: { attempt: AttemptForTaking }) {
  const router = useRouter();
  const sections = attempt.exam.sections;

  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const answer of attempt.answers) {
      if (answer.answerJson) initial[answer.questionId] = answer.answerJson;
      if (answer.audioUrl) initial[answer.questionId] = { audioUrl: answer.audioUrl };
    }
    return initial;
  });
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [playedParts, setPlayedParts] = useState<Set<string>>(new Set());
  const [showSubmit, setShowSubmit] = useState(false);
  const [saving, setSaving] = useState(false);

  const section = sections[sectionIndex];
  const questions = useMemo(
    () => section.parts.flatMap((part) => part.questions.map((question) => ({ question, part }))),
    [section],
  );
  const current = questions[questionIndex];

  // ---------- Bo'lim taymeri (sahifa yangilansa ham davom etadi) ----------
  const storageKey = `ml.exam.${attempt.id}`;
  const [now, setNow] = useState(() => Date.now());

  const startedAt = useMemo(() => {
    if (typeof window === 'undefined') return Date.now();
    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as StoredTiming;
    if (!stored[section.id]) {
      stored[section.id] = Date.now();
      window.localStorage.setItem(storageKey, JSON.stringify(stored));
    }
    return stored[section.id];
  }, [section.id, storageKey]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = Math.max(
    0,
    section.durationMinutes * 60 - Math.floor((now - startedAt) / 1000),
  );
  const lowTime = secondsLeft <= 300;

  const submit = useMutation({
    mutationFn: () => api(`/mocks/attempts/${attempt.id}/submit`, { method: 'POST' }),
    onSuccess: () => {
      window.localStorage.removeItem(storageKey);
      router.push(`/mocks/attempts/${attempt.id}/grading`);
    },
  });

  const nextSection = useCallback(() => {
    if (sectionIndex < sections.length - 1) {
      setSectionIndex(sectionIndex + 1);
      setQuestionIndex(0);
      setShowSubmit(false);
    } else {
      submit.mutate();
    }
  }, [sectionIndex, sections.length, submit]);

  // Vaqt tugasa avtomatik keyingi bo'limga
  useEffect(() => {
    if (secondsLeft === 0) nextSection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft === 0]);

  const saveAnswer = useCallback(
    async (questionId: string, payload: Record<string, unknown>) => {
      setSaving(true);
      try {
        await api(`/mocks/attempts/${attempt.id}/answers/${questionId}`, {
          method: 'POST',
          body: payload,
          raw: true,
        });
      } catch {
        /* autosave xatolari imtihonni to'xtatmaydi */
      } finally {
        setSaving(false);
      }
    },
    [attempt.id],
  );

  const answer = useCallback(
    (questionId: string, value: Record<string, unknown>) => {
      setAnswers((current) => ({ ...current, [questionId]: value }));
      void saveAnswer(questionId, { answer: value });
    },
    [saveAnswer],
  );

  const answerAudio = useCallback(
    (questionId: string, audioUrl: string) => {
      setAnswers((current) => ({ ...current, [questionId]: { audioUrl } }));
      void saveAnswer(questionId, { audioUrl });
    },
    [saveAnswer],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-panel px-4 pb-3 pt-2.5 text-on-dark">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xs tracking-label text-on-dark-4">
              BO‘LIM {sectionIndex + 1} / {sections.length}
            </p>
            <p className="mt-0.5 font-display text-lg font-semibold">
              {SKILL_LABEL[section.skill]}
            </p>
          </div>
          <div className="text-right">
            <p
              className={clsx(
                'font-mono text-3xl leading-none',
                lowTime ? 'text-error-light' : 'text-on-dark',
              )}
            >
              {formatLongClock(secondsLeft)}
            </p>
            <p className="mt-1 text-2xs tracking-label text-on-dark-4">QOLGAN VAQT</p>
          </div>
        </div>
      </header>

      {/* Savol navigatsiyasi */}
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-line px-3 py-2.5">
        {questions.map(({ question }, index) => {
          const answered = answers[question.id] !== undefined;
          const flagged = flags.has(question.id);
          return (
            <button
              key={question.id}
              onClick={() => setQuestionIndex(index)}
              className={clsx(
                'h-6 w-[26px] border font-mono text-xs',
                index === questionIndex
                  ? 'border-ink bg-ink text-bg'
                  : flagged
                    ? 'border-warn bg-warn-bg text-warn'
                    : answered
                      ? 'border-accent-border bg-accent-soft text-accent-dark'
                      : 'border-line bg-surface text-ink-5',
              )}
            >
              {question.number}
            </button>
          );
        })}
      </div>

      {/* Kontent */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {section.skill === 'LISTENING' && current && (
          <ListeningView
            part={current.part}
            question={current.question}
            played={playedParts.has(current.part.id)}
            onPlayed={() => setPlayedParts(new Set(playedParts).add(current.part.id))}
            value={answers[current.question.id]}
            onAnswer={(value) => answer(current.question.id, value)}
            flagged={flags.has(current.question.id)}
            onToggleFlag={() => toggleFlag(flags, setFlags, current.question.id)}
          />
        )}

        {section.skill === 'READING' && current && (
          <ReadingView
            part={current.part}
            answers={answers}
            onAnswer={answer}
            activeQuestionId={current.question.id}
          />
        )}

        {section.skill === 'WRITING' && current && (
          <WritingView
            question={current.question}
            part={current.part}
            value={(answers[current.question.id] as { text?: string } | undefined)?.text ?? ''}
            saving={saving}
            onChange={(text) => answer(current.question.id, { text })}
          />
        )}

        {section.skill === 'SPEAKING' && current && (
          <SpeakingView
            question={current.question}
            part={current.part}
            answered={!!answers[current.question.id]}
            onUploaded={(url) => answerAudio(current.question.id, url)}
          />
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-line px-4 pb-4 pt-3">
        <div className="flex gap-2">
          {questionIndex > 0 && (
            <Button
              variant="secondary"
              className="w-14"
              onClick={() => setQuestionIndex(questionIndex - 1)}
            >
              ←
            </Button>
          )}
          {questionIndex < questions.length - 1 ? (
            <Button full onClick={() => setQuestionIndex(questionIndex + 1)}>
              Keyingi savol
            </Button>
          ) : (
            <Button full onClick={() => setShowSubmit(true)}>
              {sectionIndex < sections.length - 1
                ? 'Bo‘limni yakunlash'
                : 'Imtihonni topshirish'}
            </Button>
          )}
        </div>
      </div>

      {showSubmit && (
        <ConfirmModal
          last={sectionIndex === sections.length - 1}
          sectionName={SKILL_LABEL[section.skill]}
          pending={submit.isPending}
          onCancel={() => setShowSubmit(false)}
          onConfirm={nextSection}
        />
      )}
    </div>
  );
}

function toggleFlag(
  flags: Set<string>,
  setFlags: (value: Set<string>) => void,
  questionId: string,
) {
  const next = new Set(flags);
  if (next.has(questionId)) next.delete(questionId);
  else next.add(questionId);
  setFlags(next);
}

// ---------- Bo'lim ko'rinishlari ----------

function ListeningView({
  part,
  question,
  played,
  onPlayed,
  value,
  onAnswer,
  flagged,
  onToggleFlag,
}: {
  part: ExamPart;
  question: QuestionPublic;
  played: boolean;
  onPlayed: () => void;
  value: unknown;
  onAnswer: (value: Record<string, unknown>) => void;
  flagged: boolean;
  onToggleFlag: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <>
      {part.audioUrl && (
        <div className="border border-line-3 bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-semibold tracking-label text-ink-4">
              {part.titleUz ?? `PART ${part.order + 1}`} · AUDIO
            </p>
            <p className="text-xs text-error">
              {played ? 'Bir marta ijro etildi' : 'Faqat bir marta eshitiladi'}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              disabled={played}
              onClick={() => {
                onPlayed();
                setPlaying(true);
                void audioRef.current?.play();
              }}
              className={clsx(
                'flex h-11 w-11 shrink-0 items-center justify-center',
                played ? 'bg-line text-ink-5' : 'bg-ink text-bg',
              )}
              aria-label="Audioni ijro etish"
            >
              <PlayIcon size={18} />
            </button>
            <audio
              ref={audioRef}
              src={part.audioUrl}
              onEnded={() => setPlaying(false)}
              className="flex-1"
              controls={playing}
            >
              <track kind="captions" />
            </audio>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="font-mono text-sm text-accent">SAVOL {question.number}</p>
        <button
          onClick={onToggleFlag}
          className={clsx('text-sm', flagged ? 'text-warn' : 'text-ink-4')}
        >
          {flagged ? 'Belgi olindi' : 'Belgilash'}
        </button>
      </div>

      <QuestionBody question={question} value={value} onAnswer={onAnswer} />
    </>
  );
}

function ReadingView({
  part,
  answers,
  onAnswer,
  activeQuestionId,
}: {
  part: ExamPart;
  answers: Record<string, unknown>;
  onAnswer: (questionId: string, value: Record<string, unknown>) => void;
  activeQuestionId: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      {part.passageText && (
        <div className="border border-line">
          <button
            onClick={() => setOpen(!open)}
            className="flex w-full items-center justify-between bg-surface-alt px-4 py-2.5"
          >
            <span className="text-sm font-semibold uppercase tracking-wide text-ink-3">
              {part.titleUz ?? part.titleEn ?? 'PASSAGE'}
            </span>
            <span className="text-lg text-ink-4">{open ? '−' : '+'}</span>
          </button>
          {open && (
            <div className="max-h-[40vh] overflow-y-auto bg-surface p-4">
              {part.passageText.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index} className="mt-3 text-md leading-relaxed text-ink-2 first:mt-0">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-6">
        {part.questions.map((question) => (
          <div
            key={question.id}
            className={clsx(
              question.id === activeQuestionId && 'border-l-2 border-accent pl-3',
            )}
          >
            <p className="font-mono text-sm text-accent">SAVOL {question.number}</p>
            <QuestionBody
              question={question}
              value={answers[question.id]}
              onAnswer={(value) => onAnswer(question.id, value)}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function WritingView({
  question,
  part,
  value,
  saving,
  onChange,
}: {
  question: QuestionPublic;
  part: ExamPart;
  value: string;
  saving: boolean;
  onChange: (text: string) => void;
}) {
  const data = question.dataJson as { minWords?: number };
  const minWords = data.minWords ?? 50;
  const words = countWords(value);

  return (
    <>
      <div className="border border-line-3 bg-surface p-4">
        <p className="text-2xs font-semibold tracking-label text-ink-4">
          {part.titleUz ?? `TASK ${question.number}`} · KAMIDA {minWords} SO‘Z
        </p>
        <p className="mt-2.5 whitespace-pre-line text-lg leading-relaxed text-ink-2">
          {question.promptEn ?? question.promptUz}
        </p>
      </div>

      <TextArea
        className="mt-4 h-[260px]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Javobingizni shu yerga yozing…"
      />
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className={words < minWords ? 'text-error' : 'text-success'}>
          {words} / {minWords} so‘z
        </span>
        <span className="text-ink-5">{saving ? 'Saqlanmoqda…' : 'Saqlandi ✓'}</span>
      </div>
    </>
  );
}

function SpeakingView({
  question,
  part,
  answered,
  onUploaded,
}: {
  question: QuestionPublic;
  part: ExamPart;
  answered: boolean;
  onUploaded: (url: string) => void;
}) {
  const data = question.dataJson as { preparationSeconds?: number; recordSeconds?: number };

  return (
    <>
      <div className="border border-line-3 bg-surface p-4">
        <p className="text-2xs font-semibold tracking-label text-ink-4">
          {part.titleUz ?? `PART ${part.order + 1}`} ·{' '}
          {Math.round((data.preparationSeconds ?? 60) / 60)} DAQIQA TAYYORGARLIK ·{' '}
          {Math.round((data.recordSeconds ?? 120) / 60)} DAQIQA GAPIRISH
        </p>
        <p className="mt-2.5 whitespace-pre-line text-lg leading-relaxed text-ink-2">
          {question.promptEn ?? question.promptUz}
        </p>
      </div>

      <div className="mt-4">
        {answered ? (
          <div className="border border-success-border bg-success-bg p-4">
            <p className="text-ui font-semibold text-success-dark">✓ Javob yozildi va saqlandi</p>
            <p className="mt-1 text-base text-ink-3">
              Baholash imtihon oxirida avtomatik boshlanadi.
            </p>
          </div>
        ) : (
          <AudioRecorder
            preparationSeconds={data.preparationSeconds ?? 60}
            recordSeconds={data.recordSeconds ?? 120}
            onUploaded={onUploaded}
          />
        )}
      </div>
    </>
  );
}

/** MCQ / true-false / gap-fill javob maydonlari (javob ko'rsatilmaydi) */
function QuestionBody({
  question,
  value,
  onAnswer,
}: {
  question: QuestionPublic;
  value: unknown;
  onAnswer: (value: Record<string, unknown>) => void;
}) {
  const data = question.dataJson as { text?: string; statement?: string; options?: string[] };
  const selected = (value as { value?: string } | undefined)?.value;

  if (question.type === 'MCQ_SINGLE' || question.type === 'TRUE_FALSE') {
    const options =
      question.type === 'TRUE_FALSE'
        ? [
            { label: 'To‘g‘ri', value: 'true' },
            { label: 'Noto‘g‘ri', value: 'false' },
          ]
        : (data.options ?? []).map((option) => ({ label: option, value: option }));

    return (
      <>
        {(data.text || data.statement || question.promptEn) && (
          <p className="mt-3 text-xl font-medium leading-snug">
            {data.statement ?? data.text ?? question.promptEn}
          </p>
        )}
        <div className="mt-3.5 flex flex-col gap-2">
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => onAnswer({ value: option.value })}
              className={clsx(
                'flex items-center gap-3 border bg-surface p-3.5 text-left',
                selected === option.value ? 'is-selected' : 'border-line',
              )}
            >
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center border border-line-4 font-mono text-xs">
                {LETTERS[index]}
              </span>
              <span className="text-md">{option.label}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  // GAP_FILL / SHORT_ANSWER
  return (
    <>
      {(data.text || question.promptEn) && (
        <p className="mt-3 text-lg leading-relaxed">{data.text ?? question.promptEn}</p>
      )}
      <input
        value={selected ?? ''}
        onChange={(event) => onAnswer({ value: event.target.value })}
        placeholder="Javobingiz"
        className="mt-3 w-full border border-line-4 bg-surface px-4 py-3 text-md outline-none focus:border-accent"
      />
    </>
  );
}

function ConfirmModal({
  last,
  sectionName,
  pending,
  onCancel,
  onConfirm,
}: {
  last: boolean;
  sectionName: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] px-6">
      <div className="w-full max-w-[350px] animate-popFast bg-bg p-5">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {last ? 'Imtihonni topshirasizmi?' : `${sectionName} bo‘limini yakunlaysizmi?`}
        </h2>
        <p className="mt-2.5 text-ui leading-relaxed text-ink-3">
          {last
            ? 'Barcha javoblar baholashga yuboriladi. Writing va Speaking AI tahlili 1-2 daqiqada tayyor bo‘ladi.'
            : 'Yakunlagandan keyin bu bo‘limga qaytib bo‘lmaydi. Qolgan vaqt keyingi bo‘limga o‘tmaydi.'}
        </p>
        <Button full className="mt-5" disabled={pending} onClick={onConfirm}>
          {pending ? 'Yuborilmoqda…' : last ? 'Ha, topshirish' : 'Ha, yakunlash'}
        </Button>
        <Button variant="secondary" full className="mt-2.5" onClick={onCancel}>
          Bekor qilish
        </Button>
      </div>
    </div>
  );
}
