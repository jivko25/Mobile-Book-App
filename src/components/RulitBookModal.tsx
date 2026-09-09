import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { RulitBookDetail } from '../types';
import { colors, fonts, testIds } from '../theme';

interface RulitBookModalProps {
  visible: boolean;
  book: RulitBookDetail | null;
  loading: boolean;
  importing: boolean;
  error: string | null;
  onClose: () => void;
  onImport: () => void;
  onRetry: () => void;
}

export function RulitBookModal({
  visible,
  book,
  loading,
  importing,
  error,
  onClose,
  onImport,
  onRetry,
}: RulitBookModalProps) {
  const authors = book?.authors?.length
    ? book.authors.join(', ')
    : book?.author;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Pressable
            testID={testIds.rulit.modalClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.burgundy} size="large" />
              <Text style={styles.loadingText}>Зареждане…</Text>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                testID={testIds.rulit.modalRetry}
                accessibilityRole="button"
                accessibilityLabel="Retry"
                onPress={onRetry}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>ОПИТАЙ ОТНОВО</Text>
              </Pressable>
            </View>
          ) : book ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.hero}>
                {book.coverUrl ? (
                  <Image
                    source={{ uri: book.coverUrl }}
                    style={styles.cover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cover, styles.coverPlaceholder]}>
                    <Text style={styles.coverPlaceholderText}>📖</Text>
                  </View>
                )}
                <View style={styles.heroInfo}>
                  <Text style={styles.title}>{book.title}</Text>
                  <Text style={styles.author}>{authors}</Text>
                  {book.year && (
                    <Text style={styles.meta}>{book.year}</Text>
                  )}
                  {book.genre && (
                    <Text style={styles.meta}>{book.genre}</Text>
                  )}
                  {book.series && (
                    <Text style={styles.series}>{book.series}</Text>
                  )}
                </View>
              </View>

              {book.synopsis ? (
                <Text style={styles.synopsis}>{book.synopsis}</Text>
              ) : (
                <Text style={styles.synopsisMuted}>Няма налична анотация.</Text>
              )}

              <Pressable
                testID={testIds.rulit.importButton}
                accessibilityRole="button"
                accessibilityLabel={`Import ${book.title}`}
                onPress={onImport}
                disabled={importing || !book.download.epub}
                style={[
                  styles.importBtn,
                  (importing || !book.download.epub) && styles.importBtnDisabled,
                ]}
              >
                {importing ? (
                  <ActivityIndicator color={colors.parchment} />
                ) : (
                  <Text style={styles.importText}>IMPORT EPUB</Text>
                )}
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  closeText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.brown,
    fontSize: 16,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  loadingText: {
    fontFamily: fonts.loraItalic,
    color: colors.brown,
    fontSize: 13,
  },
  errorText: {
    fontFamily: fonts.lora,
    color: colors.burgundy,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.burgundy,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  hero: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  cover: {
    width: 88,
    height: 128,
    borderRadius: 3,
    backgroundColor: colors.goldBgLight,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    fontSize: 28,
  },
  heroInfo: {
    flex: 1,
    paddingTop: 4,
  },
  title: {
    fontFamily: fonts.cinzel,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 6,
  },
  author: {
    fontFamily: fonts.loraMedium,
    color: colors.brown,
    fontSize: 13,
    marginBottom: 4,
  },
  meta: {
    fontFamily: fonts.lora,
    color: colors.inkMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  series: {
    fontFamily: fonts.loraItalic,
    color: colors.brown,
    fontSize: 11,
    marginTop: 4,
  },
  synopsis: {
    fontFamily: fonts.lora,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  synopsisMuted: {
    fontFamily: fonts.loraItalic,
    color: colors.brown,
    fontSize: 13,
    marginBottom: 20,
  },
  importBtn: {
    backgroundColor: colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    minHeight: 48,
  },
  importBtnDisabled: {
    opacity: 0.55,
  },
  importText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.parchment,
    fontSize: 11,
    letterSpacing: 2,
  },
});
