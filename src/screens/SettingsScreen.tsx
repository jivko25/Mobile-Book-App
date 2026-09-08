import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flourish, ScreenContainer } from '../components';
import {
  formatVoiceLanguageLabel,
  getNarrationVoices,
  loadSettings,
  saveSettings,
  TtsVoiceOption,
} from '../services/tts/voicePreferences';
import { speechPlayer } from '../services/tts/speechPlayer';
import { colors, fonts, spacing, testIds } from '../theme';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [speed, setSpeed] = useState(1);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [voices, setVoices] = useState<TtsVoiceOption[]>([]);
  const [usingFallbackVoices, setUsingFallbackVoices] = useState(false);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [sleep, setSleep] = useState(30);

  useEffect(() => {
    const init = async () => {
      const [settings, narration] = await Promise.all([
        loadSettings(),
        getNarrationVoices(),
      ]);
      setSpeed(settings.speed);
      setVoiceId(settings.voiceId ?? narration.voices[0]?.id ?? null);
      setVoices(narration.voices);
      setUsingFallbackVoices(narration.usingFallback);
      setLoadingVoices(false);
    };
    void init();
  }, []);

  const updateSpeed = useCallback(async (next: number) => {
    setSpeed(next);
    await saveSettings({ speed: next });
  }, []);

  const updateVoice = useCallback(async (id: string) => {
    setVoiceId(id);
    await saveSettings({ voiceId: id });
    await speechPlayer.setVoice(id);
  }, []);

  return (
    <ScreenContainer testID={testIds.screen.settings}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: spacing.bottomNavHeight + insets.bottom + 20,
        }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.brand}>F O L I O</Text>
          <Text style={styles.title}>The Chamber</Text>
          <Text style={styles.subtitle}>Arrange your reading preferences</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionLabel}>PLAYBACK</Text>

          <View style={styles.speedSection}>
            <View style={styles.speedHeader}>
              <Text style={styles.settingTitle}>Narration Speed</Text>
              <Text style={styles.speedValue}>{speed}×</Text>
            </View>
            <View style={styles.speedButtons}>
              {SPEEDS.map((s) => (
                <Pressable
                  key={s}
                  testID={testIds.settings.speed(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Speed ${s}x`}
                  accessibilityState={{ selected: speed === s }}
                  onPress={() => updateSpeed(s)}
                  style={[styles.speedBtn, speed === s && styles.speedBtnActive]}
                >
                  <Text
                    style={[
                      styles.speedBtnText,
                      speed === s && styles.speedBtnTextActive,
                    ]}
                  >
                    {s}×
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.sleepRow}>
            <View>
              <Text style={styles.settingTitle}>Sleep Timer</Text>
              <Text style={styles.settingDesc}>End narration after silence</Text>
            </View>
            <View style={styles.sleepControls}>
              <Pressable
                testID={testIds.settings.sleepDecrease}
                accessibilityRole="button"
                accessibilityLabel="Decrease sleep timer"
                onPress={() => setSleep((s) => Math.max(10, s - 10))}
              >
                <Text style={styles.sleepBtn}>−</Text>
              </Pressable>
              <Text style={styles.sleepValue}>{sleep}m</Text>
              <Pressable
                testID={testIds.settings.sleepIncrease}
                accessibilityRole="button"
                accessibilityLabel="Increase sleep timer"
                onPress={() => setSleep((s) => Math.min(90, s + 10))}
              >
                <Text style={styles.sleepBtn}>+</Text>
              </Pressable>
            </View>
          </View>

          <Flourish />

          <Text style={[styles.sectionLabel, styles.voiceLabel]}>
            ГЛАС ЗА ЧЕТЕНЕ
          </Text>
          {usingFallbackVoices ? (
            <Text style={styles.voiceWarning}>
              Няма инсталиран български глас на устройството. Инсталирайте български TTS
              от системните настройки → Език и въвеждане → Текст в реч. По-долу са показани
              резервни английски гласове.
            </Text>
          ) : (
            <Text style={styles.voiceHint}>
              Български системни гласове — препоръчваме Enhanced качество
            </Text>
          )}

          {loadingVoices ? (
            <ActivityIndicator color={colors.burgundy} style={styles.voiceLoader} />
          ) : voices.length === 0 ? (
            <Text style={styles.voiceHint}>
              Няма налични гласове. Добавете български TTS от настройките на телефона.
            </Text>
          ) : (
            voices.map((v) => (
              <Pressable
                key={v.id}
                testID={testIds.settings.voice(v.name)}
                accessibilityRole="button"
                accessibilityLabel={`Избери глас ${v.name}`}
                accessibilityState={{ selected: voiceId === v.id }}
                onPress={() => updateVoice(v.id)}
                style={styles.voiceRow}
              >
                <View style={styles.voiceInfo}>
                  <Text style={styles.voiceName}>{v.name}</Text>
                  <Text style={styles.voiceMeta}>
                    {formatVoiceLanguageLabel(v.language)}
                    {v.quality === 'Enhanced' ? ' · Enhanced' : ''}
                  </Text>
                </View>
                {voiceId === v.id && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            ))
          )}

          <Flourish double />

          <View style={styles.about}>
            <Text style={styles.aboutOrnament}>✦ ✦ ✦</Text>
            <Text style={styles.aboutTitle}>FOLIO</Text>
            <Text style={styles.aboutQuote}>
              &ldquo;All the world&apos;s a stage, and all the men{'\n'}
              and women merely players.&rdquo;
            </Text>
            <Text style={styles.aboutVersion}>
              Version I · IV · A Literary Experience
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 18,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.3)',
  },
  brand: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 9,
    letterSpacing: 3.5,
    marginBottom: 5,
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
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 20,
  },
  sectionLabel: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 14,
  },
  speedSection: {
    marginBottom: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.2)',
  },
  speedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingTitle: {
    fontFamily: fonts.loraMedium,
    color: colors.ink,
    fontSize: 14,
  },
  speedValue: {
    fontFamily: fonts.cinzelRegular,
    color: colors.burgundy,
    fontSize: 11,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  speedBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  speedBtnActive: {
    backgroundColor: colors.burgundy,
  },
  speedBtnText: {
    fontFamily: fonts.cinzelRegular,
    color: colors.brown,
    fontSize: 9,
  },
  speedBtnTextActive: {
    color: colors.parchment,
  },
  sleepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.2)',
  },
  settingDesc: {
    fontFamily: fonts.lora,
    color: colors.brown,
    fontSize: 11,
  },
  sleepControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sleepBtn: {
    color: colors.burgundy,
    fontSize: 18,
    paddingHorizontal: 2,
  },
  sleepValue: {
    fontFamily: fonts.cinzelRegular,
    color: colors.ink,
    fontSize: 13,
    minWidth: 40,
    textAlign: 'center',
  },
  voiceLabel: {
    marginTop: 18,
    marginBottom: 6,
  },
  voiceHint: {
    fontFamily: fonts.loraItalic,
    color: colors.brown,
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 16,
  },
  voiceWarning: {
    fontFamily: fonts.lora,
    color: colors.burgundy,
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 17,
    backgroundColor: 'rgba(123,28,46,0.08)',
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(123,28,46,0.2)',
  },
  voiceLoader: {
    marginVertical: 16,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,168,130,0.2)',
  },
  voiceInfo: {
    flex: 1,
    paddingRight: 8,
  },
  voiceName: {
    fontFamily: fonts.lora,
    color: colors.ink,
    fontSize: 14,
  },
  voiceMeta: {
    fontFamily: fonts.lora,
    color: colors.brown,
    fontSize: 11,
    marginTop: 2,
  },
  checkmark: {
    color: colors.green,
  },
  about: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  aboutOrnament: {
    fontFamily: fonts.cinzelRegular,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 3,
    marginBottom: 8,
  },
  aboutTitle: {
    fontFamily: fonts.cinzelBold,
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  aboutQuote: {
    fontFamily: fonts.fell,
    color: colors.brown,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 22,
    marginVertical: 10,
    textAlign: 'center',
  },
  aboutVersion: {
    fontFamily: fonts.lora,
    color: colors.gold,
    fontSize: 11,
  },
});
