import { COLORS } from '@/constants/medstack-colors';
import {
  CONDITION_DISCLAIMER,
  CONDITION_INCOMPLETE_NOTE,
  conditionSummaryLine,
  loadConditions,
  matchesConditionSearch,
} from '@/lib/conditions';
import { sharedStyles } from '@/styles/shared';
import type { Condition, ConditionFlag } from '@/types/medstack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BeersBadge } from './Beers';
import { SafetyLine } from './SafetyLine';

/**
 * Small "Condition" tag. Squared and plum so it reads differently from the
 * rounded slate Beers pill, and deliberately not a severity color.
 */
export function ConditionBadge({ onPress, label = 'Condition' }: { onPress?: () => void; label?: string }) {
  const tag = (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
  if (!onPress) return tag;
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} accessibilityLabel={`${label}. Tap for details.`}>
      {tag}
    </TouchableOpacity>
  );
}

/**
 * The one badge shown on a medication. Beers-only medications keep the Beers
 * pill exactly as before; condition-only ones get the Condition tag; a
 * medication with both gets a single combined tag with a count, to limit
 * alert fatigue.
 */
export function MedNoteBadge({
  beers,
  conditions,
  suffix = '',
  onPress,
}: {
  beers: number;
  conditions: number;
  /** Text appended to the badge, e.g. " - details" or ": aspirin". */
  suffix?: string;
  onPress?: () => void;
}) {
  if (beers > 0 && conditions === 0) return <BeersBadge label={`Beers${suffix}`} onPress={onPress} />;
  if (conditions > 0 && beers === 0) return <ConditionBadge label={`Condition${suffix}`} onPress={onPress} />;
  if (beers > 0 && conditions > 0) {
    return <ConditionBadge label={`${beers + conditions} notes${suffix}`} onPress={onPress} />;
  }
  return null;
}

/**
 * One line above a list or map. With flags it gives the count; when the check
 * ran and found nothing it says plainly that this is not an all-clear.
 */
export function ConditionSummary({ count, checked }: { count: number; checked: boolean }) {
  if (count > 0) {
    return (
      <View style={styles.summary}>
        <Text style={styles.summaryText}>{conditionSummaryLine(count)}</Text>
        <Text style={styles.finePrint}>
          {CONDITION_DISCLAIMER} {CONDITION_INCOMPLETE_NOTE}
        </Text>
      </View>
    );
  }
  if (!checked) return null;
  return (
    <Text style={[styles.finePrint, { marginTop: 10 }]}>
      No condition notes for this stack. {CONDITION_INCOMPLETE_NOTE} {CONDITION_DISCLAIMER}
    </Text>
  );
}

/** Condition, reason, recommendation and source for each drug-disease flag. */
export function ConditionDetail({ flags, drugLabel }: { flags: ConditionFlag[]; drugLabel?: string }) {
  if (flags.length === 0) return null;
  return (
    <View style={styles.detail}>
      {flags.map((f) => (
        <View key={`${f.drug}:${f.entryId}`} style={{ gap: 4 }}>
          <View style={styles.detailHead}>
            <ConditionBadge />
            <Text style={styles.detailTitle}>
              {drugLabel ? `${drugLabel} - ` : ''}
              <Text style={{ textTransform: 'none' }}>{f.class}</Text>
            </Text>
          </View>
          <Text style={styles.detailBody}>
            <Text style={styles.detailLabel}>Condition: </Text>
            {f.conditionLabel}
          </Text>
          <Text style={styles.detailBody}>
            <Text style={styles.detailLabel}>Why it is listed: </Text>
            {f.reason}
          </Text>
          <Text style={styles.detailBody}>
            <Text style={styles.detailLabel}>Recommendation: </Text>
            {f.recommendation}
          </Text>
          <Text style={styles.finePrint}>Source: {f.source}. Applies to adults 65+.</Text>
        </View>
      ))}
      <Text style={styles.finePrint}>
        {CONDITION_DISCLAIMER} {CONDITION_INCOMPLETE_NOTE}
      </Text>
      <SafetyLine />
    </View>
  );
}

