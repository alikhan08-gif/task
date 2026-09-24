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
- **Home** — streak/XP kartalari, bugungi vazifalar (hozircha mock ma'lumot)
- **Tasks** — kunlik jadval, timeline ko'rinishi
- **CreateTask** — yangi vazifa formasi (modal)
- **Weekly** — haftalik kun tanlagich + tanlangan kun vazifalari
- **Profile** — real backend profili (email, timezone, streak), chiqish

## Holat

Hammasi real backend API orqali ishlaydi — mock ma'lumot yo'q:

- Auth (register/login), Profile (email, timezone, XP, streak)
- Vazifalar: yaratish, ro'yxat (kunlik/haftalik guruhlash), bajarish (checkbox — XP va streak'ni real vaqtda yangilaydi), o'chirish (uzoq bosish → tasdiqlash)
- Loading/error/empty holatlar har bir ekranda
- Haftalik reja — kun tanlash, real hafta (Dushanba–Yakshanba)

`npx tsc --noEmit` toza, backend'ning 26 ta testi o'tgan, va to'liq oqim (ro'yxatdan o'tish → vazifa yaratish → bajarish → o'chirish) headless brauzerda avtomatik tekshirilgan.

**Keyingi bosqich:** Telegram bot, push-bildirishnoma, offline sinxronizatsiya, AI rejalashtiruvchi (`../ARCHITECTURE.md`ga qarang).
