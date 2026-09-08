import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Book } from '../types';
import { fonts } from '../theme';

interface BookCoverProps {
  book: Book;
  width: number;
  height: number;
  testID?: string;
}

export function BookCover({ book, width, height, testID }: BookCoverProps) {
  const spineWidth = Math.max(3, width * 0.06);
  const titleSize = Math.max(7, width * 0.075);
  const authorSize = Math.max(5, width * 0.055);
  const ornamentSize = Math.max(5, width * 0.065);
  const topOrnamentSize = Math.max(6, width * 0.09);

  return (
    <View
      testID={testID}
      style={[
        styles.cover,
        {
          width,
          height,
          backgroundColor: book.bg,
        },
      ]}
    >
      <LinearGradient
        colors={[`${book.accent}aa`, `${book.accent}33`]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.spine, { width: spineWidth }]}
      />

      <View style={styles.frame}>
        <Text style={[styles.ornament, { color: book.accent, fontSize: topOrnamentSize }]}>
          ✦
        </Text>
        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.title,
              {
                color: book.accent,
                fontSize: titleSize,
                fontFamily: fonts.cinzel,
              },
            ]}
            numberOfLines={3}
          >
            {book.title}
          </Text>
          <Text
            style={[
              styles.author,
              {
                color: book.accent,
                fontSize: authorSize,
                fontFamily: fonts.loraItalic,
              },
            ]}
          >
            {book.author.split(' ').slice(-1)[0]}
          </Text>
        </View>
        <Text style={[styles.ornament, { color: book.accent, fontSize: ornamentSize }]}>
          ❧
        </Text>
      </View>

      <View style={styles.sheen} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  frame: {
    position: 'absolute',
    top: '8%',
    left: '18%',
    right: '8%',
    bottom: '8%',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.27)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: '8%',
    paddingHorizontal: '6%',
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  author: {
    fontStyle: 'italic',
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'center',
  },
  ornament: {
    textAlign: 'center',
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
