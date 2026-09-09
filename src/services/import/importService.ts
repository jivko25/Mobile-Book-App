import { File, Paths } from 'expo-file-system';
import {
  Book,
  ImportFormat,
  ParsedBook,
  ParsedCoverImage,
  PendingImport,
} from '../../types';
import { applyPaletteIndex } from '../../theme/bookPalettes';
import {
  addBook,
  estimateDuration,
  estimateTotalDuration,
  getNextBookPaletteIndex,
  toRomanNumeral,
  writeBookCover,
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

function isRemoteUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function isFileUri(uri: string): boolean {
  return uri.startsWith('file://');
}

function cacheDestPath(fileName: string): File {
  return new File(
    Paths.cache,
    `import-${Date.now()}-${sanitizeFileName(fileName)}`,
  );
}

async function fetchBytes(uri: string): Promise<Uint8Array> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Could not download file (HTTP ${response.status}).`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function downloadRemoteFile(uri: string, fileName: string): Promise<File> {
  const dest = cacheDestPath(fileName);

  try {
    return await File.downloadFileAsync(uri, dest, { idempotent: true });
  } catch {
    const bytes = await fetchBytes(uri);
    dest.create({ overwrite: true });
    dest.write(bytes);
    return dest;
  }
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

/** Materialize picked or remote files into app cache for reliable reads. */
async function openImportFile(uri: string, fileName: string): Promise<File> {
  if (isRemoteUri(uri)) {
    return downloadRemoteFile(uri, fileName);
  }

  if (isFileUri(uri)) {
    const source = new File(uri);
    if (source.exists) {
      return source;
    }
  }

  const dest = cacheDestPath(fileName);

  try {
    const source = new File(uri);
    await source.copy(dest, { overwrite: true });
    if (dest.exists) return dest;
  } catch {
    // copy() can fail for some content:// URIs — write via fetch instead.
  }

  const bytes = await fetchBytes(uri);
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

function generateBookId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function extensionFromContentType(contentType: string): string {
  const lower = contentType.toLowerCase();
  if (lower.includes('png')) return 'png';
  if (lower.includes('webp')) return 'webp';
  if (lower.includes('gif')) return 'gif';
  return 'jpg';
}

async function persistBookCover(
  bookId: string,
  embedded?: ParsedCoverImage | null,
  remoteUrl?: string | null,
): Promise<string | null> {
  if (remoteUrl) {
    try {
      const response = await fetch(remoteUrl);
      if (response.ok) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length >= 64) {
          const ext = extensionFromContentType(response.headers.get('content-type') ?? '');
          return writeBookCover(bookId, bytes, ext);
        }
      }
    } catch {
      // Fall back to embedded EPUB cover below.
    }
  }

  if (embedded) {
    try {
      return writeBookCover(bookId, embedded.bytes, embedded.extension);
    } catch {
      return null;
    }
  }

  return null;
}

function parsedToBook(
  parsed: ParsedBook,
  pending: PendingImport,
  paletteIndex: number,
  bookId: string,
  coverUri: string | null,
): Book {
  const palette = applyPaletteIndex(paletteIndex);
  const importedAt = new Date().toISOString();

  const chapters = parsed.chapters.map((ch, i) => ({
    id: i + 1,
    numeral: toRomanNumeral(i + 1),
    title: ch.title,
    content: ch.content,
    duration: estimateDuration(ch.content),
    progress: 0,
    readProgress: 0,
    readCharOffset: 0,
  }));

  return {
    id: bookId,
    title: parsed.title,
    author: parsed.author,
    narrator: 'Системен глас',
    year: new Date().getFullYear().toString(),
    genre: 'Imported',
    bg: palette.bg,
    accent: palette.accent,
    paletteIndex: palette.paletteIndex,
    coverUri,
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
  const bookId = generateBookId();
  const coverUri = await persistBookCover(
    bookId,
    parsed.coverImage,
    pending.coverUrl,
  );
  const paletteIndex = await getNextBookPaletteIndex();
  const book = parsedToBook(parsed, pending, paletteIndex, bookId, coverUri);
  try {
    await addBook(book);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not save this book.';
    if (message.includes('CursorWindow') || message.includes('Row too big')) {
      throw new Error(
        'Book is too large for device storage. Clear app data and try again.',
      );
    }
    throw error;
  }

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
