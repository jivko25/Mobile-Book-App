/** ~38 words ≈ 15 seconds at 140 wpm (Bulgarian narration pace) */
const WORDS_PER_UNIT = 38;
/** Android TTS rejects inputs near ~4000 chars — stay safely under. */
const MAX_UNIT_CHARS = 3500;
const WORDS_PER_MINUTE = 140;

export interface SpeakUnit {
  text: string;
  startSec: number;
  durationSec: number;
}

export interface SpeakWord {
  text: string;
  startSec: number;
  durationSec: number;
}

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const parts =
    normalized.match(/[^.!?…]+[.!?…]+["']?\s*|[^.!?…]+$/g) ?? [normalized];

  return parts.map((p) => p.trim()).filter(Boolean);
}

function unitDurationSec(wordCount: number, speed: number): number {
  return (wordCount / WORDS_PER_MINUTE) * 60 / speed;
}

function splitLongSentence(sentence: string, maxWords: number): string[] {
  const tokens = sentence.split(/\s+/).filter(Boolean);
  if (tokens.length <= maxWords) return [sentence.trim()].filter(Boolean);

  const parts: string[] = [];
  for (let i = 0; i < tokens.length; i += maxWords) {
    parts.push(tokens.slice(i, i + maxWords).join(' '));
  }
  return parts;
}

function splitByCharLimit(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const parts: string[] = [];
  let remaining = text.trim();
  while (remaining.length > maxChars) {
    let cut = remaining.lastIndexOf(' ', maxChars);
    if (cut <= 0) cut = maxChars;
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

export function buildTimeline(
  text: string,
  speed: number,
): { units: SpeakUnit[]; totalSec: number } {
  const sentences = splitSentences(text);
  const units: SpeakUnit[] = [];
  let batch: string[] = [];
  let batchWords = 0;
  let cursor = 0;

  const flush = () => {
    if (batch.length === 0) return;
    const unitText = batch.join(' ');
    const duration = unitDurationSec(batchWords, speed);
    for (const part of splitByCharLimit(unitText, MAX_UNIT_CHARS)) {
      const partWords = part.split(/\s+/).filter(Boolean).length;
      const partDuration = unitDurationSec(partWords, speed);
      units.push({ text: part, startSec: cursor, durationSec: partDuration });
      cursor += partDuration;
    }
    batch = [];
    batchWords = 0;
  };

  for (const sentence of sentences) {
    for (const chunk of splitLongSentence(sentence, WORDS_PER_UNIT)) {
      const words = chunk.split(/\s+/).filter(Boolean).length;
      if (batchWords + words > WORDS_PER_UNIT && batch.length > 0) {
        flush();
      }
      batch.push(chunk);
      batchWords += words;
    }
  }

  flush();

  if (units.length === 0 && text.trim()) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const duration = unitDurationSec(words, speed);
    units.push({ text: text.trim(), startSec: 0, durationSec: duration });
    cursor = duration;
  }

  return { units, totalSec: cursor };
}

export function estimateSeconds(text: string, speed = 1): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round((words / WORDS_PER_MINUTE) * 60 / speed));
}

export function formatPlaybackTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function progressToSeconds(progress: number, totalSec: number): number {
  return (progress / 100) * totalSec;
}

export function secondsToProgress(seconds: number, totalSec: number): number {
  if (totalSec <= 0) return 0;
  return Math.min(100, Math.round((seconds / totalSec) * 100));
}

export function findUnitIndexAtTime(units: SpeakUnit[], seconds: number): number {
  if (units.length === 0) return 0;
  const clamped = Math.max(0, Math.min(seconds, units[units.length - 1].startSec + units[units.length - 1].durationSec));
  for (let i = 0; i < units.length; i++) {
    const end = units[i].startSec + units[i].durationSec;
    if (clamped < end || i === units.length - 1) return i;
  }
  return units.length - 1;
}

/** Word-level timeline for karaoke-style highlighting (estimated from WPM). */
export function buildWordTimeline(
  text: string,
  speed: number,
): { words: SpeakWord[]; totalSec: number } {
  const tokens = text.match(/\S+/g) ?? [];
  const words: SpeakWord[] = [];
  let cursor = 0;

  for (const token of tokens) {
    const duration = unitDurationSec(1, speed);
    words.push({ text: token, startSec: cursor, durationSec: duration });
    cursor += duration;
  }

  return { words, totalSec: cursor };
}

export function findWordIndexAtTime(words: SpeakWord[], seconds: number): number {
  if (words.length === 0) return 0;
  const last = words[words.length - 1];
  const clamped = Math.max(0, Math.min(seconds, last.startSec + last.durationSec));

  for (let i = 0; i < words.length; i++) {
    const end = words[i].startSec + words[i].durationSec;
    if (clamped < end || i === words.length - 1) return i;
  }

  return words.length - 1;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function secondsPerWord(speed: number): number {
  return unitDurationSec(1, speed);
}

/** O(1) word index — avoids building a full word timeline for long chapters. */
export function wordIndexAtTime(
  seconds: number,
  speed: number,
  wordCount: number,
): number {
  if (wordCount <= 0) return 0;
  const idx = Math.floor(Math.max(0, seconds) / secondsPerWord(speed));
  return Math.min(idx, wordCount - 1);
}

export function tokenizeWords(text: string): string[] {
  return text.match(/\S+/g) ?? [];
}

/** Chapters above this word count start with READ ALONG collapsed. */
export const LONG_CHAPTER_WORDS = 800;
