'use client';

import { useCallback, useEffect, useState } from 'react';

export type Lang = 'uz' | 'en';

const STORAGE_KEY = 'ml.lang';

/**
 * Landing sahifasi ikki tilli — bu yerga birinchi kelgan mehmon uchun muhim.
 * Ilova ichidagi interfeys va butun o'quv kontenti ataylab o'zbekcha:
 * platformaning asosiy qiymati — CEFR materialini ONA TILIDA tushuntirish.
 */
export const LANDING: Record<Lang, Record<string, string>> = {
  uz: {
    eyebrow: 'UZBMB MULTILEVEL · CEFR',
    heroTitle: 'CEFR’ga bepul tayyorlaning — AI ustoz bilan',
    heroBody:
      'Kurslar, mock imtihonlar, AI baholash va shaxsiy o‘quv reja. To‘lov yo‘q, reklama yo‘q, cheklov yo‘q.',
    ctaPrimary: 'Bepul boshlash',
    ctaSecondary: 'Darajamni aniqlash',
    statLessons: 'dars',
    statMocks: 'mock imtihon',
    statExercises: 'interaktiv mashq',
    statWords: 'so‘z bazasi',
    howLabel: 'QANDAY ISHLAYDI',
    step1: 'Darajangizni aniqlang',
    step1Body:
      '20 savollik qisqa test — qaysi darajadan boshlashingizni platforma o‘zi belgilaydi.',
    step2: 'Shaxsiy reja olasiz',
    step2Body:
      'Imtihon sanangiz va kunlik vaqtingizga qarab har kun uchun aniq vazifalar tuziladi.',
    step3: 'Darslar va mocklar',
    step3Body: 'A1 dan C1 gacha kurslar, haqiqiy formatdagi to‘liq mock imtihonlar — audio bilan.',
    step4: 'AI tahlil qiladi',
    step4Body:
      'Writing va Speaking javoblaringiz rasmiy mezonlar bo‘yicha baholanadi — o‘zbekcha izoh bilan.',
    featuresLabel: 'IMKONIYATLAR',
    feature1: 'AI Writing va Speaking baholash',
    feature1Body:
      'Insho yozing yoki mikrofonga gapiring — 4 mezon bo‘yicha ball, xatolar tahlili va yaxshilangan variant.',
    feature2: 'Haqiqiy formatdagi mocklar',
    feature2Body:
      'Listening 35 + Reading 35 + Writing + Speaking. Audio, timer va bo‘lim tartibi imtihondagidek.',
    feature3: 'Lug‘at — ilmiy takrorlash',
    feature3Body: 'Har so‘zni aynan unutishga yaqin paytda ko‘rsatadigan spaced repetition algoritmi.',
    feature4: 'Telegram bot',
    feature4Body:
      'Kunlik so‘zlar, tezkor testlar, eslatmalar va Writing baholash — hammasi Telegramda.',
    sampleLabel: 'NATIJA QANDAY KO‘RINADI',
    sampleScore: 'UMUMIY BALL',
    sampleAi: 'WRITING · AI TAHLIL',
    sampleBody:
      'Vazifa bajarilgan, lekin ikkinchi savolga javob to‘liq emas. Bog‘lovchilar yetarli, so‘z boyligi B1 darajasida.',
    sampleMark: 'Grammatikada takrorlanuvchi xato:',
    sampleTail: '3-shaxs birlikda -s tushib qolgan.',
    faqLabel: 'KO‘P SO‘RALADIGAN SAVOLLAR',
    faq1: 'Haqiqatan ham bepulmi?',
    faq1a:
      'Ha. Barcha kurslar, mock imtihonlar va AI baholash — hammasi to‘liq bepul. To‘lov, obuna yoki yashirin cheklov yo‘q.',
    faq2: 'AI baholash qanchalik aniq?',
    faq2a:
      'AI rasmiy UzBMB mezonlari bo‘yicha baholaydi: vazifani bajarish, izchillik, so‘z boyligi va grammatika. Bu jonli imtihonchi o‘rnini bosmaydi, lekin xatolaringizni ko‘rsatadi va qaysi yo‘nalishda ishlash kerakligini aniq aytadi.',
    faq3: 'Mock imtihonlar haqiqiy imtihonga o‘xshaydimi?',
    faq3a:
      'Format bir xil: Listening 35 savol (audio bilan), Reading 35 savol, Writing 2 vazifa, Speaking 3 qism. Timer, bo‘lim tartibi va ball tizimi (0–75) ham imtihondagidek.',
    faq4: 'Ona tili uchun ham bormi?',
    faq4a:
      'Ha. Milliy sertifikat formatidagi kurs (fonetika, morfologiya, sintaksis, insho) va 45 test + insho ko‘rinishidagi mock imtihonlar mavjud.',
    footerCourses: 'Kurslar',
    footerMocks: 'Mock imtihonlar',
    footerLogin: 'Kirish',
    footerBot: 'Telegram bot',
    footerCopy: '© 2026 Wisar.uz oilasining bir qismi',
    langNote: 'Interfeys va darslar o‘zbek tilida',
  },
  en: {
    eyebrow: 'UZBMB MULTILEVEL · CEFR',
    heroTitle: 'Prepare for CEFR for free — with an AI tutor',
    heroBody:
      'Courses, mock exams, AI grading and a personal study plan. No payment, no ads, no limits.',
    ctaPrimary: 'Start for free',
    ctaSecondary: 'Find my level',
    statLessons: 'lessons',
    statMocks: 'mock exams',
    statExercises: 'interactive exercises',
    statWords: 'vocabulary words',
    howLabel: 'HOW IT WORKS',
    step1: 'Find your level',
    step1Body: 'A short 20-question test decides which level you should start from.',
    step2: 'Get a personal plan',
    step2Body:
      'Concrete daily tasks are generated from your exam date and how much time you can give.',
    step3: 'Lessons and mocks',
    step3Body: 'Courses from A1 to C1 and full mock exams in the real format — with audio.',
    step4: 'AI analyses your work',
    step4Body:
      'Writing and Speaking answers are graded against the official criteria, explained in Uzbek.',
    featuresLabel: 'WHAT YOU GET',
    feature1: 'AI Writing and Speaking grading',
    feature1Body:
      'Write an essay or speak into the microphone — a score across 4 criteria, a mistake breakdown and an improved version.',
    feature2: 'Mocks in the real format',
    feature2Body:
      'Listening 35 + Reading 35 + Writing + Speaking. Audio, timers and section order match the real exam.',
    feature3: 'Vocabulary with spaced repetition',
    feature3Body: 'Every word comes back exactly when you are about to forget it.',
    feature4: 'Telegram bot',
    feature4Body:
      'Daily words, quick quizzes, reminders and Writing grading — all inside Telegram.',
    sampleLabel: 'WHAT A RESULT LOOKS LIKE',
    sampleScore: 'OVERALL SCORE',
    sampleAi: 'WRITING · AI ANALYSIS',
    sampleBody:
      'The task is addressed, but the second question is answered only partly. Linking is adequate, vocabulary sits at B1.',
    sampleMark: 'Recurring grammar mistake:',
    sampleTail: 'missing -s in the third person singular.',
    faqLabel: 'FREQUENTLY ASKED',
    faq1: 'Is it really free?',
    faq1a:
      'Yes. Every course, mock exam and AI evaluation is completely free. No payment, no subscription, no hidden limits.',
    faq2: 'How accurate is the AI grading?',
    faq2a:
      'The AI grades against the official UzBMB criteria: task fulfilment, coherence, lexical resource and grammar. It does not replace a human examiner, but it shows your mistakes and tells you exactly what to work on.',
    faq3: 'Do the mocks match the real exam?',
    faq3a:
      'The format is identical: Listening 35 questions (with audio), Reading 35 questions, Writing 2 tasks, Speaking 3 parts. Timers, section order and the 0–75 scoring also match.',
    faq4: 'Is Uzbek language (ona tili) covered too?',
    faq4a:
      'Yes. There is a national-certificate course (phonetics, morphology, syntax, essay) and mock exams in the 45-question + essay format.',
    footerCourses: 'Courses',
    footerMocks: 'Mock exams',
    footerLogin: 'Sign in',
    footerBot: 'Telegram bot',
    footerCopy: '© 2026 Part of the Wisar.uz family',
    langNote: 'The app interface and lessons are in Uzbek',
  },
};

export function useLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLangState] = useState<Lang>('uz');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === 'en' || stored === 'uz') setLangState(stored);
  }, []);

  const setLang = useCallback((next: Lang) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
    document.documentElement.lang = next;
  }, []);

  return [lang, setLang];
}
