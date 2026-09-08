import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface ScreenContainerProps {
  children: ReactNode;
  testID?: string;
  backgroundColor?: string;
}

export function ScreenContainer({
  children,
  testID,
  backgroundColor = colors.parchment,
}: ScreenContainerProps) {
  return (
    <View
      testID={testID}
      style={[styles.container, { backgroundColor }]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
