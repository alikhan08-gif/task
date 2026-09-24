# TimeUp

Guilt-free vazifa va rejalashtirish ilovasi — XP, streak, Telegram bot va AI rejalashtiruvchi bilan.

- To'liq arxitektura: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Backend: [`backend/`](./backend)
- Mobile (Expo): [`mobile/`](./mobile)

## Holat

**Tayyor:**
- Auth (register/login/refresh, JWT), profil (timezone, XP, streak, Telegram holati)
- Task CRUD + bajarish (idempotent, XP va timezone-aware streak bilan)
- Mobil ilova — 6 ekran, hammasi real backend API orqali (mock yo'q): yaratish, tahrirlash, bajarish, o'chirish
- Telegram bot — hisobni bog'lash (deep link), eslatma + inline "Bajarildi" tugmasi (HMAC imzo bilan himoyalangan)
- 40 ta backend test (25 unit + 15 e2e), mobil TypeScript toza
- Global xato formati, validatsiya, Swagger (`/docs`)

**Keyingi:** push-bildirishnoma, offline sync, AI rejalashtiruvchi.
