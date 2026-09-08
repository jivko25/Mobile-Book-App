import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book } from '../types';
import {
  BookCover,
  Flourish,
  InkProgress,
  ScreenContainer,
} from '../components';
import { colors, fonts, spacing, testIds } from '../theme';

interface LibraryScreenProps {
  books: Book[];
  onSelect: (book: Book) => void;
}

export function LibraryScreen({ books, onSelect }: LibraryScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.screenPadding * 2 - 18) / 2;

  const inProgress = books.filter((b) => b.progress > 0 && b.progress < 100);
  const lastRead = inProgress.length > 0 ? inProgress[0] : null;

  return (
    <ScreenContainer testID={testIds.screen.library}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: spacing.bottomNavHeight + insets.bottom + 20,
        }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.brand}>F O L I O</Text>
          <Text style={styles.title}>The Library</Text>
          <Text style={styles.subtitle}>Your literary collection</Text>
        </View>

        <View style={styles.content}>
          {books.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>Your library is empty</Text>
              <Text style={styles.emptyText}>
                Import a TXT or EPUB file from the Import tab to begin.
              </Text>
            </View>
          ) : (
            <>
          {lastRead && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CONTINUE READING</Text>
              <Pressable
                testID={testIds.library.continueReading}
                accessibilityRole="button"
                accessibilityLabel={`Continue reading ${lastRead.title}`}
                onPress={() => onSelect(lastRead)}
                style={styles.continueCard}
              >
                <BookCover book={lastRead} width={52} height={76} />
                <View style={styles.continueInfo}>
                  <View>
                    <Text style={styles.continueTitle}>{lastRead.title}</Text>
                    <Text style={styles.continueAuthor}>{lastRead.author}</Text>
                    {lastRead.lastPosition && (
                      <Text style={styles.continuePosition}>
                        Act {lastRead.lastChapterId} · {lastRead.lastPosition} elapsed
                      </Text>
                    )}
                  </View>
                  <View>
                    <InkProgress pct={lastRead.progress} height={3} />
                    <View style={styles.continueFooter}>
                      <Text style={styles.progressText}>{lastRead.progress}% heard</Text>
                      <Text style={styles.resumeText}>RESUME →</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>
          )}

          <Flourish />

          <Text style={[styles.sectionLabel, styles.volumesLabel]}>ALL VOLUMES</Text>
          <View style={styles.grid}>
            {books.map((book) => (
              <Pressable
                key={book.id}
                testID={testIds.library.bookCard(book.id)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${book.title}`}
                onPress={() => onSelect(book)}
                style={[styles.bookItem, { width: cardWidth }]}
              >
                <BookCover book={book} width={cardWidth} height={cardWidth * 1.43} />
                <View style={styles.bookMeta}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={styles.bookAuthor}>{book.author}</Text>
                  {book.progress > 0 && book.progress < 100 && (
                    <View style={styles.bookProgress}>
                      <InkProgress pct={book.progress} height={2} />
                    </View>
                  )}
                  {book.progress === 0 && (
                    <Text style={styles.unread}>Unread</Text>
                  )}
                  {book.progress === 100 && (
                    <Text style={styles.complete}>✓ Complete</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.3)',
  },
  brand: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 10,
    letterSpacing: 3.5,
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    color: colors.ink,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: fonts.fell,
    color: colors.brown,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 10,
  },
  continueCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    backgroundColor: colors.goldBg,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 2,
  },
  continueInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  continueTitle: {
    fontFamily: fonts.cinzel,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  continueAuthor: {
    fontFamily: fonts.loraItalic,
    color: colors.brown,
    fontSize: 11,
    marginTop: 2,
  },
  continuePosition: {
    fontFamily: fonts.lora,
    color: colors.inkMuted,
    fontSize: 11,
    marginTop: 6,
  },
  continueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressText: {
    fontFamily: fonts.lora,
    color: colors.brown,
    fontSize: 10,
  },
  resumeText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  volumesLabel: {
    marginTop: 18,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  bookItem: {},
  bookMeta: {
    marginTop: 8,
  },
  bookTitle: {
    fontFamily: fonts.cinzel,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  bookAuthor: {
    fontFamily: fonts.loraItalic,
    color: colors.brown,
    fontSize: 10,
    marginTop: 2,
  },
  bookProgress: {
    marginTop: 6,
  },
  unread: {
    fontFamily: fonts.lora,
    color: colors.gold,
    fontSize: 10,
    marginTop: 5,
  },
  complete: {
    fontFamily: fonts.lora,
    color: colors.green,
    fontSize: 10,
    marginTop: 5,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.cinzel,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.fell,
    color: colors.brown,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});
