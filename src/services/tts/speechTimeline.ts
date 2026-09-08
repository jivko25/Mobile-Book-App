/** ~38 words ≈ 15 seconds at 140 wpm (Bulgarian narration pace) */
const WORDS_PER_UNIT = 38;
const WORDS_PER_MINUTE = 140;

export interface SpeakUnit {
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
    units.push({ text: unitText, startSec: cursor, durationSec: duration });
    cursor += duration;
    batch = [];
    batchWords = 0;
  };

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean).length;
    if (batchWords + words > WORDS_PER_UNIT && batch.length > 0) {
      flush();
    }
    batch.push(sentence);
    batchWords += words;
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
