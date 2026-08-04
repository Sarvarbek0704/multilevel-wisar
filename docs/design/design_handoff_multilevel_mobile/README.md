# Handoff: multilevel.wisar.uz — mobil ilova dizayni (1-bosqich)

## Overview

`multilevel.wisar.uz` — UzBMB multilevel (CEFR) imtihoniga bepul tayyorlash platformasi.
Bu paket platformaning **mobil (360–390px) interfeysi** dizaynini o'z ichiga oladi: marketing sahifasidan
imtihon topshirish rejimigacha, 20 dan ortiq ekran va holat.

Qamrov (chizilgan): Landing · Register/Login (xato holatlari bilan) · Onboarding (4 qadam) ·
Dashboard (to'liq + bo'sh holat) · Kurslar · Kurs sahifasi (yo'l ko'rinishi) · Dars pleyeri
(5 kontent turi + 4 mashq turi + yakun modali) · Mocklar ro'yxati · Mock boshlash ·
Imtihon rejimi (Listening / Reading / Writing / Speaking) · Baholanish kutish · Natija sahifasi
(L/R + Writing AI + Speaking AI) · Lug'at + flashcard sessiyasi · O'quv reja · Profil + Telegram · 404.

Chizilmagan (keyingi bosqich): AI amaliyot (`/practice`), Admin panel (`/admin`), dark mode,
desktop layoutlar, email tasdiqlash / parol tiklash.

## About the Design Files

Bu paketdagi fayllar — **HTML'da yaratilgan dizayn referenslari**. Bu ishlab chiqarishga
tayyor kod emas va uni ko'chirib qo'yish maqsad qilinmagan. Vazifa — shu HTML dizaynlarni
loyihaning haqiqiy muhitida (brief bo'yicha **Next.js App Router + Tailwind CSS**) o'sha
muhitning o'z konventsiyalari, komponent kutubxonasi va papka tuzilishi bilan **qaytadan
qurish**. Layout, o'lchamlar, ranglar, tipografiya va o'zaro ta'sirlar referens sifatida
aniq ko'chirilishi kerak; kod tuzilishi esa loyihaning odatiga bo'ysunadi.

Dizayn bitta interaktiv fayl sifatida yozilgan: `Multilevel Mobile.dc.html`. Ichida oddiy
ekran "router" (state) bor — barcha ekranlar bir faylda, tugmalar orqali yuriladi.
Fayl brauzerda to'g'ridan-to'g'ri ochiladi.

## Fidelity

**High-fidelity (hifi).** Yakuniy ranglar, tipografiya, oraliqlar va interaktivlik mavjud.
Interfeysni piksel darajasida qaytarish kutiladi. Ba'zi elementlar ataylab **placeholder**:

- Bo'sh holat illyustratsiyalari — chizilmagan, `repeating-linear-gradient` chiziqli
  to'rtburchak + monospace izoh (`BO'SH HOLAT ILLYUSTRATSIYASI`). Haqiqiy illyustratsiya
  keyin qo'yiladi.
- Audio pleyerlar va mikrofon yozish — vizual holatlar to'liq, lekin haqiqiy audio yo'q
  (`MediaRecorder`, `<audio>` frontendda ulanadi).
- Waveform — `Math.sin` bilan generatsiya qilingan dekorativ ustunlar; haqiqiy amplituda
  ma'lumotidan foydalanish kerak.

## Design Tokens

### Ranglar

| Rol | Hex | Qo'llanishi |
|---|---|---|
| `bg` | `#FBFAF7` | Ilova foni (issiq oq) |
| `surface` | `#FFFFFF` | Kartalar, inputlar |
| `surface-alt` | `#F1EFEA` | Jadval sarlavhasi, sticky passage bar |
| `desk` | `#EDEAE4` | Telefon ramkasidan tashqari fon; progress trek |
| `ink` | `#14161A` | Asosiy matn, asosiy tugma foni, hero/footer foni |
| `ink-2` | `#22262C` | Uzun matn tanasi (dars kontenti) |
| `ink-3` | `#4B5058` | Ikkilamchi matn |
| `ink-4` | `#82878F` | Uchlamchi matn, label |
| `ink-5` | `#9A9791` | Eng past kontrast (hint, disabled matn) |
| `line` | `#E4E1DA` | Chegaralar |
| `line-2` | `#EDEAE4` | Ichki ajratgichlar (jadval qatorlari) |
| `line-3` | `#D5D1C8` | Kuchli chegara (muhim kartalar, telefon ramkasi) |
| `line-4` | `#C9C6C0` | Input chegarasi, ikkilamchi tugma chegarasi |
| `accent` | `#1B3C73` | Yagona urg'u: progress, aktiv holat, havolalar |
| `accent-dark` | `#12294F` | Accent ustidagi matn, hover |
| `accent-mid` | `#3E567F` | Accent fonda ikkilamchi matn |
| `accent-soft` | `#EEF1F7` | Accent karta foni |
| `accent-border` | `#C7D2E3` | Accent karta chegarasi |
| `accent-50` | `#6C87B0` | Heatmap o'rta qiymat |
| `success` | `#1E6B4F` | To'g'ri javob, tugallandi |
| `success-bg` | `#F1F7F3` | To'g'ri javob foni |
| `success-border` | `#A8C4B6` | |
| `success-dark` | `#155540` | success fonda matn |
| `error` | `#A32B2B` | Xato javob, validatsiya |
| `error-bg` | `#FCF1F1` / `#FCE9E9` | Xato javob foni / matn ichida belgilash |
| `error-border` | `#E8C9C9` | Xato chegarasi, kalendar "qoldirilgan" |
| `error-light` | `#F08A8A` | Qora fonda qizil timer |
| `warn` | `#8A5A2B` | Tugallanmagan urinish, "Qiyin" bahosi, qoidalar |
| `warn-bg` | `#FDF7EF` | |
| `warn-text` | `#6B5334` / `#3C3629` | warn fonda matn |
| `gold` | `#9A7A20` / matn `#7A5F14` / qora fonda `#E4C86A` | C1 va daraja badge'lari |
| `purple` | `#6B5B8A` / matn `#5B4C78` | B2 badge |
| `telegram` | `#229ED9` | Telegram tugmalari (brend rangi) |
| `ink-on-dark` | `#F6F4F0` | Qora fonda asosiy matn |
| `ink-on-dark-2` | `#C9C6C0` / `#B9B6B0` / `#9A9791` / `#6A6862` | Qora fonda pasayuvchi kontrast |
| `dark-line` | `#2C3038` / `#4B5058` | Qora fonda chegara va progress trek |

**Daraja badge tizimi** (platforma bo'ylab bir xil): A1/A2 → neytral (`#C9C6C0` chegara,
`#4B5058` matn) · B1 → bronza (`#8A5A2B`) · B2 → binafsha (`#6B5B8A`) · C1 → oltin (`#9A7A20`).
Badge: `padding: 2-5px 7-12px`, `font-size: 11-14px`, `font-weight: 600`, `letter-spacing: 0.06em`,
`border: 1px solid`, **radius 0**, fon shaffof (yoki qora kartada shaffof).

### Tipografiya

| Rol | Shrift | O'lcham / og'irlik |
|---|---|---|
| Sarlavhalar, raqamlar, tugma matni | **Archivo** 600/700 | `letter-spacing: -0.02em … -0.025em`, `line-height: 1.1–1.2` |
| Matn, UI, inputlar | **IBM Plex Sans** 400/500/600 | `line-height: 1.45–1.7` |
| Raqamli/texnik (timer, ball, savol raqami, fonetika, sana) | **IBM Plex Mono** 400/500 | |

Google Fonts: `Archivo:wght@500;600;700`, `IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400`,
`IBM+Plex+Mono:wght@400;500`.

O'zbek lotin harflari (`o'`, `g'`) uchun to'g'ri apostrof — IBM Plex Sans'da to'g'ri chiqadi.
Matnda `’` (U+2019) emas, ASCII `'` ishlatilgan; frontendda `’` ga o'tish tavsiya etiladi.

Tipografiya shkalasi (px): 10 (label, `letter-spacing: 0.12–0.14em`, uppercase) · 11 · 12 · 13 ·
14 (UI standarti) · 15 (tugma, input, dialog) · 16 (dars matni) · 17–19 (kichik sarlavha) ·
22–27 (ekran sarlavhasi) · 30–42 (ball, hero).

Uzun o'quv matni: `font-size: 16px`, `line-height: 1.65`, `color: #22262C`, `text-wrap: pretty`.

### Oraliqlar va shakl

- Ekran gorizontal padding: **20px**. Karta ichi padding: **14–16px**. Katta karta: **16–20px**.
- Vertikal blok oralig'i: bo'limlar orasi **26–32px**, karta ro'yxatida `gap: 8–10px`.
- Bo'lim label'i va kontent orasi: **12px**.
- **Border radius: 0 (hamma joyda).** Yagona istisno — yozish indikatoridagi kichik doira
  (`border-radius: 50%`) va progress ring'lar (SVG).
- Chegaralar: `1px solid`; urg'u kartalarda `border-left: 3px solid`.
- Tanlangan holat: `border: 1px solid #14161A` + `box-shadow: inset 0 0 0 1px #14161A`
  (ikki pikselli chegara effekti, layout siljimasin).
- Soya: faqat telefon ramkasi (`0 26px 70px rgba(20,22,26,0.16)`). Interfeys ichida soya yo'q.
- Modal fon: `rgba(20,22,26,0.55)`.

### Animatsiyalar

```css
@keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
@keyframes pop    { from { opacity:0; transform:scale(0.96) }    to { opacity:1; transform:none } }
```

- AI natija paneli: `pop 0.25s ease-out`
- Pastdan chiqadigan modal (dars yakuni): `fadeUp 0.25s ease-out`
- Markazdagi modal (imtihon submit): `pop 0.2s ease-out`

Boshqa animatsiya yo'q — interfeys ataylab tinch.

### Ikonlar

Emoji **ishlatilmaydi**. Tab-bar'da 5 ta oddiy chiziqli SVG (`stroke-width: 1.5`, `20×20`,
`fill: none`, `stroke: currentColor`): uy, kitob/papka, hujjat, ikki ustun, kalendar.
Lucide (`Home`, `BookOpen`, `FileText`, `Layers`, `CalendarDays`) bilan almashtirish tavsiya etiladi.
Telegram ikoni — bitta path'li samolyot.

