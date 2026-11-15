import { COLORS } from '@/constants/medstack-colors';
import { SAFETY_LINE } from '@/lib/safety';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

/**
 * The app's generic safety line, shown as the last line of every Beers,
 * condition and stacking detail. It is the app's own advice, not a quote from
 * a source, so it never shares a line with a source citation.
 */
export function SafetyLine() {
  return <Text style={styles.line}>{SAFETY_LINE}</Text>;
}

const styles = StyleSheet.create({
  line: { fontSize: 12, lineHeight: 17, fontWeight: '600', color: COLORS.inkSoft },
});
