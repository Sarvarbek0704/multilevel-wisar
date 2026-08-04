import { Suspense } from 'react';
import { AuthScreen } from '@/components/auth/auth-screen';
import { Spinner } from '@/components/ui';

export const metadata = { title: 'Kirish — multilevel.wisar.uz' };

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}
