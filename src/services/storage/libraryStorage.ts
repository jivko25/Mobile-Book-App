import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Book, Chapter, ImportFormat } from '../../types';

const BOOK_IDS_KEY = '@folio/library-ids';
const LEGACY_KEYS = ['@folio/library-index-v2', '@folio/library'];
const LIBRARY_DIR = 'shakes-pear-library';

const PALETTES = [
  { bg: '#2C1810', accent: '#C9A84C' },
  { bg: '#1A2818', accent: '#A04040' },
  { bg: '#1B2D3D', accent: '#6B9FB8' },
  { bg: '#2A1F3D', accent: '#9B7DC4' },
  { bg: '#1F2A1A', accent: '#8B7355' },
  { bg: '#2D1F1F', accent: '#C4785A' },
];

type StoredChapter = Omit<Chapter, 'content'>;
type StoredBook = Omit<Book, 'chapters'> & { chapters: StoredChapter[] };

let migrationDone = false;

function bookMetaKey(bookId: string): string {
  return `@folio/book-meta/${bookId}`;
}

export function pickPalette(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export function toRomanNumeral(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  let num = n;
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}

export function estimateDuration(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 140));
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

export function estimateTotalDuration(chapters: { content: string }[]): string {
  const totalWords = chapters.reduce(
    (sum, ch) => sum + ch.content.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  const minutes = Math.max(1, Math.round(totalWords / 140));
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

export function formatImportDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString();
}

function getLibraryRoot(): Directory {
  const root = new Directory(Paths.document, LIBRARY_DIR);
  if (!root.exists) {
    root.create({ intermediates: true });
  }
  return root;
}

function getBookDirectory(bookId: string): Directory {
  const dir = new Directory(getLibraryRoot(), bookId);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

function getChapterFile(bookId: string, chapterId: number): File {
  return new File(getBookDirectory(bookId), `chapter-${chapterId}.txt`);
}

function writeChapterContent(
  bookId: string,
  chapterId: number,
  content: string,
): void {
  const file = getChapterFile(bookId, chapterId);
  file.create({ overwrite: true });
  file.write(content);
}

async function readChapterContent(
  bookId: string,
  chapterId: number,
): Promise<string> {
  const file = getChapterFile(bookId, chapterId);
  if (!file.exists) return '';
  return file.text();
}

function toStoredBook(book: Book): StoredBook {
  return {
    ...book,
    chapters: book.chapters.map(({ content: _content, ...meta }) => meta),
  };
}

function stripContent(stored: StoredBook): Book {
  return {
    ...stored,
    chapters: stored.chapters.map((meta) => ({ ...meta, content: '' })),
  };
}

async function safeRemoveItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Row may be too large to read/delete on some Android builds — ignore.
  }
}

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    await safeRemoveItem(key);
    return null;
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

async function loadBookIds(): Promise<string[]> {
  const raw = await safeGetItem(BOOK_IDS_KEY);
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw) as string[];
    return Array.isArray(ids) ? ids : [];
  } catch {
    await safeRemoveItem(BOOK_IDS_KEY);
    return [];
  }
}

async function saveBookIds(ids: string[]): Promise<void> {
  await safeSetItem(BOOK_IDS_KEY, JSON.stringify(ids));
}

async function saveBookMeta(stored: StoredBook): Promise<void> {
  await safeSetItem(bookMetaKey(stored.id), JSON.stringify(stored));
}

