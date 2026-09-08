# FOLIO — TODO

## Текущо състояние

**Фаза 1 (импорт + глави)** — ✅ имплементирана  
**Фаза 2 (TTS / аудио)** — ⏳ следваща  
**Backend** — само за AI summary (по-късно)

---

## ✅ Фаза 1 — Импорт и разделяне на глави (ГОТОВО)

- [x] `expo-document-picker` — избор на файл
- [x] `expo-file-system` — четене на файла при импорт
- [x] `@react-native-async-storage/async-storage` — метаданни + текст на глави
- [x] Парсване на **TXT** — по heading patterns или double newline
- [x] Парсване на **EPUB** — `jszip` + spine/manifest
- [x] **PDF** — stub с ясно съобщение (не се поддържа on-device засега)
- [x] Запазване на `fileUri` (референция), не копиране на файла в app storage
- [x] Текстът на всяка глава се пази в storage (готов за TTS в фаза 2)
- [x] ImportScreen → ProcessingScreen → BookDetail flow
- [x] LibraryScreen зарежда импортирани книги от storage

### Как да тестваш

1. `npm start` → Import tab
2. Избери **TXT** или **EPUB** файл
3. След processing → виждаш книгата с разделени глави в detail екрана

---

## ⏳ Фаза 2 — TTS и аудио (ГОТОВО — on-device speech)

- [x] `expo-speech` — текст → говор on-device (без backend)
- [x] `expo-av` — audio mode (silent mode iOS, background)
- [x] Chunk queue — дълги глави се разделят на части за TTS
- [x] PlayerScreen — реален play/pause, seek, speed, prev/next chapter
- [x] Прогрес се пази в AsyncStorage (per chapter + book %)
- [x] „MARK HEARD ✓" в SummaryModal работи
- [ ] MP3 file cache — изисква cloud TTS или native module (бъдещо)

### Как работи TTS

1. `chapter.content` → разделя се на chunks (~2800 chars)
2. `expo-speech` чете всеки chunk последователно
3. Прогресът се следи по chunk index
4. Speed 0.75×–2× се подава директно на speech engine

### Забележка

Това е **streaming TTS** (говори на живо), не pre-generated MP3 файлове. За premium глас + offline MP3 cache ще трябва cloud TTS backend по-късно.

---

## Фаза 3 — AI Summary (backend)

- [x] Thin backend proxy (Vercel — `book-app-bice-phi.vercel.app`)
- [x] `summaryService.ts` — chapter text → summary + AsyncStorage cache
- [x] Свържи SummaryModal (loading / error / retry)
- [ ] `EXPO_PUBLIC_API_URL` в `.env` за physical device dev

---

## Други задачи

### Dev / Build
- [ ] EAS: `eas login` → `eas init` → `projectId` в `app.json`
- [ ] Preview build: `npm run build:android:cloud:preview`

### Storage enhancements
- [ ] Запазвай listening progress (%, позиция, last chapter)
- [ ] Settings preferences persistence
- [ ] Миграции на schema

### PDF import
- [ ] Native module или backend extraction за PDF текст

### Search & Settings
- [ ] Genre browse → реално филтриране
- [ ] Recent searches persistence
- [ ] Settings → player integration

### Maestro & Production
- [ ] Maestro flow за import
- [ ] CI pipeline
- [ ] Store publish prep

---

## Архитектура на storage

```
Book (AsyncStorage)
├── id, title, author, synopsis, fileUri, fileFormat
└── chapters[]
    ├── id, title, numeral, duration
    └── content  ← текст за TTS в фаза 2
```

Файлът **не се копира** — пазим само `fileUri`. Текстът на главите се парсва веднъж при импорт и се пази локално.
