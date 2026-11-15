import { COLORS } from '@/constants/medstack-colors';
import type { Hub } from '@/lib/hubs';
import { INSIGHTS_DISCLAIMER, INSIGHTS_INCOMPLETE_NOTE, type InsightsResult } from '@/lib/insights';
import { SEV_META } from '@/lib/severity';
import { sharedStyles } from '@/styles/shared';
import type { StackPattern } from '@/types/medstack';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * One collapsible card of whole-stack insights: hub drugs first, then
 * stacked-drug patterns. Collapsed by default to limit alert fatigue.
 */
export function StackInsightsCard({
  insights,
  patternsChecked,
}: {
  insights: InsightsResult;
  /** True once the stacked-drug check has run for the current stack and age. */
  patternsChecked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const total = insights.shown.length + insights.hiddenCount;

  return (
    <View style={[sharedStyles.card, styles.card]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.title}>Stack insights</Text>
        {total > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{total}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Text style={styles.toggle}>{open ? 'Hide' : 'Show'}</Text>
      </TouchableOpacity>
      <Text style={styles.finePrint}>
        {INSIGHTS_DISCLAIMER} {INSIGHTS_INCOMPLETE_NOTE}
      </Text>

      {open && (
        <View style={styles.body}>
          {insights.shown.length === 0 && (
            <Text style={styles.empty}>No patterns found across this stack. {INSIGHTS_INCOMPLETE_NOTE}</Text>
          )}

          {insights.shown.map((insight) => {
            const isOpen = openKey === insight.key;
            return (
              <View key={insight.key} style={styles.insight}>
                <Text style={styles.kind}>{insight.kind === 'hub' ? 'ASK ABOUT FIRST' : 'COMBINATION'}</Text>
                <Text style={styles.line}>{insight.line}</Text>
                <TouchableOpacity onPress={() => setOpenKey(isOpen ? null : insight.key)} hitSlop={8}>
                  <Text style={styles.toggle}>{isOpen ? 'Hide details' : 'Details'}</Text>
                </TouchableOpacity>
                {isOpen && (
                  <View style={{ gap: 4, marginTop: 6 }}>
                    <Text style={styles.detailBody}>
                      <Text style={styles.detailLabel}>Why: </Text>
                      {insight.reason}
                    </Text>
                    <Text style={styles.detailBody}>
                      <Text style={styles.detailLabel}>Recommendation: </Text>
                      {insight.recommendation}
                    </Text>
                    <Text style={styles.finePrint}>Source: {insight.source}.</Text>
                  </View>
                )}
              </View>
            );
          })}

          {insights.hiddenCount > 0 && (
            <Text style={styles.finePrint}>
              {insights.hiddenCount} more {insights.hiddenCount === 1 ? 'insight is' : 'insights are'} not shown.
            </Text>
          )}
          {!patternsChecked && (
            <Text style={styles.finePrint}>
              Combination checks need a saved age and apply to adults 65+. They are not included here.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

/** Shown under the node map when a hub drug is tapped: which drugs it interacts with. */
export function HubDetail({
  hub,
  labelFor,
  onSelectPartner,
  onClose,
}: {
  hub: Hub;
  labelFor: (name: string) => string;
  onSelectPartner: (partner: string) => void;
  onClose: () => void;
}) {
  return (
    <View style={[sharedStyles.card, styles.hubCard]}>
      <View style={styles.header}>
        <Text style={[styles.title, { textTransform: 'capitalize' }]}>{labelFor(hub.drug)}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onClose} hitSlop={8}>
          <Text style={styles.toggle}>Close</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.detailBody}>
        Interacts with {hub.partners.length} other medications in this view. It may be the one to ask a pharmacist
        about first.
      </Text>
      <View style={{ marginTop: 8 }}>
        {hub.partners.map((p) => (
          <TouchableOpacity key={p.name} style={styles.partnerRow} onPress={() => onSelectPartner(p.name)}>
            <View style={[sharedStyles.chipDot, { backgroundColor: SEV_META[p.severity].dot }]} />
            <Text style={styles.partnerName}>{labelFor(p.name)}</Text>
            <Text style={styles.partnerSeverity}>{SEV_META[p.severity].label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.finePrint, { marginTop: 8 }]}>
        Tap a medication to see that pair. {INSIGHTS_DISCLAIMER}
      </Text>
    </View>
  );
}

/**
 * Shown inside a pair's detail card when a stacked-drug pattern was left out
 * of the insights card because this pair is already marked red.
 */
export function PairPatternNote({ patterns }: { patterns: StackPattern[] }) {
  if (patterns.length === 0) return null;
  return (
    <View style={styles.pairNote}>
      {patterns.map((p) => (
        <View key={p.id} style={{ gap: 4 }}>
          <Text style={styles.detailBody}>
            <Text style={styles.detailLabel}>Also a listed combination: </Text>
            {p.label}. {p.reason}
          </Text>
          <Text style={styles.detailBody}>
            <Text style={styles.detailLabel}>Recommendation: </Text>
            {p.recommendation}
          </Text>
          <Text style={styles.finePrint}>Source: {p.source}. Applies to adults 65+.</Text>
        </View>
      ))}
      <Text style={styles.finePrint}>{INSIGHTS_DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 14 },
  hubCard: { marginTop: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: COLORS.ink },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  countPill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  toggle: { fontSize: 12.5, fontWeight: '600', color: COLORS.teal },
  finePrint: { color: COLORS.inkFaint, fontSize: 11, lineHeight: 15, marginTop: 3 },
  body: { marginTop: 10, gap: 12 },
  empty: { fontSize: 13, lineHeight: 19, color: COLORS.inkSoft },
  insight: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10, gap: 4 },
  kind: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: COLORS.inkFaint },
  line: { fontSize: 13.5, lineHeight: 20, color: COLORS.ink },
  detailBody: { fontSize: 13, lineHeight: 19, color: COLORS.inkSoft },
  detailLabel: { fontWeight: '600', color: COLORS.ink },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  partnerName: { flex: 1, fontSize: 13.5, fontWeight: '500', color: COLORS.ink, textTransform: 'capitalize' },
  partnerSeverity: { fontSize: 12, color: COLORS.inkSoft },
  pairNote: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.line, gap: 8 },
});
