# TimeUp — Backend (Phase 1 MVP)

NestJS + Prisma + PostgreSQL. Hozirgi qamrov: auth (JWT), profil/timezone, task CRUD + bajarish (XP va streak bilan), Telegram bot integratsiyasi.

## Ishga tushirish

```bash
npm install
cp .env.example .env   # DATABASE_URL, JWT va (ixtiyoriy) Telegram sirlarini to'ldiring
npx prisma migrate dev --name init
npm run start:dev
```

API `http://localhost:3000/api/v1` manzilida ko'tariladi. Swagger hujjatlari — `/docs`.

## Telegram bot

[@BotFather](https://t.me/BotFather)dan bot yarating (`/newbot`), tokenni oling. `.env`ga qo'shing:

```
TELEGRAM_BOT_TOKEN="123456:ABC-..."
TELEGRAM_BOT_USERNAME="SizningBotingiz_bot"   # @ belgisisiz
TELEGRAM_WEBHOOK_SECRET="tasodifiy-uzun-satr"
```

Token yo'q bo'lsa — ilova baribir normal ishga tushadi, faqat Telegram funksiyalari o'chirilgan holatda bo'ladi (`/telegram/link` 400 qaytaradi).

Ishlash tartibi:
1. Foydalanuvchi mobil ilovada "Telegram bilan bog'lash"ni bosadi → `POST /telegram/link` bir martalik token yaratadi (10 daqiqa amal qiladi) → `https://t.me/<bot>?start=<token>` linkini qaytaradi
2. Foydalanuvchi shu linkni ochib botga "Start" bosadi → bot tokenni tasdiqlaydi → `TelegramLink` yaratiladi
3. Bot eslatma yuborganda, xabar tagida "✅ Bajarildi" inline tugmasi bo'ladi — `callback_data` ichida HMAC-SHA256 imzo bor (`chatId:taskId` ustidan), shuning uchun boshqa foydalanuvchi vazifasini soxta so'rov bilan bajarib qo'yish mumkin emas (`TasksService.complete` ham egalikni alohida tekshiradi — ikki bosqichli himoya)

## Testlar

```bash
npm run test        # unit testlar
npm run test:e2e     # API integratsiya testlari (real Postgres talab qiladi)
```

## Endpointlar

| Method | Path | Tavsif |
|---|---|---|
| POST | `/api/v1/auth/register` | Ro'yxatdan o'tish (email, password, timezone) |
| POST | `/api/v1/auth/login` | Kirish |
| POST | `/api/v1/auth/refresh` | Access tokenni yangilash |
| GET | `/api/v1/profile` | Profil + streak + XP + Telegram holati |
| PATCH | `/api/v1/profile/timezone` | Timezone'ni o'zgartirish |
| GET | `/api/v1/tasks` | Vazifalar ro'yxati |
| POST | `/api/v1/tasks` | Vazifa yaratish |
| PATCH | `/api/v1/tasks/:id` | Vazifani tahrirlash |
| DELETE | `/api/v1/tasks/:id` | Vazifani o'chirish (soft delete) |
| POST | `/api/v1/tasks/:id/complete` | Bajarilgan deb belgilash (idempotent, XP+streak beradi) |
| POST | `/api/v1/telegram/link` | Bog'lash uchun bir martalik deep-link yaratadi |

Xatolar formati: `{ "error": { "code", "message", "details" } }`.

## Keyingi qadamlar (Phase 2)

Push-bildirishnomalar, offline sync endpointlari, AI rejalashtiruvchi — `../ARCHITECTURE.md` fayliga qarang.
