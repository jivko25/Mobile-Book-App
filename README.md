<p align="center">
  <img src="assets/icon.png" alt="Shakes Pear" width="128" />
</p>

<h1 align="center">Shakes Pear</h1>

<p align="center">
  <strong>Мобилно приложение за слушане и четене на книги</strong><br />
  EPUB · TXT · PDF · TTS · AI резюмета · Rulit каталог
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-57-000020?logo=expo&logoColor=white" alt="Expo 57" />
  <img src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white" alt="Android" />
</p>

---

## Какво представлява

**Shakes Pear** е React Native audiobook app с литературен, „antique library“ дизайн. Приложението позволява да импортираш собствени книги, да ги слушаш с text-to-speech, да ги четеш в режим scroll/pages и да получаваш AI резюмета на глави.

Основни възможности:

- **Лична библиотека** — корици с цветови палитри, прогрес по книга и глава
- **Импорт** — локални EPUB, TXT, PDF или търсене в **Rulit** каталога
- **Слушане (TTS)** — скорост, глас, sleep timer, отделен listen progress
- **Четене** — reader с A−/A+, scroll/pages режим, точен resume
- **AI резюмета** — кратко резюме на глава чрез backend API
- **Защита от дубликати** — една и съща книга не може да се импортира два пъти
- **Корици** — embedded EPUB cover или Rulit cover art

---

## Screenshots

| Library | Book detail | Player | Reader |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/library.png" alt="Library" width="180" /> | <img src="docs/screenshots/detail.png" alt="Detail" width="180" /> | <img src="docs/screenshots/player.png" alt="Player" width="180" /> | <img src="docs/screenshots/reader.png" alt="Reader" width="180" /> |

| Import / Rulit |
| :---: |
| <img src="docs/screenshots/import.png" alt="Import" width="180" /> |

> Добави PNG файлове в [`docs/screenshots/`](docs/screenshots/) (`library.png`, `detail.png`, `player.png`, `reader.png`, `import.png`), за да се покажат в таблицата.

---

## Технологии

| Слой | Stack |
| --- | --- |
| **Mobile** | [Expo SDK 57](https://expo.dev), [React Native 0.86](https://reactnative.dev), React 19, TypeScript |
| **UI** | Cinzel / Lora / IM Fell English fonts, expo-linear-gradient, custom parchment theme |
| **Storage** | AsyncStorage (metadata) + expo-file-system (chapter text & covers per book) |
| **Import** | Custom EPUB/TXT/PDF parsers (JSZip за EPUB) |
| **TTS** | expo-speech, expo-audio |
| **Catalog** | Rulit API (`/api/rulit/*`) via backend |
| **Summaries** | Backend API (`book-app-bice-phi.vercel.app`) |
| **Testing** | Maestro E2E flows |
| **Build** | Gradle local APK (Windows-friendly), optional EAS cloud builds |

---

## APK downloads

Локалните release билдове се качват автоматично в [`releases/`](releases/) и се push-ват към GitHub след успешен `npm run build:android`.

<!-- APK_RELEASES_START -->
| Version | Build | APK | Date | Size |
| --- | --- | --- | --- | --- |
| **1.0.1** | 2 (Release) | [Download](https://github.com/jivko25/Mobile-Book-App/raw/main/releases/shakes-pear-v1.0.1-release.apk) | 2026-09-09 | 32.5 MB |
<!-- APK_RELEASES_END -->

> Директен линк формат: `https://github.com/jivko25/Mobile-Book-App/raw/main/releases/shakes-pear-vX.Y.Z-release.apk`

---

## Development

### Prerequisites

- Node.js 20+
- Android SDK (за локален APK билд)
- Expo Go или Android emulator (за dev)

### Install & run

```bash
npm install
npm start
```

### Lint

```bash
npm run lint
```

### Local Android APK (release)

```bash
npm run build:android
```

При всеки **release** билд скриптът:

1. Вдига patch версията (`1.0.0` → `1.0.1`) в `package.json` и `app.json`
2. Увеличава `android.versionCode`
3. Сглобява APK чрез `expo prebuild` + Gradle
4. Копира файла в `releases/shakes-pear-v{version}-release.apk`
5. Обновява таблицата с APK-та в този README
6. Commit + push към GitHub

### Build flags

| Command | Description |
| --- | --- |
| `npm run build:android` | Release APK + bump + publish |
| `npm run build:android:local:debug` | Debug APK, без bump/publish |
| `node scripts/build-android-apk.js --no-publish` | Release без git push |
| `node scripts/build-android-apk.js --no-bump` | Билд без version bump |
| `node scripts/build-android-apk.js --fresh` | Изтрива `android/` и пуска expo prebuild |
| `SKIP_RELEASE_PUSH=1 npm run build:android` | Билд без commit/push |

> **Windows:** повторните билдове **не** пускат `expo prebuild` (избягва EBUSY lock). Използвай `--fresh` само когато промениш native plugins в `app.json`.

### Cloud builds (EAS)

```bash
npm run build:android:cloud
npm run build:android:cloud:preview
```

---

## Project structure

```
src/
  components/     UI (BookCover, modals, progress, Rulit browse)
  screens/        Library, Detail, Player, Reader, Import, Settings
  services/       import parsers, storage, TTS, Rulit API
  theme/          colors, fonts, book palettes
  hooks/          chapter player
releases/         Published APK files + manifest.json
docs/screenshots/ App screenshots for README
maestro/flows/    E2E test flows
scripts/          Local Android build & release automation
```

---

## Backend

- **Summaries:** `https://book-app-bice-phi.vercel.app`
- **Rulit proxy:** same backend (`/api/rulit/*`)

---

## License

Private project — all rights reserved.
