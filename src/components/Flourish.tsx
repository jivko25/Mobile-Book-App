import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../theme';

interface FlourishProps {
  double?: boolean;
}

export function Flourish({ double = false }: FlourishProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['transparent', colors.gold]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
      <Text style={[styles.symbol, double && styles.symbolDouble]}>
        {double ? '❧  ✦  ❦' : '✦'}
      </Text>
      <LinearGradient
        colors={[colors.gold, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
  },
  symbol: {
    color: colors.gold,
    fontSize: 11,
  },
  symbolDouble: {
    letterSpacing: 6,
  },
});
