import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../types';
import { colors, fonts, testIds } from '../theme';
import { IconBookOpen, IconPlusCircle, IconSliders } from './NavIcons';

type NavTab = Extract<Screen, 'library' | 'import' | 'settings'>;

interface BottomNavProps {
  active: Screen;
  onChange: (screen: NavTab) => void;
}

const tabs: { id: NavTab; label: string; Icon: React.ComponentType<{ color: string; size?: number }> }[] = [
  { id: 'library', label: 'Library', Icon: IconBookOpen },
  { id: 'import', label: 'Import', Icon: IconPlusCircle },
  { id: 'settings', label: 'Chamber', Icon: IconSliders },
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
        const iconColor = isActive ? colors.burgundy : colors.brown;
        const { Icon } = tab;

        return (
          <Pressable
            key={tab.id}
            testID={testIds.nav[tab.id]}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.id)}
            style={styles.tab}
          >
            <Icon color={iconColor} size={22} />
            <Text
              style={[
                styles.label,
                { color: iconColor },
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
    gap: 4,
    paddingVertical: 2,
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
