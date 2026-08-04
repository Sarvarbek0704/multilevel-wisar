'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SideNav } from '@/components/side-nav';
import { TabBar } from '@/components/tab-bar';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

/**
 * Kirishni talab qiladigan sahifalar karkasi.
 * Mobilda: kontent + pastdagi tab-bar. Desktopda (lg+): chapda yon panel,
 * kontent markazda cheklangan kenglikda.
 */
export function AppFrame({
  children,
  tabBar = true,
  scroll = true,
  /** Keng ekranda kontent maydoni kengligi */
  width = 'default',
}: {
  children: ReactNode;
  tabBar?: boolean;
  scroll?: boolean;
  width?: 'default' | 'wide' | 'full';
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const maxWidth = {
    default: 'lg:max-w-[760px]',
    wide: 'lg:max-w-[1040px]',
    full: '',
  }[width];

  return (
    <div className="flex flex-1 overflow-hidden">
      {tabBar && <SideNav />}

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className={clsx(
            scroll ? 'flex-1 overflow-y-auto' : 'flex flex-1 flex-col overflow-hidden',
          )}
        >
          <div className={clsx('mx-auto w-full', maxWidth)}>{children}</div>
        </div>
        {tabBar && <TabBar className="lg:hidden" />}
      </div>
    </div>
  );
}
