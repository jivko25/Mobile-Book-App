import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ViewStyle,
  NativeSyntheticEvent,
  TextLayoutEventData,
} from 'react-native';
import { SpeakWord } from '../services/tts/speechTimeline';
import { colors, fonts } from '../theme';

interface HighlightedChapterTextProps {
  words: SpeakWord[];
  currentWordIndex: number;
  accent: string;
  playing: boolean;
  style?: ViewStyle;
}

function buildPanelColors(accent: string) {
  return {
    border: accent,
    headerBg: 'rgba(8, 5, 3, 0.94)',
    collapsedBg: 'rgba(8, 5, 3, 0.94)',
    parchment: '#F3EAD0',
    label: accent,
    hint: 'rgba(243, 234, 208, 0.82)',
    chevronBg: 'rgba(255, 255, 255, 0.08)',
    chevronBorder: accent,
    body: colors.ink,
    past: '#6B5340',
    currentBg: `${accent}40`,
    currentText: colors.ink,
  };
}

export function HighlightedChapterText({
  words,
  currentWordIndex,
  accent,
  playing,
  style,
}: HighlightedChapterTextProps) {
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const lineOffsets = useRef<number[]>([]);
  const panel = useMemo(() => buildPanelColors(accent), [accent]);

  const onTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    lineOffsets.current = event.nativeEvent.lines.map((line) => line.y);
  };

  useEffect(() => {
    if (collapsed || words.length === 0) return;

    const lineIndex = Math.floor(currentWordIndex / 8);
    const y = lineOffsets.current[lineIndex] ?? lineIndex * 28;
    scrollRef.current?.scrollTo({
      y: Math.max(0, y - 48),
      animated: playing,
    });
  }, [collapsed, currentWordIndex, playing, words.length]);

  const toggleCollapsed = () => setCollapsed((value) => !value);

  if (words.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          { borderColor: panel.border, backgroundColor: panel.headerBg },
          style,
        ]}
      >
        <Text style={[styles.emptyText, { color: panel.hint }]}>
          No text for this chapter.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        collapsed ? styles.wrapCollapsed : styles.wrapExpanded,
        style,
      ]}
    >
      <View
        style={[
          styles.frame,
          {
            borderColor: panel.border,
            backgroundColor: collapsed ? panel.collapsedBg : panel.parchment,
          },
          collapsed ? styles.frameCollapsed : styles.frameExpanded,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={collapsed ? 'Expand chapter text' : 'Collapse chapter text'}
          accessibilityState={{ expanded: !collapsed }}
          onPress={toggleCollapsed}
          hitSlop={8}
          style={({ pressed }) => [
            styles.header,
            { backgroundColor: panel.headerBg },
            collapsed && styles.headerCollapsed,
            !collapsed && {
              borderBottomWidth: 1,
              borderBottomColor: `${accent}55`,
            },
            pressed && styles.headerPressed,
          ]}
        >
          <View style={styles.headerTextGroup}>
            <Text style={[styles.headerLabel, { color: panel.label }]}>
              READ ALONG
            </Text>
            {collapsed && (
              <Text style={[styles.headerHint, { color: panel.hint }]}>
                Tap to show chapter text
              </Text>
            )}
          </View>
          <View
            style={[
              styles.chevronBadge,
              {
                backgroundColor: panel.chevronBg,
                borderColor: panel.chevronBorder,
              },
            ]}
          >
            <Text style={[styles.headerChevron, { color: panel.label }]}>
              {collapsed ? '▴' : '▾'}
            </Text>
          </View>
        </Pressable>

        {!collapsed && (
          <ScrollView
            ref={scrollRef}
            style={[styles.textScroll, { backgroundColor: panel.parchment }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={[styles.body, { color: panel.body }]} onTextLayout={onTextLayout}>
              {words.map((word, index) => {
                const isCurrent = index === currentWordIndex;
                const isPast = index < currentWordIndex;

                return (
                  <Text
                    key={`${index}-${word.text}`}
                    style={[
                      styles.word,
                      { color: panel.body },
                      isPast && { color: panel.past, opacity: 0.72 },
                      isCurrent && {
                        color: panel.currentText,
                        backgroundColor: panel.currentBg,
                      },
                      isCurrent && styles.currentWord,
                    ]}
                  >
                    {word.text}{' '}
                  </Text>
                );
              })}
            </Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  wrapExpanded: {
    flex: 1,
    minHeight: 0,
  },
  wrapCollapsed: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 4,
  },
  frame: {
    borderWidth: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  frameExpanded: {
    flex: 1,
    minHeight: 0,
  },
  frameCollapsed: {
    flexGrow: 0,
    flexShrink: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  headerCollapsed: {
    minHeight: 56,
    paddingVertical: 14,
  },
  headerPressed: {
    opacity: 0.88,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 12,
  },
  headerLabel: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 10,
    letterSpacing: 2,
  },
  headerHint: {
    fontFamily: fonts.loraItalic,
    fontSize: 12,
    marginTop: 4,
  },
  chevronBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerChevron: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 13,
    lineHeight: 14,
  },
  textScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  body: {
    fontFamily: fonts.lora,
    fontSize: 15,
    lineHeight: 28,
  },
  word: {
    fontFamily: fonts.lora,
    fontSize: 15,
    lineHeight: 28,
  },
  currentWord: {
    fontFamily: fonts.loraMedium,
    fontWeight: '700',
  },
  empty: {
    padding: 16,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  emptyText: {
    fontFamily: fonts.loraItalic,
    fontSize: 13,
    textAlign: 'center',
  },
});