async function loadBookMeta(bookId: string): Promise<StoredBook | null> {
  const raw = await safeGetItem(bookMetaKey(bookId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredBook | Book;
    if (!parsed?.id) return null;

    if (
      parsed.chapters?.[0] &&
      'content' in parsed.chapters[0] &&
      typeof (parsed.chapters[0] as Chapter).content === 'string' &&
      (parsed.chapters[0] as Chapter).content.length > 0
    ) {
      const full = parsed as Book;
      for (const chapter of full.chapters) {
        if (chapter.content) {
          writeChapterContent(full.id, chapter.id, chapter.content);
        }
      }
      const slim = toStoredBook(full);
      await saveBookMeta(slim);
      return slim;
    }

    return parsed as StoredBook;
  } catch {
    await safeRemoveItem(bookMetaKey(bookId));
    return null;
  }
}

async function migrateLegacyMonolithicKeys(): Promise<void> {
  for (const legacyKey of LEGACY_KEYS) {
    const raw = await safeGetItem(legacyKey);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as Book[];
      if (!Array.isArray(parsed)) continue;

      const ids = await loadBookIds();
      const nextIds = [...ids];

      for (const book of parsed) {
        if (!book?.id) continue;

        for (const chapter of book.chapters ?? []) {
          if (chapter.content) {
            writeChapterContent(book.id, chapter.id, chapter.content);
          }
        }

        await saveBookMeta(toStoredBook(book));
        if (!nextIds.includes(book.id)) {
          nextIds.unshift(book.id);
        }
      }

      await saveBookIds(nextIds);
    } catch {
      // Could not parse legacy blob — drop it.
    } finally {
      await safeRemoveItem(legacyKey);
    }
  }
}

async function ensureMigration(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;
  await migrateLegacyMonolithicKeys();
}

async function loadStoredBooks(): Promise<StoredBook[]> {
  await ensureMigration();

  const ids = await loadBookIds();
  const books: StoredBook[] = [];

  for (const id of ids) {
    const meta = await loadBookMeta(id);
    if (meta) books.push(meta);
  }

  return books;
}

export async function loadBooks(): Promise<Book[]> {
  try {
    const stored = await loadStoredBooks();
    return stored.map(stripContent);
  } catch {
    return [];
  }
}

export async function addBook(book: Book): Promise<void> {
  for (const chapter of book.chapters) {
    writeChapterContent(book.id, chapter.id, chapter.content);
  }

  const stored = toStoredBook(book);
  await saveBookMeta(stored);

  const ids = await loadBookIds();
  const nextIds = [book.id, ...ids.filter((id) => id !== book.id)];
  await saveBookIds(nextIds);
}

export async function getRecentImports(limit = 5): Promise<
  { title: string; type: ImportFormat; date: string; id: string }[]
> {
  const books = await loadStoredBooks();
  return books.slice(0, limit).map((b) => ({
    id: b.id,
    title: b.title,
    type: b.fileFormat,
    date: formatImportDate(b.importedAt),
  }));
}

export async function getBookById(bookId: string): Promise<Book | null> {
  const stored = await loadBookMeta(bookId);
  return stored ? stripContent(stored) : null;
}

export async function getChapterWithContent(
  bookId: string,
  chapterId: number,
): Promise<Chapter | null> {
  const stored = await loadBookMeta(bookId);
  if (!stored) return null;

  const meta = stored.chapters.find((c) => c.id === chapterId);
  if (!meta) return null;

  return {
    ...meta,
    content: await readChapterContent(bookId, chapterId),
  };
}

export async function updateListeningProgress(
  bookId: string,
  chapterId: number,
  progress: number,
): Promise<Book | null> {
  const stored = await loadBookMeta(bookId);
  if (!stored) return null;

  const chapterIndex = stored.chapters.findIndex((c) => c.id === chapterId);
  if (chapterIndex === -1) return null;

  const rounded = Math.min(100, Math.round(progress));

  const updated: StoredBook = {
    ...stored,
    chapters: stored.chapters.map((ch, i) =>
      i === chapterIndex ? { ...ch, progress: rounded } : ch,
    ),
    lastChapterId: chapterId,
    progress: Math.round(
      stored.chapters.reduce(
        (sum, ch, i) => sum + (i === chapterIndex ? rounded : ch.progress),
        0,
      ) / stored.chapters.length,
    ),
  };

  await saveBookMeta(updated);
  return stripContent(updated);
}

export async function markChapterHeard(
  bookId: string,
  chapterId: number,
): Promise<Book | null> {
  return updateListeningProgress(bookId, chapterId, 100);
}

/** Clears oversized legacy SQLite rows — call if storage errors persist. */
export async function resetLibraryStorage(): Promise<void> {
  for (const key of LEGACY_KEYS) {
    await safeRemoveItem(key);
  }
  await safeRemoveItem(BOOK_IDS_KEY);
}
