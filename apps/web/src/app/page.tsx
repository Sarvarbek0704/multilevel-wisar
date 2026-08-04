import Link from 'next/link';
import { LandingFaq } from '@/components/landing-faq';

// Statik ko'rsatkichlar — public stats endpointi yo'q, seed'dagi haqiqiy sonlar.
const STATS = [
  { value: '89', label: 'dars' },
  { value: '7', label: 'mock imtihon' },
  { value: '598', label: 'interaktiv mashq' },
  { value: '180', label: "so'z bazasi" },
];

const STEPS = [
  {
    title: 'Darajangizni aniqlang',
    body: '20 savollik qisqa test — qaysi darajadan boshlashingizni platforma o‘zi belgilaydi.',
  },
  {
    title: 'Shaxsiy reja olasiz',
    body: 'Imtihon sanangiz va kunlik vaqtingizga qarab har kun uchun aniq vazifalar tuziladi.',
  },
  {
    title: 'Darslar va mocklar',
    body: 'A1 dan C1 gacha kurslar, haqiqiy formatdagi to‘liq mock imtihonlar — audio bilan.',
  },
  {
    title: 'AI tahlil qiladi',
    body: 'Writing va Speaking javoblaringiz rasmiy mezonlar bo‘yicha baholanadi — o‘zbekcha izoh bilan.',
  },
];

const FEATURES = [
  {
    title: 'AI Writing va Speaking baholash',
    body: 'Insho yozing yoki mikrofonga gapiring — 4 mezon bo‘yicha ball, xatolar tahlili va yaxshilangan variant.',
  },
  {
    title: 'Haqiqiy formatdagi mocklar',
    body: 'Listening 35 + Reading 35 + Writing + Speaking. Audio, timer va bo‘lim tartibi imtihondagidek.',
  },
  {
    title: 'Lug‘at — ilmiy takrorlash',
    body: 'Har so‘zni aynan unutishga yaqin paytda ko‘rsatadigan spaced repetition algoritmi.',
  },
  {
    title: 'Telegram bot',
    body: 'Kunlik so‘zlar, tezkor testlar, eslatmalar va Writing baholash — hammasi Telegramda.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pb-[18px] pt-2.5">
        <Link href="/" className="flex items-baseline gap-1">
          <span className="font-display text-[17px] font-bold tracking-tight">multilevel</span>
          <span className="text-sm text-ink-4">.wisar.uz</span>
        </Link>
        <div className="inline-flex border border-line-3">
          <span className="bg-ink px-2 py-1 text-xs font-semibold text-bg">UZ</span>
          <span className="px-2 py-1 text-xs font-semibold text-ink-3">EN</span>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-ink px-5 pb-7 pt-8 text-on-dark">
        <span className="inline-block border border-dark-line-2 px-2 py-1 text-2xs font-semibold tracking-wider text-on-dark-2">
          UZBMB MULTILEVEL · CEFR
        </span>
        <h1 className="mt-5 font-display text-7xl font-bold tracking-tighter">
          CEFR&rsquo;ga bepul tayyorlaning — AI ustoz bilan
        </h1>
        <p className="mt-4 max-w-[300px] text-md leading-relaxed text-on-dark-3">
          Kurslar, mock imtihonlar, AI baholash va shaxsiy o‘quv reja. To‘lov yo‘q, reklama yo‘q,
          cheklov yo‘q.
        </p>
        <Link
          href="/register"
          className="mt-6 block w-full bg-bg py-4 text-center font-display text-md font-semibold text-ink"
        >
          Bepul boshlash
        </Link>
        <Link
          href="/register?next=placement"
          className="mt-2.5 block w-full border border-dark-line-2 py-4 text-center font-display text-md font-semibold text-on-dark"
        >
          Darajamni aniqlash
        </Link>
      </section>

      {/* Raqamlar */}
      <section className="grid grid-cols-2 border-b border-line">
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={`px-5 py-[18px] ${index % 2 === 0 ? 'border-r border-line' : ''} ${
              index < 2 ? 'border-b border-line' : ''
            }`}
          >
            <p className="font-display text-[26px] font-bold tracking-tight">{stat.value}</p>
            <p className="mt-0.5 text-sm text-ink-4">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Qanday ishlaydi */}
      <section className="px-5 pt-8">
        <p className="text-2xs font-semibold uppercase tracking-label text-ink-4">
          QANDAY ISHLAYDI
        </p>
        <div className="mt-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex gap-3.5 border-t border-line py-3.5">
              <span className="font-mono text-sm text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold leading-tight">{step.title}</h3>
                <p className="mt-1 text-base leading-relaxed text-ink-3">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Imkoniyatlar */}
      <section className="px-5 pt-8">
        <p className="text-2xs font-semibold uppercase tracking-label text-ink-4">IMKONIYATLAR</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="border border-line bg-surface p-4">
              <h3 className="font-display text-md font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-base leading-relaxed text-ink-3">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Natija namunasi */}
      <section className="px-5 pt-8">
        <p className="text-2xs font-semibold uppercase tracking-label text-ink-4">
          NATIJA QANDAY KO‘RINADI
        </p>
        <div className="mt-3 border border-line-3">
          <div className="bg-ink p-5 text-on-dark">
            <p className="text-2xs font-semibold tracking-label text-on-dark-4">UMUMIY BALL</p>
            <div className="mt-1.5 flex items-end justify-between">
              <p className="font-display text-6xl font-bold tracking-tighter">
                48.8
                <span className="text-md text-on-dark-4">/75</span>
              </p>
              <span className="border border-warn px-2 py-0.5 text-xs font-semibold text-warn">
                B1
              </span>
            </div>
          </div>
          <div className="bg-surface p-4">
            <p className="text-2xs font-semibold tracking-label text-accent">
              WRITING · AI TAHLIL
            </p>
            <p className="mt-2 text-base leading-relaxed text-ink-2">
              Vazifa bajarilgan, lekin ikkinchi savolga javob to‘liq emas. Bog‘lovchilar
              yetarli, so‘z boyligi B1 darajasida.{' '}
              <span className="bg-error-mark">Grammatikada takrorlanuvchi xato:</span> 3-shaxs
              birlikda <b>-s</b> tushib qolgan.
            </p>
          </div>
        </div>
      </section>

      <LandingFaq />

      {/* Footer */}
      <footer className="mt-8 bg-ink px-5 pb-8 pt-7 text-on-dark">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-[17px] font-bold tracking-tight">multilevel</span>
          <span className="text-sm text-on-dark-4">.wisar.uz</span>
        </div>
        <div className="mt-4 flex flex-col gap-2 text-base text-on-dark-4">
          <Link href="/courses">Kurslar</Link>
          <Link href="/mocks">Mock imtihonlar</Link>
          <Link href="/login">Kirish</Link>
          <a href="https://t.me/sf_multilevel_bot" target="_blank" rel="noreferrer">
            Telegram bot
          </a>
        </div>
        <p className="mt-6 text-xs text-on-dark-5">© 2026 Wisar.uz oilasining bir qismi</p>
      </footer>
    </div>
  );
}
