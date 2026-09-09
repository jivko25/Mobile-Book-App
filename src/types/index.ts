export type Screen =
  | 'library'
  | 'import'
  | 'processing'
  | 'detail'
  | 'player'
  | 'search'
  | 'settings';

export type ImportFormat = 'epub' | 'pdf' | 'txt';

export interface Chapter {
  id: number;
  numeral: string;
  title: string;
  duration: string;
  progress: number;
  /** Parsed chapter text — used for TTS in phase 2 */
  content: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  narrator: string;
  year: string;
  genre: string;
  bg: string;
  accent: string;
  progress: number;
  totalDuration: string;
  lastChapterId?: number;
  lastPosition?: string;
  synopsis: string;
  chapters: Chapter[];
  /** URI to the original file on device — we don't copy the file */
  fileUri: string;
  fileFormat: ImportFormat;
  importedAt: string;
}

export interface PendingImport {
  uri: string;
  format: ImportFormat;
  fileName: string;
}

export interface ParsedChapter {
  title: string;
  content: string;
}

export interface ParsedBook {
  title: string;
  author: string;
  synopsis: string;
  chapters: ParsedChapter[];
}

export interface SummaryRequest {
  chapter_text: string;
  book_title?: string;
  chapter_title?: string;
  chapter_numeral?: string;
}

export interface SummaryResponse {
  summary: string;
}

export interface ApiErrorResponse {
  detail: string;
}

export class SummaryServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'SummaryServiceError';
  }
}

export interface RulitBookListItem {
  id: string;
  title: string;
  author: string;
  language: string;
  year: string | null;
  genre: string | null;
  rating: number | null;
  coverUrl: string | null;
  pageUrl: string;
  formats: string[];
  epubSizeKb: number | null;
}

export interface RulitCatalogResponse {
  page: number;
  hasNext: boolean;
  items: RulitBookListItem[];
}

export interface RulitFormatInfo {
  type: string;
  sizeKb: number | null;
}

export interface RulitDownloadInfo {
  url: string;
  fileName: string;
}

export interface RulitBookDetail extends Omit<RulitBookListItem, 'formats'> {
  authors: string[];
  series: string | null;
  synopsis: string | null;
  formats: RulitFormatInfo[];
  download: {
    epub?: RulitDownloadInfo;
  };
}

export interface RulitDownloadUrlResponse {
  bookId: string;
  format: string;
  url: string;
  fileName: string;
  resolvedUrl: string | null;
}

export class RulitServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'RulitServiceError';
  }
}
