import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { PendingImport, RulitBookDetail, RulitBookListItem } from '../types';
import { RulitBookModal } from './RulitBookModal';
import {
  getRulitBookDetail,
  getRulitCatalog,
  getRulitDownloadUrl,
  searchRulitBooks,
} from '../services/rulitService';
import {
  buildRulitSourceKey,
  findDuplicateBook,
} from '../services/storage/libraryStorage';
import { colors, fonts, testIds } from '../theme';

interface RulitBrowsePanelProps {
  onImport: (pending: PendingImport) => void;
}

export function RulitBrowsePanel({ onImport }: RulitBrowsePanelProps) {
  const [items, setItems] = useState<RulitBookListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RulitBookDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPage = useCallback(
    async (nextPage: number, query: string, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const result = query.trim().length >= 2
          ? await searchRulitBooks({ q: query.trim(), page: nextPage })
          : await getRulitCatalog({ page: nextPage, sort: 'date' });

        setPage(result.page);
        setHasNext(result.hasNext);
        setItems((prev) =>
          append ? [...prev, ...result.items] : result.items,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Каталогът е временно недостъпен.',
        );
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadPage(1, activeSearch, false);
  }, [activeSearch, loadPage]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      setActiveSearch(searchQuery.trim());
    }, 400);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  const loadDetail = useCallback(async (bookId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      setDetail(await getRulitBookDetail(bookId));
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Неуспешно зареждане.',
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openBook = (bookId: string) => {
    setSelectedId(bookId);
    void loadDetail(bookId);
  };

  const closeModal = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
    setImporting(false);
  };

  const handleImport = async () => {
    if (!detail) return;

    setImporting(true);
    try {
      const sourceKey = buildRulitSourceKey(detail.id);
      const existing = await findDuplicateBook({ sourceKey });
      if (existing) {
        setDetailError(`"${existing.title}" is already in your library.`);
        setImporting(false);
        return;
      }

      const download = await getRulitDownloadUrl(detail.id, true);
      const uri = download.resolvedUrl ?? download.url;

      onImport({
        uri,
        format: 'epub',
        fileName: download.fileName || `${detail.title}.epub`,
        coverUrl: detail.coverUrl,
        sourceKey,
      });
      closeModal();
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Download failed.',
      );
      setImporting(false);
    }
  };

  const loadMore = () => {
    if (loadingMore || loading || !hasNext) return;
    void loadPage(page + 1, activeSearch, true);
  };

  const renderItem: ListRenderItem<RulitBookListItem> = ({ item }) => (
    <Pressable
      testID={testIds.rulit.book(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} by ${item.author}`}
      onPress={() => openBook(item.id)}
      style={styles.row}
    >
      {item.coverUrl ? (
        <Image source={{ uri: item.coverUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbIcon}>📖</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rowAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        {item.genre && (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {item.genre}
          </Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Български EPUB от rulit.me — изберете книга и натиснете Import.
      </Text>

      <View style={styles.searchWrap}>
        <TextInput
          testID={testIds.rulit.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Търсене по заглавие или автор…"
          placeholderTextColor={colors.brown}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.burgundy} size="large" />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            testID={testIds.rulit.retry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            onPress={() => void loadPage(1, activeSearch, false)}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>ОПИТАЙ ОТНОВО</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={colors.burgundy}
                style={styles.footerLoader}
              />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Няма намерени книги.</Text>
          }
        />
      )}

      <RulitBookModal
        visible={selectedId !== null}
        book={detail}
        loading={detailLoading}
        importing={importing}
        error={detailError}
        onClose={closeModal}
        onImport={() => void handleImport()}
        onRetry={() => selectedId && void loadDetail(selectedId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 360,
  },
  hint: {
    fontFamily: fonts.loraItalic,
    color: colors.brown,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  searchWrap: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: 'rgba(245,237,204,0.5)',
  },
  searchInput: {
    fontFamily: fonts.lora,
    color: colors.ink,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  listContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.25)',
  },
  thumb: {
    width: 52,
    height: 76,
    borderRadius: 2,
    backgroundColor: colors.goldBgLight,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: {
    fontSize: 22,
  },
  rowInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: fonts.loraMedium,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 3,
  },
  rowAuthor: {
    fontFamily: fonts.lora,
    color: colors.brown,
    fontSize: 12,
  },
  rowMeta: {
    fontFamily: fonts.loraItalic,
    color: colors.inkMuted,
    fontSize: 11,
    marginTop: 2,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 14,
  },
  errorText: {
    fontFamily: fonts.lora,
    color: colors.burgundy,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.burgundy,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  emptyText: {
    fontFamily: fonts.loraItalic,
    color: colors.brown,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