Belgilar matn sifatida: `✓` `✗` `←` `→` `✕` `+` `−` `▶` `❙❙`. Frontendda ikon komponentlariga o'tkazish mumkin.

## Layout asoslari

Butun ilova **390px kenglikda** chizilgan, minimal qo'llab-quvvatlanadigan kenglik **360px**.

Umumiy karkas (barcha ekranlar):

```
[status bar 40px]                     (faqat prototipda — real ilovada OS beradi)
[skrollanadigan kontent  flex:1]
[tab-bar  ~64px]                      (ba'zi ekranlarda yashiriladi)
```

Tab-bar **yashiriladi**: Landing, Register/Login, Onboarding, Dars pleyeri, Imtihon rejimi,
Baholanish kutish, Flashcard sessiyasi, 404.

Tab-bar: `display: grid; grid-template-columns: repeat(5,1fr)`, `padding: 8px 0 12px`,
`border-top: 1px solid #E4E1DA`. Har tab: ikon 20px + label 10px/500, `gap: 5px`.
Aktiv `#14161A`, nofaol `#9A9791`. Tablar: **Bosh · Kurslar · Mocklar · Lug'at · Reja**.
(Profil tab-bar'da emas — Dashboard'dagi avatar orqali kiriladi.)

Barcha bosiladigan elementlar ≥ 44px balandlikda (tugmalar `padding: 13–16px`).

---

## Screens

### 1. Landing — `/`

**Maqsad:** ro'yxatdan o'tkazish. Bloklar tartibi:

1. **Top bar** — `padding: 10px 20px 18px`. Chapda wordmark: `multilevel` (Archivo 700, 17px,
   `-0.02em`) + `.wisar.uz` (12px, `#82878F`, baseline align). O'ngda UZ/EN segment:
   `border: 1px solid #D5D1C8`, aktiv `#14161A` fon + `#FBFAF7` matn, 11px/600, `padding: 4px 8px`.
2. **Hero** — fon `#14161A`, matn `#F6F4F0`, `padding: 32px 20px 28px`.
   - Eyebrow: `UZBMB MULTILEVEL · CEFR`, 10px, `letter-spacing: 0.14em`, 600, `#C9C6C0`,
     `border: 1px solid #4B5058`, `padding: 4px 8px`, pastdan 20px.
   - H1: Archivo 700, **34px**, `line-height: 1.08`, `-0.025em` — "CEFR'ga bepul tayyorlaning — AI ustoz bilan"
   - Paragraf: 15px/1.55, `#B9B6B0`, `max-width: 300px`.
   - CTA 1: to'liq kenglik, `padding: 16px`, fon `#FBFAF7`, matn `#14161A`, Archivo 600 15px — "Bepul boshlash" → Register
   - CTA 2: shaffof, `border: 1px solid #4B5058`, matn `#F6F4F0` — "Darajamni aniqlash" → Register
3. **Raqamlar** — 2×2 grid, ichki `1px solid #E4E1DA` chegaralar, har katak `padding: 18px 20px`.
   Raqam: Archivo 700 26px. Label: 12px `#82878F`. Qiymatlar: 412 dars · 38 mock imtihon ·
   6 200 so'z bazasi · 94 517 AI baholash. (SSR/statik — public stats endpoint yo'q.)
