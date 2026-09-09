import * as Speech from 'expo-speech';
import { setAudioModeAsync } from 'expo-audio';
import {
  buildTimeline,
  buildWordTimeline,
  findUnitIndexAtTime,
  findWordIndexAtTime,
  progressToSeconds,
  secondsToProgress,
  SpeakUnit,
  SpeakWord,
} from './speechTimeline';
import { resolveVoiceId, voiceLanguage, getNarrationVoices, TtsVoiceOption } from './voicePreferences';

type ProgressListener = (progress: number) => void;
type TickListener = (positionSec: number, wordIndex: number) => void;
type StateListener = (playing: boolean) => void;
type CompleteListener = () => void;

const SKIP_SECONDS = 15;
const WORD_TICK_MS = 80;

class SpeechPlayer {
  private sourceText = '';
  private units: SpeakUnit[] = [];
  private words: SpeakWord[] = [];
  private unitIndex = 0;
  private currentWordIndex = 0;
  private positionSec = 0;
  private totalSec = 0;
  private speed = 1;
  private voiceId: string | undefined;
  private voices: TtsVoiceOption[] = [];
  private playing = false;
  private audioReady = false;
  private loadGeneration = 0;
  private unitStartedAt = 0;
  private wordTickTimer: ReturnType<typeof setInterval> | null = null;
  private onProgress?: ProgressListener;
  private onTick?: TickListener;
  private onStateChange?: StateListener;
  private onComplete?: CompleteListener;

