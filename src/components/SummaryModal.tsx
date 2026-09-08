import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Book, Chapter } from '../types';
import { AI_SUMMARIES } from '../data/books';
import { Flourish } from './Flourish';
import { colors, fonts, testIds } from '../theme';

interface SummaryModalProps {
  visible: boolean;
  book: Book;
  chapter: Chapter;
  onClose: () => void;
  onMarkHeard?: () => void;
}

export function SummaryModal({ visible, book, chapter, onClose, onMarkHeard }: SummaryModalProps) {
  const key = `${book.id}-${chapter.id}`;
  const text =
    AI_SUMMARIES[key] ||
    "The stage is set, the players assembled, and the story turns upon its hinge. What was hidden comes to light; what was light dissolves into shadow. Every word spoken carries the weight of consequence, and the audience leans forward in the dark, breath held, knowing that nothing shall ever again be quite as it was before this scene was played.";

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
            <Text style={styles.summaryText}>&ldquo;{text}&rdquo;</Text>
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
            style={[styles.button, styles.buttonPrimary]}
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
