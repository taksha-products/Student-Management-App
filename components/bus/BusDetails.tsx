import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { stopForTrip, tripAt } from "../../lib/busTrip";
import type { ParentBusView } from "../../lib/parentBus";

const TRIP_TICK_MS = 60_000;

type Tone = { bg: string; icon: string };

const TONES = {
  stop: { bg: "#FFF7ED", icon: "#F97316" },
  bus: { bg: "#EFF6FF", icon: "#2563EB" },
  driver: { bg: "#F5F3FF", icon: "#7C3AED" },
  route: { bg: "#ECFDF5", icon: "#059669" }
} as const;

function DetailCard({
  icon,
  tone,
  label,
  value,
  keepTogether,
  wide,
  children
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: Tone;
  label: string;
  value: string;
  keepTogether?: boolean;
  wide?: boolean;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.card, wide ? styles.wide : null]}>
      <View style={[styles.iconCircle, { backgroundColor: tone.bg }]}>
        <Ionicons name={icon} size={20} color={tone.icon} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={[styles.cardValue, keepTogether ? styles.nowrap : null]} numberOfLines={keepTogether ? 1 : 3}>
          {value}
        </Text>
        {children}
      </View>
    </View>
  );
}

/** Facts about the bus — same layout as web `BusDetails`. */
export function BusDetails({ view }: { view: ParentBusView }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TRIP_TICK_MS);
    return () => clearInterval(id);
  }, []);

  if (!view.bus) {
    return null;
  }

  const stop = stopForTrip(view.stops, tripAt(now));

  return (
    <View style={styles.grid}>
      {stop ? (
        <View style={[styles.card, styles.wide]}>
          <View style={[styles.iconCircle, { backgroundColor: TONES.stop.bg }]}>
            <Ionicons name="location-outline" size={20} color={TONES.stop.icon} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{stop.label}</Text>
            <Text style={styles.cardValue}>{stop.name}</Text>
            {stop.other ? (
              <Text style={styles.otherStop}>
                {stop.other.label}: {stop.other.name}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      <DetailCard
        icon="bus-outline"
        tone={TONES.bus}
        label="Bus"
        value={view.bus.busNumber}
        keepTogether
        wide={!view.bus.driverName}
      />
      {view.bus.driverName ? (
        <DetailCard
          icon="person-outline"
          tone={TONES.driver}
          label="Driver"
          value={view.bus.driverName}
        />
      ) : null}
      <DetailCard
        icon="git-branch-outline"
        tone={TONES.route}
        label="Route name"
        value={view.bus.routeName}
        wide
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#F3F4F6",
    backgroundColor: "rgba(249,250,251,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  wide: { width: "100%" },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardLabel: { fontSize: 12, color: "#6B7280" },
  cardValue: { fontSize: 15, fontWeight: "700", color: "#111827", lineHeight: 20 },
  nowrap: { flexShrink: 1 },
  otherStop: { marginTop: 2, fontSize: 12, color: "#6B7280" }
});
