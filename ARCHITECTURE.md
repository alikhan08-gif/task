# TimeUp — Arxitektura hujjati (Phase 0)

> Bu hujjat faqat rejalashtirish uchun. Kod yo'q. "Start Phase 1" deyilgandan keyin implementatsiya boshlanadi.

---

## A. Mahsulot arxitekturasi (Product architecture)

TimeUp — foydalanuvchiga kunlik/haftalik vazifalarni rejalashtirishda yordam beradigan, ammo ayblov hissi uyg'otmaydigan (guilt-free) shaxsiy samaradorlik ilovasi.

Asosiy tamoyil: **"Soddalik va rag'batlantirish orqali intizom."**

Asosiy modullar:
- Vazifalar (Tasks) — yaratish, tahrirlash, bajarish, o'chirish
- Kunlik jadval (Daily schedule) va haftalik rejalashtiruvchi (Weekly planner)
- XP va Streak — motivatsiya tizimi, lekin bosim qilmaydigan tarzda
- Telegram bot — eslatmalar va tezkor amallar uchun muqobil interfeys
- Push-bildirishnomalar — foydalanuvchi nazorat qiladigan chastotada
- Offline rejim — internetsiz ham asosiy funksiyalar ishlaydi, keyin sinxronlanadi
- AI rejalashtiruvchi (keyingi bosqich) — backend orqali, tuzilgan JSON qaytaradi

## B. Texnologik arxitektura (Technology architecture)

