'use client';

import { useState } from 'react';

const FAQ = [
  {
    q: 'Haqiqatan ham bepulmi?',
    a: 'Ha. Barcha kurslar, mock imtihonlar va AI baholash — hammasi to‘liq bepul. To‘lov, obuna yoki yashirin cheklov yo‘q.',
  },
  {
    q: 'AI baholash qanchalik aniq?',
    a: 'AI rasmiy UzBMB mezonlari bo‘yicha baholaydi: vazifani bajarish, izchillik, so‘z boyligi va grammatika. Bu jonli imtihonchi o‘rnini bosmaydi, lekin xatolaringizni ko‘rsatadi va qaysi yo‘nalishda ishlash kerakligini aniq aytadi.',
  },
  {
    q: 'Mock imtihonlar haqiqiy imtihonga o‘xshaydimi?',
    a: 'Format bir xil: Listening 35 savol (audio bilan), Reading 35 savol, Writing 2 vazifa, Speaking 3 qism. Timer, bo‘lim tartibi va ball tizimi (0–75) ham imtihondagidek.',
  },
  {
    q: 'Ona tili (o‘zbek tili) uchun ham bormi?',
    a: 'Ha. Milliy sertifikat formatidagi kurs (fonetika, morfologiya, sintaksis, insho) va 45 test + insho ko‘rinishidagi mock imtihonlar mavjud.',
  },
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="px-5 pt-8">
      <p className="text-2xs font-semibold uppercase tracking-label text-ink-4">
        KO‘P SO‘RALADIGAN SAVOLLAR
      </p>
      <div className="mt-3">
        {FAQ.map((item, index) => (
          <div
            key={item.q}
            className={`border-t border-line ${index === FAQ.length - 1 ? 'border-b' : ''}`}
          >
            <button
              onClick={() => setOpen(open === index ? null : index)}
              className="flex w-full items-center justify-between py-4 text-left"
            >
              <span className="pr-4 text-ui font-medium">{item.q}</span>
              <span className="text-lg text-ink-4">{open === index ? '−' : '+'}</span>
            </button>
            {open === index && (
              <p className="pb-4 text-base leading-relaxed text-ink-3">{item.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
