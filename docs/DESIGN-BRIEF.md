# multilevel.wisar.uz — To'liq dizayn topshirig'i (Design Brief)

> Bu hujjat dizayn chizuvchi uchun: platformaning HAR BIR sahifasi, holati va oqimi tasvirlangan.
> Backend tayyor va ishlayapti — bu yerda yozilgan barcha ma'lumotlar real API'dan keladi.
> Dizayn tayyor bo'lgach, frontend Next.js + Tailwind'da aynan shu dizayn bo'yicha yoziladi.

## 1. Mahsulot haqida

**multilevel.wisar.uz** — O'zbekistondagi UzBMB multilevel (CEFR) imtihoniga MUTLAQO BEPUL tayyorlash platformasi.
Ikki fan: Ingliz tili (asosiy) va Ona tili. Asosiy qiymatlar: bepullik, AI baholash (Writing/Speaking uchun
o'zbekcha batafsil tahlil), tayyor mocklar (haqiqiy formatda, audio bilan), shaxsiy o'quv reja, Telegram bot.

**Auditoriya**: 16-30 yoshli o'zbekistonliklar, asosan telefonda ishlatishadi (mobile-first majburiy!),
internet tezligi o'rtacha. Til: interfeys O'zbek (lotin) + English (i18n almashtirgich).

**Brend hissi**: zamonaviy, ishonchli, motivatsiya beruvchi, "premium lekin bepul". Duolingo darajasida
do'stona, lekin imtihon platformasiga mos jiddiylik bilan. Wisar.uz oilasining sub-brendi.

## 2. Umumiy tizim

### 2.1 Navigatsiya (login qilingan foydalanuvchi)
Asosiy bo'limlar: **Bosh sahifa (Dashboard) · Kurslar · Mocklar · Lug'at · Reja · Profil**
- Desktop: yon panel (sidebar) yoki yuqori navbar — dizayner tanlaydi
- Mobil: pastki tab-bar (5 ta tab) tavsiya etiladi
- Har sahifada: streak 🔥 ko'rsatkichi va foydalanuvchi avatari ko'rinib turadi

### 2.2 Global holatlar (har sahifa uchun chizilishi kerak)
- **Loading**: skeleton yoki spinner
- **Bo'sh holat (empty)**: illyustratsiya + tushuntirish + harakat tugmasi
- **Xato**: qayta urinish tugmasi bilan
- **Offline/sekin internet**: audio yuklanish indikatorlari

### 2.3 Til va mavzu
- i18n: UZ (lotin) / EN almashtirgich (profil va navbarda)
- Light + Dark mode (ikkalasi ham chizilsin)

## 3. Sahifalar

### 3.1 Landing (public, SEO-muhim) — `/`
Maqsad: ro'yxatdan o'tkazish. Bloklar:
1. Hero: qisqa qiymat taklifi ("CEFR'ga BEPUL tayyorlaning — AI ustoz bilan"), CTA "Boshlash", ikkinchi CTA "Darajamni aniqlash"
2. Raqamlar paneli: X dars, Y mock, Z so'z, AI baholashlar soni (API: `/api/admin/stats` public variant yo'q — statik/SSR)
3. Qanday ishlaydi (3-4 qadam): Placement test → Shaxsiy reja → Darslar+Mocklar → AI tahlil
4. Imkoniyatlar kartalari: AI Writing/Speaking baholash · Haqiqiy formatdagi mocklar (audio bilan) · Spaced repetition lug'at · Telegram bot · O'quv reja
5. Mock natija namunasi (screenshot-karta: ball + AI feedback ko'rinishi)
6. FAQ + Footer (Wisar.uz havolasi)

### 3.2 Auth sahifalari — `/login`, `/register`, `/forgot`, `/reset`

Backend **5 xil kirish usulini** qo'llab-quvvatlaydi. Login sahifasida ular tanlanadigan bo'lsin
(tab yoki tugmalar): dizayner ierarxiyani belgilaydi, lekin **Telegram va telefon usuli birinchi
o'rinda** turishi kerak (auditoriya asosan Telegramda).

**A) Google** — bitta tugma (rasmiy Google branding). API: `POST /api/auth/google` {idToken}

