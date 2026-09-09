import React from 'react';
import { View, StyleSheet } from 'react-native';

interface NavIconProps {
  color: string;
  size?: number;
}

export function IconBookOpen({ color, size = 22 }: NavIconProps) {
  const bookW = size * 0.92;
  const bookH = size * 0.82;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={[
          styles.book,
          {
            width: bookW,
            height: bookH,
            borderColor: color,
          },
        ]}
      >
        <View style={[styles.bookSpine, { backgroundColor: color }]} />
        <View style={[styles.bookPage, { borderLeftColor: color }]} />
      </View>
    </View>
  );
}

export function IconPlusCircle({ color, size = 22 }: NavIconProps) {
  const d = size * 0.88;
  const stroke = 1.5;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={[
          styles.circle,
          {
            width: d,
            height: d,
            borderRadius: d / 2,
            borderColor: color,
            borderWidth: stroke,
          },
        ]}
      >
        <View
          style={[
            styles.plusBar,
            {
              width: d * 0.38,
              height: stroke,
              backgroundColor: color,
            },
          ]}
        />
        <View
          style={[
            styles.plusBar,
            styles.plusBarVertical,
            {
              width: stroke,
              height: d * 0.38,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function IconSliders({ color, size = 22 }: NavIconProps) {
  const rowW = size * 0.92;
  const dot = 4;

  return (
    <View style={[styles.box, { width: size, height: size, gap: 3 }]}>
      {[0.22, 0.5, 0.72].map((pos) => (
        <View key={pos} style={[styles.sliderRow, { width: rowW }]}>
          <View style={[styles.sliderTrack, { backgroundColor: color }]} />
          <View
            style={[
              styles.sliderDot,
              {
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                backgroundColor: color,
                left: rowW * pos - dot / 2,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  book: {
    borderWidth: 1.5,
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bookSpine: {
    width: 3,
    height: '100%',
    opacity: 0.85,
  },
  bookPage: {
    flex: 1,
    borderLeftWidth: 1,
    opacity: 0.35,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBar: {
    position: 'absolute',
    borderRadius: 1,
  },
  plusBarVertical: {},
  sliderRow: {
    height: 4,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 1.5,
    borderRadius: 1,
    opacity: 0.55,
  },
  sliderDot: {
    position: 'absolute',
    top: -1.25,
  },
});