/** Searchable multi-select of conditions, each shown with its ICD-10 code. */
export function ConditionsPicker({
  initialSelected,
  isFirstTime,
  onSave,
  onCancel,
}: {
  initialSelected: string[];
  /** First-time prompt ("Skip for now") vs. an edit from the header ("Cancel"). */
  isFirstTime: boolean;
  onSave: (conditionIds: string[]) => void;
  onCancel: () => void;
}) {
  const [conditions, setConditions] = useState<Condition[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const load = useCallback(() => {
    setFailed(false);
    loadConditions()
      .then(setConditions)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadConditions()
      .then((list) => {
        if (!cancelled) setConditions(list);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const visible = (conditions || []).filter((c) => matchesConditionSearch(c, query));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[sharedStyles.card, styles.pickerCard]}>
          <Text style={sharedStyles.h2}>Any of these conditions?</Text>
          <Text style={[sharedStyles.subtle, { marginTop: 6 }]}>
            Optional. MedStack marks medications that may be a concern with the conditions you pick. These notes
            currently apply to adults 65 and older.
          </Text>

          <TextInput
            style={[sharedStyles.input, { marginTop: 12 }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or ICD-10 code"
            placeholderTextColor={COLORS.inkFaint}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {!conditions && !failed && <ActivityIndicator color={COLORS.teal} style={{ marginVertical: 24 }} />}
            {failed && (
              <View style={{ alignItems: 'center', paddingVertical: 18, gap: 4 }}>
                <Text style={sharedStyles.subtle}>Could not load the conditions list.</Text>
                <TouchableOpacity onPress={load} hitSlop={8}>
                  <Text style={styles.retry}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}
            {conditions && visible.length === 0 && (
              <Text style={[sharedStyles.subtle, { paddingVertical: 18 }]}>No matching condition in this list.</Text>
            )}
            {visible.map((c) => {
              const isOn = selected.includes(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.row}
                  onPress={() => toggle(c.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isOn }}
                >
                  <View style={[styles.checkbox, isOn && styles.checkboxOn]}>
                    {isOn && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{c.label}</Text>
                    <Text style={styles.rowCodes}>ICD-10: {c.codes.join(', ')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.finePrint, { marginTop: 10 }]}>
            Saved on this device. Sent only to MedStack&apos;s own server to run the check, never to other services.{' '}
            {CONDITION_INCOMPLETE_NOTE}
          </Text>

          <TouchableOpacity
            style={[sharedStyles.btnPrimaryFull, { marginTop: 12 }]}
            onPress={() => onSave(selected)}
          >
            <Text style={sharedStyles.btnPrimaryText}>
              {selected.length > 0 ? `Save (${selected.length} selected)` : isFirstTime ? 'None of these' : 'Save (none)'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={sharedStyles.btnGhost} onPress={onCancel}>
            <Text style={sharedStyles.btnGhostText}>{isFirstTime ? 'Skip for now' : 'Cancel'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.conditionSoft,
    borderWidth: 1,
    borderColor: COLORS.condition,
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
  },
  badgeText: { color: COLORS.conditionInk, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.3 },
  summary: {
    backgroundColor: COLORS.conditionSoft,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.condition,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 3,
  },
  summaryText: { color: COLORS.conditionInk, fontSize: 12.5, lineHeight: 18, fontWeight: '500' },
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
  pickerCard: { padding: 20, maxHeight: '88%' },
  list: { marginTop: 8, maxHeight: 280 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 16 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: COLORS.ink },
  rowCodes: { fontSize: 11.5, color: COLORS.inkFaint, marginTop: 1 },
  retry: { color: COLORS.teal, fontSize: 13, fontWeight: '600' },
});
