'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AppFrame } from '@/components/app-frame';
import { Button, SectionLabel, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDateFull } from '@/lib/format';
import type { CefrLevel } from '@/lib/types';

type Tab = 'stats' | 'import' | 'users';

interface AdminStats {
  users: number;
  courses: number;
  lessons: number;
  exercises: number;
  words: number;
  mocks: number;
  attempts: number;
  evaluations: number;
  failedEvals: number;
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string | null;
  role: string;
  telegramId: string | null;
  currentLevel: CefrLevel | null;
  targetLevel: CefrLevel | null;
  createdAt: string;
}

export default function AdminPage() {
  return (
    <AppFrame>
      <AdminContent />
    </AppFrame>
  );
}

function AdminContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('stats');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="px-5 pb-8 pt-4">
      <h1 className="font-display text-4xl font-bold tracking-tighter">Admin</h1>
      <p className="mt-1.5 text-base text-ink-3">Kontent, foydalanuvchilar va AI navbati.</p>

      <div className="mt-5 flex border-b border-line">
        {(
          [
            ['stats', 'Statistika'],
            ['import', 'Kontent'],
            ['users', 'Foydalanuvchilar'],
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
        {tab === 'stats' && <StatsTab />}
        {tab === 'import' && <ImportTab />}
        {tab === 'users' && <UsersTab />}
      </div>
    </div>
  );
}

function StatsTab() {
  const stats = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api<AdminStats>('/admin/stats'),
  });

  if (stats.isLoading) return <Skeleton className="h-48 w-full" />;
  const data = stats.data;
  if (!data) return null;

  const cells = [
    { value: data.users, label: 'FOYDALANUVCHI' },
    { value: data.courses, label: 'KURS' },
    { value: data.lessons, label: 'DARS' },
    { value: data.exercises, label: 'MASHQ' },
    { value: data.mocks, label: 'MOCK' },
    { value: data.words, label: 'SO‘Z' },
    { value: data.attempts, label: 'URINISH' },
    { value: data.evaluations, label: 'AI BAHOLASH' },
  ];

  return (
    <>
      <div className="grid grid-cols-2 border border-line">
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className={clsx(
              'p-4',
              index % 2 === 0 && 'border-r border-line',
              index < cells.length - 2 && 'border-b border-line',
            )}
          >
            <p className="font-display text-3xl font-bold tracking-tight">{cell.value}</p>
            <p className="mt-1 text-2xs tracking-label text-ink-4">{cell.label}</p>
          </div>
        ))}
      </div>

      {data.failedEvals > 0 && (
        <div className="mt-4 border border-error-border bg-error-bg p-4">
          <p className="text-ui font-semibold text-error">
            {data.failedEvals} ta AI baholash muvaffaqiyatsiz
          </p>
          <p className="mt-1 text-base leading-relaxed text-ink-3">
            Bu odatda API kaliti yoki tarmoq muammosi. Baholashni qayta navbatga qo‘yish uchun
            API: <code className="font-mono text-sm">POST /api/admin/evaluations/:id/retry</code>
          </p>
        </div>
      )}
    </>
  );
}

function ImportTab() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<'course' | 'mock' | 'vocab'>('course');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importContent = useMutation({
    mutationFn: async (payload: unknown) =>
      api<Record<string, unknown>>(`/admin/import/${kind}`, { method: 'POST', body: payload }),
    onSuccess: (result) => {
      setMessage(`Import muvaffaqiyatli: ${JSON.stringify(result)}`);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (caught) => {
      setError(caught instanceof Error ? caught.message : 'Import muvaffaqiyatsiz');
      setMessage(null);
    },
  });

  const handleFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      importContent.mutate(parsed);
    } catch {
      setError('JSON faylni o‘qib bo‘lmadi');
    }
  };

  return (
    <>
      <SectionLabel>JSON IMPORT</SectionLabel>
      <p className="mt-2 text-base leading-relaxed text-ink-3">
        Kontent fayllari <code className="font-mono text-sm">content/</code> papkasidagi format
        bilan bir xil bo‘lishi kerak. Sxema:{' '}
        <code className="font-mono text-sm">apps/api/src/content/schemas.ts</code>
      </p>

      <div className="mt-3 flex gap-2">
        {(
          [
            ['course', 'Kurs'],
            ['mock', 'Mock'],
            ['vocab', 'Lug‘at'],
          ] as Array<['course' | 'mock' | 'vocab', string]>
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setKind(value)}
            className={clsx(
              'flex-1 border px-3 py-2 text-base font-medium',
              kind === value ? 'border-ink bg-ink text-bg' : 'border-line-4 text-ink-3',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={() => fileInput.current?.click()}
        className="placeholder-hatch mt-3 flex h-32 w-full items-center justify-center"
      >
        <span className="font-mono text-sm text-ink-4">
          {importContent.isPending ? 'Yuklanmoqda…' : 'JSON faylni tanlang'}
        </span>
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = '';
        }}
      />

      {message && (
        <p className="mt-3 border border-success-border bg-success-bg p-3 text-base text-success-dark">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 border border-error-border bg-error-bg p-3 text-base text-error">
          {error}
        </p>
      )}

      <div className="mt-6 border border-line p-4">
        <SectionLabel>ESLATMA</SectionLabel>
        <p className="mt-2 text-base leading-relaxed text-ink-3">
          Serverdagi <code className="font-mono text-sm">content/</code> papkasidan ommaviy
          import uchun: <code className="font-mono text-sm">pnpm seed</code>. Listening audio
          uchun: <code className="font-mono text-sm">node tools/generate-audio.mjs</code>
        </p>
      </div>
    </>
  );
}

function UsersTab() {
  const [page, setPage] = useState(1);

  const users = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () =>
      api<{ items: AdminUser[]; total: number; page: number; limit: number }>(
        `/admin/users?page=${page}&limit=20`,
      ),
  });

  if (users.isLoading) return <Skeleton className="h-64 w-full" />;
  const data = users.data;
  if (!data) return null;

  const pages = Math.ceil(data.total / data.limit);

  return (
    <>
      <p className="text-sm text-ink-4">Jami: {data.total} foydalanuvchi</p>
      <div className="mt-3 border border-line">
        {data.items.map((item, index) => (
          <div
            key={item.id}
            className={clsx('flex items-center gap-3 p-3.5', index > 0 && 'border-t border-line-2')}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-ui font-medium">
                {item.firstName} {item.lastName ?? ''}
                {item.role === 'ADMIN' && (
                  <span className="ml-2 border border-accent px-1.5 py-0.5 text-2xs text-accent">
                    ADMIN
                  </span>
                )}
              </p>
              <p className="truncate text-sm text-ink-4">
                {item.email ?? (item.telegramId ? 'Telegram' : '—')} ·{' '}
                {formatDateFull(item.createdAt)}
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm text-ink-4">
              {item.currentLevel ?? '—'}
              {item.targetLevel ? `→${item.targetLevel}` : ''}
            </span>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ← Oldingi
          </Button>
          <span className="font-mono text-sm text-ink-4">
            {page} / {pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            Keyingi →
          </Button>
        </div>
      )}
    </>
  );
}