  async ensureAudioMode() {
    if (this.audioReady) return;
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });
    this.audioReady = true;
  }

  async initVoices() {
    const { voices } = await getNarrationVoices();
    this.voices = voices;
  }

  setListeners(listeners: {
    onProgress?: ProgressListener;
    onTick?: TickListener;
    onStateChange?: StateListener;
    onComplete?: CompleteListener;
  }) {
    this.onProgress = listeners.onProgress;
    this.onTick = listeners.onTick;
    this.onStateChange = listeners.onStateChange;
    this.onComplete = listeners.onComplete;
  }

  async load(
    text: string,
    startProgress = 0,
    speed = 1,
    preferredVoiceId: string | null = null,
  ): Promise<number> {
    const generation = ++this.loadGeneration;
    Speech.stop();
    this.playing = false;
    this.onProgress = undefined;
    this.onStateChange = undefined;
    this.onComplete = undefined;

    this.sourceText = text;
    this.speed = speed;
    this.voiceId = await resolveVoiceId(preferredVoiceId);

    if (generation !== this.loadGeneration) {
      return secondsToProgress(this.positionSec, this.totalSec);
    }

    const timeline = buildTimeline(text, speed);
    const wordTimeline = buildWordTimeline(text, speed);

    if (generation !== this.loadGeneration) {
      return secondsToProgress(this.positionSec, this.totalSec);
    }

    this.units = timeline.units;
    this.words = wordTimeline.words;
    this.totalSec = timeline.totalSec;
    this.positionSec = progressToSeconds(startProgress, this.totalSec);
    this.unitIndex = findUnitIndexAtTime(this.units, this.positionSec);
    this.currentWordIndex = findWordIndexAtTime(this.words, this.positionSec);

    return secondsToProgress(this.positionSec, this.totalSec);
  }

  async setVoice(preferredVoiceId: string | null) {
    this.voiceId = await resolveVoiceId(preferredVoiceId);
    if (this.playing) {
      Speech.stop();
      await this.play();
    }
  }

  getProgressPercent(): number {
    return secondsToProgress(this.positionSec, this.totalSec);
  }

  private emitProgress() {
    this.onProgress?.(secondsToProgress(this.positionSec, this.totalSec));
  }

  private emitTick() {
    const positionSec = this.getPositionSec();
    const wordIndex = findWordIndexAtTime(this.words, positionSec);
    if (wordIndex !== this.currentWordIndex) {
      this.currentWordIndex = wordIndex;
    }
    this.onTick?.(positionSec, this.currentWordIndex);
  }

  private stopWordTicker() {
    if (this.wordTickTimer) {
      clearInterval(this.wordTickTimer);
      this.wordTickTimer = null;
    }
  }

  private startWordTicker() {
    this.stopWordTicker();
    this.unitStartedAt = Date.now();
    this.emitTick();
    this.wordTickTimer = setInterval(() => this.emitTick(), WORD_TICK_MS);
  }

  private emitState(playing: boolean) {
    this.onStateChange?.(playing);
  }

  private getSpeakOptions(): Speech.SpeechOptions {
    const language = voiceLanguage(this.voiceId, this.voices);
    return {
      rate: this.speed,
      pitch: 1.0,
      language,
      ...(this.voiceId ? { voice: this.voiceId } : {}),
    };
  }

  private speakCurrentUnit() {
    if (!this.playing || this.unitIndex >= this.units.length) {
      this.playing = false;
      this.emitState(false);
      if (this.unitIndex >= this.units.length && this.units.length > 0) {
        this.positionSec = this.totalSec;
        this.onProgress?.(100);
        this.onComplete?.();
      }
      return;
    }

    const unit = this.units[this.unitIndex];
    this.positionSec = unit.startSec;
    this.startWordTicker();

    Speech.speak(unit.text, {
      ...this.getSpeakOptions(),
      onDone: () => {
        if (!this.playing) return;
        this.stopWordTicker();
        this.unitIndex += 1;
        if (this.unitIndex < this.units.length) {
          this.positionSec = this.units[this.unitIndex].startSec;
        } else {
          this.positionSec = this.totalSec;
          this.currentWordIndex = Math.max(0, this.words.length - 1);
        }
        this.emitProgress();
        this.emitTick();
        this.speakCurrentUnit();
      },
      onStopped: () => {},
      onError: () => {
        this.playing = false;
        this.emitState(false);
      },
    });
  }

  async play() {
    await this.ensureAudioMode();
    if (this.units.length === 0) return;

    if (this.unitIndex >= this.units.length) {
      this.unitIndex = 0;
      this.positionSec = 0;
      this.emitProgress();
    }

    this.playing = true;
    this.emitState(true);
    Speech.stop();
    this.speakCurrentUnit();
  }

  pause() {
    this.playing = false;
    this.stopWordTicker();
    this.positionSec = this.getPositionSec();
    this.currentWordIndex = findWordIndexAtTime(this.words, this.positionSec);
    Speech.stop();
    this.emitState(false);
    this.emitProgress();
    this.emitTick();
  }

  toggle() {
    if (this.playing) this.pause();
    else void this.play();
  }

  skipSeconds(delta: number) {
    const wasPlaying = this.playing;
    this.stopWordTicker();
    Speech.stop();
    this.playing = false;

    this.positionSec = Math.max(
      0,
      Math.min(this.getPositionSec() + delta, this.totalSec),
    );
    this.unitIndex = findUnitIndexAtTime(this.units, this.positionSec);
    this.currentWordIndex = findWordIndexAtTime(this.words, this.positionSec);
    this.emitProgress();
    this.emitTick();

    if (wasPlaying) void this.play();
  }

  skipBack() {
    this.skipSeconds(-SKIP_SECONDS);
  }

  skipForward() {
    this.skipSeconds(SKIP_SECONDS);
  }

  async setSpeed(speed: number) {
    const progress = secondsToProgress(this.positionSec, this.totalSec);
    this.speed = speed;
    const timeline = buildTimeline(this.sourceText, speed);
    const wordTimeline = buildWordTimeline(this.sourceText, speed);
    this.units = timeline.units;
    this.words = wordTimeline.words;
    this.totalSec = timeline.totalSec;
    this.positionSec = progressToSeconds(progress, this.totalSec);
    this.unitIndex = findUnitIndexAtTime(this.units, this.positionSec);
    this.currentWordIndex = findWordIndexAtTime(this.words, this.positionSec);
    this.emitProgress();
    this.emitTick();

    if (this.playing) {
      Speech.stop();
      await this.play();
    }
  }

  getPositionSec() {
    if (this.playing && this.units[this.unitIndex]) {
      const unit = this.units[this.unitIndex];
      const elapsed = (Date.now() - this.unitStartedAt) / 1000;
      return unit.startSec + Math.min(Math.max(0, elapsed), unit.durationSec);
    }
    return this.positionSec;
  }

  getTotalSec() {
    return this.totalSec;
  }

  getWords(): SpeakWord[] {
    return this.words;
  }

  getCurrentWordIndex(): number {
    return this.currentWordIndex;
  }

  destroy() {
    this.pause();
    this.onProgress = undefined;
    this.onTick = undefined;
    this.onStateChange = undefined;
    this.onComplete = undefined;
  }
}

export const speechPlayer = new SpeechPlayer();
