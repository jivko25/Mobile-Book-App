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
