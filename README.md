# TimeUp

Guilt-free vazifa va rejalashtirish ilovasi — XP, streak, Telegram bot va AI rejalashtiruvchi bilan.

- To'liq arxitektura: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Backend (Phase 1 MVP): [`backend/`](./backend)
- Mobile: keyingi bosqichda qo'shiladi

## Holat

**Phase 1 (backend qismi) tayyor:**
- Auth (register/login/refresh, JWT)
- Profil + timezone
- Task CRUD + bajarish (idempotent, XP va timezone-aware streak bilan)
- 26 ta test (14 unit + 12 e2e), barchasi o'tgan
- Global xato formati, validatsiya

**Keyingi:** Telegram bot, mobile (Expo) ilova, offline sync, push-bildirishnoma, AI rejalashtiruvchi.
