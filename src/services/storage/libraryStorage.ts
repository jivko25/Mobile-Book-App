import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, ImportFormat } from '../../types';

const STORAGE_KEY = '@folio/library';

const PALETTES = [
  { bg: '#2C1810', accent: '#C9A84C' },
  { bg: '#1A2818', accent: '#A04040' },
  { bg: '#1B2D3D', accent: '#6B9FB8' },
  { bg: '#2A1F3D', accent: '#9B7DC4' },
  { bg: '#1F2A1A', accent: '#8B7355' },
  { bg: '#2D1F1F', accent: '#C4785A' },
];

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

export async function loadBooks(): Promise<Book[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Book[];
}

export async function saveBooks(books: Book[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export async function addBook(book: Book): Promise<void> {
  const books = await loadBooks();
  books.unshift(book);
  await saveBooks(books);
}

export async function getRecentImports(limit = 5): Promise<
  { title: string; type: ImportFormat; date: string; id: string }[]
> {
  const books = await loadBooks();
  return books.slice(0, limit).map((b) => ({
    id: b.id,
    title: b.title,
    type: b.fileFormat,
    date: formatImportDate(b.importedAt),
  }));
}

export async function getBookById(bookId: string): Promise<Book | null> {
  const books = await loadBooks();
  return books.find((b) => b.id === bookId) ?? null;
}

export async function updateListeningProgress(
  bookId: string,
  chapterId: number,
  progress: number,
): Promise<Book | null> {
  const books = await loadBooks();
  const bookIndex = books.findIndex((b) => b.id === bookId);
  if (bookIndex === -1) return null;

  const book = { ...books[bookIndex] };
  const chapterIndex = book.chapters.findIndex((c) => c.id === chapterId);
  if (chapterIndex === -1) return null;

  const rounded = Math.min(100, Math.round(progress));

  book.chapters = book.chapters.map((ch, i) =>
    i === chapterIndex ? { ...ch, progress: rounded } : ch,
  );

  book.lastChapterId = chapterId;
  book.progress = Math.round(
    book.chapters.reduce((sum, ch) => sum + ch.progress, 0) / book.chapters.length,
  );

  books[bookIndex] = book;
  await saveBooks(books);
  return book;
}

export async function markChapterHeard(
  bookId: string,
  chapterId: number,
): Promise<Book | null> {
  return updateListeningProgress(bookId, chapterId, 100);
}
