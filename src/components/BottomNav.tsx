import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../types';
import { colors, fonts, testIds } from '../theme';

interface BottomNavProps {
  active: Screen;
  onChange: (screen: Screen) => void;
}

const tabs: { id: Screen; label: string; icon: string }[] = [
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'import', label: 'Import', icon: '📜' },
  { id: 'settings', label: 'Chamber', icon: '⚙' },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      testID="bottom-nav"
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 14) }]}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const testID = testIds.nav[tab.id as keyof typeof testIds.nav];

        return (
          <Pressable
            key={tab.id}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.id)}
            style={styles.tab}
          >
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.burgundy : colors.brown },
              ]}
            >
              {tab.label.toUpperCase()}
            </Text>
            {isActive && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.parchment,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196,168,130,0.5)',
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 7,
    letterSpacing: 1.2,
  },
  indicator: {
    width: 16,
    height: 1.5,
    backgroundColor: colors.burgundy,
    borderRadius: 1,
    marginTop: 1,
  },
});
