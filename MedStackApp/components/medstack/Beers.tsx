import { COLORS } from '@/constants/medstack-colors';
import { BEERS_DISCLAIMER, BEERS_SOURCE_LABEL, beersSummaryLine, parseAge } from '@/lib/beers';
import { sharedStyles } from '@/styles/shared';
import { SafetyLine } from './SafetyLine';
import type { BeersFlag } from '@/types/medstack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * Small, calm "Beers" pill. Deliberately not one of the interaction severity
 * colors: it marks "worth a conversation", not "stop".
 */
export function BeersBadge({ onPress, label = 'Beers' }: { onPress?: () => void; label?: string }) {
  const pill = (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
  if (!onPress) return pill;
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} accessibilityLabel="On the Beers list. Tap for details.">
      {pill}
    </TouchableOpacity>
  );
}

/** One line shown above a list or map when any medication is flagged. */
export function BeersSummary({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryText}>{beersSummaryLine(count)}</Text>
      <Text style={styles.finePrint}>{BEERS_DISCLAIMER}</Text>
    </View>
  );
}

/** Reason, recommendation and source for each Beers entry a medication matched. */
export function BeersDetail({ flags, drugLabel }: { flags: BeersFlag[]; drugLabel?: string }) {
  if (flags.length === 0) return null;
  return (
    <View style={styles.detail}>
      {flags.map((f) => (
        <View key={`${f.drug}:${f.entryId}`} style={{ gap: 4 }}>
          <View style={styles.detailHead}>
            <BeersBadge />
            <Text style={styles.detailTitle}>
              {drugLabel ? `${drugLabel} - ` : ''}
              <Text style={{ textTransform: 'none' }}>{f.class}</Text>
            </Text>
          </View>
          <Text style={styles.detailBody}>
            <Text style={styles.detailLabel}>Why it is listed: </Text>
            {f.reason}
          </Text>
          <Text style={styles.detailBody}>
            <Text style={styles.detailLabel}>AGS recommendation: </Text>
            {f.recommendation}
          </Text>
        </View>
      ))}
      <Text style={styles.finePrint}>Source: {BEERS_SOURCE_LABEL}. Applies to adults 65+.</Text>
      <Text style={styles.finePrint}>{BEERS_DISCLAIMER}</Text>
      <SafetyLine />
    </View>
  );
}

/** Asks for the user's age (once after sign-in, or again from the header). */
export function AgePrompt({
  visible,
  initialAge,
  onSave,
  onSkip,
}: {
  visible: boolean;
  initialAge?: number | null;
  onSave: (age: number) => void;
  /** Dismiss without an age. */
  onSkip: () => void;
}) {
  const [draft, setDraft] = useState(initialAge != null ? String(initialAge) : '');
  const [error, setError] = useState('');

  const submit = () => {
    const age = parseAge(draft);
    if (age === null || age === 'invalid') {
      setError('Enter an age from 0 to 120.');
      return;
    }
    setError('');
    onSave(age);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[sharedStyles.card, styles.promptCard]}>
          <Text style={sharedStyles.h2}>How old is the person taking these?</Text>
          <Text style={[sharedStyles.subtle, { marginTop: 6 }]}>
            For adults 65 and older, MedStack also marks medications on the AGS Beers Criteria list. Age stays on this
            device apart from that check.
          </Text>
          <Text style={[sharedStyles.eyebrow, { marginTop: 16 }]}>AGE</Text>
          <TextInput
            style={sharedStyles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="e.g. 72"
            placeholderTextColor={COLORS.inkFaint}
            keyboardType="number-pad"
            maxLength={3}
            autoFocus
            onSubmitEditing={submit}
          />
          {!!error && <Text style={sharedStyles.errorText}>{error}</Text>}
          <TouchableOpacity style={[sharedStyles.btnPrimaryFull, { marginTop: 16 }]} onPress={submit}>
            <Text style={sharedStyles.btnPrimaryText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sharedStyles.btnGhost} onPress={onSkip}>
            <Text style={sharedStyles.btnGhostText}>{initialAge != null ? 'Cancel' : 'Skip for now'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.beersSoft,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  badgeText: { color: COLORS.beersInk, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.3 },
  summary: {
    backgroundColor: COLORS.beersSoft,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    gap: 3,
  },
  summaryText: { color: COLORS.beersInk, fontSize: 12.5, lineHeight: 18, fontWeight: '500' },
  finePrint: { color: COLORS.inkFaint, fontSize: 11, lineHeight: 15 },
  detail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 10,
  },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  detailTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.ink, textTransform: 'capitalize' },
  detailBody: { fontSize: 13, lineHeight: 19, color: COLORS.inkSoft },
  detailLabel: { fontWeight: '600', color: COLORS.ink },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 43, 39, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  promptCard: { padding: 22 },
});