| Qatlam | Tanlov | Sabab |
|---|---|---|
| Mobile | React Native (Expo, TypeScript) | Bitta kodbaza — iOS + Android, OTA yangilanishlar, offline uchun ekotizim yaxshi |
| Backend | Node.js + NestJS (TypeScript) | Modulli struktura, DI, admin panel uchun kengaytirish oson |
| DB | PostgreSQL | Reliability, JSONB (AI natijalarini saqlash uchun), vaqt zonasi bilan ishlash yaxshi |
| ORM | Prisma | Type-safe, migratsiyalar, ERD bilan mos |
| Auth | JWT (access + refresh) + bcrypt | Standart, mobil uchun mos |
| Push | Expo Push / Firebase Cloud Messaging | Expo bilan tabiiy integratsiya |
| Telegram | Telegraf (webhook rejimi) | TypeScript-friendly, ishonchli |
| AI | Backend orqali OpenAI/Claude API proksi | Kalitni mobil ilovada hech qachon ko'rsatmaslik uchun |
| Queue/Cron | node-cron yoki BullMQ (Redis) | Eslatmalar va streak hisob-kitobi uchun |
| Fayl saqlash | S3-compatible (keyingi bosqichda, agar kerak bo'lsa) | Profil rasmi va h.k. |

## C. Papka strukturasi (Folder structure)

```
timeup/
├── apps/
│   ├── mobile/                 # React Native (Expo) ilova
│   │   ├── app/                 # Ekranlar (expo-router)
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── api/              # Backend bilan aloqa
│   │   │   ├── offline/          # Local DB (SQLite) + sync queue
│   │   │   └── storage/
│   │   └── package.json
│   └── backend/                 # NestJS backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── tasks/
│       │   │   ├── schedule/
│       │   │   ├── xp/
│       │   │   ├── streak/
│       │   │   ├── notifications/
│       │   │   ├── telegram/
│       │   │   ├── ai/
│       │   │   ├── sync/          # Offline sinxronizatsiya endpointlari
│       │   │   └── admin/         # Kelajakdagi admin panel uchun tayyor
│       │   ├── common/            # Guards, interceptors, filters
│       │   └── main.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── package.json
├── packages/
│   └── shared-types/             # Mobile va backend uchun umumiy TS tiplar
└── docs/
```

## D. Ma'lumotlar bazasi ERD

```
User ──┬──< Task
       ├──< Streak (1:1)
       ├──< XPTransaction
       ├──< TelegramLink (1:1)
       ├──< DeviceToken >──┐
       ├──< NotificationPreference (1:1)
       └──< SyncLog

Task ──< Reminder
Task ──< TaskCompletionLog   (offline sync uchun tarix)

AIRequestLog >── User
```

## E. Jadval va bog'lanishlar (Tables & relationships)

**User**
- id (uuid, PK)
- email, passwordHash
- timezone (string, IANA, masalan "Asia/Tashkent")
- createdAt, updatedAt

**Task**
- id (uuid, PK)
- userId (FK → User)
- title, description
- dueAt (timestamptz, UTC da saqlanadi)
- isRecurring, recurrenceRule (RFC5545 RRULE formatida)
- status: `pending | completed | missed`
- completedAt (timestamptz)
- clientUpdatedAt (offline sync uchun — qurilmada o'zgargan vaqt)
- serverUpdatedAt (server authoritative)
- version (int — conflict resolution uchun)
- deletedAt (soft delete, sync uchun tombstone)

**Reminder**
- id, taskId (FK)
- triggerAtUtc (hisoblangan UTC vaqt, foydalanuvchi tz'siga asoslangan)
- channel: `push | telegram`
- sentAt

**Streak**
- userId (FK, 1:1)
- currentStreak, longestStreak
- lastCompletedDate (foydalanuvchi tz'sidagi "kalendar kun")
- timezoneAtLastUpdate (tz o'zgarganda streak buzilib qolmasligi uchun)

**XPTransaction**
- id, userId (FK)
- amount, reason, createdAt

**TelegramLink**
- userId (FK, 1:1), telegramChatId, linkedAt

**NotificationPreference**
- userId (FK, 1:1)
- frequency: `minimal | normal | detailed`
- quietHoursStart, quietHoursEnd (foydalanuvchi tz'sida)

**SyncLog / TaskCompletionLog**
- offline paytida bajarilgan amallarni tartib bilan qayta qo'llash uchun

**AIRequestLog**
- userId, promptHash, responseJson, createdAt, cost
- keshlash va limitlash uchun

## F. API arxitekturasi

REST, JWT bilan himoyalangan (`Authorization: Bearer`), versiyalash: `/api/v1/...`

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- `GET/POST/PATCH/DELETE /tasks`
- `GET /schedule/daily?date=`, `GET /schedule/weekly?weekStart=`
- `POST /tasks/:id/complete` — idempotent (bir xil amal ikki marta yuborilsa xato bermaydi, mavjud holatni qaytaradi)
- `POST /sync/push` — offline paytida to'plangan amallarni serverga yuboradi
- `GET /sync/pull?since=` — serverdagi o'zgarishlarni oladi
- `GET /profile`, `PATCH /profile/timezone`
- `POST /ai/generate-schedule` — AI orqali jadval taklifi (rate-limit bilan)
- `POST /telegram/webhook` — Telegram Bot API webhook
- Xatolar formati barcha endpointlarda bir xil: `{ error: { code, message, details } }`

## G. Telegram integratsiyasi

- Foydalanuvchi mobil ilovada "Telegram bilan bog'lash" tugmasini bosadi → backend bir martalik token yaratadi → deep link (`t.me/TimeUpBot?start=<token>`) → foydalanuvchi botga start bosadi → bot tokenni backendga tasdiqlaydi → `TelegramLink` yaratiladi.
- Bot imkoniyatlari: eslatmalarni qabul qilish, inline tugma orqali "Bajarildi ✅" deb belgilash.
- **Telegram callback xavfsizligi**: har bir callback_data ichida HMAC imzo bo'ladi (userId + taskId + secret), backend uni tekshiradi — boshqa foydalanuvchi vazifasini bajarib qo'yish mumkin bo'lmasligi uchun.

## H. Bildirishnoma arxitekturasi

- Ikki kanal: mobil push (Expo/FCM) va Telegram.
- Foydalanuvchi chastotani boshqaradi (`minimal/normal/detailed`) — 39-band talabiga ko'ra bosim qilmaslik uchun.
- Barcha eslatma vaqtlari **UTC**da saqlanadi, lekin **foydalanuvchi timezone'iga qarab hisoblanadi** (cron server-local vaqtda emas).
- Timezone o'zgarsa → shu foydalanuvchining kelajakdagi barcha `Reminder.triggerAtUtc` qiymatlari qayta hisoblanadi (background job).

## I. AI arxitekturasi

- Mobil ilova hech qachon AI provayder kalitini bilmaydi — faqat backendga so'rov yuboradi.
- Backend: so'rovni keshlaydi (bir xil promptga qayta AI chaqirmaslik), foydalanuvchi uchun kunlik/oylik limit qo'yadi.
- AI javobi **qat'iy JSON schema** bo'yicha talab qilinadi (masalan, tasks massivi: title, suggestedTime, duration).
- Saqlashdan oldin backend JSON'ni validatsiya qiladi (Zod/class-validator) — noto'g'ri struktura bazaga yozilmaydi.

## J. Rivojlantirish bosqichlari (Development phases)

**MVP (40-band bo'yicha):**
1. Ro'yxatdan o'tish/kirish
2. Home
3. Vazifa yaratish
4. Tahrirlash/o'chirish
5. Bajarish
6. Kunlik jadval
7. Haftalik rejalashtiruvchi
8. PostgreSQL
9. Backend API
10. Push-bildirishnomalar
11. Oddiy Telegram bot
12. XP
13. Streak
14. Oddiy profil

**Keyingi bosqich:** AI rejalashtiruvchi, Focus mode, Pomodoro, Analytics, Achievements, Do'stlar, Challenges, Rewards, Qo'ng'iroq orqali eslatma.

## K. Phase 1 uchun aniq sozlash buyruqlari

```bash
mkdir timeup && cd timeup
npm init -y

# Backend
npx @nestjs/cli new apps/backend --package-manager npm
cd apps/backend
npm install @prisma/client prisma @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt telegraf class-validator class-transformer
npx prisma init --datasource-provider postgresql
cd ../..

# Mobile
npx create-expo-app apps/mobile -t expo-template-blank-typescript
cd apps/mobile
npx expo install expo-router expo-notifications expo-sqlite
cd ../..
```

**Kerakli environment o'zgaruvchilar (backend `.env`):**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/timeup
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
OPENAI_API_KEY=          # yoki ANTHROPIC_API_KEY
FCM_SERVER_KEY=
```

---

Tayyor bo'lgach, **"Start Phase 1"** deb yozsangiz, MVP'ning birinchi qismini (odatda: loyiha skeleti + auth + Task CRUD) real, ishlaydigan kod bilan boshlayman.
