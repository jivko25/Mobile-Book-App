import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Cinzel_400Regular,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import { IMFellEnglish_400Regular_Italic } from '@expo-google-fonts/im-fell-english';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
} from '@expo-google-fonts/lora';
import { Screen, Book, Chapter, PendingImport } from './src/types';
import { BottomNav, SummaryModal } from './src/components';
import { LibraryProvider, useLibrary } from './src/context/LibraryContext';
import {
  LibraryScreen,
  BookDetailScreen,
  PlayerScreen,
  ImportScreen,
  ProcessingScreen,
  SettingsScreen,
} from './src/screens';
import { colors } from './src/theme';
import {
  getBookById,
  getChapterWithContent,
  markChapterHeard,
  updateListeningProgress,
} from './src/services/storage/libraryStorage';
import { speechPlayer } from './src/services/tts/speechPlayer';

function mergeChapterContent(
  stored: Chapter,
  previous: Chapter | null | undefined,
): Chapter {
  if (!previous || previous.id !== stored.id) return stored;
  if (stored.content) return stored;
  if (previous.content) return { ...stored, content: previous.content };
  return stored;
}

function AppContent() {
  const { books, loading, refresh } = useLibrary();
  const [screen, setScreen] = useState<Screen>('library');
  const [navStack, setNavStack] = useState<Screen[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

  const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgressRef = useRef(0);
  const selectedBookRef = useRef(selectedBook);
  const selectedChapterRef = useRef(selectedChapter);

  selectedBookRef.current = selectedBook;
  selectedChapterRef.current = selectedChapter;

  const applyBookUpdate = useCallback(
    async (updated: Book) => {
      setSelectedBook(updated);
      const chapterId = selectedChapterRef.current?.id;
      if (chapterId) {
        const ch = updated.chapters.find((c) => c.id === chapterId);
        if (ch) {
          setSelectedChapter((prev) => mergeChapterContent(ch, prev));
        }
      }
      await refresh();
    },
    [refresh],
  );

  const flushProgressSave = useCallback(async () => {
    if (progressSaveTimer.current) {
      clearTimeout(progressSaveTimer.current);
      progressSaveTimer.current = null;
    }

    const book = selectedBookRef.current;
    const chapter = selectedChapterRef.current;
    if (!book || !chapter) return;

    const progress = Math.max(
      lastProgressRef.current,
      speechPlayer.getProgressPercent(),
    );
    const updated = await updateListeningProgress(book.id, chapter.id, progress);
    if (updated) {
      setSelectedBook(updated);
      const ch = updated.chapters.find((c) => c.id === chapter.id);
      if (ch) {
        setSelectedChapter((prev) => mergeChapterContent(ch, prev));
      }
      await refresh();
    }
  }, [refresh]);

  const handleProgressChange = useCallback(
    (progress: number, chapterId: number) => {
      const book = selectedBookRef.current;
      if (!book) return;

      if (selectedChapterRef.current?.id === chapterId) {
        lastProgressRef.current = progress;
      }

      if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
      progressSaveTimer.current = setTimeout(async () => {
        progressSaveTimer.current = null;
        const updated = await updateListeningProgress(
          book.id,
          chapterId,
          progress,
        );
        if (updated) await applyBookUpdate(updated);
      }, 800);
    },
    [applyBookUpdate],
  );

  const handleChapterComplete = useCallback(async () => {
    const book = selectedBookRef.current;
    const chapter = selectedChapterRef.current;
    if (!book || !chapter) return;
    lastProgressRef.current = 100;
    const updated = await updateListeningProgress(book.id, chapter.id, 100);
    if (updated) await applyBookUpdate(updated);
  }, [applyBookUpdate]);

  const handleMarkHeard = useCallback(async () => {
    const book = selectedBookRef.current;
    const chapter = selectedChapterRef.current;
    if (!book || !chapter) return;
    const updated = await markChapterHeard(book.id, chapter.id);
    if (updated) {
      await applyBookUpdate(updated);
      setShowSummary(false);
    }
  }, [applyBookUpdate]);

  const reloadSelectedBook = useCallback(async () => {
    const bookId = selectedBookRef.current?.id;
    if (!bookId) return null;
    const fresh = await getBookById(bookId);
    if (fresh) setSelectedBook(fresh);
    return fresh;
  }, []);

  const openChapterById = useCallback(
    async (chapterId: number) => {
      await flushProgressSave();
      speechPlayer.pause();

      const bookId = selectedBookRef.current?.id;
      if (!bookId) return;

      const fresh = await getBookById(bookId);
      if (!fresh) return;

      const chapter = await getChapterWithContent(bookId, chapterId);
      if (!chapter) return;

      lastProgressRef.current = chapter.progress ?? 0;
      setSelectedBook(fresh);
      setSelectedChapter(chapter);
      setNavStack((prev) => [...prev, screen]);
      setScreen('player');
    },
    [flushProgressSave, screen],
  );

  const goToAdjacentChapter = useCallback(
    async (direction: -1 | 1) => {
      await flushProgressSave();
      speechPlayer.pause();

      const book = selectedBookRef.current;
      const chapter = selectedChapterRef.current;
      if (!book || !chapter) return;

      const fresh = await getBookById(book.id);
      if (!fresh) return;

      const idx = fresh.chapters.findIndex((c) => c.id === chapter.id);
      const nextMeta = fresh.chapters[idx + direction];
      if (!nextMeta) return;

      const next = await getChapterWithContent(book.id, nextMeta.id);
      if (!next) return;

      lastProgressRef.current = next.progress ?? 0;
      setSelectedBook(fresh);
      setSelectedChapter(next);
    },
    [flushProgressSave],
  );

  const navigate = useCallback((next: Screen) => {
    setNavStack((prev) => [...prev, screen]);
    setScreen(next);
  }, [screen]);

  const goBack = useCallback(async () => {
    if (screen === 'player') {
      await flushProgressSave();
      speechPlayer.pause();
    }

    setNavStack((prev) => {
      const stack = [...prev];
      const previous = stack.pop();
      setScreen(previous ?? 'library');

      if (previous === 'detail') {
        void reloadSelectedBook();
      }

      return stack;
    });
  }, [screen, flushProgressSave, reloadSelectedBook]);

  const openBook = useCallback(
    async (book: Book) => {
      const fresh = (await getBookById(book.id)) ?? book;
      setSelectedBook(fresh);
      navigate('detail');
    },
    [navigate],
  );

  const openChapter = useCallback(
    (chapter: Chapter) => {
      void openChapterById(chapter.id);
    },
    [openChapterById],
  );

  const openResume = useCallback(async () => {
    const book = selectedBookRef.current;
    if (!book) return;

    const fresh = (await getBookById(book.id)) ?? book;
    const resumeMeta =
      fresh.chapters.find((c) => c.id === fresh.lastChapterId) ?? fresh.chapters[0];
    if (!resumeMeta) return;

    const resumeChapter = await getChapterWithContent(fresh.id, resumeMeta.id);
    if (!resumeChapter) return;

    lastProgressRef.current = resumeChapter.progress ?? 0;
    setSelectedBook(fresh);
    setSelectedChapter(resumeChapter);
    setNavStack((prev) => [...prev, screen]);
    setScreen('player');
  }, [screen]);

  const handleFileSelected = useCallback(
    (pending: PendingImport) => {
      setPendingImport(pending);
      navigate('processing');
    },
    [navigate],
  );

  const handleImportComplete = useCallback(
    async (book: Book) => {
      setPendingImport(null);
      await refresh();
      setSelectedBook(book);
      setNavStack(['library']);
      setScreen('detail');
    },
    [refresh],
  );

  const handleImportError = useCallback((message: string) => {
    setPendingImport(null);
    Alert.alert('Import failed', message, [
      { text: 'OK', onPress: () => setScreen('import') },
    ]);
  }, []);

  const showBottomNav = ['library', 'import', 'settings'].includes(screen);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.burgundy} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.parchment} />
      <View style={styles.root}>
        <View style={styles.shell}>
          {screen === 'library' && (
            <LibraryScreen books={books} onSelect={openBook} />
          )}
          {screen === 'detail' && selectedBook && (
            <BookDetailScreen
              book={selectedBook}
              onBack={goBack}
              onPlayChapter={openChapter}
              onResume={() => void openResume()}
            />
          )}
          {screen === 'player' && selectedBook && selectedChapter && (
            <PlayerScreen
              key={`${selectedBook.id}-${selectedChapter.id}`}
              book={selectedBook}
              chapter={selectedChapter}
              onBack={() => void goBack()}
              onSummary={() => setShowSummary(true)}
              onProgressChange={handleProgressChange}
              onChapterComplete={handleChapterComplete}
              onPrevChapter={() => void goToAdjacentChapter(-1)}
              onNextChapter={() => void goToAdjacentChapter(1)}
              canPrev={
                selectedBook.chapters.findIndex((c) => c.id === selectedChapter.id) > 0
              }
              canNext={
                selectedBook.chapters.findIndex((c) => c.id === selectedChapter.id) <
                selectedBook.chapters.length - 1
              }
            />
          )}
          {screen === 'import' && (
            <ImportScreen
              onBack={() => setScreen('library')}
              onFileSelected={handleFileSelected}
            />
          )}
          {screen === 'processing' && pendingImport && (
            <ProcessingScreen
              pending={pendingImport}
              onComplete={handleImportComplete}
              onError={handleImportError}
            />
          )}
          {screen === 'settings' && <SettingsScreen />}

          {showBottomNav && (
            <BottomNav
              active={screen}
              onChange={(s) => {
                setNavStack([]);
                setScreen(s);
              }}
            />
          )}

          {selectedBook && selectedChapter && (
            <SummaryModal
              visible={showSummary}
              book={selectedBook}
              chapter={selectedChapter}
              onClose={() => setShowSummary(false)}
              onMarkHeard={handleMarkHeard}
            />
          )}
        </View>
      </View>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    IMFellEnglish_400Regular_Italic,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LibraryProvider>
        <AppContent />
      </LibraryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchment,
  },
  root: {
    flex: 1,
    backgroundColor: colors.parchmentDark,
    alignItems: 'center',
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.parchment,
    overflow: 'hidden',
  },
});
