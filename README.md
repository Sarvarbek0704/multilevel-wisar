# multilevel.wisar.uz

**O'zbekiston uchun mutlaqo bepul CEFR (UzBMB multilevel) imtihoniga tayyorlash platformasi.**

Kurslar, mock imtihonlar, AI baholash (Writing/Speaking), so'z yodlash (spaced repetition), shaxsiy o'quv reja va Telegram bot — hammasi bepul.

## Arxitektura

```
apps/
  api/          NestJS backend (REST API + Telegram bot + AI baholash)
  web/          Next.js frontend (App Router + Tailwind, mobil-first)
content/
  english/      Ingliz tili: kurslar, mocklar, lug'at (JSON)
  uzbek/        Ona tili (keyingi bosqich)
deploy/         nginx konfiguratsiya namunasi
docker-compose.yml
```

**Stack:** NestJS 11 · Prisma 6 · PostgreSQL 16 · grammY (Telegram) · Gemini/Claude (almashtiriladigan AI provayder) · pnpm monorepo

## Tez boshlash (lokal)

```bash
# 1. Bog'liqliklar
pnpm install

# 2. PostgreSQL (Docker)
docker compose up -d postgres

# 3. Muhit (apps/api/.env allaqachon dev qiymatlar bilan bor, tekshiring)

# 4. Migratsiya + seed (kontent + admin)
cd apps/api
pnpm prisma:migrate    # birinchi marta: nom sifatida "init"
pnpm seed

# 5. Ishga tushirish
pnpm start:dev
# API:  http://localhost:3001/api
# Docs: http://localhost:3001/docs (Swagger)
```

## Muhit o'zgaruvchilari

`apps/api/.env.example` da to'liq ro'yxat. Asosiylari:

| O'zgaruvchi | Tavsif |
|---|---|
| `DATABASE_URL` | PostgreSQL ulanish satri |
| `AI_PROVIDER` | `gemini` (bepul) / `anthropic` (Claude, pullik) / `mock` (dev) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) dan bepul olinadi |
| `TELEGRAM_BOT_TOKEN` | @BotFather dan |
| `TELEGRAM_BOT_USERNAME` | Bot username (@ siz) — telefon OTP havolalari uchun |
| `SMTP_*` | Email OTP va parol tiklash uchun (Gmail App Password mos keladi). Bo'sh bo'lsa kodlar konsolga yoziladi |
| `GOOGLE_CLIENT_ID` | Google OAuth (ixtiyoriy) |
| `ADMIN_EMAIL/PASSWORD` | Seed'da admin yaratish uchun |

## Autentifikatsiya

5 xil kirish usuli, hammasi bitta hisobga olib keladi:

| Usul | Endpoint | Izoh |
|---|---|---|
| Google | `POST /api/auth/google` | ID token frontendda olinadi |
| Telegram Login Widget | `POST /api/auth/telegram` | HMAC imzo tekshiriladi |
| Email + kod (parolsiz) | `POST /api/auth/otp/email/request` → `.../verify` | Hisob yo'q bo'lsa avtomatik yaratiladi |
| Telefon + kod | `POST /api/auth/otp/phone/request` → `.../verify` | Kod **Telegram botga** yuboriladi |
| Email + parol | `POST /api/auth/login` / `register` | Klassik |

Qo'shimcha: `password/forgot` → `password/reset` (kod bilan, barcha sessiyalar bekor qilinadi),
`password/change`, hamda kirgan holatda `attach/email/*` va `attach/phone/*` — hisobga email yoki
telefon biriktirish.

**Telefon OTP qanday ishlaydi:** foydalanuvchi botda «📱 Telefon raqamni yuborish» tugmasini bosadi
(Telegram raqamni o'zi tasdiqlaydi) → raqam hisobga bog'lanadi → saytda raqamni kiritganda kod
o'sha Telegram chatga keladi. Raqam hali ulanmagan bo'lsa API `{needsBotContact: true, botUrl}`
qaytaradi va frontend foydalanuvchini botga yo'naltiradi.

OTP xavfsizligi: 6 xonali kod, HMAC-SHA256 bilan xeshlanadi, 5 daqiqa amal qiladi, 5 ta noto'g'ri
urinishdan keyin kuyadi, qayta yuborish 60 soniya kutadi, soatiga 5 tadan ko'p emas.

## Kontent qo'shish

Kontent — `content/` papkasidagi JSON fayllar. Format sxemalari: `apps/api/src/content/schemas.ts` (zod).

- `content/<til>/curriculum/*.json` — kurs (modullar → darslar → mashqlar)
- `content/<til>/mocks/*.json` — mock imtihon (bo'limlar → qismlar → savollar)
- `content/<til>/vocabulary/*.json` — so'zlar

Qayta yuklash: `pnpm --filter @multilevel/api seed` yoki admin API: `POST /api/admin/import/course|mock|vocab`.

## AI baholash

- Writing: matn → mezonlar bo'yicha 0-75 ball, xatolar tahlili, yaxshilangan versiya — hammasi o'zbek tilida.
- Speaking: audio → transkripsiya + baholash (Gemini multimodal).
- Mock imtihonda navbat orqali (har 15 soniyada qayta ishlanadi), amaliyot rejimida sinxron.
- Provayder almashtirish: `.env` da `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` — kod o'zgarmaydi.

## Deploy (VPS)

```bash
# Server: Ubuntu + Docker + nginx
git clone <repo> && cd multilevel
cp apps/api/.env.example apps/api/.env   # production qiymatlar bilan to'ldiring!
docker compose --profile prod up -d --build
# nginx: deploy/nginx-multilevel.conf → sites-available, certbot bilan SSL
```

Production'da bot avtomatik webhook rejimiga o'tadi (`NODE_ENV=production`).

## Frontend

```bash
cd apps/web
cp .env.example .env.local     # API_ORIGIN va bot username
pnpm dev                       # http://localhost:3000
```

Dizayn manbasi: `docs/design/design_handoff_multilevel_mobile/` (mobil-first, 390px).
Tokenlar `apps/web/tailwind.config.ts` da, ranglar CSS o'zgaruvchilari orqali —
shuning uchun dark mode komponentlarni o'zgartirmasdan ishlaydi.

Sahifalar: landing (UZ/EN) · auth (5 usul + OTP + parol tiklash) · onboarding ·
dashboard · kurslar · dars pleyeri · mocklar · imtihon rejimi (L/R/W/S) ·
baholanish kutish · natija · lug'at + flashcard · o'quv reja · AI amaliyot ·
profil · admin panel.

> Ilova interfeysi o'zbekcha: darslar, mashqlar va AI izohlari ham o'zbek tilida —
> bu platformaning asosiy qiymati. Landing sahifasi ikki tilli.

## Yo'l xaritasi

- [x] Backend: auth (5 usul, OTP), kurslar, mashqlar, lug'at+SRS, mock dvigatel, AI baholash, o'quv reja, progress, Telegram bot, admin
- [x] Kontent: A1→C1 ingliz tili kurslari, ona tili kursi, 7 mock (3 tasi to'liq, audio bilan), 180 so'z
- [x] Listening audio (TTS pipeline: `node tools/generate-audio.mjs`)
- [x] Telegram bot: flashcard, test, AI writing, eslatmalar, telefon OTP
- [x] Frontend: barcha ekranlar, dark mode, desktop layout
- [x] Haqiqiy AI baholash (Gemini) va email OTP (SMTP)
- [ ] Production deploy: multilevel.wisar.uz — [docs/DEPLOY.md](docs/DEPLOY.md)
