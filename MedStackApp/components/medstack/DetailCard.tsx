import { COLORS } from "@/constants/medstack-colors";
import { SEV_META } from "@/lib/severity";
import { sharedStyles } from "@/styles/shared";
import { flagsForDrug } from "@/lib/beers";
import type { BeersFlag, Pair } from "@/types/medstack";
import * as Speech from "expo-speech";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BeersDetail } from "./Beers";

export default function DetailCard({
  pair,
  labelFor,
  beersFlags = [],
}: {
  pair: Pair;
  labelFor: (name: string) => string;
  beersFlags?: BeersFlag[];
}) {
  const meta = SEV_META[pair.severity];
  const [spoken, setSpoken] = useState(false);
  const nameA = labelFor(pair.drugA);
  const nameB = labelFor(pair.drugB);
  const line = `${nameA} and ${nameB}. ${pair.summary} ${pair.action}`;
  const url = pair.sourceUrl;
  const beersA = flagsForDrug(pair.drugA, beersFlags);
  const beersB = flagsForDrug(pair.drugB, beersFlags);

  const toggleSpeak = () => {
    if (spoken) {
      Speech.stop();
      setSpoken(false);
    } else {
      Speech.speak(line);
      setSpoken(true);
    }
  };

  return (
    <View
      style={[sharedStyles.card, styles.wrap, { borderTopColor: meta.line }]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <View style={[sharedStyles.chip, { backgroundColor: meta.bg }]}>
          <View style={[sharedStyles.chipDot, { backgroundColor: meta.dot }]} />
          <Text style={{ color: meta.ink, fontSize: 12, fontWeight: "700" }}>
            {meta.label}
          </Text>
        </View>
      </View>
      <Text style={styles.pairTitle}>
        {nameA} + {nameB}
      </Text>
      <Text style={styles.pairSummary}>{pair.summary}</Text>
      <Text style={styles.pairAction}>
        <Text style={{ fontWeight: "600", color: COLORS.ink }}>
          What to do:{" "}
        </Text>
        {pair.action}
      </Text>
      <TouchableOpacity
        style={[sharedStyles.btnGhost, { width: "100%" }]}
        onPress={toggleSpeak}
      >
        <Text style={sharedStyles.btnGhostText}>
          {spoken ? "Stop" : "Read this aloud"}
        </Text>
      </TouchableOpacity>
      {!!url && (
        <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(url)}>
          <Text style={styles.sourceLink}>Source</Text>
        </TouchableOpacity>
      )}
      <BeersDetail flags={beersA} drugLabel={nameA} />
      <BeersDetail flags={beersB} drugLabel={nameB} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14, padding: 18, borderTopWidth: 3 },
  pairTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.ink,
    textTransform: "capitalize",
    marginBottom: 8,
  },
  pairSummary: {
    fontSize: 14.5,
    lineHeight: 21,
    color: COLORS.ink,
    marginBottom: 10,
  },
  pairAction: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.inkSoft,
    marginBottom: 12,
  },
  sourceLink: {
    textAlign: "center",
    fontSize: 11.5,
    color: COLORS.teal,
    marginTop: 10,
  },
});
