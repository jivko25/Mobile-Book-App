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
  onResume: () => void;
}

export function BookDetailScreen({
  book,
  onBack,
  onPlayChapter,
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
            <Text style={styles.genre}>
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
              <InkProgress pct={book.progress} height={3} />
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
            style={styles.cta}
          >
            <Text style={styles.ctaText}>
              {book.progress > 0 ? '▶  RESUME LISTENING' : '▶  BEGIN THIS VOLUME'}
            </Text>
          </Pressable>

          <Flourish double />
          <Text style={styles.synopsis}>{book.synopsis}</Text>
          <Flourish />

          <Text style={styles.chaptersLabel}>ACTS & CHAPTERS</Text>
          {book.chapters.map((ch) => (
            <Pressable
              key={ch.id}
              testID={testIds.detail.chapter(ch.id)}
              accessibilityRole="button"
              accessibilityLabel={`Play ${ch.title}`}
              onPress={() => onPlayChapter(ch)}
              style={styles.chapterRow}
            >
              <View
                style={[
                  styles.chapterBadge,
                  ch.progress === 100 && styles.chapterBadgeComplete,
                  ch.progress > 0 && ch.progress < 100 && styles.chapterBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.chapterNumeral,
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
                    <InkProgress pct={ch.progress} height={2} />
                  </View>
                )}
              </View>
              <View style={styles.playIcon}>
                {ch.progress === 100 ? (
                  <Text style={styles.replayIcon}>↺</Text>
                ) : (
                  <View style={styles.playCircle}>
                    <Text style={styles.playTriangle}>▶</Text>
                  </View>
                )}
              </View>
            </Pressable>
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
    backgroundColor: colors.burgundy,
    borderWidth: 1,
    borderColor: colors.burgundyLight,
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
    color: colors.burgundy,
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
    borderBottomColor: colors.goldBorderLight,
  },
  chapterBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldBg,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.38)',
  },
  chapterBadgeActive: {
    backgroundColor: colors.burgundy,
    borderColor: colors.burgundyLight,
  },
  chapterBadgeComplete: {
    backgroundColor: colors.green,
    borderColor: colors.greenLight,
  },
  chapterNumeral: {
    fontFamily: fonts.cinzel,
    fontSize: 11,
    fontWeight: '600',
    color: colors.brown,
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
  },
  playIcon: {
    flexShrink: 0,
  },
  replayIcon: {
    color: colors.green,
    fontSize: 16,
  },
  playCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldBg,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.38)',
  },
  playTriangle: {
    color: colors.burgundy,
    fontSize: 10,
    marginLeft: 2,
  },
});
