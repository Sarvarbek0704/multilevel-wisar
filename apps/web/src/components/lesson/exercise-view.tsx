'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { AiPanel } from '@/components/ai-panel';
import { AudioRecorder } from '@/components/audio-recorder';
import { Button, SectionLabel, TextArea, TextInput } from '@/components/ui';
import { api } from '@/lib/api';
import { countWords } from '@/lib/format';
import type { EvaluationResult, ExercisePublic, SubmitAnswerResult } from '@/lib/types';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  exercise: ExercisePublic;
  /** Javob tekshirilgach ota-komponent "Davom etish" tugmasini yoqadi */
  onAnswered: (correct: boolean) => void;
}

export function ExerciseView({ exercise, onAnswered }: Props) {
  const data = exercise.dataJson as {
    text?: string;
    statement?: string;
    options?: string[];
    items?: string[];
    left?: string[];
    right?: string[];
    minWords?: number;
    maxWords?: number;
    preparationSeconds?: number;
    recordSeconds?: number;
  };

  const [result, setResult] = useState<SubmitAnswerResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (answer: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const response = await api<SubmitAnswerResult>(`/exercises/${exercise.id}/submit`, {
        method: 'POST',
        body: { answer },
      });
      setResult(response);
      onAnswered(response.isCorrect);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Javob yuborilmadi');
    } finally {
      setBusy(false);
    }
  };

  const prompt = exercise.promptUz ?? exercise.promptEn ?? '';
  const checked = result !== null;

  return (
    <div>
      <SectionLabel className="text-accent">MASHQ</SectionLabel>
      {prompt && <p className="mt-3 text-md leading-relaxed text-ink-2">{prompt}</p>}

      {exercise.type === 'MCQ_SINGLE' && (
        <ChoiceExercise
          text={data.text}
          options={data.options ?? []}
          result={result}
          busy={busy}
          onSubmit={(value) => submit({ value })}
        />
      )}

      {exercise.type === 'TRUE_FALSE' && (
        <ChoiceExercise
          text={data.statement}
          options={['To‘g‘ri', 'Noto‘g‘ri']}
          values={['true', 'false']}
          result={result}
          busy={busy}
          onSubmit={(value) => submit({ value })}
        />
      )}

      {exercise.type === 'MCQ_MULTI' && (
        <MultiExercise
          options={data.options ?? []}
          result={result}
          busy={busy}
          onSubmit={(values) => submit({ values })}
        />
      )}

      {(exercise.type === 'GAP_FILL' || exercise.type === 'SHORT_ANSWER') && (
        <GapExercise
          text={data.text}
          result={result}
          busy={busy}
          onSubmit={(value) => submit({ value })}
        />
      )}

      {exercise.type === 'ORDERING' && (
        <OrderingExercise
          items={data.items ?? []}
          result={result}
          busy={busy}
          onSubmit={(order) => submit({ order })}
        />
      )}

      {exercise.type === 'MATCHING' && (
        <MatchingExercise
          left={data.left ?? []}
          right={data.right ?? []}
          result={result}
          busy={busy}
          onSubmit={(pairs) => submit({ pairs })}
        />
      )}

      {exercise.type === 'WRITING_TASK' && (
        <WritingExercise
          promptEn={exercise.promptEn ?? prompt}
          minWords={data.minWords ?? 50}
          onDone={() => onAnswered(true)}
        />
      )}

      {exercise.type === 'SPEAKING_TASK' && (
        <SpeakingExercise
          promptEn={exercise.promptEn ?? prompt}
          preparationSeconds={data.preparationSeconds ?? 30}
          recordSeconds={data.recordSeconds ?? 60}
          onDone={() => onAnswered(true)}
        />
      )}

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      {checked && result && (
        <div
          className={clsx(
            'mt-4 border p-4',
            result.isCorrect ? 'border-success-border bg-success-bg' : 'border-error-border bg-error-bg',
          )}
        >
          <p
            className={clsx(
              'text-base font-semibold',
              result.isCorrect ? 'text-success-dark' : 'text-error',
            )}
          >
            {result.isCorrect ? '✓ To‘g‘ri javob' : '✗ Xato'}
          </p>
          {!result.isCorrect && result.correctAnswer && (
            <p className="mt-1.5 text-ui text-ink-2">
              To‘g‘ri javob:{' '}
              <b className="font-semibold">{formatCorrect(result.correctAnswer)}</b>
            </p>
          )}
          {result.explanationUz && (
            <p className="mt-2 text-ui leading-relaxed text-ink-2">{result.explanationUz}</p>
          )}
        </div>
      )}
    </div>
  );
}

function formatCorrect(answer: Record<string, unknown>): string {
  if (typeof answer.value === 'string') {
    if (answer.value === 'true') return 'To‘g‘ri';
    if (answer.value === 'false') return 'Noto‘g‘ri';
    return answer.value;
  }
  if (Array.isArray(answer.values)) return answer.values.join(', ');
  if (Array.isArray(answer.accept)) return String(answer.accept[0]);
  if (Array.isArray(answer.order)) return answer.order.join(' → ');
  if (Array.isArray(answer.gaps)) {
    return (answer.gaps as unknown[][]).map((gap) => String(gap[0])).join(', ');
  }
  if (answer.pairs && typeof answer.pairs === 'object') {
    return Object.entries(answer.pairs as Record<string, string>)
      .map(([key, value]) => `${key} → ${value}`)
      .join('; ');
  }
  return '—';
}

