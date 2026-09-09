export interface ChapterBlock {
  id: string;
  text: string;
  startOffset: number;
}

const SCROLL_BLOCK_CHARS = 600;

export function splitChapterIntoBlocks(
  content: string,
  maxBlockChars = SCROLL_BLOCK_CHARS,
): ChapterBlock[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const rawParts = normalized.split(/\n\s*\n/);
  const chunks: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxBlockChars) {
      chunks.push(trimmed);
      continue;
    }

    let remaining = trimmed;
    while (remaining.length > maxBlockChars) {
      let cut = remaining.lastIndexOf('. ', maxBlockChars);
      if (cut < maxBlockChars * 0.5) {
        cut = remaining.lastIndexOf(' ', maxBlockChars);
      }
      if (cut <= 0) cut = maxBlockChars;
      chunks.push(remaining.slice(0, cut + 1).trim());
      remaining = remaining.slice(cut + 1).trim();
    }

    if (remaining) chunks.push(remaining);
  }

  if (chunks.length === 0) {
    chunks.push(normalized);
  }

  let searchFrom = 0;
  return chunks.map((text, index) => {
    const found = normalized.indexOf(text, searchFrom);
    const startOffset = found >= 0 ? found : searchFrom;
    searchFrom = startOffset + text.length;
    return { id: `block-${index}`, text, startOffset };
  });
}

export function charOffsetFromProgress(
  progress: number,
  totalLength: number,
): number {
  if (totalLength <= 0 || progress <= 0) return 0;
  return Math.min(totalLength, Math.round((progress / 100) * totalLength));
}

export function progressFromCharOffset(
  charOffset: number,
  totalLength: number,
): number {
  if (totalLength <= 0) return 0;
  return Math.min(100, Math.round((charOffset / totalLength) * 100));
}

export function segmentIndexAtCharOffset(
  segments: ChapterBlock[],
  charOffset: number,
): number {
  if (segments.length === 0 || charOffset <= 0) return 0;

  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i].startOffset <= charOffset) return i;
  }

  return 0;
}

export function blockIndexAtProgress(
  blocks: ChapterBlock[],
  progress: number,
  totalLength: number,
): number {
  return segmentIndexAtCharOffset(
    blocks,
    charOffsetFromProgress(progress, totalLength),
  );
}

export function progressFromBlockIndex(
  blocks: ChapterBlock[],
  index: number,
  totalLength: number,
): number {
  if (blocks.length === 0 || totalLength <= 0) return 0;

  const block = blocks[Math.min(Math.max(0, index), blocks.length - 1)];
  const charPos = block.startOffset + block.text.length;
  return progressFromCharOffset(charPos, totalLength);
}

export function charOffsetFromSegmentIndex(
  segments: ChapterBlock[],
  index: number,
): number {
  if (segments.length === 0) return 0;
  const segment = segments[Math.min(Math.max(0, index), segments.length - 1)];
  return segment.startOffset + segment.text.length;
}

export type ReaderPage = ChapterBlock;

function pageLineCapacity(
  fontSize: number,
  pageWidth: number,
  pageHeight: number,
): { maxLines: number; charsPerLine: number } {
  const horizontalPad = 36;
  const verticalPad = 32;
  const lineHeight = fontSize * 1.75;
  const maxLines = Math.max(
    3,
    Math.floor((pageHeight - verticalPad) / lineHeight) - 2,
  );
  const charsPerLine = Math.max(
    8,
    Math.floor((pageWidth - horizontalPad) / (fontSize * 0.56)),
  );

  return { maxLines, charsPerLine };
}

export function splitChapterIntoPages(
  content: string,
  fontSize: number,
  pageWidth: number,
  pageHeight: number,
): ReaderPage[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  if (pageWidth <= 0 || pageHeight <= 0) {
    return [{ id: 'page-0', text: normalized, startOffset: 0 }];
  }

  const { maxLines, charsPerLine } = pageLineCapacity(
    fontSize,
    pageWidth,
    pageHeight,
  );

  const words = [...normalized.matchAll(/\S+/g)].map((match) => ({
    text: match[0],
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));

  if (words.length === 0) {
    return [{ id: 'page-0', text: normalized, startOffset: 0 }];
  }

  const pages: ReaderPage[] = [];
  let pageLines: string[] = [];
  let pageStartWord = 0;
  let pageEndWord = -1;
  let line = '';

  const flushPage = () => {
    if (pageLines.length === 0 || pageEndWord < pageStartWord) return;

    const startOffset = words[pageStartWord].start;
    const text = pageLines.join('\n').trim();

    if (text) {
      pages.push({
        id: `page-${pages.length}`,
        text,
        startOffset,
      });
    }

    pageLines = [];
    pageStartWord = pageEndWord + 1;
    pageEndWord = pageStartWord - 1;
    line = '';
  };

  const pushLine = () => {
    if (!line) return;
    pageLines.push(line);
    line = '';
    if (pageLines.length >= maxLines) flushPage();
  };

  for (let i = 0; i < words.length; i++) {
    const word = words[i].text;
    if (pageEndWord < pageStartWord) {
      pageStartWord = i;
    }

    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= charsPerLine) {
      line = candidate;
      pageEndWord = i;
      continue;
    }

    pushLine();

    if (word.length > charsPerLine) {
      let rest = word;
      while (rest.length > charsPerLine) {
        pageLines.push(rest.slice(0, charsPerLine));
        pageEndWord = i;
        if (pageLines.length >= maxLines) flushPage();
        rest = rest.slice(charsPerLine);
      }
      line = rest;
      pageEndWord = i;
      continue;
    }

    line = word;
    pageEndWord = i;
  }

  pushLine();
  flushPage();

  if (pages.length === 0) {
    pages.push({ id: 'page-0', text: normalized, startOffset: 0 });
  }

  return pages;
}

export function pageIndexAtProgress(
  pages: ReaderPage[],
  progress: number,
  totalLength: number,
): number {
  return blockIndexAtProgress(pages, progress, totalLength);
}

export function progressFromPageIndex(
  pages: ReaderPage[],
  index: number,
  totalLength: number,
): number {
  return progressFromBlockIndex(pages, index, totalLength);
}
