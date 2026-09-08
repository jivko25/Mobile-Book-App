import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import {
  ApiErrorResponse,
  Book,
  Chapter,
  SummaryRequest,
  SummaryResponse,
  SummaryServiceError,
} from '../types';

const CACHE_PREFIX = 'summary:';
const MIN_CHAPTER_CHARS = 50;

function cacheKey(bookId: string, chapterId: number): string {
  return `${CACHE_PREFIX}${bookId}:${chapterId}`;
}

async function getCachedSummary(
  bookId: string,
  chapterId: number,
): Promise<string | null> {
  return AsyncStorage.getItem(cacheKey(bookId, chapterId));
}

async function setCachedSummary(
  bookId: string,
  chapterId: number,
  summary: string,
): Promise<void> {
  await AsyncStorage.setItem(cacheKey(bookId, chapterId), summary);
}

function mapApiError(status: number, detail: string): SummaryServiceError {
  switch (status) {
    case 422:
      return new SummaryServiceError('Chapter text too short', status, false);
    case 429:
      return new SummaryServiceError(
        'Gemini API quota exceeded. Please try again later.',
        status,
        true,
      );
    case 401:
    case 403:
      return new SummaryServiceError(
        'Summary service is temporarily unavailable.',
        status,
        false,
      );
    case 502:
      return new SummaryServiceError(
        'Gemini API is temporarily unavailable.',
        status,
        true,
      );
    case 503:
      return new SummaryServiceError(
        __DEV__
          ? 'GEMINI_API_KEY is not configured on the server.'
          : 'Summary service is temporarily unavailable.',
        status,
        false,
      );
    default:
      return new SummaryServiceError(
        detail || 'Failed to generate summary.',
        status,
        status >= 500,
      );
  }
}

async function requestSummary(body: SummaryRequest): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = 'Failed to generate summary.';
    try {
      const errorBody = (await response.json()) as ApiErrorResponse;
      if (typeof errorBody.detail === 'string') {
        detail = errorBody.detail;
      }
    } catch {
      // ignore parse errors
    }
    throw mapApiError(response.status, detail);
  }

  const data = (await response.json()) as SummaryResponse;
  if (!data.summary?.trim()) {
    throw new SummaryServiceError('Empty summary received.', 502, true);
  }

  return data.summary.trim();
}

export async function fetchSummary(
  book: Book,
  chapter: Chapter,
  options?: { skipCache?: boolean },
): Promise<string> {
  const trimmed = chapter.content.trim();
  if (trimmed.length < MIN_CHAPTER_CHARS) {
    throw new SummaryServiceError('Chapter text too short', 422, false);
  }

  if (!options?.skipCache) {
    const cached = await getCachedSummary(book.id, chapter.id);
    if (cached) return cached;
  }

  const summary = await requestSummary({
    chapter_text: trimmed,
    book_title: book.title,
    chapter_title: chapter.title,
    chapter_numeral: chapter.numeral,
  });

  await setCachedSummary(book.id, chapter.id, summary);
  return summary;
}

export async function checkSummaryApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) return false;
    const data = (await response.json()) as { status?: string };
    return data.status === 'ok';
  } catch {
    return false;
  }
}
