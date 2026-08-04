# multilevel.wisar.uz — VPS'ga chiqarish qo'llanmasi

Ubuntu 22.04+ VPS uchun. Frontend tayyor bo'lmaguncha ham backend + bot mustaqil ishlaydi
(bot allaqachon to'liq funksional o'quv hamrohi).

## 0. Oldindan tayyorlang

| Kerak | Qayerdan |
|---|---|
| Domen `multilevel.wisar.uz` | Wisar.uz DNS: A-record → VPS IP |
| Telegram bot token | @BotFather (allaqachon bor: `@sf_multilevel_bot`) |
| Gemini API key | https://aistudio.google.com/apikey — **bepul** |
| Gmail App Password | https://myaccount.google.com/apppasswords (2FA yoqilgan bo'lishi shart) |
| Google OAuth Client ID | https://console.cloud.google.com → APIs → Credentials (ixtiyoriy) |

## 1. Server tayyorlash

```bash
# Docker + compose
curl -fsSL https://get.docker.com | sh
sudo apt install -y nginx certbot python3-certbot-nginx git

# Loyihani klonlash
sudo mkdir -p /opt && cd /opt
git clone https://github.com/Sarvarbek0704/multilevel-wisar.git multilevel
cd multilevel
```

## 2. Muhit sozlash

```bash
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
```

Productionda **majburiy** o'zgartiriladiganlar:

```env
NODE_ENV=production
APP_URL=https://multilevel.wisar.uz
WEB_URL=https://multilevel.wisar.uz

DATABASE_URL=postgresql://multilevel:<KUCHLI-PAROL>@postgres:5432/multilevel?schema=public

# Har birini alohida tasodifiy satr qiling: openssl rand -hex 32
JWT_ACCESS_SECRET=<64 belgi>
JWT_REFRESH_SECRET=<64 belgi>
OTP_SECRET=<64 belgi>
TELEGRAM_WEBHOOK_SECRET=<32 belgi>

AI_PROVIDER=gemini
GEMINI_API_KEY=<AI Studio kaliti>

TELEGRAM_BOT_TOKEN=<BotFather tokeni>
TELEGRAM_BOT_USERNAME=sf_multilevel_bot

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<gmail manzil>
SMTP_PASS=<App Password, 16 belgi>
SMTP_FROM=multilevel.wisar.uz <noreply@wisar.uz>

ADMIN_EMAIL=<sizning email>
ADMIN_PASSWORD=<kuchli parol — seeddan keyin almashtiring>
```

> ⚠️ `.env` hech qachon git'ga tushmaydi (`.gitignore`da). Tokenlar tarqalsa: @BotFather → `/revoke`,
> AI Studio'da kalitni o'chirib yangisini oling.

`docker-compose.yml` dagi postgres paroli `.env` dagi `DATABASE_URL` bilan bir xil bo'lsin.

## 3. Ishga tushirish

```bash
docker compose --profile prod up -d --build
docker compose logs -f api        # "Polling"/"Webhook o'rnatildi" satrini kuting
```

Migratsiyalar konteyner ichida avtomatik qo'llanadi (`prisma migrate deploy`).

### Kontent va admin

```bash
docker compose exec api pnpm seed          # kurslar, mocklar, lug'at + admin
docker compose exec api node ../../tools/generate-audio.mjs   # listening audio (bir marta)
```

Audio fayllar `apps/api/uploads/` da — bu papka git'da yo'q, serverda generatsiya qilinadi.
Yangi mock qo'shganda shu buyruqni qayta ishlating.

## 4. nginx + SSL

```bash
sudo cp deploy/nginx-multilevel.conf /etc/nginx/sites-available/multilevel.conf
sudo ln -s /etc/nginx/sites-available/multilevel.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d multilevel.wisar.uz     # SSL, avtomatik yangilanadi
```

SSL o'rnatilgach botni qayta ishga tushiring (webhook `https://` bo'lishi kerak):

```bash
docker compose restart api
```

## 5. Tekshirish ro'yxati

```bash
curl https://multilevel.wisar.uz/api/health          # {"status":"ok","database":"ok"}
curl https://multilevel.wisar.uz/api/courses | head  # kurslar ro'yxati
```

- [ ] Telegramda botga `/start` — menyu chiqdimi?
- [ ] `/quiz` — savol keldimi, javob bergach izoh chiqdimi?
- [ ] `/phone` → raqamni yuboring → «Raqam ulandi» xabari
- [ ] Saytda (yoki `curl` bilan) `POST /api/auth/otp/phone/request` → kod Telegramga keldimi?
- [ ] `POST /api/auth/otp/email/request` → kod emailga keldimi (spam papkasini ham tekshiring)
- [ ] `/api/docs` — Swagger ochiladimi?
- [ ] Admin bilan kirib `GET /api/admin/stats` ishlaydimi?

## 6. Kundalik ishlatish

```bash
# Yangilash
cd /opt/multilevel && git pull && docker compose --profile prod up -d --build

# Kontent yangilash (content/ o'zgargach)
docker compose exec api pnpm seed

# Loglar
docker compose logs -f api --tail 100

# Baza zaxirasi (cron'ga qo'ying: har kuni 03:00)
docker compose exec -T postgres pg_dump -U multilevel multilevel | gzip > /opt/backups/db-$(date +%F).sql.gz
```

## 7. Xavfsizlik minimumi

- `ufw allow 22,80,443/tcp && ufw enable` — postgres portini tashqariga ochmang
- Seeddan keyin admin parolini almashtiring (`POST /api/auth/password/change`)
- `docker compose exec postgres psql` orqali kirishni faqat serverdan qoldiring
- Zaxira nusxalarni boshqa joyga (masalan, boshqa server yoki bulut) ko'chirib turing

## Muammolar

| Belgi | Sabab / yechim |
|---|---|
| Bot javob bermayapti | `docker compose logs api` da webhook xatosi bormi? `TELEGRAM_WEBHOOK_SECRET` va `APP_URL` to'g'rimi? SSL ishlayaptimi? |
| Emaildagi kod kelmayapti | `SMTP_*` to'ldirilganmi? Gmail App Password (oddiy parol emas!) ishlatilganmi? Loglarda `[DEV]` yozuvi bo'lsa — SMTP sozlanmagan |
| AI baholash namunaviy javob qaytaryapti | `AI_PROVIDER=gemini` va `GEMINI_API_KEY` to'ldirilganmi? |
| Listening audio yo'q | `tools/generate-audio.mjs` serverda ishlatilganmi? `uploads/audio/listening/` da MP3 bormi? |
| 502 Bad Gateway | `docker compose ps` — api konteyner ishlayaptimi? Port 3001 nginx'dagi bilan mos kelyaptimi? |