// ---------- Turlar ----------

function ChoiceExercise({
  text,
  options,
  values,
  result,
  busy,
  onSubmit,
}: {
  text?: string;
  options: string[];
  values?: string[];
  result: SubmitAnswerResult | null;
  busy: boolean;
  onSubmit: (value: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const correctValue = (result?.correctAnswer as { value?: string } | null)?.value;

  return (
    <>
      {text && <p className="mt-4 text-xl font-medium leading-snug">{text}</p>}
      <div className="mt-4 flex flex-col gap-2">
        {options.map((option, index) => {
          const value = values?.[index] ?? option;
          const isSelected = selected === index;
          const isCorrect = result && correctValue === value;
          const isWrongPick = result && isSelected && !result.isCorrect;

          return (
            <button
              key={option}
              disabled={!!result || busy}
              onClick={() => setSelected(index)}
              className={clsx(
                'flex items-center gap-3 border bg-surface p-3.5 text-left',
                isCorrect
                  ? 'border-success bg-success-bg'
                  : isWrongPick
                    ? 'border-error bg-error-bg'
                    : isSelected
                      ? 'is-selected'
                      : 'border-line',
                result && !isCorrect && !isWrongPick && 'opacity-50',
              )}
            >
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center border border-line-4 font-mono text-xs">
                {LETTERS[index]}
              </span>
              <span className="text-md">{option}</span>
              {isCorrect && <span className="ml-auto text-success">✓</span>}
              {isWrongPick && <span className="ml-auto text-error">✗</span>}
            </button>
          );
        })}
      </div>
      {!result && (
        <Button
          full
          className="mt-4"
          disabled={selected === null || busy}
          onClick={() => selected !== null && onSubmit(values?.[selected] ?? options[selected])}
        >
          Tekshirish
        </Button>
      )}
    </>
  );
}

function MultiExercise({
  options,
  result,
  busy,
  onSubmit,
}: {
  options: string[];
  result: SubmitAnswerResult | null;
  busy: boolean;
  onSubmit: (values: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);

  return (
    <>
      <p className="mt-3 text-sm text-ink-4">Bir nechta javobni tanlang</p>
      <div className="mt-3 flex flex-col gap-2">
        {options.map((option) => {
          const active = picked.includes(option);
          return (
            <button
              key={option}
              disabled={!!result || busy}
              onClick={() =>
                setPicked(active ? picked.filter((item) => item !== option) : [...picked, option])
              }
              className={clsx(
                'flex items-center gap-3 border bg-surface p-3.5 text-left',
                active ? 'is-selected' : 'border-line',
              )}
            >
              <span
                className={clsx(
                  'flex h-[18px] w-[18px] shrink-0 items-center justify-center border',
                  active ? 'border-ink bg-ink text-bg' : 'border-line-4',
                )}
              >
                {active && '✓'}
              </span>
              <span className="text-md">{option}</span>
            </button>
          );
        })}
      </div>
      {!result && (
        <Button
          full
          className="mt-4"
          disabled={picked.length === 0 || busy}
          onClick={() => onSubmit(picked)}
        >
          Tekshirish
        </Button>
      )}
    </>
  );
}

function GapExercise({
  text,
  result,
  busy,
  onSubmit,
}: {
  text?: string;
  result: SubmitAnswerResult | null;
  busy: boolean;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <>
      {text && (
        <p className="mt-4 text-xl leading-relaxed">
          {text.split('___').map((part, index, array) => (
            <span key={index}>
              {part}
              {index < array.length - 1 && (
                <span className="mx-1 inline-block w-20 border-b-2 border-accent align-baseline" />
              )}
            </span>
          ))}
        </p>
      )}
      <TextInput
        className="mt-4"
        value={value}
        disabled={!!result || busy}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Javobingiz"
        autoComplete="off"
      />
      {!result && (
        <Button full className="mt-4" disabled={!value.trim() || busy} onClick={() => onSubmit(value)}>
          Tekshirish
        </Button>
      )}
    </>
  );
}

function OrderingExercise({
  items,
  result,
  busy,
  onSubmit,
}: {
  items: string[];
  result: SubmitAnswerResult | null;
  busy: boolean;
  onSubmit: (order: string[]) => void;
}) {
  const [order, setOrder] = useState<string[]>([]);
  const remaining = useMemo(
    () => items.filter((item) => !order.includes(item)),
    [items, order],
  );

  return (
    <>
      <p className="mt-3 text-sm text-ink-4">So‘zlarni to‘g‘ri tartibda bosing</p>

      <div className="mt-3 min-h-[52px] border border-line-3 bg-surface p-2.5">
        {order.length === 0 ? (
          <span className="text-base text-ink-5">Bu yerda javobingiz yig‘iladi</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {order.map((item, index) => (
              <button
                key={`${item}-${index}`}
                disabled={!!result || busy}
                onClick={() => setOrder(order.filter((_, i) => i !== index))}
                className="border border-ink bg-ink px-2.5 py-1.5 text-base text-bg"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {remaining.map((item) => (
          <button
            key={item}
            disabled={!!result || busy}
            onClick={() => setOrder([...order, item])}
            className="border border-line-4 bg-surface px-2.5 py-1.5 text-base"
          >
            {item}
          </button>
        ))}
      </div>

      {!result && (
        <Button
          full
          className="mt-4"
          disabled={remaining.length > 0 || busy}
          onClick={() => onSubmit(order)}
        >
          Tekshirish
        </Button>
      )}
    </>
  );
}

function MatchingExercise({
  left,
  right,
  result,
  busy,
  onSubmit,
}: {
  left: string[];
  right: string[];
  result: SubmitAnswerResult | null;
  busy: boolean;
  onSubmit: (pairs: Record<string, string>) => void;
}) {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [activeLeft, setActiveLeft] = useState<string | null>(null);

  const usedRight = new Set(Object.values(pairs));

  const pick = (item: string) => {
    if (!activeLeft) return;
    setPairs({ ...pairs, [activeLeft]: item });
    setActiveLeft(null);
  };

  return (
    <>
      <p className="mt-3 text-sm text-ink-4">Chapdagini tanlab, mos juftini bosing</p>
      <div className="mt-3 flex gap-2.5">
        <div className="flex flex-1 flex-col gap-2">
          {left.map((item) => (
            <button
              key={item}
              disabled={!!result || busy}
              onClick={() => setActiveLeft(activeLeft === item ? null : item)}
              className={clsx(
                'border bg-surface p-2.5 text-left text-base',
                activeLeft === item ? 'is-selected' : pairs[item] ? 'border-accent' : 'border-line',
              )}
            >
              {item}
              {pairs[item] && (
                <span className="mt-1 block text-sm text-accent">→ {pairs[item]}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {right.map((item) => (
            <button
              key={item}
              disabled={!!result || busy || usedRight.has(item)}
              onClick={() => pick(item)}
              className={clsx(
                'border bg-surface p-2.5 text-left text-base',
                usedRight.has(item) ? 'border-line opacity-40' : 'border-line',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {!result && (
        <Button
          full
          className="mt-4"
          disabled={Object.keys(pairs).length < left.length || busy}
          onClick={() => onSubmit(pairs)}
        >
          Tekshirish
        </Button>
      )}
      {Object.keys(pairs).length > 0 && !result && (
        <button onClick={() => setPairs({})} className="mt-2 w-full text-base text-ink-4">
          Tozalash
        </button>
      )}
    </>
  );
}

function WritingExercise({
  promptEn,
  minWords,
  onDone,
}: {
  promptEn: string;
  minWords: number;
  onDone: () => void;
}) {
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const words = countWords(text);

  const evaluate = async () => {
    setPending(true);
    setError(null);
    try {
      setResult(
        await api<EvaluationResult>('/ai/writing/practice', {
          method: 'POST',
          body: { subject: 'ENGLISH', taskPrompt: promptEn, text },
        }),
      );
      onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Baholash muvaffaqiyatsiz');
    } finally {
      setPending(false);
    }
  };

  if (result) return <div className="mt-4">{<AiPanel result={result} />}</div>;

  return (
    <>
      <TextArea
        className="mt-4 h-[180px]"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Javobingizni ingliz tilida yozing…"
        disabled={pending}
      />
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className={words < minWords ? 'text-error' : 'text-success'}>
          {words} so‘z · kamida {minWords}
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

function SpeakingExercise({
  promptEn,
  preparationSeconds,
  recordSeconds,
  onDone,
}: {
  promptEn: string;
  preparationSeconds: number;
  recordSeconds: number;
  onDone: () => void;
}) {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = async (audioUrl: string) => {
    setPending(true);
    setError(null);
    try {
      setResult(
        await api<EvaluationResult>('/ai/speaking/practice', {
          method: 'POST',
          body: { subject: 'ENGLISH', taskPrompt: promptEn, audioUrl },
        }),
      );
      onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Baholash muvaffaqiyatsiz');
    } finally {
      setPending(false);
    }
  };

  if (result) {
    return (
      <div className="mt-4">
        {result.transcript && (
          <div className="mb-3 border border-line bg-surface p-4">
            <SectionLabel>TRANSKRIPT</SectionLabel>
            <p className="mt-2 text-ui leading-relaxed text-ink-2">{result.transcript}</p>
          </div>
        )}
        <AiPanel result={result} />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <AudioRecorder
        preparationSeconds={preparationSeconds}
        recordSeconds={recordSeconds}
        onUploaded={evaluate}
        busy={pending}
      />
      {pending && (
        <p className="mt-3 text-ui text-ink-4">AI baholayapti… bu 20-40 soniya olishi mumkin.</p>
      )}
      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </div>
  );
}
