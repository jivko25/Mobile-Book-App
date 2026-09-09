import { File, Paths } from 'expo-file-system';
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

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, '_').slice(0, 80) || 'import';
}

async function readFileBytes(file: File): Promise<Uint8Array> {
  if (file.exists) {
    try {
      return await file.bytes();
    } catch {
      // Fall back to fetch below.
    }
  }

  const response = await fetch(file.uri);
  if (!response.ok) {
    throw new Error(`Could not read file (HTTP ${response.status}).`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function readFileText(file: File): Promise<string> {
  if (file.exists) {
    try {
      return await file.text();
    } catch {
      // Fall back to fetch below.
    }
  }

  const response = await fetch(file.uri);
  if (!response.ok) {
    throw new Error(`Could not read file (HTTP ${response.status}).`);
  }
  return response.text();
}

/** Materialize picked files into app cache for reliable reads on Android. */
async function openImportFile(uri: string, fileName: string): Promise<File> {
  const source = new File(uri);

  if (uri.startsWith('file://') && source.exists) {
    return source;
  }

  const dest = new File(
    Paths.cache,
    `import-${Date.now()}-${sanitizeFileName(fileName)}`,
  );

  try {
    await source.copy(dest, { overwrite: true });
    if (dest.exists) return dest;
  } catch {
    // copy() can fail for some content:// URIs — write via fetch instead.
  }

  const bytes = await readFileBytes(source);
  dest.create({ overwrite: true });
  dest.write(bytes);
  return dest;
}

async function parseImportFile(
  file: File,
  format: ImportFormat,
  fileName: string,
): Promise<ParsedBook> {
  switch (format) {
    case 'txt':
      return parseTxt(await readFileText(file), fileName);
    case 'epub':
      return parseEpub(await readFileBytes(file), fileName);
    case 'pdf':
      return parsePdf(await file.base64(), fileName);
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
  const file = await openImportFile(pending.uri, pending.fileName);

  onStep?.('parsing');
  const parsed = await parseImportFile(file, pending.format, pending.fileName);

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
