import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import { themeScript } from '@/lib/theme';
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
    <html
      lang="uz"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <head>
        {/* Tema klassi birinchi bo'yoqdan oldin qo'yiladi — miltillash bo'lmaydi */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-desk">
        <Providers>
          {/*
            Dizayn 390px da chizilgan. Planshetgacha shu ramkani markazda ushlaymiz,
            lg dan boshlab esa to'liq kenglikka chiqamiz — desktopda yon panel bilan
            haqiqiy layout ishlaydi.
          */}
          <div className="mx-auto flex min-h-dvh max-w-phone flex-col bg-bg shadow-frame sm:border-x sm:border-line-3 lg:max-w-none lg:border-x-0 lg:shadow-none">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