4. **Qanday ishlaydi** — label `QANDAY ISHLAYDI`. 4 qator, har biri `border-top: 1px solid #E4E1DA`,
   `padding: 14px 0`, `gap: 14px`. Chapda monospace tartib raqami (`01`…`04`, 12px, `#1B3C73`).
   Sarlavha Archivo 600 16px, tavsif 13px/1.5 `#4B5058`.
   Qadamlar: Placement test (25 daqiqa) → Shaxsiy reja → Darslar va mocklar → AI tahlil.
5. **Imkoniyatlar** — 4 karta, `gap: 10px`, `border: 1px solid #E4E1DA`, fon `#FFFFFF`,
   `padding: 16px`. Sarlavha Archivo 600 15px, tavsif 13px/1.5.
   AI Writing va Speaking baholash · Haqiqiy formatdagi mocklar · Lug'at (spaced repetition) · Telegram bot.
6. **Natija namunasi** — `border: 1px solid #D5D1C8`. Yuqori qismi qora (`#14161A`): "UMUMIY BALL"
   + `48.8/75` (Archivo 700 30px, `/75` 15px `#9A9791`) + B1 badge oltin. Pastda oq blok:
   "Writing · AI tahlil" + namuna feedback, ichida `#FCE9E9` fonda belgilangan qism.
7. **FAQ** — akkordeon, 4 savol. Har qator `border-top: 1px solid #E4E1DA` (oxirgisida
   `border-bottom` ham). Tugma: to'liq kenglik, `padding: 16px 0`, 14px/500, o'ngda `+` / `−`
   (16px, `#82878F`). Ochilgan javob: 13px/1.6 `#4B5058`, `padding-bottom: 16px`.
   Bir vaqtda faqat bitta ochiq.
8. **Footer** — fon `#14161A`, `padding: 28px 20px 32px`, `margin-top: 32px`. Wordmark, 4 havola
   (13px, `#9A9791`, `gap: 8px`), copyright 11px `#6A6862`: "© 2026 Wisar.uz oilasining bir qismi".

### 2. Register / Login — `/register`, `/login`

Bitta layout, `authMode` bilan almashadi. `padding: 20px 20px 32px`, `min-height: 100%`,
flex column (pastdagi swap qatori `flex: 1` bilan pastga siqiladi).

- Wordmark (pastdan 36px).
- Sarlavha Archivo 700 27px: "Bepul hisob yarating" / "Xush kelibsiz". Tagida 14px/1.55 `#4B5058`.
- **Telegram tugmasi** (asosiy): fon `#229ED9`, matn oq, 15px/600, `padding: 15px`, ikon + matn
  `gap: 10px` — "Telegram bilan davom etish". Real implementatsiyada rasmiy Telegram Login Widget.
- **Google tugmasi**: oq fon, `border: 1px solid #C9C6C0`.
- Ajratgich: chiziq + `YOKI EMAIL BILAN` (11px, `letter-spacing: 0.08em`, `#9A9791`), `margin: 22px 0`.
- Maydonlar (`gap: 10px`): label 12px/500 `#4B5058` (pastdan 6px), input `padding: 14px 16px`,
  15px, `border: 1px solid #C9C6C0`, `:focus` → `border-color: #1B3C73`.
  Register'da qo'shimcha "Ismingiz" maydoni. Login'da parol label yonida "Unutdingizmi?" havolasi (12px).
- Submit: qora, Archivo 600 15px, `padding: 16px`, `margin-top: 18px`.
- Pastda swap: "Hisobingiz bormi? **Kirish**" (13px).

**Validatsiya qoidalari** (prototipda ishlaydi):

| Holat | Trigger | Ko'rinish |
|---|---|---|
| Email noto'g'ri/bo'sh | `@` yo'q | Input chegarasi `#A32B2B`, ostida 12px xato matni: "Email manzilini to'g'ri kiriting." |
| Email band | Register + `dilnoza@mail.uz` | "Bu email allaqachon band. Kirishni sinab ko'ring." |
| Parol qisqa | Register + `< 8` belgi | "Parol kamida 8 belgidan iborat bo'lishi kerak." |
| Noto'g'ri parol | Login + `≠ parol1234` | "Email yoki parol xato." (parol maydoni qizil) |

Xato input'ga yozilganda darhol tozalanadi. Muvaffaqiyat: Register → Onboarding, Login → Dashboard.

### 3. Onboarding — `/onboarding`