**B) Telegram Login Widget** — rasmiy vidjet. API: `POST /api/auth/telegram`

**C) Email + tasdiqlash kodi (parolsiz)** — 2 qadamli:
   1. Email kiritish → `POST /api/auth/otp/email/request` → javob: `{sent, target: "a***z@gmail.com", expiresInSeconds: 300}`
   2. **Kod kiritish ekrani**: 6 xonali kod (6 ta alohida katak yoki bitta input), taymer
      (5:00 dan teskari sanoq), «Qayta yuborish» tugmasi (60 soniya bloklangan holda ko'rsatiladi),
      «Emailni o'zgartirish» havolasi.
      API: `POST /api/auth/otp/email/verify` {email, code, firstName?}
      Xato holatlari: «Kod noto'g'ri. Qolgan urinishlar: 4», «Kod muddati tugagan», «60 soniya kuting»
   - Hisob yo'q bo'lsa avtomatik yaratiladi → shu holatda **ism so'raladigan qadam** qo'shilsin.

**D) Telefon raqam + kod (kod Telegram botga keladi)** — 2 qadamli:
   1. Raqam kiritish (`+998 __ ___ __ __` maskasi) → `POST /api/auth/otp/phone/request`
   2. Ikki xil javob bo'lishi mumkin — **ikkalasi ham chizilishi kerak**:
      - `{sent: true, target: "+998901***67"}` → kod kiritish ekrani (C dagidek)
      - `{needsBotContact: true, botUrl}` → **maxsus ekran**: «Bu raqam botga ulanmagan» +
        3 qadamli qisqa yo'riqnoma (botni oching → «📱 Telefon raqamni yuborish» tugmasini bosing →
        shu yerga qayting) + katta «Telegram botni ochish» tugmasi (botUrl) + «Qayta urinish» tugmasi
   3. `POST /api/auth/otp/phone/verify` {phone, code, firstName?}

**E) Email + parol** — klassik. `POST /api/auth/login`, ro'yxat: `POST /api/auth/register`

**Parolni tiklash** — `/forgot` va `/reset`:
   1. `/forgot`: email kiritish → `POST /api/auth/password/forgot` → **doim bir xil javob**
      («Agar bu email ro'yxatdan o'tgan bo'lsa, kod yuborildi») — dizaynda ham xuddi shunday
      neytral xabar bo'lsin
   2. `/reset`: kod + yangi parol (+ takror) → `POST /api/auth/password/reset` → avtomatik kirish.
      Ogohlantirish ko'rsatilsin: «Barcha qurilmalardagi sessiyalar yakunlanadi»
   - Parol kuchi indikatori (min 8 belgi)

**Umumiy komponent — OTP kod kiritish** (C, D va reset uchun bir xil ishlatiladi):
6 katakli kod input (avtomatik keyingi katakka o'tish, paste qo'llab-quvvatlash), teskari taymer,
«Qayta yuborish» (60s cooldown), xato matni, yuklanish holati.

### 3.3 Onboarding (birinchi kirishdan keyin) — `/onboarding`
3-4 qadamli wizard:
1. Fan tanlash: Ingliz tili / Ona tili (kartalar)
2. Maqsad daraja: B1/B2/C1 (tavsif bilan) + imtihon sanasi (ixtiyoriy, date picker)
3. Kunlik vaqt: 30 daq / 1 soat / 2 soat / 3+ soat (slider yoki kartalar)
4. Taklif: "Darajangizni aniqlaymizmi?" → Placement test yoki "O'tkazib yuborish"
API: `PATCH /api/users/me` {targetLevel, examDate, dailyGoalMinutes}, keyin `POST /api/study-plan/generate`

### 3.4 Dashboard — `/dashboard`
API: `GET /api/progress/dashboard`, `GET /api/study-plan/active`
Bloklar:
1. Salomlashish + imtihongacha kunlar countdown (agar examDate bor): "Imtihongacha 142 kun"
2. Streak kartasi: 🔥 kunlar soni + haftalik mini-kalendar (qaysi kunlar faol)
3. Bugungi maqsad: minut progress ring (25/60 daq) + XP
4. **Bugungi reja** (asosiy blok): vazifalar ro'yxati (dars/mock/so'zlar) — har biri checkbox, davomiyligi, "Boshlash" tugmasi. API'dan: `todayTasks[]` {kind, titleUz, durationMinutes, status, lesson?, mockExam?}
5. Takrorlash kutayotgan so'zlar: "24 ta so'z kutmoqda" + "Takrorlash" CTA
6. Oxirgi mock natija: ball 0-75 + daraja badge (C1 oltin, B2 kumush, B1 bronza uslubida)
7. Faollik heatmap (oxirgi 3-6 oy, GitHub-style)

