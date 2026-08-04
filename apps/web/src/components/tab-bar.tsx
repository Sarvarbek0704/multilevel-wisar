'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookIcon, CalendarIcon, FileIcon, HomeIcon, LayersIcon } from './icons';

const TABS = [
  { href: '/dashboard', label: 'Bosh', Icon: HomeIcon },
  { href: '/courses', label: 'Kurslar', Icon: BookIcon },
  { href: '/mocks', label: 'Mocklar', Icon: FileIcon },
  { href: '/vocabulary', label: 'Lug‘at', Icon: LayersIcon },
  { href: '/plan', label: 'Reja', Icon: CalendarIcon },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="grid shrink-0 grid-cols-5 border-t border-line bg-bg pb-3 pt-2">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-col items-center gap-[5px]',
              active ? 'text-ink' : 'text-ink-5',
            )}
          >
            <Icon size={20} />
            <span className="text-2xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
