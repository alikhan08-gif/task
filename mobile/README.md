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

Auth va Profile real backend API orqali ishlaydi. Task CRUD hozircha mock ma'lumot bilan (UI to'liq tayyor) — keyingi bosqichda `src/api/client.ts`ga tasks endpointlari qo'shilib, `src/data/mock.ts` o'rniga real so'rovlar ulanadi.
