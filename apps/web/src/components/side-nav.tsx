'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookIcon,
  CalendarIcon,
  FileIcon,
  HomeIcon,
  LayersIcon,
  MicIcon,
} from './icons';
import { useAuth } from '@/lib/auth-context';
import { initials } from '@/lib/format';

const ITEMS = [
  { href: '/dashboard', label: 'Bosh sahifa', Icon: HomeIcon },
  { href: '/courses', label: 'Kurslar', Icon: BookIcon },
  { href: '/mocks', label: 'Mock imtihonlar', Icon: FileIcon },
  { href: '/vocabulary', label: 'Lug‘at', Icon: LayersIcon },
  { href: '/plan', label: 'O‘quv reja', Icon: CalendarIcon },
  { href: '/practice', label: 'AI amaliyot', Icon: MicIcon },
];

/** Desktopdagi yon navigatsiya — mobil tab-bar o'rniga (lg dan boshlab). */
export function SideNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line bg-bg lg:flex">
      <Link href="/dashboard" className="flex items-baseline gap-1 px-6 pb-8 pt-6">
        <span className="font-display text-[19px] font-bold tracking-tight">multilevel</span>
        <span className="text-base text-ink-4">.wisar.uz</span>
      </Link>

      <nav className="flex flex-col px-3">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 text-ui',
                active ? 'bg-surface-alt font-semibold text-ink' : 'text-ink-3',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {user && (
        <Link
          href="/profile"
          className={clsx(
            'mx-3 mb-6 flex items-center gap-3 border border-line px-3 py-3',
            pathname === '/profile' && 'bg-surface-alt',
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-ink font-display text-base font-semibold text-bg">
            {initials(user.firstName, user.lastName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-medium">{user.firstName}</span>
            <span className="block truncate text-sm text-ink-4">
              {user.targetLevel ? `Maqsad: ${user.targetLevel}` : 'Profil'}
            </span>
          </span>
        </Link>
      )}
    </aside>
  );
}