### 3.5 Kurslar ro'yxati — `/courses`
API: `GET /api/courses?subject=`
- Fan tab: Ingliz / Ona tili
- Kurs kartalari: icon (emoji), titleUz, daraja badge (A1..C1), darslar soni, progress bar (agar boshlangan)
- Tartib: darajaga qarab (A1 → C1), strategiya kursi alohida ajratilgan
Kurslar hozir bazada: A1 Ilk qadamlar 🐣, A2 Poydevor 🌱, B1 Grammatika 🧠, B1 Writing ✍️, B2 Yuqori 🚀, C1 Mahorat 👑, Imtihon strategiyasi 🎯, Speaking 🎤, Ona tili 📚

### 3.6 Kurs sahifasi — `/courses/[slug]`
API: `GET /api/courses/:slug` (modullar → darslar, har darsda progress)
- Kurs sarlavhasi + tavsif + umumiy progress (X/Y dars)
- Modullar accordion yoki vertikal yo'l (path) ko'rinishida — Duolingo-style yo'l afzal
- Har dars: titleUz, skill belgisi (🎧📖✍️🎤🧠), vaqt (15 daq), holat: tugallangan ✅ / boshlangan 🔵 / ochiq ⚪ / (qulflash YO'Q — hammasi ochiq)

### 3.7 Dars sahifasi (Lesson player) — `/lessons/[id]`
API: `GET /api/courses/lessons/:id`, tugatish: `POST /api/progress/lessons/:id/complete`
Eng muhim sahifalardan biri. Tuzilma:
1. Yuqori: kurs nomi ← orqaga, progress (blok 3/8), yopish tugmasi
2. **Kontent bloklari** (ketma-ket skroll yoki step-by-step — dizayner tanlaydi):
   - `theory`: titleUz + bodyUz (markdown: qalin, ro'yxatlar) — o'qish uchun qulay tipografiya
   - `example`: en/uz juftliklar kartasi (en katta, uz kichikroq ostida)
   - `table`: headers + rows — mobilda gorizontal skroll
   - `dialogue`: chat-ko'rinish (2 spiker, bubble'lar), en + uz
   - `tip`: ajralib turadigan karta (💡 belgisi bilan)
3. **Mashqlar** (kontentdan keyin): har mashq alohida karta/qadam:
   - MCQ_SINGLE/TRUE_FALSE: variantlar tugmalar; javobdan keyin: to'g'ri yashil / xato qizil + explanationUz + to'g'ri javob
   - MCQ_MULTI: checkbox variantlar + "Tekshirish"
   - GAP_FILL/SHORT_ANSWER: matn input (___ o'rnida)
   - MATCHING: ikki ustunni bog'lash (tap-tap mobilda)
   - ORDERING: drag-and-drop yoki tap-tartib
   - WRITING_TASK: textarea + so'z hisoblagich + "AI'ga yuborish" → natija paneli (3.12 ko'rinishida)
   - SPEAKING_TASK: tayyorgarlik timer → yozish tugmasi (katta mikrofon) → to'lqin animatsiya → qayta eshitish → "AI'ga yuborish"
   - API: `POST /api/exercises/:id/submit` {answer} → {isCorrect, ratio, correctAnswer, explanationUz}
4. Yakun: "Darsni tugatish" → natija modali (ball %, XP +50, streak yangilanishi) → keyingi dars CTA

### 3.8 Mocklar ro'yxati — `/mocks`
API: `GET /api/mocks?subject=&kind=`
- Fan tab + tur filtri: To'liq / Mini / Placement
- Mock kartasi: titleUz, bo'limlar belgilar (🎧35 · 📖35 · ✍️3 · 🎤3), umumiy vaqt, "Boshlash"
- Agar tugallanmagan urinish bor: "Davom ettirish" (sariq holat)
- Mening urinishlarim: `GET /api/mocks/attempts/my` — tarix ro'yxati (sana, ball, daraja badge, "Natijani ko'rish")

### 3.9 Mock boshlash — `/mocks/[slug]`
API: `GET /api/mocks/:slug`
- Imtihon tavsifi, bo'limlar jadvali (skill, savollar soni, vaqt)
- Qoidalar eslatmasi (audio bir marta, timer to'xtamaydi)
- "Imtihonni boshlash" → `POST /api/mocks/:slug/start`

### 3.10 Imtihon topshirish rejimi — `/mocks/attempts/[id]` (FULLSCREEN, chalg'ituvchisiz)
API: attempt obyekti (savollar javoblarsiz), autosave: `POST .../answers/:questionId`
Eng murakkab sahifa — har bo'lim uchun alohida layout:
**Umumiy**: yuqorida bo'lim nomi + TIMER (qolgan vaqt, oxirgi 5 daqiqada qizil), savol navigatsiya paneli
(1-35 raqamlar to'ri: javob berilgan=to'ldirilgan, joriy=aktiv, belgilangan=bayroqcha), "Bo'limni yakunlash"
- **Listening**: audio player (part uchun; play bir marta — pauza yo'q imtihon rejimida), savollar audio ostida
- **Reading**: split-view: chapda passageText (skroll), o'ngda savollar. Mobil: passage yuqorida yig'iladigan (collapsible)
- **Writing**: task prompt + textarea + so'z hisoblagich (min so'zga yetmaganda ogohlantirish rangi), autosave indikatori ("Saqlandi ✓")
- **Speaking**: task prompt → tayyorgarlik countdown (60s) → avtomatik yozish boshlanadi (120s countdown + to'lqin) → qayta eshitish → qayta yozish (1 imkon) → keyingi
- Yakuniy: "Imtihonni topshirish" tasdiqlash modali → `POST .../submit`

### 3.11 Baholanish kutish holati
Submit'dan keyin: L/R darhol tayyor, W/S AI navbatda (~1-2 daqiqa).
- Ekran: "Natijalar hisoblanmoqda" + qaysi bo'limlar tayyor (checkmark animatsiya) + polling
- Telegram ulangan bo'lsa: "Natija botga ham keladi" xabari

### 3.12 Natija sahifasi — `/mocks/attempts/[id]/result`
API: `GET /api/mocks/attempts/:id/result`
1. **Katta natija kartasi**: umumiy ball (48.8/75), daraja badge (B1), bo'limlar radar/bar chart (L/R/W/S ballari)
2. Bo'lim tablari:
   - L/R: savollar ro'yxati — sizning javob / to'g'ri javob / ✅❌, passagega havola
   - Writing (har task): sizning matn + AI tahlil paneli: mezonlar (4 ta, har biri ball + izoh), kuchli tomonlar,
     **xatolar jadvali** (original → corrected → nima uchun), yaxshilangan versiya (diff yoki alohida), umumiy feedback
   - Speaking (har part): audio player (o'z javobingiz) + transkript + xuddi shu AI tahlil paneli
3. Tavsiya bloki: "Keyingi qadam" (zaif skill bo'yicha kurs/dars havolasi)
4. Ulashish: natija kartasi rasmini yuklab olish / ulashish (ixtiyoriy, keyingi bosqich)

### 3.13 Lug'at — `/vocabulary`
API: topics, words, due, stats
1. Statistika paneli: jami / o'rganilmoqda / puxta / bugun kutmoqda
2. **Takrorlash sessiyasi** (asosiy CTA): flashcard UI —
   old tomoni: so'z + phonetic + audio tugma; teskarisi: tarjima + definition + misol (en+uz)
   4 baho tugmasi: Bilmadim (qizil) / Qiyin (sariq) / Yaxshi (yashil) / Oson (ko'k)
   API: `POST /api/vocabulary/cards/:id/review` {grade: 0/3/4/5}
   Sessiya yakuni: nechta ko'rildi, keyingi takrorlash qachon
3. Mavzular katalogi: daraja filtri + mavzu kartalari (so'z soni) → so'zlar jadvali → "O'rganishga qo'shish"

### 3.14 O'quv reja — `/plan`
API: `GET /api/study-plan/active`, `POST /api/study-plan/generate`, `POST /api/study-plan/tasks/:id/complete`
- Reja yo'q holati: tushuntirish + "Reja tuzish" wizard (maqsad daraja, sana, kunlik vaqt)
- Reja bor: bugungi vazifalar (dashboard'dagi kabi, kengroq) + haftalik ko'rinish + oy kalendari
  (kunlar: bajarilgan yashil nuqta / qoldirilgan qizil / kelgusi kulrang)
- Reja meta: boshlash → maqsad daraja yo'li, bosqichlar (A2→B1→B2→C1 progress yo'li)
- "Rejani qayta tuzish" tugmasi

### 3.15 AI amaliyot — `/practice`
API: `POST /api/ai/writing/practice`, `POST /api/ai/speaking/practice`, `GET /api/ai/evaluations/my`
- Ikki tab: Writing / Speaking
- Writing: mavzu tanlash (tayyor prompts ro'yxati) yoki o'z mavzusi → textarea → AI natija (3.12 uslubida)
- Speaking: mavzu → yozish oqimi (3.10 dagi kabi) → AI natija + transkript
- Tarix: oldingi baholashlar ro'yxati (sana, skill, ball) → batafsil ko'rish

### 3.16 Profil va sozlamalar — `/profile`
API: `GET /api/auth/me`, `PATCH /api/users/me`, `POST /api/telegram/link`
- Profil: avatar, ism, email, joriy daraja / maqsad daraja, imtihon sanasi, kunlik maqsad
- **Bog'langan hisoblar kartasi** (muhim blok — har biri ulangan/ulanmagan holatda chizilsin):
  | Element | Ulangan holat | Ulanmagan holat |
  |---|---|---|
  | Email | `a***z@gmail.com` ✅ tasdiqlangan | «Email biriktirish» → kod so'rash → 6 katakli kod modali |
  | Telefon | `+998 90 ***67` ✅ | «Telefon biriktirish» → agar bot bilmasa, botga yo'naltirish ekrani (3.2-D dagidek) |
  | Google | ulangan ✅ | «Google ulash» |
  | Telegram | @username ✅ | «Botni ulash» → deep link |
  | Parol | «Parolni almashtirish» | «Parol o'rnatish» (Google/Telegram orqali kirganlarda parol yo'q) |
  API: `POST /api/auth/attach/email/request|verify`, `POST /api/auth/attach/phone/request|verify`,
  `POST /api/auth/password/change`
- Xato holatlari: «Bu email boshqa hisobga biriktirilgan», «Bu raqam bot orqali boshqa hisobga bog'langan»
- Sozlamalar: interfeys tili (UZ/EN), tema (light/dark/auto)
- Statistika: umumiy XP, jami daqiqalar, tugallangan darslar, heatmap (katta)
- Chiqish tugmasi

### 3.17 Admin panel — `/admin` (faqat ADMIN rol)
API: `/api/admin/*`
Oddiy, funksional dizayn (foydalanuvchi-sahifalardek jilolangan bo'lishi shart emas):
- Statistika dashboard: foydalanuvchilar, urinishlar, AI baholashlar (failed alohida)
- Kontent: kurslar/mocklar jadvali + publish toggle + JSON import (fayl tashlash zonasi + natija/xato ko'rsatish)
- Foydalanuvchilar jadvali (qidiruv, sahifalash)
- Failed AI baholashlar ro'yxati + "Qayta urinish" tugmasi

## 4. Dizayn tizimi talablari

- **Mobile-first**: barcha sahifalar 360px dan boshlab; imtihon rejimi planshet/desktopda ham qulay
- **Ranglar**: dizayner taklif qiladi. Daraja ranglari izchil: A1/A2 (boshlang'ich), B1 (bronza/ko'k),
  B2 (kumush/binafsha), C1 (oltin) — badge tizimi platforma bo'ylab bir xil
- **Skill ikonlari izchil**: Listening 🎧, Reading 📖, Writing ✍️, Speaking 🎤, Grammar 🧠, Vocabulary 📚 (yoki chiziqli ikonlar)
- **Motivatsiya elementlari**: streak olovi, XP, progress ring/bar, daraja badge — gamifikatsiya bor,
  lekin bolalarcha emas (imtihon platformasi)
- **Tipografiya**: lotin o'zbekcha matn uchun qulay (o', g', apostroflar to'g'ri ko'rinishi); uzun darslik
  matni uchun o'qilishi oson shrift
- **Audio komponentlar**: 3 xil player kerak — (1) imtihon listening (cheklangan), (2) oddiy playback
  (natijada o'z ovozini eshitish), (3) yozish (recorder: prep timer + record timer + waveform)
- **Timer komponenti**: bo'lim timer (katta), tayyorgarlik countdown (doira)
- **Grafiklar**: bo'lim ballari (bar/radar), faollik heatmap, progress ring

## 5. Chizilishi kerak bo'lgan ekranlar ro'yxati (checklist)

Desktop + Mobil har biri uchun:
1. Landing
2. Login (5 usul tanlash) / Register (+ xato holatlari)
2a. OTP kod kiritish ekrani (6 katak + taymer + qayta yuborish) — email va telefon uchun
2b. «Raqam botga ulanmagan» yo'riqnoma ekrani (botga yo'naltirish)
2c. Parolni unutdim → kod → yangi parol (3 ekran)
3. Onboarding 4 qadam
4. Dashboard (to'liq holat + yangi foydalanuvchi bo'sh holati)
5. Kurslar ro'yxati
6. Kurs sahifasi (yo'l ko'rinishi)
7. Dars: kontent bloklari (5 tur) + mashqlar (8 tur, javobdan keyingi holatlar bilan)
8. Dars yakuni modali
9. Mocklar ro'yxati (+urinishlar tarixi)
10. Mock boshlash sahifasi
11. Imtihon rejimi: Listening / Reading / Writing / Speaking (4 alohida layout) + savol navigatsiyasi + submit modal
12. Baholanish kutish ekrani
13. Natija sahifasi (L/R javoblar + Writing AI tahlil + Speaking AI tahlil)
14. Lug'at: statistika + flashcard sessiyasi (old/orqa + 4 baho) + mavzular + so'zlar
15. O'quv reja: bo'sh + wizard + faol reja (kun/hafta/oy)
16. AI amaliyot: Writing + Speaking + tarix
17. Profil + sozlamalar + bog'langan hisoblar (email/telefon/Google/Telegram/parol)
18. Admin: dashboard + kontent + import + foydalanuvchilar
19. 404 / umumiy xato sahifasi
20. Email tasdiqlash/parol tiklash (kelajak uchun placeholder)

## 6. Texnik cheklovlar (frontend uchun)

- Next.js (App Router) + Tailwind CSS; SEO: landing, kurslar, mocklar sahifalari SSR/SSG
- API bilan JWT (Authorization: Bearer) — barcha endpointlar `/api/*` prefiksida, Swagger: `/docs`
- Fayl yuklash: audio `multipart/form-data` → `/api/files/audio` → {url}
- Speaking yozish: MediaRecorder API (webm/opus)
- i18n: next-intl yoki shunga o'xshash; barcha UI matnlar lug'at fayllarida
