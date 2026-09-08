import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book, Chapter } from '../types';
import { BookCover, InkProgress, ScreenContainer } from '../components';
import { useChapterPlayer } from '../hooks/useChapterPlayer';
import { colors, fonts, testIds } from '../theme';

interface PlayerScreenProps {
  book: Book;
  chapter: Chapter;
  onBack: () => void;
  onSummary: () => void;
  onProgressChange: (progress: number, chapterId: number) => void;
  onChapterComplete: () => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export function PlayerScreen({
  book,
  chapter,
  onBack,
  onSummary,
  onProgressChange,
  onChapterComplete,
  onPrevChapter,
  onNextChapter,
  canPrev,
  canNext,
}: PlayerScreenProps) {
  const insets = useSafeAreaInsets();
  const player = useChapterPlayer({
    chapter,
    onProgressChange,
    onComplete: onChapterComplete,
  });

  const bars = Array.from({ length: 52 }, (_, i) => ({
    h: 10 + Math.abs(Math.sin(i * 0.65) * 14 + Math.sin(i * 1.2) * 8),
    played: (i / 52) * 100 < player.progress,
  }));

  return (
    <ScreenContainer testID={testIds.screen.player} backgroundColor={book.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            testID={testIds.player.back}
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
          >
            <Text style={[styles.topAction, { color: book.accent }]}>← BACK</Text>
          </Pressable>
          <Text style={[styles.nowPlaying, { color: `${book.accent}80` }]}>
            NOW PLAYING
          </Text>
          <Pressable
            testID={testIds.player.summary}
            accessibilityRole="button"
            accessibilityLabel="AI Summary"
            onPress={onSummary}
            style={[styles.summaryButton, { borderColor: `${book.accent}50` }]}
          >
            <Text style={[styles.summaryText, { color: book.accent }]}>
              AI SUMMARY
            </Text>
          </Pressable>
        </View>

        <View style={styles.coverSection}>
          <BookCover book={book} width={164} height={240} />
        </View>

        <View style={styles.chapterInfo}>
          <Text style={[styles.actLabel, { color: `${book.accent}70` }]}>
            ACT {chapter.numeral}
          </Text>
          <Text style={[styles.chapterTitle, { color: book.accent }]}>
            {chapter.title}
          </Text>
          <Text style={[styles.chapterMeta, { color: `${book.accent}65` }]}>
            {book.title} · {book.narrator}
          </Text>
        </View>

        <View style={styles.waveform}>
          {bars.map((bar, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: bar.h,
                  backgroundColor: bar.played ? book.accent : `${book.accent}28`,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.scrubber}>
          <InkProgress pct={player.progress} height={3} color={book.accent} />
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: `${book.accent}75` }]}>
              {player.elapsed}
            </Text>
            <Text style={[styles.timeText, { color: `${book.accent}75` }]}>
              −{player.remaining}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous chapter"
            onPress={onPrevChapter}
            disabled={!canPrev}
          >
            <Text
              style={[
                styles.skipIcon,
                { color: canPrev ? `${book.accent}60` : `${book.accent}25` },
              ]}
            >
              ⏮
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rewind"
            onPress={player.skipBack}
          >
            <Text style={[styles.skipButton, { color: book.accent, borderColor: `${book.accent}40` }]}>
              −15s
            </Text>
          </Pressable>
          <Pressable
            testID={testIds.player.playPause}
            accessibilityRole="button"
            accessibilityLabel={player.playing ? 'Pause' : 'Play'}
            onPress={player.togglePlay}
            disabled={!player.ready}
            style={[
              styles.playButton,
              {
                backgroundColor: book.accent,
                borderColor: `${book.accent}99`,
                shadowColor: book.accent,
                opacity: player.ready ? 1 : 0.5,
              },
            ]}
          >
            <Text style={styles.playIcon}>{player.playing ? '⏸' : '▶'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Forward"
            onPress={player.skipForward}
          >
            <Text style={[styles.skipButton, { color: book.accent, borderColor: `${book.accent}40` }]}>
              +15s
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next chapter"
            onPress={onNextChapter}
            disabled={!canNext}
          >
            <Text
              style={[
                styles.skipIcon,
                { color: canNext ? `${book.accent}60` : `${book.accent}25` },
              ]}
            >
              ⏭
            </Text>
          </Pressable>
        </View>

        <View style={styles.speedRow}>
          {player.speeds.map((s) => (
            <Pressable
              key={s}
              testID={testIds.player.speed(s)}
              accessibilityRole="button"
              accessibilityLabel={`Speed ${s}x`}
              onPress={() => player.setSpeed(s)}
              style={[
                styles.speedButton,
                {
                  backgroundColor: player.speed === s ? book.accent : 'transparent',
                  borderColor: `${book.accent}38`,
                },
              ]}
            >
              <Text
                style={[
                  styles.speedText,
                  { color: player.speed === s ? colors.ink : `${book.accent}65` },
                ]}
              >
                {s}×
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topAction: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  nowPlaying: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 9,
    letterSpacing: 2.5,
  },
  summaryButton: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  summaryText: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  coverSection: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 24,
  },
  chapterInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  actLabel: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 5,
  },
  chapterTitle: {
    fontFamily: fonts.cinzel,
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 6,
  },
  chapterMeta: {
    fontFamily: fonts.loraItalic,
    fontSize: 11,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: 44,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  bar: {
    flex: 1,
    maxWidth: 4,
    borderRadius: 2,
  },
  scrubber: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeText: {
    fontFamily: fonts.lora,
    fontSize: 10,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  skipIcon: {
    fontSize: 18,
  },
  skipButton: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 9,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 2,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  playIcon: {
    color: colors.ink,
    fontSize: 20,
    marginLeft: 2,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  speedButton: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  speedText: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 9,
  },
});
