import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Book, PendingImport } from '../types';
import { InkProgress, ScreenContainer } from '../components';
import {
  IMPORT_STEPS,
  ImportStep,
  importVolume,
} from '../services/import/importService';
import { colors, fonts, testIds } from '../theme';

interface ProcessingScreenProps {
  pending: PendingImport;
  onComplete: (book: Book) => void;
  onError: (message: string) => void;
}

const STEP_ORDER: ImportStep[] = ['reading', 'parsing', 'chapters', 'saving', 'done'];

export function ProcessingScreen({
  pending,
  onComplete,
  onError,
}: ProcessingScreenProps) {
  const [inkPct, setInkPct] = useState(0);
  const [step, setStep] = useState<ImportStep>('reading');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    importVolume(pending, (nextStep) => {
      setStep(nextStep);
      const idx = STEP_ORDER.indexOf(nextStep);
      setInkPct(Math.round((idx / (STEP_ORDER.length - 1)) * 100));
    })
      .then((book) => {
        setInkPct(100);
        setTimeout(() => onComplete(book), 800);
      })
      .catch((err: Error) => {
        onError(err.message ?? 'Import failed.');
      });
  }, [pending, onComplete, onError]);

  return (
    <ScreenContainer testID={testIds.screen.processing}>
      <View style={styles.container}>
        <Text style={styles.ornament}>❧ ✦ ❦</Text>

        <View style={styles.inkwell}>
          <Text
            style={[
              styles.quill,
              { transform: [{ rotate: `${-28 + inkPct * 0.15}deg` }] },
            ]}
          >
            🪶
          </Text>
          <View style={styles.inkwellBody}>
            <View style={[styles.inkFill, { height: `${inkPct}%` }]} />
          </View>
        </View>

        <Text style={styles.title}>Preparing Your Volume</Text>
        <Text style={styles.step}>{IMPORT_STEPS[step]}</Text>
        <Text style={styles.fileName} numberOfLines={1}>
          {pending.fileName}
        </Text>

        <View style={styles.progressWrap}>
          <InkProgress pct={inkPct} height={4} />
        </View>
        <Text style={styles.percent}>{inkPct}%</Text>

        {inkPct >= 100 && (
          <View style={styles.ready}>
            <Text style={styles.readyIcon}>📖</Text>
            <Text style={styles.readyText}>VOLUME READY</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  ornament: {
    fontFamily: fonts.cinzelRegular,
    color: colors.gold,
    fontSize: 20,
    marginBottom: 32,
  },
  inkwell: {
    width: 80,
    height: 110,
    marginBottom: 32,
    position: 'relative',
  },
  quill: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -18,
    fontSize: 36,
  },
  inkwellBody: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    borderWidth: 2,
    borderColor: 'rgba(196,168,130,0.5)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(196,168,130,0.1)',
    overflow: 'hidden',
  },
  inkFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A0905',
  },
  title: {
    fontFamily: fonts.cinzel,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  step: {
    fontFamily: fonts.fell,
    color: colors.brown,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 6,
    textAlign: 'center',
    minHeight: 22,
  },
  fileName: {
    fontFamily: fonts.lora,
    color: colors.inkMuted,
    fontSize: 11,
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: '100%',
  },
  progressWrap: {
    width: '100%',
    marginBottom: 8,
  },
  percent: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 10,
    letterSpacing: 2,
  },
  ready: {
    marginTop: 28,
    alignItems: 'center',
  },
  readyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  readyText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.green,
    fontSize: 10,
    letterSpacing: 2,
  },
});
