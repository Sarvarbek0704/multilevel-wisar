'use client';

import clsx from 'clsx';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import type { CefrLevel } from '@/lib/types';
import { levelBadgeClass } from '@/lib/format';

// ---------- Button ----------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'telegram' | 'danger' | 'warn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  full?: boolean;
  size?: 'md' | 'sm';
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-bg disabled:bg-line disabled:text-ink-5',
  secondary: 'border border-line-4 text-ink bg-transparent disabled:text-ink-5',
  ghost: 'text-ink-4 bg-transparent',
  accent: 'bg-accent text-white',
  telegram: 'bg-telegram text-white',
  danger: 'border border-error-border text-error bg-transparent',
  warn: 'bg-warn text-white',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', full, size = 'md', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'font-display font-semibold transition-opacity disabled:cursor-not-allowed',
        size === 'md' ? 'px-4 py-4 text-md' : 'px-3 py-2.5 text-base',
        full && 'w-full',
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
});

// ---------- Inputs ----------

interface FieldProps {
  label?: string;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <div>
      {(label || hint) && (
        <div className="mb-1.5 flex items-baseline justify-between">
          {label && <label className="text-sm font-medium text-ink-3">{label}</label>}
          {hint}
        </div>
      )}
      {children}
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full border bg-surface px-4 py-3.5 text-md outline-none placeholder:text-ink-5',
        invalid ? 'border-error' : 'border-line-4 focus:border-accent',
        className,
      )}
      {...props}
    />
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx(
          'w-full resize-none border border-line-4 bg-surface p-4 text-md leading-relaxed outline-none focus:border-accent placeholder:text-ink-5',
          className,
        )}
        {...props}
      />
    );
  },
);

// ---------- Layout bits ----------

export function Card({
  children,
  className,
  strong,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={clsx(
        'border bg-surface',
        strong ? 'border-line-3' : 'border-line',
        onClick && 'w-full text-left',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={clsx(
        'text-2xs font-semibold uppercase tracking-label text-ink-4',
        className,
      )}
    >
      {children}
    </p>
  );
}

export function LevelBadge({
  level,
  className,
  onDark,
}: {
  level: CefrLevel | null | undefined;
  className?: string;
  onDark?: boolean;
}) {
  if (!level) return null;
  return (
    <span
      className={clsx(
        'border px-2 py-0.5 text-xs font-semibold tracking-wide',
        onDark ? levelBadgeClassOnDarkLocal(level) : levelBadgeClass(level),
        className,
      )}
    >
      {level}
    </span>
  );
}

function levelBadgeClassOnDarkLocal(level: CefrLevel): string {
  switch (level) {
    case 'C1':
    case 'C2':
      return 'border-gold text-gold-ondark';
    case 'B2':
      return 'border-purple text-purple';
    case 'B1':
      return 'border-warn text-warn';
    default:
      return 'border-dark-line-2 text-on-dark-2';
  }
}

/** Segment control: [Ingliz tili | Ona tili] */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={clsx('inline-flex border border-line-3', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={clsx(
            'px-3 py-1.5 text-sm font-semibold',
            value === option.value ? 'bg-ink text-bg' : 'text-ink-3',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  className,
  height = 4,
  complete,
}: {
  value: number;
  max?: number;
  className?: string;
  height?: number;
  complete?: boolean;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={clsx('w-full bg-desk', className)} style={{ height }}>
      <div
        className={complete ? 'h-full bg-success' : 'h-full bg-accent'}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  max,
  size = 58,
  stroke = 6,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EDEAE4"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1B3C73"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}

/** Bo'sh holat uchun chiziqli placeholder (dizaynda illyustratsiya yo'q) */
export function HatchPlaceholder({ height = 88, label }: { height?: number; label?: string }) {
  return (
    <div
      className="placeholder-hatch flex items-center justify-center"
      style={{ height }}
    >
      <span className="font-mono text-2xs uppercase tracking-wide text-ink-5">
        {label ?? 'BO‘SH HOLAT ILLYUSTRATSIYASI'}
      </span>
    </div>
  );
}

export function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border border-error-border bg-error-bg p-4">
      <p className="text-ui text-error">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-base font-semibold text-error underline">
          Qayta urinish
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse bg-desk', className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={clsx('flex justify-center py-10', className)}>
      <div className="h-6 w-6 animate-spin border-2 border-line-4 border-t-accent" />
    </div>
  );
}
