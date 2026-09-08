import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface InkProgressProps {
  pct: number;
  height?: number;
  color?: string;
  testID?: string;
}

export function InkProgress({
  pct,
  height = 2,
  color = colors.burgundy,
  testID,
}: InkProgressProps) {
  return (
    <View
      testID={testID}
      style={[styles.track, { height, borderRadius: height }]}
    >
      <LinearGradient
        colors={[`${color}bb`, color]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          styles.fill,
          { width: `${Math.min(100, Math.max(0, pct))}%`, borderRadius: height },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
