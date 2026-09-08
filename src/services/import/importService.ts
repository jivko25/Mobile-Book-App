import * as FileSystem from 'expo-file-system/legacy';
import {
  Book,
  ImportFormat,
  ParsedBook,
  PendingImport,
} from '../../types';
import {
  addBook,
  estimateDuration,
  estimateTotalDuration,
  pickPalette,
  toRomanNumeral,
} from '../storage/libraryStorage';
import { parseTxt } from './parsers/txtParser';
import { parseEpub } from './parsers/epubParser';
import { parsePdf } from './parsers/pdfParser';

export type ImportStep =
  | 'reading'
  | 'parsing'
  | 'chapters'
  | 'saving'
  | 'done';

export const IMPORT_STEPS: Record<ImportStep, string> = {
  reading: 'Reading manuscript…',
  parsing: 'Parsing structure…',
  chapters: 'Dividing into chapters…',
  saving: 'Cataloguing your volume…',
  done: 'Volume ready.',
};

async function readFile(uri: string, format: ImportFormat): Promise<string> {
  if (format === 'txt') {
    return FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
  }
  return FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
}

async function parseFile(
  raw: string,
  format: ImportFormat,
  fileName: string,
): Promise<ParsedBook> {
  switch (format) {
    case 'txt':
      return parseTxt(raw, fileName);
    case 'epub':
      return parseEpub(raw, fileName);
    case 'pdf':
      return parsePdf(raw, fileName);
  }
}

function parsedToBook(
  parsed: ParsedBook,
  pending: PendingImport,
): Book {
  const palette = pickPalette(parsed.title);
  const importedAt = new Date().toISOString();

  const chapters = parsed.chapters.map((ch, i) => ({
    id: i + 1,
    numeral: toRomanNumeral(i + 1),
    title: ch.title,
    content: ch.content,
    duration: estimateDuration(ch.content),
    progress: 0,
  }));

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: parsed.title,
    author: parsed.author,
    narrator: 'Системен глас',
    year: new Date().getFullYear().toString(),
    genre: 'Imported',
    bg: palette.bg,
    accent: palette.accent,
    progress: 0,
    totalDuration: estimateTotalDuration(parsed.chapters),
    synopsis: parsed.synopsis,
    chapters,
    fileUri: pending.uri,
    fileFormat: pending.format,
    importedAt,
  };
}

export async function importVolume(
  pending: PendingImport,
  onStep?: (step: ImportStep) => void,
): Promise<Book> {
  onStep?.('reading');
  const raw = await readFile(pending.uri, pending.format);

  onStep?.('parsing');
  const parsed = await parseFile(raw, pending.format, pending.fileName);

  onStep?.('chapters');
  if (parsed.chapters.length === 0) {
    throw new Error('No chapters could be extracted from this file.');
  }

  onStep?.('saving');
  const book = parsedToBook(parsed, pending);
  await addBook(book);

  onStep?.('done');
  return book;
}

export function formatFromMime(mime: string | null | undefined): ImportFormat | null {
  if (!mime) return null;
  if (mime.includes('epub')) return 'epub';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('text')) return 'txt';
  return null;
}

export function formatFromName(name: string): ImportFormat | null {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'epub') return 'epub';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'txt';
  return null;
}
