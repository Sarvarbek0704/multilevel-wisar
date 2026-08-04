import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'multilevel.wisar.uz — CEFR imtihoniga bepul tayyorgarlik',
  description:
    'UzBMB multilevel (CEFR) imtihoniga bepul tayyorlaning: kurslar, haqiqiy formatdagi mock imtihonlar, AI Writing va Speaking baholash, so‘z yodlash va Telegram bot.',
  metadataBase: new URL('https://multilevel.wisar.uz'),
  openGraph: {
    title: 'multilevel.wisar.uz',
    description: 'CEFR imtihoniga bepul tayyorgarlik — AI ustoz bilan',
    locale: 'uz_UZ',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#14161A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className="bg-desk">
        <Providers>
          {/* Dizayn 390px kenglikda chizilgan; kattaroq ekranda markazda ushlab turamiz */}
          <div className="mx-auto flex min-h-dvh max-w-phone flex-col bg-bg sm:min-h-dvh sm:border-x sm:border-line-3">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
