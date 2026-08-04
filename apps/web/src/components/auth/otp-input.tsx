'use client';

import clsx from 'clsx';
import { useEffect, useRef } from 'react';

const LENGTH = 6;

/**
 * 6 katakli kod kiritish. Avtomatik keyingi katakka o'tadi, paste'ni qo'llab-quvvatlaydi,
 * to'liq bo'lganda onComplete chaqiriladi.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  autoFocus = true,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const completedFor = useRef<string | null>(null);

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === LENGTH && completedFor.current !== value) {
      completedFor.current = value;
      onComplete?.(value);
    }
    if (value.length < LENGTH) completedFor.current = null;
  }, [value, onComplete]);

  const setDigit = (index: number, digit: string) => {
    const next = value.split('');
    next[index] = digit;
    onChange(next.join('').slice(0, LENGTH));
  };

  return (
    <div className="flex gap-2">
      {Array.from({ length: LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          value={value[index] ?? ''}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`${index + 1}-raqam`}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '');
            if (!digits) {
              setDigit(index, '');
              return;
            }
            if (digits.length > 1) {
              // Paste: barcha kataklarni to'ldiramiz
              onChange(digits.slice(0, LENGTH));
              inputs.current[Math.min(digits.length, LENGTH - 1)]?.focus();
              return;
            }
            setDigit(index, digits);
            if (index < LENGTH - 1) inputs.current[index + 1]?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !value[index] && index > 0) {
              inputs.current[index - 1]?.focus();
              setDigit(index - 1, '');
            }
            if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
            if (event.key === 'ArrowRight' && index < LENGTH - 1) inputs.current[index + 1]?.focus();
          }}
          className={clsx(
            'h-14 flex-1 border bg-surface text-center font-mono text-2xl outline-none',
            invalid ? 'border-error text-error' : 'border-line-4 focus:border-accent',
            disabled && 'opacity-60',
          )}
        />
      ))}
    </div>
  );
}
