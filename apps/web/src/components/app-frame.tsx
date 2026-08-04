'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { TabBar } from '@/components/tab-bar';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

/**
 * Kirishni talab qiladigan sahifalar uchun karkas: yuklanishni kutadi,
 * mehmonni /login ga yuboradi, pastda tab-bar ko'rsatadi.
 */
export function AppFrame({
  children,
  tabBar = true,
  scroll = true,
}: {
  children: ReactNode;
  tabBar?: boolean;
  scroll?: boolean;
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

  return (
    <>
      <div className={scroll ? 'flex-1 overflow-y-auto' : 'flex flex-1 flex-col overflow-hidden'}>
        {children}
      </div>
      {tabBar && <TabBar />}
    </>
  );
}
