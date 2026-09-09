import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book, Chapter } from '../types';
import {
  BookCover,
  Flourish,
  InkProgress,
  ScreenContainer,
} from '../components';
import { colors, fonts, spacing, testIds } from '../theme';

interface BookDetailScreenProps {
  book: Book;
  onBack: () => void;
  onPlayChapter: (chapter: Chapter) => void;
  onReadChapter: (chapter: Chapter) => void;
  onResume: () => void;
}

export function BookDetailScreen({
  book,
  onBack,
  onPlayChapter,
  onReadChapter,
  onResume,
}: BookDetailScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScreenContainer testID={testIds.screen.detail}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={[styles.hero, { backgroundColor: book.bg, paddingTop: insets.top + 8 }]}>
          <Pressable
            testID={testIds.detail.back}
            accessibilityRole="button"
            accessibilityLabel="Back to library"
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: book.accent }]}>← LIBRARY</Text>
          </Pressable>
          <View style={styles.coverWrapper}>
            <BookCover book={book} width={120} height={178} />
          </View>
          <LinearGradient
            colors={['transparent', colors.parchment]}
            style={styles.heroFade}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <Text style={[styles.genre, { color: book.accent }]}>
              {book.genre.toUpperCase()} · {book.year}
            </Text>
            <Text style={styles.title}>{book.title}</Text>
            {book.subtitle && (
              <Text style={styles.subtitle}>{book.subtitle}</Text>
            )}
            <Text style={styles.credits}>
              by {book.author} · narrated by {book.narrator}
            </Text>
          </View>

          {book.progress > 0 && (
            <View style={styles.progressBlock}>
              <InkProgress pct={book.progress} height={3} color={book.accent} />
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{book.progress}% heard</Text>
                <Text style={styles.progressLabel}>{book.totalDuration} total</Text>
              </View>
            </View>
          )}

          <Pressable
            testID={testIds.detail.resume}
            accessibilityRole="button"
            accessibilityLabel={
              book.progress > 0 ? 'Resume listening' : 'Begin this volume'
            }
            onPress={onResume}
            style={[
              styles.cta,
              {
                backgroundColor: book.accent,
                borderColor: `${book.accent}cc`,
              },
            ]}
          >
            <Text style={styles.ctaText}>
              {book.progress > 0 ? '▶  RESUME LISTENING' : '▶  BEGIN THIS VOLUME'}
            </Text>
          </Pressable>

          <Flourish double />
          <Text style={styles.synopsis}>{book.synopsis}</Text>
          <Flourish />

          <Text style={[styles.chaptersLabel, { color: book.accent }]}>
            ACTS & CHAPTERS
          </Text>
          {book.chapters.map((ch) => (
            <View
              key={ch.id}
              style={[styles.chapterRow, { borderBottomColor: `${book.accent}22` }]}
            >
              <View
                style={[
                  styles.chapterBadge,
                  {
                    borderColor: `${book.accent}40`,
                    backgroundColor: `${book.accent}12`,
                  },
                  ch.progress === 100 && {
                    backgroundColor: book.accent,
                    borderColor: `${book.accent}cc`,
                  },
                  ch.progress > 0 &&
                    ch.progress < 100 && {
                      backgroundColor: book.accent,
                      borderColor: `${book.accent}cc`,
                    },
                ]}
              >
                <Text
                  style={[
                    styles.chapterNumeral,
                    { color: book.accent },
                    ch.progress > 0 && styles.chapterNumeralActive,
                  ]}
                >
                  {ch.progress === 100 ? '✓' : ch.numeral}
                </Text>
              </View>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterTitle}>{ch.title}</Text>
                <Text style={styles.chapterDuration}>{ch.duration}</Text>
                {ch.progress > 0 && ch.progress < 100 && (
                  <View style={styles.chapterProgress}>
                    <Text style={[styles.progressKind, { color: book.accent }]}>
                      Heard
                    </Text>
                    <InkProgress pct={ch.progress} height={2} color={book.accent} />
                  </View>
                )}
                {(ch.readProgress ?? 0) > 0 && (ch.readProgress ?? 0) < 100 && (
                  <View style={styles.chapterProgress}>
                    <Text style={[styles.progressKind, { color: `${book.accent}99` }]}>
                      Read
                    </Text>
                    <InkProgress
                      pct={ch.readProgress ?? 0}
                      height={2}
                      color={`${book.accent}88`}
                    />
                  </View>
                )}
                {(ch.readProgress ?? 0) === 100 && (
                  <Text style={[styles.readComplete, { color: book.accent }]}>
                    Read complete
                  </Text>
                )}
              </View>
              <View style={styles.chapterActions}>
                <Pressable
                  testID={testIds.detail.readChapter(ch.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Read ${ch.title}`}
                  onPress={() => onReadChapter(ch)}
                  style={[
                    styles.readButton,
                    {
                      borderColor: `${book.accent}55`,
                      backgroundColor: `${book.accent}10`,
                    },
                  ]}
                >
                  <Text style={[styles.readButtonText, { color: book.accent }]}>
                    READ
                  </Text>
                </Pressable>
                <Pressable
                  testID={testIds.detail.chapter(ch.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${ch.title}`}
                  onPress={() => onPlayChapter(ch)}
                  style={styles.playIcon}
                >
                  {ch.progress === 100 ? (
                    <Text style={[styles.replayIcon, { color: book.accent }]}>↺</Text>
                  ) : (
                    <View
                      style={[
                        styles.playCircle,
                        {
                          borderColor: `${book.accent}50`,
                          backgroundColor: `${book.accent}12`,
                        },
                      ]}
                    >
                      <Text style={[styles.playTriangle, { color: book.accent }]}>
                        ▶
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 220,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: 20,
    zIndex: 2,
  },
  backText: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 10,
    letterSpacing: 2,
  },
  coverWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  genre: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 9,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: fonts.fell,
    color: colors.inkMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  credits: {
    fontFamily: fonts.lora,
    color: colors.brown,
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },
  progressBlock: {
    marginBottom: 14,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {
    fontFamily: fonts.lora,
    color: colors.brown,
    fontSize: 10,
  },
  cta: {
    width: '100%',
    paddingVertical: 13,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 4,
  },
  ctaText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.parchment,
    fontSize: 11,
    letterSpacing: 2,
  },
  synopsis: {
    fontFamily: fonts.fell,
    color: colors.inkMuted,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 25,
    marginVertical: 14,
  },
  chaptersLabel: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 18,
    marginBottom: 12,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  chapterBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chapterNumeral: {
    fontFamily: fonts.cinzel,
    fontSize: 11,
    fontWeight: '600',
  },
  chapterNumeralActive: {
    color: colors.parchment,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontFamily: fonts.loraMedium,
    color: colors.ink,
    fontSize: 14,
  },
  chapterDuration: {
    fontFamily: fonts.lora,
    color: colors.brown,
    fontSize: 11,
    marginTop: 2,
  },
  chapterProgress: {
    marginTop: 5,
    gap: 3,
  },
  progressKind: {
    fontFamily: fonts.lora,
    fontSize: 9,
    color: colors.brown,
  },
  readComplete: {
    fontFamily: fonts.lora,
    fontSize: 9,
    color: colors.brown,
    marginTop: 5,
  },
  chapterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  readButton: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 2,
  },
  readButtonText: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  playIcon: {
    flexShrink: 0,
  },
  replayIcon: {
    fontSize: 16,
  },
  playCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  playTriangle: {
    fontSize: 10,
    marginLeft: 2,
  },
});
