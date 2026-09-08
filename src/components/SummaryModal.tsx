import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Book, Chapter, SummaryServiceError } from '../types';
import { fetchSummary } from '../services/summaryService';
import { Flourish } from './Flourish';
import { colors, fonts, testIds } from '../theme';

interface SummaryModalProps {
  visible: boolean;
  book: Book;
  chapter: Chapter;
  onClose: () => void;
  onMarkHeard?: () => void;
}

type LoadState = 'idle' | 'loading' | 'error' | 'success';

export function SummaryModal({
  visible,
  book,
  chapter,
  onClose,
  onMarkHeard,
}: SummaryModalProps) {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [summary, setSummary] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryable, setRetryable] = useState(false);

  const loadSummary = useCallback(
    async (skipCache = false) => {
      setLoadState('loading');
      setErrorMessage('');
      setRetryable(false);

      try {
        const text = await fetchSummary(book, chapter, { skipCache });
        setSummary(text);
        setLoadState('success');
      } catch (error) {
        const message =
          error instanceof SummaryServiceError
            ? error.message
            : 'Could not reach the summary service.';
        const canRetry =
          error instanceof SummaryServiceError ? error.retryable : true;
        setErrorMessage(message);
        setRetryable(canRetry);
        setLoadState('error');
      }
    },
    [book, chapter],
  );

  useEffect(() => {
    if (visible) {
      void loadSummary();
    } else {
      setLoadState('idle');
      setSummary('');
      setErrorMessage('');
    }
  }, [visible, loadSummary]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View testID={testIds.summary.modal} style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.headerLabel}>AI CHAPTER SUMMARY</Text>
              <Text style={styles.headerTitle}>Act {chapter.numeral}</Text>
              <Text style={styles.headerSubtitle}>{chapter.title}</Text>
            </View>

            <View style={styles.divider} />
            <Text style={styles.quill}>✍</Text>

            {loadState === 'loading' && (
              <View style={styles.centerBlock}>
                <ActivityIndicator color={colors.burgundy} size="small" />
                <Text style={styles.loadingText}>Summoning the scribe…</Text>
              </View>
            )}

            {loadState === 'error' && (
              <View style={styles.centerBlock}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                {retryable && (
                  <Pressable
                    testID={testIds.summary.retry}
                    accessibilityRole="button"
                    accessibilityLabel="Retry summary"
                    onPress={() => void loadSummary(true)}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>TRY AGAIN</Text>
                  </Pressable>
                )}
              </View>
            )}

            {loadState === 'success' && (
              <Text style={styles.summaryText}>&ldquo;{summary}&rdquo;</Text>
            )}

            <Flourish double />

            <View style={styles.actions}>
              <Pressable
                testID={testIds.summary.close}
                accessibilityRole="button"
                accessibilityLabel="Close summary"
                onPress={onClose}
                style={[styles.button, styles.buttonSecondary]}
              >
                <Text style={styles.buttonSecondaryText}>CLOSE</Text>
              </Pressable>
              <Pressable
                testID={testIds.summary.markHeard}
                accessibilityRole="button"
                accessibilityLabel="Mark heard"
                onPress={onMarkHeard}
                disabled={loadState === 'loading'}
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  loadState === 'loading' && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.buttonPrimaryText}>MARK HEARD ✓</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '78%',
    backgroundColor: colors.parchment,
    borderTopWidth: 3,
    borderTopColor: colors.goldAccent,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLabel: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 9,
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  headerTitle: {
    fontFamily: fonts.cinzel,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontFamily: fonts.fell,
    color: colors.brown,
    fontSize: 12,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.5,
    marginBottom: 20,
  },
  quill: {
    textAlign: 'center',
    fontSize: 26,
    marginBottom: 12,
  },
  centerBlock: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.fell,
    color: colors.brown,
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorText: {
    fontFamily: fonts.lora,
    color: colors.burgundy,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: colors.burgundyLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  summaryText: {
    fontFamily: fonts.fell,
    color: '#2A1A0A',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonSecondary: {
    borderColor: 'rgba(196,168,130,0.5)',
  },
  buttonPrimary: {
    backgroundColor: colors.burgundy,
    borderColor: colors.burgundyLight,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondaryText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.inkMuted,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  buttonPrimaryText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.parchment,
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
