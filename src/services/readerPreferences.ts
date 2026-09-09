import AsyncStorage from '@react-native-async-storage/async-storage';

const READER_PREFS_KEY = '@folio/reader-prefs';

export type ReaderViewMode = 'scroll' | 'pages';

export interface ReaderPreferences {
  fontSize: number;
  viewMode: ReaderViewMode;
}

export const READER_FONT_MIN = 13;
export const READER_FONT_MAX = 26;
export const READER_FONT_DEFAULT = 16;

const DEFAULTS: ReaderPreferences = {
  fontSize: READER_FONT_DEFAULT,
  viewMode: 'scroll',
};

export async function loadReaderPreferences(): Promise<ReaderPreferences> {
  const raw = await AsyncStorage.getItem(READER_PREFS_KEY);
  if (!raw) return DEFAULTS;

  try {
    const parsed = JSON.parse(raw) as Partial<ReaderPreferences>;
    return {
      fontSize: clampFontSize(parsed.fontSize ?? DEFAULTS.fontSize),
      viewMode: parsed.viewMode === 'pages' ? 'pages' : 'scroll',
    };
  } catch {
    return DEFAULTS;
  }
}

export async function saveReaderPreferences(
  partial: Partial<ReaderPreferences>,
): Promise<ReaderPreferences> {
  const current = await loadReaderPreferences();
  const next: ReaderPreferences = {
    fontSize: clampFontSize(partial.fontSize ?? current.fontSize),
    viewMode: partial.viewMode ?? current.viewMode,
  };
  await AsyncStorage.setItem(READER_PREFS_KEY, JSON.stringify(next));
  return next;
}

function clampFontSize(size: number): number {
  return Math.min(READER_FONT_MAX, Math.max(READER_FONT_MIN, Math.round(size)));
}
