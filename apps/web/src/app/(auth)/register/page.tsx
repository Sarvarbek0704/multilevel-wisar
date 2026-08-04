import { Suspense } from 'react';
import { AuthScreen } from '@/components/auth/auth-screen';
import { Spinner } from '@/components/ui';

export const metadata = { title: 'Ro‘yxatdan o‘tish — multilevel.wisar.uz' };

export default function RegisterPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AuthScreen mode="register" />
    </Suspense>
  );
}
