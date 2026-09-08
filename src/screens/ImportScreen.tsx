import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImportFormat, PendingImport } from '../types';
import { Flourish, ScreenContainer } from '../components';
import { getRecentImports } from '../services/storage/libraryStorage';
import {
  formatFromMime,
  formatFromName,
} from '../services/import/importService';
import { colors, fonts, spacing, testIds } from '../theme';

interface ImportScreenProps {
  onBack: () => void;
  onFileSelected: (pending: PendingImport) => void;
}

const MIME_TYPES: Record<ImportFormat, string[]> = {
  epub: ['application/epub+zip'],
  pdf: ['application/pdf'],
  txt: ['text/plain'],
};

export function ImportScreen({ onBack, onFileSelected }: ImportScreenProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<ImportFormat>('txt');
  const [picking, setPicking] = useState(false);
  const [recent, setRecent] = useState<
    { title: string; type: ImportFormat; date: string; id: string }[]
  >([]);

  const loadRecent = useCallback(async () => {
    setRecent(await getRecentImports());
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const pickFile = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: MIME_TYPES[tab],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const format =
        formatFromMime(asset.mimeType) ??
        formatFromName(asset.name) ??
        tab;

      if (format !== tab) {
        Alert.alert(
          'Wrong format',
          `Please select a ${tab.toUpperCase()} file for this tab.`,
        );
        return;
      }

      onFileSelected({
        uri: asset.uri,
        format,
        fileName: asset.name,
      });
    } catch {
      Alert.alert('Import failed', 'Could not open the file picker.');
    } finally {
      setPicking(false);
    }
  };

  return (
    <ScreenContainer testID={testIds.screen.import}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: spacing.bottomNavHeight + insets.bottom + 20,
        }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable
            testID={testIds.import.back}
            accessibilityRole="button"
            accessibilityLabel="Back to library"
            onPress={onBack}
          >
            <Text style={styles.backText}>← LIBRARY</Text>
          </Pressable>
          <Text style={styles.title}>Import a Volume</Text>
          <Text style={styles.subtitle}>Add a new work to your collection</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.tabs}>
            {(['txt', 'epub', 'pdf'] as const).map((format) => (
              <Pressable
                key={format}
                testID={testIds.import.tab(format)}
                accessibilityRole="button"
                accessibilityLabel={`Import ${format.toUpperCase()}`}
                accessibilityState={{ selected: tab === format }}
                onPress={() => setTab(format)}
                style={[styles.tab, tab === format && styles.tabActive]}
              >
                <Text
                  style={[styles.tabText, tab === format && styles.tabTextActive]}
                >
                  {format.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            testID={testIds.import.dropZone}
            accessibilityRole="button"
            accessibilityLabel={`Pick a ${tab.toUpperCase()} file`}
            onPress={pickFile}
            disabled={picking}
            style={[styles.dropZone, picking && styles.dropZoneDisabled]}
          >
            <Text style={styles.dropIcon}>📜</Text>
            <Text style={styles.dropTitle}>
              {picking ? 'OPENING…' : `SELECT YOUR ${tab.toUpperCase()} FILE`}
            </Text>
            <Text style={styles.dropSubtitle}>tap to browse your files</Text>
          </Pressable>

          <Flourish />

          <Text style={styles.sectionLabel}>RECENTLY IMPORTED</Text>
          {recent.length === 0 ? (
            <Text style={styles.emptyRecent}>No imports yet</Text>
          ) : (
            recent.map((item) => (
              <View key={item.id} style={styles.recentRow}>
                <View>
                  <Text style={styles.recentTitle}>{item.title}</Text>
                  <Text style={styles.recentDate}>{item.date}</Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.3)',
  },
  backText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    color: colors.ink,
    fontSize: 22,
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
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  tabActive: {
    backgroundColor: colors.burgundy,
  },
  tabText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.brown,
    fontSize: 10,
    letterSpacing: 2,
  },
  tabTextActive: {
    color: colors.parchment,
  },
  dropZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(196,168,130,0.5)',
    backgroundColor: 'rgba(196,168,130,0.1)',
  },
  dropZoneDisabled: {
    opacity: 0.6,
  },
  dropIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  dropTitle: {
    fontFamily: fonts.cinzelRegular,
    color: colors.inkMuted,
    fontSize: 11,
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  dropSubtitle: {
    fontFamily: fonts.fell,
    color: colors.brown,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 18,
    marginBottom: 10,
  },
  emptyRecent: {
    fontFamily: fonts.loraItalic,
    color: colors.brown,
    fontSize: 12,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.2)',
  },
  recentTitle: {
    fontFamily: fonts.loraMedium,
    color: colors.ink,
    fontSize: 14,
  },
  recentDate: {
    fontFamily: fonts.lora,
    color: colors.brown,
    fontSize: 11,
  },
  typeBadge: {
    borderWidth: 1,
    borderColor: colors.goldBorder,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  typeText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.brown,
    fontSize: 9,
    letterSpacing: 1,
  },
});
