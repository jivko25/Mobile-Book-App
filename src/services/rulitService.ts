import { API_BASE_URL } from '../config/api';
import {
  ApiErrorResponse,
  RulitBookDetail,
  RulitCatalogResponse,
  RulitDownloadUrlResponse,
  RulitServiceError,
} from '../types';

type CatalogSort = 'date' | 'popular';

interface CatalogParams {
  lang?: string;
  page?: number;
  sort?: CatalogSort;
  genre?: string;
  format?: string;
}

interface SearchParams {
  q: string;
  lang?: string;
  page?: number;
  format?: string;
}

function mapRulitError(status: number, detail: string): RulitServiceError {
  switch (status) {
    case 404:
      return new RulitServiceError('Книгата не е намерена.', status, false);
    case 422:
      return new RulitServiceError(detail || 'Невалидна заявка.', status, false);
    case 429:
      return new RulitServiceError(
        'Твърде много заявки. Опитайте отново след малко.',
        status,
        true,
      );
    case 502:
      return new RulitServiceError(
        'Каталогът е временно недостъпен.',
        status,
        true,
      );
    default:
      return new RulitServiceError(
        detail || 'Неуспешно зареждане от каталога.',
        status,
        status >= 500,
      );
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    if (typeof body.detail === 'string') return body.detail;
  } catch {
    // ignore
  }
  return 'Неуспешна заявка към сървъра.';
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    const detail = await parseError(response);
    throw mapRulitError(response.status, detail);
  }

  return response.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export async function getRulitCatalog(
  params: CatalogParams = {},
): Promise<RulitCatalogResponse> {
  const query = buildQuery({
    lang: params.lang ?? 'bg',
    page: params.page ?? 1,
    sort: params.sort ?? 'date',
    genre: params.genre,
    format: params.format ?? 'epub',
  });

  return getJson<RulitCatalogResponse>(`/api/rulit/catalog${query}`);
}

export async function searchRulitBooks(
  params: SearchParams,
): Promise<RulitCatalogResponse> {
  const query = buildQuery({
    q: params.q,
    lang: params.lang ?? 'bg',
    page: params.page ?? 1,
    format: params.format ?? 'epub',
  });

  return getJson<RulitCatalogResponse>(`/api/rulit/search${query}`);
}

export async function getRulitBookDetail(bookId: string): Promise<RulitBookDetail> {
  return getJson<RulitBookDetail>(`/api/rulit/books/${bookId}`);
}

export async function getRulitDownloadUrl(
  bookId: string,
  resolve = true,
): Promise<RulitDownloadUrlResponse> {
  const query = buildQuery({
    format: 'epub',
    resolve: resolve ? 'true' : 'false',
  });

  return getJson<RulitDownloadUrlResponse>(
    `/api/rulit/books/${bookId}/download-url${query}`,
  );
}
