import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ListRenderItem,
  ViewToken,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book, Chapter } from '../types';
import { ScreenContainer } from '../components';
import {
  loadReaderPreferences,
  READER_FONT_MAX,
  READER_FONT_MIN,
  ReaderViewMode,
  saveReaderPreferences,
} from '../services/readerPreferences';
import {
  ChapterBlock,
  charOffsetFromProgress,
  charOffsetFromSegmentIndex,
  progressFromCharOffset,
  ReaderPage,
  segmentIndexAtCharOffset,
  splitChapterIntoBlocks,
  splitChapterIntoPages,
} from '../utils/chapterReader';
import { colors, fonts, testIds } from '../theme';

interface ReaderScreenProps {
  book: Book;
  chapter: Chapter;
  onBack: () => void;
  onReadProgressChange?: (
    readProgress: number,
    chapterId: number,
    readCharOffset: number,
  ) => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  canPrev: boolean;
  canNext: boolean;
}

function resolveStartCharOffset(chapter: Chapter): number {
  if ((chapter.readCharOffset ?? 0) > 0) return chapter.readCharOffset ?? 0;
  return charOffsetFromProgress(
    chapter.readProgress ?? 0,
    chapter.content.length,
  );
}

export function ReaderScreen({
  book,
  chapter,
  onBack,
  onReadProgressChange,
  onPrevChapter,
  onNextChapter,
  canPrev,
  canNext,
}: ReaderScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollListRef = useRef<FlatList<ChapterBlock>>(null);
  const pageListRef = useRef<FlatList<ReaderPage>>(null);
  const [readyToScroll, setReadyToScroll] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [viewMode, setViewMode] = useState<ReaderViewMode>('scroll');
  const [pageLayout, setPageLayout] = useState({ width: 0, height: 0 });
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [displayReadProgress, setDisplayReadProgress] = useState(
    chapter.readProgress ?? 0,
  );
  const [openedAtProgress, setOpenedAtProgress] = useState(
    chapter.readProgress ?? 0,
  );

  const maxReadCharOffsetRef = useRef(resolveStartCharOffset(chapter));
  const positionCharOffsetRef = useRef(resolveStartCharOffset(chapter));
  const hasInitialScrolledRef = useRef(false);
  const lastReportedCharOffsetRef = useRef(-1);
  const pagesRef = useRef<ReaderPage[]>([]);

  const lineHeight = fontSize * 1.75;
  const textStyle = useMemo(
    () => ({
      fontFamily: fonts.lora,
      fontSize,
      lineHeight,
      color: colors.ink,
    }),
    [fontSize, lineHeight],
  );

  const blocks = useMemo(
    () => splitChapterIntoBlocks(chapter.content),
    [chapter.content],
  );

  const textAreaWidth = Math.max(0, pageLayout.width - 36);
  const textAreaHeight = Math.max(0, pageLayout.height - 32);

  const pages = useMemo(
    () =>
      splitChapterIntoPages(
        chapter.content,
        fontSize,
        textAreaWidth,
        textAreaHeight,
      ),
    [chapter.content, fontSize, textAreaWidth, textAreaHeight],
  );

  pagesRef.current = pages;

  const startCharOffset = useMemo(
    () => resolveStartCharOffset(chapter),
    [chapter.id, chapter.readCharOffset, chapter.readProgress, chapter.content.length],
  );

  const initialScrollIndex = useMemo(() => {
    if (viewMode === 'pages') {
      return segmentIndexAtCharOffset(pages, startCharOffset);
    }
    return segmentIndexAtCharOffset(blocks, startCharOffset);
  }, [viewMode, pages, blocks, startCharOffset]);

  useEffect(() => {
    let mounted = true;
    void loadReaderPreferences().then((prefs) => {
      if (!mounted) return;
      setFontSize(prefs.fontSize);
      setViewMode(prefs.viewMode);
      setPrefsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const start = resolveStartCharOffset(chapter);
    maxReadCharOffsetRef.current = start;
    positionCharOffsetRef.current = start;
    setDisplayReadProgress(
      chapter.readProgress ??
        progressFromCharOffset(start, chapter.content.length),
    );
    setOpenedAtProgress(
      chapter.readProgress ??
        progressFromCharOffset(start, chapter.content.length),
    );
    hasInitialScrolledRef.current = false;
    lastReportedCharOffsetRef.current = -1;
    setCurrentPageIndex(0);
  }, [chapter.id]);

  useEffect(() => {
    setReadyToScroll(false);
    hasInitialScrolledRef.current = false;
    const timer = setTimeout(() => setReadyToScroll(true), 60);
    return () => clearTimeout(timer);
  }, [chapter.id, viewMode, fontSize, pageLayout.width, pageLayout.height]);

  useEffect(() => {
    if (!readyToScroll || hasInitialScrolledRef.current) return;

    const index = Math.min(initialScrollIndex, Math.max(segmentsLength() - 1, 0));
    const timer = setTimeout(() => {
      if (viewMode === 'pages' && pageLayout.width > 0) {
        pageListRef.current?.scrollToOffset({
          offset: index * pageLayout.width,
          animated: false,
        });
        setCurrentPageIndex(index);
      } else if (viewMode === 'scroll' && index > 0) {
        scrollListRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0,
        });
      }
      hasInitialScrolledRef.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, [
    readyToScroll,
    initialScrollIndex,
    chapter.id,
    viewMode,
    pageLayout.width,
    blocks.length,
    pages.length,
  ]);

  function segmentsLength() {
    return viewMode === 'pages' ? pages.length : blocks.length;
  }

  const reportProgress = useCallback(
    (index: number) => {
      if (!onReadProgressChange || chapter.content.length === 0) return;

      const segments = viewMode === 'pages' ? pages : blocks;
      const charOffset = charOffsetFromSegmentIndex(segments, index);
      if (charOffset <= lastReportedCharOffsetRef.current) return;
      if (charOffset <= maxReadCharOffsetRef.current) return;

      const next = progressFromCharOffset(charOffset, chapter.content.length);
      lastReportedCharOffsetRef.current = charOffset;
      maxReadCharOffsetRef.current = charOffset;
      positionCharOffsetRef.current = charOffset;
      setDisplayReadProgress(next);
      onReadProgressChange(next, chapter.id, charOffset);
    },
    [blocks, chapter.content.length, chapter.id, onReadProgressChange, pages, viewMode],
  );

  const snapToNearestPage = useCallback(
    (offsetX: number, animated: boolean) => {
      const width = pageLayout.width;
      if (width <= 0) return;

      const maxIndex = Math.max(pagesRef.current.length - 1, 0);
      const index = Math.max(0, Math.min(Math.round(offsetX / width), maxIndex));
      const targetOffset = index * width;

      if (Math.abs(offsetX - targetOffset) > 1) {
        pageListRef.current?.scrollToOffset({
          offset: targetOffset,
          animated,
        });
      }

      setCurrentPageIndex(index);
      reportProgress(index);
    },
    [pageLayout.width, reportProgress],
  );

  const onPageScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      snapToNearestPage(event.nativeEvent.contentOffset.x, true);
    },
    [snapToNearestPage],
  );

  const onScrollViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const top = viewableItems[0];
      if (top?.index != null) reportProgress(top.index);
    },
  );

  useEffect(() => {
    onScrollViewableItemsChanged.current = ({ viewableItems }) => {
      const top = viewableItems[0];
      if (top?.index != null) reportProgress(top.index);
    };
  }, [reportProgress]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 35,
    minimumViewTime: 300,
  }).current;

  const changeFontSize = (delta: number) => {
    setFontSize((current) => {
      const next = Math.min(
        READER_FONT_MAX,
        Math.max(READER_FONT_MIN, current + delta),
      );
      if (next !== current) {
        void saveReaderPreferences({ fontSize: next });
        positionCharOffsetRef.current = maxReadCharOffsetRef.current;
        hasInitialScrolledRef.current = false;
        lastReportedCharOffsetRef.current = -1;
      }
      return next;
    });
  };

  const setReaderViewMode = (mode: ReaderViewMode) => {
    if (mode === viewMode) return;
    positionCharOffsetRef.current = maxReadCharOffsetRef.current;
    hasInitialScrolledRef.current = false;
    lastReportedCharOffsetRef.current = -1;
    setViewMode(mode);
    void saveReaderPreferences({ viewMode: mode });
  };

  const renderScrollBlock: ListRenderItem<ChapterBlock> = ({ item }) => (
    <Text style={[styles.paragraph, textStyle]}>{item.text}</Text>
  );

  const renderPage: ListRenderItem<ReaderPage> = ({ item }) => (
    <View style={[styles.page, { width: pageLayout.width, height: pageLayout.height }]}>
      <Text style={[textStyle, styles.pageText]}>{item.text}</Text>
    </View>
  );

  const footerLabel =
    viewMode === 'pages' && pages.length > 0
      ? `Page ${currentPageIndex + 1} / ${pages.length}`
      : displayReadProgress > 0
        ? `${displayReadProgress}% read`
        : chapter.duration;

  return (
    <ScreenContainer testID={testIds.screen.reader} backgroundColor={book.bg}>
      <View
        style={[
          styles.layout,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            testID={testIds.reader.back}
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
          >
            <Text style={[styles.topAction, { color: book.accent }]}>← BACK</Text>
          </Pressable>
          <Text style={[styles.modeLabel, { color: `${book.accent}80` }]}>
            READING
          </Text>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.header}>
          <Text style={[styles.actLabel, { color: `${book.accent}70` }]}>
            ACT {chapter.numeral}
          </Text>
          <Text style={[styles.chapterTitle, { color: book.accent }]}>
            {chapter.title}
          </Text>
          <Text style={[styles.chapterMeta, { color: `${book.accent}65` }]}>
            {book.title} · {book.author}
          </Text>
          {openedAtProgress > 0 && openedAtProgress < 100 && (
            <Text style={[styles.resumeHint, { color: `${book.accent}75` }]}>
              Resumed reading at {openedAtProgress}%
            </Text>
          )}
        </View>

        <View style={[styles.toolbar, { borderColor: `${book.accent}30` }]}>
          <View style={styles.fontControls}>
            <Pressable
              testID={testIds.reader.fontDecrease}
              accessibilityRole="button"
              accessibilityLabel="Decrease font size"
              onPress={() => changeFontSize(-1)}
              disabled={fontSize <= READER_FONT_MIN}
              style={[
                styles.toolButton,
                { borderColor: `${book.accent}40` },
                fontSize <= READER_FONT_MIN && styles.toolButtonDisabled,
              ]}
            >
              <Text style={[styles.toolButtonText, { color: book.accent }]}>A−</Text>
            </Pressable>
            <Text style={[styles.fontSizeLabel, { color: `${book.accent}90` }]}>
              {fontSize}
            </Text>
            <Pressable
              testID={testIds.reader.fontIncrease}
              accessibilityRole="button"
              accessibilityLabel="Increase font size"
              onPress={() => changeFontSize(1)}
              disabled={fontSize >= READER_FONT_MAX}
              style={[
                styles.toolButton,
                { borderColor: `${book.accent}40` },
                fontSize >= READER_FONT_MAX && styles.toolButtonDisabled,
              ]}
            >
              <Text style={[styles.toolButtonText, { color: book.accent }]}>A+</Text>
            </Pressable>
          </View>

          <View style={styles.modeToggle}>
            <Pressable
              testID={testIds.reader.modeScroll}
              accessibilityRole="button"
              accessibilityLabel="Scroll reading mode"
              onPress={() => setReaderViewMode('scroll')}
              style={[
                styles.modeButton,
                {
                  borderColor: `${book.accent}40`,
                  backgroundColor:
                    viewMode === 'scroll' ? `${book.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={[styles.modeButtonText, { color: book.accent }]}>
                SCROLL
              </Text>
            </Pressable>
            <Pressable
              testID={testIds.reader.modePages}
              accessibilityRole="button"
              accessibilityLabel="Page reading mode"
              onPress={() => setReaderViewMode('pages')}
              style={[
                styles.modeButton,
                {
                  borderColor: `${book.accent}40`,
                  backgroundColor:
                    viewMode === 'pages' ? `${book.accent}22` : 'transparent',
                },
              ]}
            >
              <Text style={[styles.modeButtonText, { color: book.accent }]}>
                PAGES
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.contentArea}>
          {!prefsLoaded || !chapter.content.trim() ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={book.accent} />
              <Text style={[styles.emptyText, { color: `${book.accent}80` }]}>
                Loading chapter text…
              </Text>
            </View>
          ) : viewMode === 'pages' ? (
            <View
              style={styles.pageListFrame}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setPageLayout((prev) =>
                  prev.width === width && prev.height === height
                    ? prev
                    : { width, height },
                );
              }}
            >
              {pageLayout.width > 0 && pageLayout.height > 0 ? (
                <FlatList
                  ref={pageListRef}
                  data={pages}
                  key={`pages-${fontSize}-${pageLayout.width}-${pageLayout.height}-${chapter.id}`}
                  keyExtractor={(item) => item.id}
                  renderItem={renderPage}
                  horizontal
                  pagingEnabled
                  snapToInterval={pageLayout.width}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  disableIntervalMomentum
                  bounces={false}
                  overScrollMode="never"
                  showsHorizontalScrollIndicator={false}
                  style={styles.pageList}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={onPageScrollEnd}
                  onScrollEndDrag={onPageScrollEnd}
                  getItemLayout={(_, index) => ({
                    length: pageLayout.width,
                    offset: pageLayout.width * index,
                    index,
                  })}
                  onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                      pageListRef.current?.scrollToOffset({
                        offset: info.index * pageLayout.width,
                        animated: false,
                      });
                    }, 100);
                  }}
                />
              ) : (
                <View style={styles.emptyState}>
                  <ActivityIndicator color={book.accent} />
                </View>
              )}
            </View>
          ) : (
            <FlatList
              ref={scrollListRef}
              data={blocks}
              key={`scroll-${fontSize}-${chapter.id}`}
              keyExtractor={(item) => item.id}
              renderItem={renderScrollBlock}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              initialNumToRender={Math.min(blocks.length, initialScrollIndex + 8)}
              onViewableItemsChanged={onScrollViewableItemsChanged.current}
              viewabilityConfig={viewabilityConfig}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  scrollListRef.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: false,
                  });
                }, 100);
              }}
            />
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: `${book.accent}30` }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous chapter"
            onPress={onPrevChapter}
            disabled={!canPrev}
          >
            <Text
              style={[
                styles.navAction,
                { color: canPrev ? book.accent : `${book.accent}30` },
              ]}
            >
              ← PREV
            </Text>
          </Pressable>
          <Text style={[styles.footerMeta, { color: `${book.accent}70` }]}>
            {footerLabel}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next chapter"
            onPress={onNextChapter}
            disabled={!canNext}
          >
            <Text
              style={[
                styles.navAction,
                { color: canNext ? book.accent : `${book.accent}30` },
              ]}
            >
              NEXT →
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topAction: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  modeLabel: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 9,
    letterSpacing: 2.5,
  },
  topSpacer: {
    width: 48,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  actLabel: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 4,
  },
  chapterTitle: {
    fontFamily: fonts.cinzel,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 4,
  },
  chapterMeta: {
    fontFamily: fonts.loraItalic,
    fontSize: 11,
    textAlign: 'center',
  },
  resumeHint: {
    fontFamily: fonts.lora,
    fontSize: 10,
    marginTop: 6,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolButton: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: 'center',
  },
  toolButtonDisabled: {
    opacity: 0.35,
  },
  toolButtonText: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  fontSizeLabel: {
    fontFamily: fonts.lora,
    fontSize: 12,
    minWidth: 22,
    textAlign: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  modeButton: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modeButtonText: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 8,
    letterSpacing: 1,
  },
  contentArea: {
    flex: 1,
    marginTop: 8,
    marginHorizontal: 16,
  },
  list: {
    flex: 1,
    backgroundColor: '#F3EAD0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.45)',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  paragraph: {
    marginBottom: 16,
  },
  pageListFrame: {
    flex: 1,
    backgroundColor: '#F3EAD0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.45)',
    overflow: 'hidden',
  },
  pageList: {
    flex: 1,
  },
  page: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  pageText: {
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  navAction: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  footerMeta: {
    fontFamily: fonts.lora,
    fontSize: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontFamily: fonts.loraItalic,
    fontSize: 13,
  },
});
