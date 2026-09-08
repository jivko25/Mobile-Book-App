import { ParsedBook, ParsedChapter } from '../../../types';

const CHAPTER_PATTERNS = [
  /^(?:chapter|act|part|book|section|глава)\s+([IVXLCDM\d]+)[:\s\-–—]*(.*)$/i,
  /^([IVXLCDM]+)\.\s+(.+)$/,
  /^(\d+)\.\s+(.+)$/,
  /^#{1,3}\s+(.+)$/,
];

function stripExtension(name: string): string {
  return name.replace(/\.(txt|epub|pdf)$/i, '');
}

function titleFromFilename(fileName: string): string {
  return stripExtension(fileName).replace(/[-_]/g, ' ').trim();
}

function splitByPattern(text: string): ParsedChapter[] | null {
  const lines = text.split(/\r?\n/);
  const chapters: ParsedChapter[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  const flush = () => {
    const content = currentLines.join('\n').trim();
    if (content.length > 0) {
      chapters.push({
        title: currentTitle || `Section ${chapters.length + 1}`,
        content,
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    let matched = false;

    for (const pattern of CHAPTER_PATTERNS) {
      const m = trimmed.match(pattern);
      if (m && trimmed.length < 120) {
        flush();
        currentTitle = m[2]?.trim() || m[1]?.trim() || trimmed;
        matched = true;
        break;
      }
    }

    if (!matched) {
      currentLines.push(line);
    }
  }

  flush();
  return chapters.length > 1 ? chapters : null;
}

function splitByDoubleNewline(text: string): ParsedChapter[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 80);

  if (blocks.length <= 1) {
    return [{ title: 'Full Text', content: text.trim() }];
  }

  return blocks.map((content, i) => {
    const firstLine = content.split('\n')[0]?.trim() ?? '';
    const useFirstLineAsTitle =
      firstLine.length > 0 && firstLine.length < 80 && !firstLine.endsWith('.');
    return {
      title: useFirstLineAsTitle ? firstLine : `Section ${i + 1}`,
      content: useFirstLineAsTitle ? content.slice(firstLine.length).trim() : content,
    };
  });
}

function buildSynopsis(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 280) return clean;
  const cut = clean.slice(0, 280);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : 280)}…`;
}

export function parseTxt(content: string, fileName: string): ParsedBook {
  const normalized = content.replace(/^\uFEFF/, '').trim();
  if (!normalized) {
    throw new Error('The file appears to be empty.');
  }

  const byPattern = splitByPattern(normalized);
  const chapters = byPattern ?? splitByDoubleNewline(normalized);
  const fullText = chapters.map((c) => c.content).join('\n\n');

  return {
    title: titleFromFilename(fileName),
    author: 'Unknown Author',
    synopsis: buildSynopsis(fullText),
    chapters,
  };
}
