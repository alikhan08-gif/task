# TimeUp — Mobile (Phase 1)

Expo (React Native + TypeScript) ilova. Dizayn `../ARCHITECTURE.md` va `../timeup-design` (Artifact) asosida.

## Ishga tushirish

```bash
npm install
npm run web      # brauzerda
npm run android  # Android (Expo Go yoki emulyator)
npm run ios      # iOS (faqat macOS)
```

API manzili `src/api/client.ts` faylida hardcoded (`http://localhost:3000/api/v1`) — backendni birga ishga tushiring (`../backend`, `npm run start:dev`).

## Ekranlar

- **Login** — kirish/ro'yxatdan o'tish, real backendga ulangan (JWT)
- **Home** — streak/XP kartalari, bugungi vazifalar
- **Tasks** — kunlik jadval, timeline ko'rinishi
- **CreateTask** — yangi vazifa yaratish/tahrirlash formasi (modal)
- **Weekly** — haftalik kun tanlagich + tanlangan kun vazifalari
- **Profile** — real backend profili (email, timezone, XP, streak, Telegram holati), chiqish

## Holat

Hammasi real backend API orqali ishlaydi — mock ma'lumot yo'q:

- Auth (register/login), Profile (email, timezone, XP, streak, Telegram bog'lanish holati)
- Vazifalar: yaratish, tahrirlash (vazifaga bosish), ro'yxat (kunlik/haftalik guruhlash), bajarish (checkbox — XP va streak'ni real vaqtda yangilaydi), o'chirish (uzoq bosish → tasdiqlash)
- **Telegram bot** — Profil'dagi "Telegram bot" qatorini bosish `POST /telegram/link`ni chaqiradi, deep-link'ni (`t.me/<bot>?start=<token>`) qurilma brauzerida/Telegram ilovasida ochadi. Backend'da `TELEGRAM_BOT_TOKEN` sozlanmagan bo'lsa, foydalanuvchiga tushunarli xato ko'rsatiladi ("hozircha sozlanmagan") — ilova qulamaydi
- Loading/error/empty holatlar har bir ekranda

`npx tsc --noEmit` toza, backend'ning 40 ta testi o'tgan, va to'liq oqim (ro'yxatdan o'tish → vazifa yaratish/tahrirlash/bajarish/o'chirish → Telegram bog'lash urinishi) headless brauzerda avtomatik tekshirilgan.

**Keyingi bosqich:** push-bildirishnoma, offline sinxronizatsiya, AI rejalashtiruvchi (`../ARCHITECTURE.md`ga qarang). Telegram bot backend tomoni tayyor — real ishlashini ko'rish uchun `../backend/README.md`dagi ko'rsatma bo'yicha @BotFather'dan token oling.
