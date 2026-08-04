import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[52px] text-line-3">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Sahifa topilmadi</h1>
      <p className="mt-2.5 text-ui leading-relaxed text-ink-3">
        Havola eskirgan yoki noto‘g‘ri bo‘lishi mumkin.
      </p>
      <div className="mt-6 flex w-full max-w-[300px] flex-col gap-2.5">
        <Link href="/" className="bg-ink py-3.5 font-display text-md font-semibold text-bg">
          Bosh sahifaga
        </Link>
        <Link
          href="/mocks"
          className="border border-line-4 py-3.5 font-display text-md font-semibold text-ink"
        >
          Mocklarga o‘tish
        </Link>
      </div>
    </div>
  );
}
