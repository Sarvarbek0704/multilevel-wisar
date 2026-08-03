# multilevel.wisar.uz

**O'zbekiston uchun mutlaqo bepul CEFR (UzBMB multilevel) imtihoniga tayyorlash platformasi.**

Kurslar, mock imtihonlar, AI baholash (Writing/Speaking), so'z yodlash (spaced repetition), shaxsiy o'quv reja va Telegram bot — hammasi bepul.

## Arxitektura

```
apps/
  api/          NestJS backend (REST API + Telegram bot + AI baholash)
  web/          Next.js frontend (dizayn bosqichidan keyin qo'shiladi)
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
| `GOOGLE_CLIENT_ID` | Google OAuth (ixtiyoriy) |
| `ADMIN_EMAIL/PASSWORD` | Seed'da admin yaratish uchun |

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

## Yo'l xaritasi

- [x] Backend: auth, kurslar, mashqlar, lug'at+SRS, mock dvigatel, AI baholash, o'quv reja, progress, Telegram bot, admin
- [x] Boshlang'ich kontent: A2/B1 kurslar, placement test, mini-mock, lug'at
- [ ] Kontent fabrikasi: A1→C1 to'liq kurslar, ko'plab to'liq mocklar (listening audio bilan)
- [ ] Listening audio generatsiya (TTS pipeline)
- [ ] Ona tili (o'zbek) CEFR kontenti
- [ ] Dizayn hujjatlari → dizayn → Next.js frontend
- [ ] Production deploy: multilevel.wisar.uz
