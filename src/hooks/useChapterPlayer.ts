import { useCallback, useEffect, useRef, useState } from 'react';
import { Chapter } from '../types';
import { speechPlayer } from '../services/tts/speechPlayer';
import { formatPlaybackTime } from '../services/tts/speechTimeline';
import { loadSettings } from '../services/tts/voicePreferences';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackSpeed = (typeof SPEEDS)[number];

interface UseChapterPlayerOptions {
  chapter: Chapter;
  onProgressChange?: (progress: number, chapterId: number) => void;
  onComplete?: () => void;
}

export function useChapterPlayer({
  chapter,
  onProgressChange,
  onComplete,
}: UseChapterPlayerOptions) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(chapter.progress ?? 0);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [remainingSec, setRemainingSec] = useState(0);
  const [ready, setReady] = useState(false);

  const progressRef = useRef(onProgressChange);
  const completeRef = useRef(onComplete);
  const chapterIdRef = useRef(chapter.id);
  const canPersistRef = useRef(false);
  const lastProgressRef = useRef(chapter.progress ?? 0);

  progressRef.current = onProgressChange;
  completeRef.current = onComplete;
  chapterIdRef.current = chapter.id;

  useEffect(() => {
    let mounted = true;
    canPersistRef.current = false;
    setReady(false);

    const init = async () => {
      speechPlayer.pause();
      await speechPlayer.initVoices();
      const settings = await loadSettings();
      if (!mounted || chapterIdRef.current !== chapter.id) return;

      setSpeedState(settings.speed as PlaybackSpeed);
      const startProgress = chapter.progress ?? 0;
      const loadedProgress = await speechPlayer.load(
        chapter.content,
        startProgress,
        settings.speed,
        settings.voiceId,
      );

      if (!mounted || chapterIdRef.current !== chapter.id) return;

      lastProgressRef.current = loadedProgress;
      setProgress(loadedProgress);
      setElapsedSec(speechPlayer.getPositionSec());
      setRemainingSec(
        Math.max(0, speechPlayer.getTotalSec() - speechPlayer.getPositionSec()),
      );
      setPlaying(false);
      setReady(true);
      canPersistRef.current = true;

      speechPlayer.setListeners({
        onProgress: (pct: number) => {
          if (!canPersistRef.current) return;
          lastProgressRef.current = pct;
          setProgress(pct);
          setElapsedSec(speechPlayer.getPositionSec());
          setRemainingSec(
            Math.max(0, speechPlayer.getTotalSec() - speechPlayer.getPositionSec()),
          );
          progressRef.current?.(pct, chapterIdRef.current);
        },
        onStateChange: setPlaying,
        onComplete: () => completeRef.current?.(),
      });
    };

    void init();

    return () => {
      mounted = false;
      canPersistRef.current = false;
      speechPlayer.pause();
    };
  }, [chapter.id, chapter.content]);

  const togglePlay = useCallback(() => {
    if (!ready) return;
    speechPlayer.toggle();
  }, [ready]);

  const skipBack = useCallback(() => {
    if (!ready) return;
    speechPlayer.skipBack();
  }, [ready]);

  const skipForward = useCallback(() => {
    if (!ready) return;
    speechPlayer.skipForward();
  }, [ready]);

  const setSpeed = useCallback(async (next: PlaybackSpeed) => {
    if (!ready) return;
    setSpeedState(next);
    await speechPlayer.setSpeed(next);
  }, [ready]);

  return {
    playing,
    progress,
    speed,
    speeds: SPEEDS,
    ready,
    elapsed: formatPlaybackTime(elapsedSec),
    remaining: formatPlaybackTime(remainingSec),
    togglePlay,
    skipBack,
    skipForward,
    setSpeed,
  };
}
