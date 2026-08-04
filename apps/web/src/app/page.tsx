'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LANDING, useLang } from '@/lib/i18n';

// Statik ko'rsatkichlar — public stats endpointi yo'q, seed'dagi haqiqiy sonlar.
const STATS = [
  { value: '89', key: 'statLessons' },
  { value: '7', key: 'statMocks' },
  { value: '598', key: 'statExercises' },
  { value: '180', key: 'statWords' },
] as const;

export default function LandingPage() {
  const [lang, setLang] = useLang();
  const t = LANDING[lang];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const steps = [
    [t.step1, t.step1Body],
    [t.step2, t.step2Body],
    [t.step3, t.step3Body],
    [t.step4, t.step4Body],
  ];
  const features = [
    [t.feature1, t.feature1Body],
    [t.feature2, t.feature2Body],
    [t.feature3, t.feature3Body],
    [t.feature4, t.feature4Body],
  ];
  const faq = [
    [t.faq1, t.faq1a],
    [t.faq2, t.faq2a],
    [t.faq3, t.faq3a],
    [t.faq4, t.faq4a],
  ];

  return (
    <div className="flex flex-1 flex-col [&_section]:mx-auto [&_section]:w-full [&_section]:max-w-[1100px]">
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-5 pb-[18px] pt-2.5 lg:px-8 lg:pt-5">
        <Link href="/" className="flex items-baseline gap-1">
          <span className="font-display text-[17px] font-bold tracking-tight">multilevel</span>
          <span className="text-sm text-ink-4">.wisar.uz</span>
        </Link>
        <div className="inline-flex border border-line-3">
          {(['uz', 'en'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setLang(value)}
              className={`px-2 py-1 text-xs font-semibold ${
                lang === value ? 'bg-ink text-bg' : 'text-ink-3'
              }`}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Hero — desktopda ikki ustun */}
      <section className="!max-w-none bg-panel text-on-dark">
        <div className="mx-auto w-full max-w-[1100px] px-5 pb-7 pt-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <span className="inline-block border border-dark-line-2 px-2 py-1 text-2xs font-semibold tracking-wider text-on-dark-2">
              {t.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-7xl font-bold tracking-tighter lg:text-[56px] lg:leading-[1.04]">
              {t.heroTitle}
            </h1>
            <p className="mt-4 max-w-[300px] text-md leading-relaxed text-on-dark-3 lg:max-w-[440px] lg:text-lg">
              {t.heroBody}
            </p>
            <div className="lg:flex lg:gap-3">
              <Link
                href="/register"
                className="mt-6 block w-full bg-bg py-4 text-center font-display text-md font-semibold text-ink lg:w-auto lg:px-8"
              >
                {t.ctaPrimary}
              </Link>
              <Link
                href="/register?next=placement"
                className="mt-2.5 block w-full border border-dark-line-2 py-4 text-center font-display text-md font-semibold text-on-dark lg:mt-6 lg:w-auto lg:px-8"
              >
                {t.ctaSecondary}
              </Link>
            </div>
            {lang === 'en' && <p className="mt-4 text-xs text-on-dark-5">{t.langNote}</p>}
          </div>

          {/* Desktopda natija namunasi hero yonida */}
          <div className="mt-10 hidden border border-dark-line lg:mt-0 lg:block">
            <div className="border-b border-dark-line p-6">
              <p className="text-2xs font-semibold tracking-label text-on-dark-4">
                {t.sampleScore}
              </p>
              <div className="mt-2 flex items-end justify-between">
                <p className="font-display text-8xl font-bold tracking-tightest">
                  48.8<span className="text-2xl text-on-dark-4">/75</span>
                </p>
                <span className="border border-warn px-2 py-0.5 text-xs font-semibold text-warn">
                  B1
                </span>
              </div>
            </div>
            <div className="p-6">
              <p className="text-2xs font-semibold tracking-label text-on-dark-4">{t.sampleAi}</p>
              <p className="mt-2 text-base leading-relaxed text-on-dark-2">
                {t.sampleBody} <span className="text-error-light">{t.sampleMark}</span>{' '}
                {t.sampleTail}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Raqamlar */}
      <section className="grid grid-cols-2 border-b border-line lg:grid-cols-4 lg:border-b-0 lg:px-8">
        {STATS.map((stat, index) => (
          <div
            key={stat.key}
            className={`px-5 py-[18px] lg:py-8 ${
              index % 2 === 0 ? 'border-r border-line' : ''
            } ${index < 2 ? 'border-b border-line lg:border-b-0' : ''} lg:border-r lg:last:border-r-0`}
          >
            <p className="font-display text-[26px] font-bold tracking-tight lg:text-4xl">
              {stat.value}
            </p>
            <p className="mt-0.5 text-sm text-ink-4">{t[stat.key]}</p>
          </div>
        ))}
      </section>

      {/* Qanday ishlaydi */}
      <section className="px-5 pt-8 lg:px-8 lg:pt-16">
        <p className="text-2xs font-semibold uppercase tracking-label text-ink-4">{t.howLabel}</p>
        <div className="mt-3 lg:grid lg:grid-cols-2 lg:gap-x-12">
          {steps.map(([title, body], index) => (
            <div key={title} className="flex gap-3.5 border-t border-line py-3.5 lg:py-5">
              <span className="font-mono text-sm text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold leading-tight">{title}</h3>
                <p className="mt-1 text-base leading-relaxed text-ink-3">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Imkoniyatlar */}
      <section className="px-5 pt-8 lg:px-8 lg:pt-16">
        <p className="text-2xs font-semibold uppercase tracking-label text-ink-4">
          {t.featuresLabel}
        </p>
        <div className="mt-3 flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3">
          {features.map(([title, body]) => (
            <div key={title} className="border border-line bg-surface p-4">
              <h3 className="font-display text-md font-semibold">{title}</h3>
              <p className="mt-1.5 text-base leading-relaxed text-ink-3">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Natija namunasi — desktopda hero ichida ko'rsatiladi */}
      <section className="px-5 pt-8 lg:hidden">
        <p className="text-2xs font-semibold uppercase tracking-label text-ink-4">
          {t.sampleLabel}
        </p>
        <div className="mt-3 border border-line-3">
          <div className="bg-panel p-5 text-on-dark">
            <p className="text-2xs font-semibold tracking-label text-on-dark-4">{t.sampleScore}</p>
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
            <p className="text-2xs font-semibold tracking-label text-accent">{t.sampleAi}</p>
            <p className="mt-2 text-base leading-relaxed text-ink-2">
              {t.sampleBody} <span className="bg-error-mark">{t.sampleMark}</span> {t.sampleTail}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 pt-8 lg:px-8 lg:pt-16">
        <p className="text-2xs font-semibold uppercase tracking-label text-ink-4">{t.faqLabel}</p>
        <div className="mt-3 lg:max-w-[760px]">
          {faq.map(([question, answer], index) => (
            <div
              key={question}
              className={`border-t border-line ${index === faq.length - 1 ? 'border-b' : ''}`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="flex w-full items-center justify-between py-4 text-left"
              >
                <span className="pr-4 text-ui font-medium">{question}</span>
                <span className="text-lg text-ink-4">{openFaq === index ? '−' : '+'}</span>
              </button>
              {openFaq === index && (
                <p className="pb-4 text-base leading-relaxed text-ink-3">{answer}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 bg-panel px-5 pb-8 pt-7 text-on-dark lg:mt-16 lg:px-8 lg:py-12">
        <div className="mx-auto w-full max-w-[1100px]">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-[17px] font-bold tracking-tight">multilevel</span>
          <span className="text-sm text-on-dark-4">.wisar.uz</span>
        </div>
        <div className="mt-4 flex flex-col gap-2 text-base text-on-dark-4 lg:flex-row lg:gap-8">
          <Link href="/courses">{t.footerCourses}</Link>
          <Link href="/mocks">{t.footerMocks}</Link>
          <Link href="/login">{t.footerLogin}</Link>
          <a href="https://t.me/sf_multilevel_bot" target="_blank" rel="noreferrer">
            {t.footerBot}
          </a>
        </div>
        <p className="mt-6 text-xs text-on-dark-5">{t.footerCopy}</p>
        </div>
      </footer>
    </div>
  );
}
