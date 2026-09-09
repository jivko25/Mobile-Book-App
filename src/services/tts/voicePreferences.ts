import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { VoiceQuality } from 'expo-speech';

const SETTINGS_KEY = '@folio/settings';

/** Primary narration language for Shakes Pear */
export const PRIMARY_LANGUAGE = 'bg-BG';

export interface TtsVoiceOption {
  id: string;
  name: string;
  language: string;
  quality: string;
}

export interface AppSettings {
  voiceId: string | null;
  speed: number;
}

export interface NarrationVoicesResult {
  voices: TtsVoiceOption[];
  /** True when no Bulgarian voice is installed — English fallback is shown */
  usingFallback: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  voiceId: null,
  speed: 1,
};

function isBulgarianVoice(voice: Speech.Voice): boolean {
  return voice.language.toLowerCase().startsWith('bg');
}

function isEnglishVoice(voice: Speech.Voice): boolean {
  return voice.language.toLowerCase().startsWith('en');
}

function scoreBulgarianVoice(voice: Speech.Voice): number {
  let score = 0;
  const lang = voice.language.toLowerCase();
  const name = voice.name.toLowerCase();

  if (voice.quality === VoiceQuality.Enhanced) score += 100;
  if (lang === 'bg-bg' || lang === 'bg_bg') score += 50;
  if (lang.startsWith('bg')) score += 30;

  if (name.includes('bulgaria') || name.includes('българ')) score += 20;
  if (name.includes('daria') || name.includes('maria')) score += 10;

  return score;
}

function scoreEnglishVoice(voice: Speech.Voice): number {
  let score = 0;
  const lang = voice.language.toLowerCase();

  if (voice.quality === VoiceQuality.Enhanced) score += 100;
  if (lang.startsWith('en-gb')) score += 40;
  if (lang.startsWith('en-us')) score += 30;
  if (lang.startsWith('en')) score += 10;

  return score;
}

function mapVoices(voices: Speech.Voice[]): TtsVoiceOption[] {
  return voices.map((v) => ({
    id: v.identifier,
    name: v.name,
    language: v.language,
    quality: v.quality,
  }));
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();
  const next = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export async function getNarrationVoices(): Promise<NarrationVoicesResult> {
  try {
    const all = await Speech.getAvailableVoicesAsync();

    const bulgarian = all
      .filter(isBulgarianVoice)
      .sort((a, b) => scoreBulgarianVoice(b) - scoreBulgarianVoice(a));

    if (bulgarian.length > 0) {
      return { voices: mapVoices(bulgarian), usingFallback: false };
    }

    const english = all
      .filter(isEnglishVoice)
      .sort((a, b) => scoreEnglishVoice(b) - scoreEnglishVoice(a));

    return { voices: mapVoices(english), usingFallback: true };
  } catch {
    return { voices: [], usingFallback: false };
  }
}

/** @deprecated Use getNarrationVoices */
export async function getEnglishVoices(): Promise<TtsVoiceOption[]> {
  const { voices } = await getNarrationVoices();
  return voices;
}

export async function getDefaultVoiceId(): Promise<string | null> {
  const { voices } = await getNarrationVoices();
  return voices[0]?.id ?? null;
}

export async function resolveVoiceId(preferredId: string | null): Promise<string | undefined> {
  const { voices } = await getNarrationVoices();
  if (voices.length === 0) return undefined;

  if (preferredId && voices.some((v) => v.id === preferredId)) {
    return preferredId;
  }

  return voices[0].id;
}

export function voiceLanguage(voiceId: string | undefined, voices: TtsVoiceOption[]): string {
  if (!voiceId) return PRIMARY_LANGUAGE;
  const match = voices.find((v) => v.id === voiceId);
  return match?.language ?? PRIMARY_LANGUAGE;
}

export function formatVoiceLanguageLabel(language: string): string {
  const lang = language.toLowerCase();
  if (lang.startsWith('bg')) return 'Български';
  if (lang.startsWith('en-gb')) return 'English (UK)';
  if (lang.startsWith('en-us')) return 'English (US)';
  if (lang.startsWith('en')) return 'English';
  return language;
}
