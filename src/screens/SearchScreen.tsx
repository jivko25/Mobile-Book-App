import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book } from '../types';
import { BookCover, Flourish, ScreenContainer } from '../components';
import { colors, fonts, spacing, testIds } from '../theme';

interface SearchScreenProps {
  books: Book[];
  onSelect: (book: Book) => void;
}

const GENRES = [
  { name: 'Tragedy', icon: '🎭', count: 2 },
  { name: 'Comedy', icon: '🎪', count: 1 },
  { name: 'Romance', icon: '🌊', count: 1 },
  { name: 'History', icon: '⚔️', count: 0 },
  { name: 'Sonnets', icon: '📜', count: 0 },
];

const RECENT_SEARCHES = ['Hamlet', 'William Shakespeare', 'Tragedy'];

export function SearchScreen({ books, onSelect }: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered =
    query.length > 1
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(query.toLowerCase()) ||
            b.author.toLowerCase().includes(query.toLowerCase()) ||
            b.genre.toLowerCase().includes(query.toLowerCase()),
        )
      : [];

  return (
    <ScreenContainer testID={testIds.screen.search}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: spacing.bottomNavHeight + insets.bottom + 20,
        }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.title}>Search the Library</Text>
          <View style={styles.inputWrap}>
            <TextInput
              testID={testIds.search.input}
              accessibilityLabel="Search input"
              placeholder="Title, author, or genre…"
              placeholderTextColor={colors.brown}
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
        </View>

        <View style={styles.content}>
          {filtered.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>
                {filtered.length} VOLUME{filtered.length !== 1 ? 'S' : ''} FOUND
              </Text>
              {filtered.map((book) => (
                <Pressable
                  key={book.id}
                  testID={testIds.search.result(book.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${book.title}`}
                  onPress={() => onSelect(book)}
                  style={styles.resultRow}
                >
                  <BookCover book={book} width={46} height={66} />
                  <View>
                    <Text style={styles.resultTitle}>{book.title}</Text>
                    <Text style={styles.resultAuthor}>by {book.author}</Text>
                    <Text style={styles.resultGenre}>{book.genre}</Text>
                  </View>
                </Pressable>
              ))}
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>BROWSE BY GENRE</Text>
              {GENRES.map((g) => (
                <Pressable
                  key={g.name}
                  testID={testIds.search.genre(g.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${g.name}`}
                  style={styles.genreRow}
                >
                  <Text style={styles.genreIcon}>{g.icon}</Text>
                  <View style={styles.genreInfo}>
                    <Text style={styles.genreName}>{g.name}</Text>
                    <Text style={styles.genreCount}>
                      {g.count} volume{g.count !== 1 ? 's' : ''} in collection
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}

              <Flourish double />

              <Text style={[styles.sectionLabel, styles.recentLabel]}>
                RECENT SEARCHES
              </Text>
              {RECENT_SEARCHES.map((s) => (
                <Pressable
                  key={s}
                  accessibilityRole="button"
                  accessibilityLabel={`Search for ${s}`}
                  onPress={() => setQuery(s)}
                  style={styles.recentRow}
                >
                  <Text style={styles.recentIcon}>⏱</Text>
                  <Text style={styles.recentText}>{s}</Text>
                </Pressable>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.3)',
  },
  title: {
    fontFamily: fonts.cinzelBold,
    color: colors.ink,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    fontFamily: fonts.lora,
    width: '100%',
    paddingVertical: 11,
    paddingLeft: 14,
    paddingRight: 36,
    backgroundColor: colors.goldBgLight,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.5)',
    color: colors.ink,
    fontSize: 14,
  },
  searchIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
    color: colors.brown,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 18,
  },
  sectionLabel: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.2)',
  },
  resultTitle: {
    fontFamily: fonts.cinzel,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  resultAuthor: {
    fontFamily: fonts.loraItalic,
    color: colors.brown,
    fontSize: 11,
    marginTop: 2,
  },
  resultGenre: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: 5,
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.2)',
  },
  genreIcon: {
    fontSize: 20,
  },
  genreInfo: {
    flex: 1,
  },
  genreName: {
    fontFamily: fonts.cinzel,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  genreCount: {
    fontFamily: fonts.lora,
    color: colors.brown,
    fontSize: 11,
  },
  chevron: {
    color: colors.gold,
  },
  recentLabel: {
    marginTop: 18,
    marginBottom: 10,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  recentIcon: {
    color: colors.gold,
    fontSize: 11,
  },
  recentText: {
    fontFamily: fonts.lora,
    color: colors.inkMuted,
    fontSize: 13,
  },
});