4 qadamli wizard, flex column: yuqorida orqaga tugmasi + 4 ta progress segment
(`flex: 1; height: 3px`, o'tilgan `#1B3C73`, qolgani `#E4E1DA`), o'rtada kontent `padding: 28px 20px 20px`,
pastda CTA `padding: 0 20px 24px`.

Har qadamda: `1 / 4` label (10px, `0.14em`, `#1B3C73`), sarlavha Archivo 700 25px.

1. **Fan** — 2 karta: Ingliz tili / Ona tili. Karta `padding: 18px`, sarlavha Archivo 600 17px,
   tavsif 13px `#4B5058`. Tanlangan → ink chegara + inset shadow.
2. **Maqsad daraja** — 3 qator (B1/B2/C1): chapda Archivo 700 16px daraja (`width: 26px`),
   o'ngda tavsif 13px/1.45. Pastida "Imtihon sanasi (ixtiyoriy)" — monospace input, placeholder
   `24.12.2026` (real ilovada native date picker).
3. **Kunlik vaqt** — 4 qator: 30 daqiqa / 1 soat (*tavsiya etiladi*) / 2 soat / 3 soat va ko'proq.
   Chapda Archivo 600 16px, o'ngda izoh 12px `#82878F`.
4. **Xulosa** — sarlavha "Darajangizni aniqlaymizmi?", tushuntirish, so'ng tanlovlar jadvali
   (Fan / Maqsad daraja / Imtihon sanasi / Kunlik vaqt — har qator `padding: 14px 16px`,
   chapda `#4B5058`, o'ngda 500). CTA: "Placement testni boshlash" (qora) + "O'tkazib yuborish"
   (matn tugma, `#82878F`).

API: `PATCH /api/users/me` `{targetLevel, examDate, dailyGoalMinutes}` → `POST /api/study-plan/generate`.

### 4. Dashboard — `/dashboard`

`padding: 8px 0 24px`. API: `GET /api/progress/dashboard`, `GET /api/study-plan/active`.

1. **Salomlashish** — chapda "Salom, Dilnoza" (Archivo 700 24px) + ostida
   "Imtihongacha **142 kun** · maqsad B2" (13px, kun soni `#1B3C73` 600).
   O'ngda 40×40 avatar: qora kvadrat, initsiallar Archivo 600 14px → Profil.
2. **Streak** — `border: 1px solid #E4E1DA`, ikki ustun. Chap ustun `width: 118px`,
   `border-right`: label `KETMA-KET` + "12 **kun**" (Archivo 700 28px). O'ng ustun: 7 kunlik
   mini-kalendar — harf 10px `#9A9791` + 9×9 kvadrat (faol `#1B3C73`, bugun `#C7D2E3`, bo'sh `#E4E1DA`).
3. **Bugungi maqsad** — 58×58 SVG progress ring (`r=25`, `stroke-width: 6`, trek `#EDEAE4`,
   progress `#1B3C73`, `rotate(-90deg)`, `stroke-dasharray: 157`) + "25 / 60 daqiqa" (Archivo 600 19px)
   + "Bugun +80 XP · jami 1 240 XP".
4. **Bugungi reja** (asosiy blok) — label + "1/4 bajarildi". 4 qator, har biri
   `padding: 14px 16px`, `gap: 12px`: 18×18 checkbox (bajarilgan → `#1E6B4F` fon + oq `✓`,
   karta `opacity: 0.55` + `line-through`), o'rtada sarlavha 14px/500 + meta 12px `#82878F`
   (`kurs · davomiylik`), o'ngda "Boshlash" tugmasi (birinchi bajarilmagan vazifada qora,
   qolganlarida `border: 1px solid #C9C6C0`).
   `todayTasks[]`: `{kind, titleUz, durationMinutes, status, lesson?, mockExam?}`.
5. **Lug'at CTA** — accent karta: `border: 1px solid #1B3C73`, fon `#EEF1F7`. "24 ta so'z
   takrorlashni kutmoqda" (14px/600 `#12294F`) + "Bugun o'tkazib yuborsangiz, ertaga 40 ta bo'ladi"
   + "Takrorlash" tugmasi (`#1B3C73` fon, oq matn).
6. **Oxirgi mock** — bosiladigan karta `border: 1px solid #D5D1C8`: `48.8/75` (Archivo 700 28px)
   + "2-avgust · To'liq mock #4", o'ngda B1 badge + `→` → Natija sahifasi.
7. **Faollik heatmap** — 18×7 grid (`grid-template-columns: repeat(18,1fr)`, `gap: 3px`,
   `aspect-ratio: 1`). 4 pog'ona: `#EDEAE4` → `#C7D2E3` → `#6C87B0` → `#1B3C73`.
   Oxirgi kunlar (kelgusi) bo'sh rangda.

**Bo'sh holat** (yangi foydalanuvchi, `newUser` prop): streak/maqsad/reja bloklari o'rniga bitta
karta — chiziqli placeholder illyustratsiya (88px), "Reja hali tuzilmagan", tushuntirish,
"Darajamni aniqlash" (qora) + "O'tkazib yuborish" (matn tugma).

**Gamifikatsiyani yashirish** (`hideGamification` prop): streak va kunlik maqsad bloklari olib
tashlanadi, qolgani o'z joyida. Gamifikatsiya darajasi ataylab past: olov emoji yo'q, XP kichik
matnda, konfetti yo'q.

### 5. Kurslar — `/courses`

Sarlavha "Kurslar" + "Hammasi ochiq — istagan joydan boshlang". Fan segmenti (Ingliz tili /
Ona tili) — `border: 1px solid #D5D1C8`, aktiv qora fon.

Kurs kartasi: `border: 1px solid #E4E1DA`, `padding: 16px`. Sarlavha Archivo 600 16px,
o'ngda daraja badge, ostida "N dars · M tugallandi" 12px `#82878F`, boshlangan bo'lsa
4px progress bar (`#EDEAE4` trek, `#1B3C73`; 100% bo'lsa `#1E6B4F`).

Davom etayotgan kurs birinchi va ajratilgan: `border: 1px solid #14161A` + `DAVOM ETMOQDA`
label (`#1B3C73`).

Tartib: davom etayotgan → A1 → A2 → B1 → B2 → C1. Pastda **ALOHIDA** bo'limi:
Imtihon strategiyasi (accent karta) + Speaking mashqlari.

### 6. Kurs sahifasi — `/courses/[slug]`

Yuqorida orqaga + "Kurslar". Sarlavha bloki: daraja badge + fan, Archivo 700 25px nom,
tavsif 14px/1.6, ostida progress bar + `9/24` (monospace 12px).

**Modul — vertikal yo'l**: `border-left: 1px solid #E4E1DA; margin-left: 11px; padding-left: 22px`.
Har dars: chapda chiziq ustidagi 13×13 nuqta (`position: absolute; left: -29px; top: 14px`) —
tugallangan `#1E6B4F`, joriy `#1B3C73`, ochiq oq + `1px solid #C9C6C0`. O'ngda karta:
sarlavha 15px/500, o'ngda davomiylik monospace 11px, ostida meta 12px (`Grammar · tugallandi`).
Joriy dars kartasi `border: 1px solid #14161A`; tugallanganlar `opacity: 0.6`.

**Qulflash yo'q** — keyingi modul ham ochiq, faqat kulrang karta bilan izohlanadi:
"5 dars · modul 2 tugagach ochiladi (lekin xohlagan vaqtda kirishingiz mumkin)".

### 7. Dars pleyeri — `/lessons/[id]`

**Qadam-baqadam** (Duolingo uslubi): bitta blok = bitta ekran, 9 qadam.
API: `GET /api/courses/lessons/:id`, `POST /api/progress/lessons/:id/complete`,
`POST /api/exercises/:id/submit`.

**Sticky header** (`top: 0`, fon `#FBFAF7`, `border-bottom: 1px solid #E4E1DA`):
`←` (orqaga; 1-qadamda chiqish) · kurs nomi 12px `#82878F` + dars nomi 13px/600 (ellipsis) · `✕`.
Ostida 3px progress bar (`#1B3C73`) + `Blok 3/9` (monospace 11px).

**Kontent** `padding: 24px 20px 120px` (pastda fixed footer bor).
**Footer**: `position: absolute; bottom: 0`, `padding: 14px 16px 18px`, `border-top`.
Tugma to'liq kenglik, qora, Archivo 600 15px. O'chirilgan holat: fon `#E4E1DA`, matn `#9A9791`,
`cursor: not-allowed`.

Har blok yuqorisida tur label'i: 10px, `letter-spacing: 0.14em`, 600, `#1B3C73`.

| # | Tur | Tuzilishi |
|---|---|---|
| 1 | `theory` | `NAZARIYA` · h2 Archivo 700 24px · paragraflar 16px/1.65 `#22262C`, `<b>`/`<i>` markdown, `<ul>` `padding-left: 20px`, `line-height: 1.7` |
| 2 | `example` | `MISOLLAR` · kartalar `gap: 10px`: EN 18px/1.4/500, UZ 14px `#4B5058` (`margin-top: 6px`) |
| 3 | `table` | `JADVAL` · h3 19px · `overflow-x: auto` konteyner + `min-width: 460px` jadval. Thead fon `#F1EFEA`, 11px `0.08em`. Katakchalar `padding: 11px 14px`, `border-bottom: 1px solid #EDEAE4`. Ostida "← jadvalni yon tomonga suring" (12px `#9A9791`) |
| 4 | `dialogue` | `DIALOG` · chat: A chapda (26px kulrang avatar, oq bubble `border: 1px solid #E4E1DA`), B o'ngda (`flex-direction: row-reverse`, qora avatar, bubble fon `#EEF1F7` + `border: 1px solid #C7D2E3`). `max-width: 270px`. Har bubble: EN 15px/1.45 + UZ 13px `#82878F`. Oxirida izoh qatori `border-top` bilan |
| 5 | `tip` | `MASLAHAT` · `border-left: 3px solid #1B3C73`, fon `#EEF1F7`, `padding: 18px 18px 18px 16px`. Sarlavha Archivo 600 18px `#12294F`, matn 15px/1.6 |

**Mashqlar** (4 tur chizilgan, brief'da 8 tur bor):

| Tur | Interaksiya | Javobdan keyin |
|---|---|---|
| `MCQ_SINGLE` | 4 variant tugmasi: 22px harf kvadrati (monospace 11px) + matn 15px. Tanlangan → ink chegara + inset. Footer "Tekshirish" (tanlanmaguncha o'chirilgan) | To'g'ri variant `border: #1E6B4F` + fon `#F1F7F3` + `✓`; tanlangan xato `#A32B2B` + `#FCF1F1` + `✗`; qolganlar `opacity: 0.5`. Ostida izoh kartasi: verdikt 13px/600 + `explanationUz` 14px/1.6 |
| `TRUE_FALSE` | Gap kartada ko'rsatiladi, savol matni ostida 2 variant (To'g'ri / Xato) | Xuddi shu naqsh |
| `GAP_FILL` | Gap ichida `border-bottom: 2px solid #1B3C73` bo'sh joy + izoh `(not / finish)`. Input `padding: 14px 16px`, 16px | Izoh kartasida: "To'g'ri javob: **haven't finished**" + qoida. Qabul qilinadigan javoblar normallashtiriladi (kichik harf, apostrof variantlari) |
| `WRITING_TASK` | Prompt 16px/1.55 · textarea `height: 180px`, 15px/1.6 · ostida so'z hisoblagichi (`{n} so'z · kamida 60`; 60 dan kam → `#A32B2B`, aks holda `#1E6B4F`) + "Saqlandi ✓" (`#9A9791`) · footer "AI'ga yuborish" (≥20 so'zda faollashadi) | **Kutish**: karta "AI baholayapti…" + "Odatda 20-40 soniya oladi" + 3px indikator. So'ng **AI panel** (`pop 0.25s`): sarlavha `AI TAHLIL` + `5.5/7`; 4 mezon qatori (nom `width: 118px` 13px, 5px bar, monospace ball); `KUCHLI TOMONLAR` (`#1E6B4F` label); `XATOLAR` — har biri `border-left: 2px solid #E8C9C9; padding-left: 12px`: original `line-through` `#A32B2B` → tuzatilgan `#1E6B4F` → sabab 12px `#82878F` |

**Dars yakuni modali** — pastdan chiqadi (`align-items: flex-end`, `fadeUp 0.25s`):
`DARS TUGALLANDI` label, dars nomi Archivo 700 26px, 3 ustunli statistika karta
(to'g'ri javob % / +50 XP / 13 kun ketma-ket — Archivo 700 22px + 11px label),
"Keyingi dars: Passive Voice" (qora) + "Bosh sahifaga qaytish" (matn tugma).
Foiz **haqiqiy javoblardan** hisoblanadi.

### 8. Mocklar — `/mocks`

Sarlavha + fan segmenti + tur chiplari (`To'liq / Mini / Placement`, `overflow-x: auto`,
`padding: 7px 14px`, aktiv `border: 1px solid #14161A`).

- **Tugallanmagan urinish** (birinchi, sariq holat): `border: 1px solid #8A5A2B`, fon `#FDF7EF`,
  label `TUGALLANMAGAN URINISH`, "Reading bo'limida to'xtagan · 41 daqiqa qoldi",
  "Davom ettirish" tugmasi (`#8A5A2B` fon, oq matn).
- **Mock kartasi**: sarlavha Archivo 600 16px + o'ngda umumiy vaqt (monospace 11px).
  Bo'limlar qatori: `L 35  R 35  W 3  S 3` (12px, `gap: 14px`) — emoji o'rniga harf+son.
- **Mening urinishlarim**: qatorlar — nom 14px + sana 12px, o'ngda ball Archivo 700 15px + daraja badge.
  `GET /api/mocks/attempts/my`.

### 9. Mock boshlash — `/mocks/[slug]`

Sarlavha Archivo 700 26px, tavsif 14px/1.6. **Bo'limlar jadvali**: header qatori
(`BO'LIM / SAVOL / VAQT`, fon `#F1EFEA`, 11px), 4 qator (`padding: 13px 16px`, vaqt monospace).
**Qoidalar**: `border-left: 3px solid #8A5A2B`, fon `#FDF7EF`, 4 qator 13px/1.5 `#3C3629` —
audio bir marta, timer to'xtamaydi, bo'limga qaytib bo'lmaydi, mikrofon ruxsati.
CTA "Imtihonni boshlash" + ostida ogohlantirish 12px `#9A9791`.

### 10. Imtihon rejimi — `/mocks/attempts/[id]`

**Chalg'ituvchisiz**: tab-bar yo'q, `height: 100%` flex column.

**Header** (fon `#14161A`, `padding: 10px 16px 12px`): chapda `BO'LIM 1 / 4` (10px `#9A9791`)
+ bo'lim nomi (Archivo 600 16px). O'ngda **timer** — monospace 24px, `#F6F4F0`;
**oxirgi 5 daqiqada `#F08A8A`** + ostida `QOLGAN VAQT` 10px.

**Savol navigatsiyasi** (`border-bottom`, `padding: 10px 12px`, `flex-wrap`, `gap: 4px`):
26×24 kvadratchalar, monospace 11px. Holatlar:
- joriy → `#14161A` fon, oq matn
- belgilangan (flag) → `border: 1px solid #8A5A2B`, fon `#FDF7EF`
- javob berilgan → `border: #C7D2E3`, fon `#EEF1F7`, matn `#12294F`
- bo'sh → `border: #E4E1DA`, oq fon, matn `#9A9791`

Raqamlash bo'limlar bo'ylab davom etadi (L: 1–35, R: 36–70, W/R: 71+).

**Footer**: "Bo'limni yakunlash" / oxirgi bo'limda "Imtihonni topshirish".

#### 10a. Listening
Audio karta: `border: 1px solid #D5D1C8`. `PART 1 · AUDIO` + o'ngda qizil ogohlantirish
("Faqat bir marta eshitiladi" → ijrodan keyin "Bir marta ijro etildi"). 44×44 qora play tugmasi
+ 4px progress + vaqtlar monospace 11px. **Pauza yo'q, qayta ijro yo'q** — bir marta bosilgach
tugma qayta ishlamaydi.

Savol bloki: `SAVOL 12` (monospace 12px `#1B3C73`) + o'ngda "Belgilash" tugmasi (bosilganda
"Belgi olindi"). Savol 17px/1.45/500, 4 variant (dars MCQ naqshi, lekin **javob ko'rsatilmaydi**).
Pastda `←` (navigatsiya) + "Keyingi savol" (qora, `flex: 1`).

#### 10b. Reading
**Split-view mobil varianti**: passage yuqorida yig'iladigan.
Sticky sarlavha (`background: #F1EFEA`, `border-bottom`): `PASSAGE 1 · THE RETURN OF THE NIGHT TRAIN`
(12px/600, `0.08em`) + `−`/`+`. Ochiq passage: oq fon, 15px/1.7 `#22262C`, paragraflar `margin-bottom: 12px`.
Savollar: raqam monospace 12px `#1B3C73` + gap 15px/1.5, ostida 3 tugma yonma-yon
(`TO'G'RI / XATO / AYTILMAGAN`, `flex: 1`, 12px/600). Savollar orasi `gap: 20px`.
Desktop/planshetda: chapda passage (skroll), o'ngda savollar.

#### 10c. Writing
Prompt kartasi: `TASK 2 · 20 DAQIQA · KAMIDA 120 SO'Z` + matn 16px/1.55.
Textarea `height: 260px`. Hisoblagich: `{n} / 120 so'z` — 120 dan kam bo'lsa `#A32B2B`,
yetganda `#1E6B4F`. O'ngda autosave indikatori "Saqlandi ✓".
Autosave: `POST /api/mocks/attempts/:id/answers/:questionId` (debounce ~2s).

#### 10d. Speaking
Prompt kartasi: `PART 2 · 1 DAQIQA TAYYORGARLIK · 2 DAQIQA GAPIRISH` + topshiriq +
bulletlar (`— what the skill is` ko'rinishida, `padding-left: 14px`).

4 faza:
1. **idle** — tushuntirish + "Tayyorgarlikni boshlash".
2. **prep** — `TAYYORGARLIK` label (`#8A5A2B`), 132×132 SVG doira countdown
   (`r=58`, `stroke-width: 8`, `stroke-dasharray: 364`, `rotate(-90deg)`, progress `#8A5A2B`),
   markazda monospace 30px vaqt, ostida "Yozish avtomatik boshlanadi". 60 → 0.
2. **rec** — 9px qizil doira + `YOZILMOQDA` (`#A32B2B`), 28 ustunli waveform
   (`width: 4px`, `gap: 3px`, balandlik 10–72px, `#1B3C73`, har soniyada yangilanadi),
   monospace 30px countdown 120 → 0, "Yozishni tugatish" (qizil chegara).
3. **done** — "Javob yozildi ✓" (yashil karta) + playback pleyeri (38px play + progress + vaqt)
   + "Qayta yozish (1 imkon qoldi)".

Yozish: `MediaRecorder` (webm/opus) → `POST /api/files/audio` (`multipart/form-data`) → `{url}`.

#### 10e. Submit modali
Markazda (`pop 0.2s`), `padding: 24px 20px 20px`. Sarlavha Archivo 700 20px:
- oraliq bo'lim: "Reading bo'limini yakunlaysizmi?" + "Yakunlagandan keyin bu bo'limga qaytib
  bo'lmaydi. Qolgan vaqt keyingi bo'limga o'tmaydi." → "Ha, yakunlash"
- oxirgi: "Imtihonni topshirasizmi?" + "Barcha javoblar baholashga yuboriladi. Writing va
  Speaking AI tahlili 1-2 daqiqada tayyor bo'ladi." → "Ha, topshirish"

Ostida "Bekor qilish" (`border: 1px solid #C9C6C0`).

### 11. Baholanish kutish

`padding: 80px 24px 40px`, markazlashtirilgan. Sarlavha Archivo 700 24px
"Natijalar hisoblanmoqda" + tushuntirish. 4 qatorli karta (Listening / Reading / Writing / Speaking):
20px kvadrat — tayyor bo'lsa `#1E6B4F` + oq `✓`, kutayotganda `#D5D1C8` bo'sh; o'ngda holat
matni ("tayyor" / "AI baholayapti…" / "navbatda"). L va R darhol tayyor, W→S ketma-ket keladi
(polling: `GET /api/mocks/attempts/:id/result`). Pastda accent karta: "Telegram ulangan —
natija botga ham yuboriladi. Bu sahifani yopsangiz ham baholash davom etadi."
Hammasi tayyor bo'lgach avtomatik natija sahifasiga o'tadi.

### 12. Natija sahifasi — `/mocks/attempts/[id]/result`

Header: `←` + "To'liq mock #4" 13px/600 + "2-avgust, 2026 · 2 soat 15 daqiqa" 12px `#82878F`.

**Katta natija kartasi** (`margin: 0 20px`, fon `#14161A`, `padding: 20px`):
`UMUMIY BALL` + `48.8/75` (Archivo 700 42px, `-0.03em`); o'ngda B1 badge (oltin) + "B2 gacha 8.2 ball".
Ostida 4 ta bo'lim bari: nom `width: 74px` 12px `#C9C6C0`, 6px bar (trek `#2C3038`, to'ldiruv
`#F6F4F0`; **eng zaif bo'lim `#E4C86A`**), ball monospace 12px `width: 34px`.
Pastda "Har bo'lim maksimal 18.75 ball" (11px `#6A6862`).

**Tablar**: `L · R` / `Writing` / `Speaking` — `flex: 1`, `padding: 11px 4px`, 13px/600.
Aktiv `#14161A` + `border-bottom: 2px solid #14161A`; nofaol `#82878F` + shaffof border.

- **L · R tab**: yuqorida xulosa ("Listening 27/35 · Reading 24/35" / "xatolar: 19").
  Qatorlar: monospace raqam (`width: 22px`) + "Sizning javob: **B**" (to'g'ri `#1E6B4F`,
  xato `#A32B2B`) + ikkinchi qator "To'g'ri javob: C" · o'ngda `✓`/`✗`.
  Pastda "Barcha 70 savolni ko'rish" havolasi.
- **Writing tab**: `TASK 2 · JAVOBINGIZ` — foydalanuvchi matni oq kartada 14px/1.65, xatolar
  `#FCE9E9` fonda belgilangan. So'ng AI panel: sarlavha + `11.8/18.75`; **4 mezon** (nom + ball
  monospace, ostida 13px/1.55 izoh); **XATOLAR JADVALI** (`original → corrected → nima uchun`,
  `border-left: 2px solid #E8C9C9`); **YAXSHILANGAN VERSIYA** (fon `#F3F6F1`,
  `border: 1px solid #DCE5D9`, 14px/1.65); **UMUMIY XULOSA**.
- **Speaking tab**: `PART 2 · JAVOBINGIZ` — playback pleyeri (38px play + progress + vaqtlar);
  `TRANSKRIPT` kartasi 14px/1.7 (xatolar belgilangan); so'ng xuddi shu AI panel
  (Fluency / Pronunciation / Grammar) + xatolar.

**Keyingi qadam** (tablardan keyin, doim ko'rinadi): accent karta — `ENG ZAIF BO'LIM · SPEAKING`
label + tavsiya etilgan dars nomi Archivo 600 16px + meta + `→`.

### 13. Lug'at — `/vocabulary`

**Statistika**: 2×2 grid (jami 412 / o'rganilmoqda 168 / puxta 196 `#1E6B4F` /
bugun kutmoqda 24 `#1B3C73`), raqam Archivo 700 22px.
CTA "24 so'zni takrorlash" (qora) + "Taxminan 8 daqiqa".
**Mavzular**: qatorlar — nom 14px/500 + "86 so'z · 40 o'rganilgan" 12px, o'ngda "Qo'shish"
(12px/600 `#1B3C73`).

**Flashcard sessiyasi** (alohida ekran, tab-bar yo'q):
Yuqorida `✕` + 3px progress + `2/5` (monospace 11px).
Karta `flex: 1` (butun bo'sh joyni oladi), `border: 1px solid #D5D1C8`, `padding: 28px 22px`,
kontent vertikal markazda, matn chapga tekislangan. Butun karta bosiladi (aylantiradi).

- **Old tomoni**: so'z Archivo 700 34px · fonetika monospace 14px `#82878F` (`/rɪˈlʌktənt/`) ·
  "▶ Tinglash" tugmasi (`border: 1px solid #C9C6C0`, `padding: 9px 14px`) ·
  "Javobni ko'rish uchun kartani bosing" 12px `#9A9791`.
  Pastda "Javobni ko'rsatish" (qora tugma).
- **Orqa tomoni**: so'z Archivo 700 22px · tarjima 20px/600 `#1B3C73` · ta'rif 14px/1.6
  (`border-top: 1px solid #EDEAE4` bilan ajratilgan) · misol EN 15px + UZ 13px `#82878F`.
  Pastda **4 baho tugmasi** 2×2 grid (`padding: 14px 6px`): nom 13px/600 + ostida keyingi
  takrorlash 10px (`opacity: 0.7`):
  | Baho | Rang | Keyingi | API `grade` |
  |---|---|---|---|
  | Bilmadim | `#A32B2B` | 10 daqiqa | 0 |
  | Qiyin | `#8A5A2B` | 1 kun | 3 |
  | Yaxshi | `#1E6B4F` | 4 kun | 4 |
  | Oson | `#1B3C73` | 9 kun | 5 |

  `POST /api/vocabulary/cards/:id/review` `{grade}`.
- **Sessiya yakuni**: "Sessiya tugadi" + ko'rilgan so'zlar soni + 3 ustunli hisob
  (bildim `#1E6B4F` / qiyin `#8A5A2B` / bilmadim `#A32B2B` — **haqiqiy baholardan**) +
  accent karta "Keyingi takrorlash: ertaga soat 09:00 · 19 so'z" + "Lug'atga qaytish".

### 14. O'quv reja — `/plan`

Sarlavha "O'quv reja" + "B1 → B2 · imtihongacha 142 kun".

- **Bugun** — label `BUGUN · 4-AVGUST` + "25/60 daqiqa". Vazifalar Dashboard bilan bir xil naqsh.
- **Bu hafta** — 7 ustunli grid, har katak `padding: 12px 0`: harf 10px `#9A9791` +
  kun raqami Archivo 600 14px (bugun `#1B3C73`) + 7px kvadrat holat nuqtasi.
- **Avgust** — 7 ustunli oy kalendari (`gap: 6px`, `aspect-ratio: 1`, monospace 11px):
  bajarildi `#1B3C73` + oq matn · qoldirildi `#E8C9C9` + `#8A2B2B` · bugun
  `border: 1px solid #14161A` · kelgusi `#EDEAE4` + `#9A9791`. Ostida legend (11px, 8px kvadratlar).
- **Bosqichlar** — A2 —— B1 —— B2 yo'li: daraja yorliqlari 11px/600 (tugallangan `#1E6B4F`,
  joriy `#1B3C73`, kelgusi `#9A9791`), oralarida 3px chiziqlar (joriy segment qisman to'ldirilgan).
  Ostida izoh: "Hozir B1 bosqichidasiz. Rejaga ko'ra 12-oktabrga B2 materialiga o'tasiz."
- "Rejani qayta tuzish" (`border: 1px solid #C9C6C0`).

**Bo'sh holat**: chiziqli placeholder + "Hali reja yo'q" + tushuntirish + "Reja tuzish".

API: `GET /api/study-plan/active`, `POST /api/study-plan/generate`,
`POST /api/study-plan/tasks/:id/complete`.

### 15. Profil — `/profile`

- **Sarlavha**: 52px avatar (qora, initsiallar Archivo 600 18px) + ism Archivo 700 19px + email 13px.
- **Ma'lumotlar kartasi**: Joriy daraja B1 / Maqsad daraja B2 / Imtihon sanasi 24.12.2026
  (monospace) / Kunlik maqsad 60 daqiqa — har qator `padding: 14px 16px`, label `#4B5058`, qiymat 600.
- **Telegram kartasi** — ikki holat:
  - *Ulanmagan*: `border: 1px solid #C7D2E3`, fon `#EEF1F7`. "Bot ulanmagan" + foyda tushuntirishi
    + "Botni ulash" (`#229ED9`). Bosilganda deep link: `POST /api/telegram/link` → `t.me/...`.
  - *Ulangan*: `border: 1px solid #1E6B4F`, fon `#F1F7F3`, 20px yashil `✓` + "Bot ulangan" +
    "@dilnoza_r · natijalar va eslatmalar botga keladi" + "Uzish".
- **Sozlamalar**: "Interfeys tili" UZ/EN segmenti · "Tema" Light/Dark/Auto segmenti
  (`border: 1px solid #D5D1C8`, aktiv qora fon, `padding: 6px 11–12px`, 12px/600).
- **Statistika**: 3 ustun (1 240 XP / 31 dars / 18s jami vaqt) + katta heatmap (Dashboard bilan bir xil).
- "Chiqish" (`border: 1px solid #E8C9C9`, matn `#A32B2B`).

### 16. 404

Markazlashtirilgan: `404` monospace 52px `#D5D1C8` · "Sahifa topilmadi" Archivo 700 22px ·
tushuntirish 14px/1.6 · "Bosh sahifaga" (qora) + "Mocklarga o'tish" (chegarali).

---

## Interactions & Behavior

**Navigatsiya oqimi**

```
Landing ──"Bepul boshlash"──▶ Register ──▶ Onboarding (4) ──▶ Dashboard
                                 │                              │
                              Login ─────────────────────────────┘
Dashboard ──vazifa "Boshlash"──▶ Dars pleyeri ──yakun modali──▶ Dashboard
Dashboard ──avatar──▶ Profil
Tab-bar: Bosh · Kurslar · Mocklar · Lug'at · Reja
Kurslar ──▶ Kurs sahifasi ──dars──▶ Dars pleyeri
Mocklar ──▶ Mock boshlash ──▶ Imtihon (L→R→W→S) ──submit──▶ Kutish ──▶ Natija
Lug'at ──▶ Flashcard sessiyasi ──▶ Sessiya yakuni
Natija ──"Keyingi qadam"──▶ Dars pleyeri
```

**Timerlar** (barchasi 1 soniyalik interval)
- Bo'lim timeri: imtihon ekranida ishlaydi, 0 ga yetganda to'xtaydi (real ilovada avtomatik submit).
  Serverdan `expiresAt` olib, mijozda hisoblash tavsiya etiladi — sahifa yopilsa ham davom etadi.
- Speaking prep 60s → avtomatik `rec` fazasiga o'tadi; rec 120s → avtomatik `done`.
- Audio progress: ijro davomida oshadi, 4:20 (260s) da to'xtaydi.
- Baholanish ekrani: har soniyada bir bo'lim "tayyor" bo'ladi, 4 tadan keyin natijaga o'tadi
  (prototip simulyatsiyasi — real ilovada polling).

**Validatsiya**
- Auth: yuqoridagi jadval.
- Dars MCQ/TF: variant tanlanmaguncha "Tekshirish" o'chirilgan.
- Dars GAP_FILL: bo'sh bo'lmasa faollashadi; javob normallashtirib solishtiriladi.
- Dars WRITING: ≥20 so'zda "AI'ga yuborish" faollashadi; hisoblagich 60 so'zgacha qizil.
- Imtihon Writing: hisoblagich 120 so'zgacha qizil (bloklamaydi).

**Loading / xato / offline holatlari** (brief 2.2)
Chizilgan: AI baholash kutish (dars), baholanish kutish ekrani, audio yuklanish indikatori
(progress bar). Chizilmagan va frontendda qo'shilishi kerak: skeleton loaderlar
(karta shakllarini `#EDEAE4` fonda takrorlash), umumiy xato kartasi ("Qayta urinish" tugmasi bilan),
offline banner. Naqsh: xato → `border: 1px solid #E8C9C9`, fon `#FCF1F1`, matn `#A32B2B`.

## State Management

Prototipda barcha state bitta komponentda. Real ilovada bo'linadi (URL routing + server state).

| Guruh | O'zgaruvchilar |
|---|---|
| Router | `screen`, `tab` |
| Auth | `authMode`, `regName`, `email`, `pass`, `authErr` |
| Onboarding | `onb` (0–3), `onbSubj`, `onbLevel`, `onbDate`, `onbTime` |
| Dars | `step` (0–8), `mcq`, `mcqChecked`, `tf`, `tfChecked`, `gap`, `gapChecked`, `wtext`, `aiPending`, `aiDone`, `showFinish` |
| Imtihon | `sec` (0–3), `left` (soniya), `lq`, `ansL{}`, `ansR{}`, `flags{}`, `w2`, `passOpen`, `audioPlaying`, `audioPlayed`, `audioAt`, `spPhase` (`idle/prep/rec/done`), `spLeft`, `showSubmit` |
| Natija | `rtab` (`lr/w/s`), `playing` |
| Lug'at | `fi` (karta indeksi), `flipped`, `fgrades[]` |
| Mocklar/Kurslar | `subj`, `kind` |
| Profil | `tg`, `lang`, `theme` |
| Baholash | `gradeStep` |

**Data fetching** (brief'dan): `GET /api/progress/dashboard` · `GET /api/study-plan/active` ·
`GET /api/courses?subject=` · `GET /api/courses/:slug` · `GET /api/courses/lessons/:id` ·
`POST /api/exercises/:id/submit` · `POST /api/progress/lessons/:id/complete` ·
`GET /api/mocks?subject=&kind=` · `GET /api/mocks/:slug` · `POST /api/mocks/:slug/start` ·
`POST /api/mocks/attempts/:id/answers/:questionId` · `POST /api/mocks/attempts/:id/submit` ·
`GET /api/mocks/attempts/:id/result` · `GET /api/mocks/attempts/my` ·
`POST /api/vocabulary/cards/:id/review` · `PATCH /api/users/me` · `POST /api/telegram/link`.
JWT: `Authorization: Bearer`.

## Prototip sozlamalari (tweaks)

Dizayn faylida 4 ta almashtirgich bor — turli holatlarni ko'rish uchun:

| Nom | Ta'siri |
|---|---|
| `newUser` | Dashboard va Reja bo'sh holatlarini ko'rsatadi |
| `hideGamification` | Streak va kunlik maqsad bloklarini olib tashlaydi |
| `timerLow` | Imtihon timerini 4:57 dan boshlaydi (qizil holatni ko'rish uchun) |
| `examDays` | Imtihongacha kunlar soni (0–400) |

## Assets

Dizaynda hech qanday tashqi rasm yoki ikon fayli ishlatilmagan.

- Shriftlar: Google Fonts (Archivo, IBM Plex Sans, IBM Plex Mono).
- Ikonlar: inline SVG (tab-bar 5 ta, Telegram 1 ta) — Lucide'ga almashtirish tavsiya etiladi.
- Illyustratsiyalar: **yo'q**. Bo'sh holatlarda chiziqli placeholder
  (`repeating-linear-gradient(135deg, #F1EFEA 0 8px, #FBFAF7 8px 16px)` + `1px solid #E4E1DA` +
  markazda monospace 10px izoh). Haqiqiy illyustratsiyalar keyin qo'yiladi.
- Audio: yo'q — pleyerlar vizual holatlarni ko'rsatadi.
- Logo: wordmark faqat matn (`multilevel` Archivo 700 + `.wisar.uz`).

## Files

- `Multilevel Mobile.dc.html` — butun dizayn (barcha ekranlar, interaktiv). Brauzerda ochiladi.
- `DESIGN-BRIEF.md` — asl topshiriq (o'zbekcha), barcha sahifalar va API'lar ro'yxati.
  Chizilmagan ekranlar (AI amaliyot, Admin, dark mode, desktop) shu yerda tasvirlangan.
