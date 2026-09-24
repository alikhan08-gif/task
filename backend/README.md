# TimeUp — Backend (Phase 1 MVP)

NestJS + Prisma + PostgreSQL. Hozirgi qamrov: auth (JWT), profil/timezone, task CRUD + bajarish (XP va streak bilan).

## Ishga tushirish

```bash
npm install
cp .env.example .env   # DATABASE_URL va JWT sirlarini to'ldiring
npx prisma migrate dev --name init
npm run start:dev
```

API `http://localhost:3000/api/v1` manzilida ko'tariladi.

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
| GET | `/api/v1/profile` | Profil + streak |
| PATCH | `/api/v1/profile/timezone` | Timezone'ni o'zgartirish |
| GET | `/api/v1/tasks` | Vazifalar ro'yxati |
| POST | `/api/v1/tasks` | Vazifa yaratish |
| PATCH | `/api/v1/tasks/:id` | Vazifani tahrirlash |
| DELETE | `/api/v1/tasks/:id` | Vazifani o'chirish (soft delete) |
| POST | `/api/v1/tasks/:id/complete` | Bajarilgan deb belgilash (idempotent, XP+streak beradi) |

Xatolar formati: `{ "error": { "code", "message", "details" } }`.

## Keyingi qadamlar (Phase 2)

Telegram bot integratsiyasi, push-bildirishnomalar, offline sync endpointlari, AI rejalashtiruvchi — `../ARCHITECTURE.md` fayliga qarang.
