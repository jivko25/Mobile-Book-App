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
  /** Google TTS voice — closest match to Google Maps navigation */
  googleMapsStyle?: boolean;
}

export interface AppSettings {
  voiceId: string | null;
  speed: number;
}

export interface NarrationVoicesResult {
  voices: TtsVoiceOption[];
  /** True when no Bulgarian voice is installed — English fallback is shown */
  usingFallback: boolean;
  recommendedVoiceId: string | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  voiceId: null,
  speed: 1,
};

const GOOGLE_FEMALE_HINTS = [
  'female',
  'woman',
  'girl',
  'жена',
  'женски',
  'daria',
  'maria',
  'elena',
  'victoria',
  'samantha',
  'karen',
  'zira',
  '-iog-',
  '-tpf-',
  '-tpc-',
  '-iob-',
  '-iol-',
  '-iob-local',
  '-iog-local',
];

function voiceHaystack(voice: Speech.Voice): string {
  return `${voice.name} ${voice.identifier}`.toLowerCase();
}

function isBulgarianVoice(voice: Speech.Voice): boolean {
  return voice.language.toLowerCase().startsWith('bg');
}

function isEnglishVoice(voice: Speech.Voice): boolean {
  return voice.language.toLowerCase().startsWith('en');
}

function isGoogleVoice(voice: Speech.Voice): boolean {
  const hay = voiceHaystack(voice);
  return (
    hay.includes('google') ||
    voice.identifier.toLowerCase().includes('com.google') ||
    /x-[a-z]{3}-local/.test(voice.identifier.toLowerCase())
  );
}

function isLikelyFemaleVoice(voice: Speech.Voice): boolean {
  const hay = voiceHaystack(voice);
  return GOOGLE_FEMALE_HINTS.some((hint) => hay.includes(hint));
}

function scoreBulgarianVoice(voice: Speech.Voice): number {
  let score = 0;
  const lang = voice.language.toLowerCase();
  const name = voice.name.toLowerCase();

  if (voice.quality === VoiceQuality.Enhanced) score += 100;
  if (isGoogleVoice(voice)) score += 90;
  if (isLikelyFemaleVoice(voice)) score += 60;
  if (lang === 'bg-bg' || lang === 'bg_bg') score += 50;
  if (lang.startsWith('bg')) score += 30;

  if (name.includes('bulgaria') || name.includes('българ')) score += 20;
  if (name.includes('daria') || name.includes('maria')) score += 15;

  return score;
}

function scoreEnglishVoice(voice: Speech.Voice): number {
  let score = 0;
  const lang = voice.language.toLowerCase();

  if (voice.quality === VoiceQuality.Enhanced) score += 100;
  if (isGoogleVoice(voice)) score += 90;
  if (isLikelyFemaleVoice(voice)) score += 60;
  if (lang.startsWith('en-us')) score += 35;
  if (lang.startsWith('en-gb')) score += 30;
  if (lang.startsWith('en')) score += 10;

  return score;
}

function isGoogleMapsStyleVoice(voice: Speech.Voice): boolean {
  return isGoogleVoice(voice) && isLikelyFemaleVoice(voice);
}

function mapVoices(voices: Speech.Voice[], recommendedId: string | null): TtsVoiceOption[] {
  return voices.map((v) => ({
    id: v.identifier,
    name: v.name,
    language: v.language,
    quality: v.quality,
    googleMapsStyle: v.identifier === recommendedId || isGoogleMapsStyleVoice(v),
  }));
}

function pickRecommendedId(voices: Speech.Voice[]): string | null {
  if (voices.length === 0) return null;

  const mapsStyle = voices.find(isGoogleMapsStyleVoice);
  if (mapsStyle) return mapsStyle.identifier;

  const googleEnhanced = voices.find(
    (v) => isGoogleVoice(v) && v.quality === VoiceQuality.Enhanced,
  );
  if (googleEnhanced) return googleEnhanced.identifier;

  const googleAny = voices.find(isGoogleVoice);
  if (googleAny) return googleAny.identifier;

  const female = voices.find(isLikelyFemaleVoice);
  if (female) return female.identifier;

  return voices[0].identifier;
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
      const recommendedVoiceId = pickRecommendedId(bulgarian);
      return {
        voices: mapVoices(bulgarian, recommendedVoiceId),
        usingFallback: false,
        recommendedVoiceId,
      };
    }

    const english = all
      .filter(isEnglishVoice)
      .sort((a, b) => scoreEnglishVoice(b) - scoreEnglishVoice(a));

    const recommendedVoiceId = pickRecommendedId(english);
    return {
      voices: mapVoices(english, recommendedVoiceId),
      usingFallback: true,
      recommendedVoiceId,
    };
  } catch {
    return { voices: [], usingFallback: false, recommendedVoiceId: null };
  }
}

/** @deprecated Use getNarrationVoices */
export async function getEnglishVoices(): Promise<TtsVoiceOption[]> {
  const { voices } = await getNarrationVoices();
  return voices;
}

export async function getDefaultVoiceId(): Promise<string | null> {
  const { recommendedVoiceId, voices } = await getNarrationVoices();
  return recommendedVoiceId ?? voices[0]?.id ?? null;
}

export async function resolveVoiceId(preferredId: string | null): Promise<string | undefined> {
  const { voices, recommendedVoiceId } = await getNarrationVoices();
  if (voices.length === 0) return undefined;

  if (preferredId && voices.some((v) => v.id === preferredId)) {
    return preferredId;
  }

  return recommendedVoiceId ?? voices[0].id;
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

export function previewSampleText(language: string): string {
  if (language.toLowerCase().startsWith('bg')) {
    return 'Здравейте. Това е примерен глас за аудиокнига.';
  }
  return 'Hello. This is a sample voice for your audiobook.';
}

export async function previewVoice(voiceId: string, language: string): Promise<void> {
  Speech.stop();
  await Speech.speak(previewSampleText(language), {
    voice: voiceId,
    language,
    rate: 1,
    pitch: 1,
  });
}
