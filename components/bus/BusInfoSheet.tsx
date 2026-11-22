import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";

import { BusDetails } from "./BusDetails";
import {
  BUS_STATUS_META,
  formatAgo,
  formatDuration,
  isStale,
  statusLabel
} from "../../lib/busTracking";
import { stopForTrip, tripAt } from "../../lib/busTrip";
import type { ParentBusView } from "../../lib/parentBus";

interface BusInfoSheetProps {
  view: ParentBusView;
  refreshFailed: boolean;
  brandColor: string;
  onHeightChange?: (height: number) => void;
}

/**
 * Bottom sheet over the map — mirrors web `BusInfoSheet`
 * (route heading, status pill, trip stop, detail cards, live-info note).
 */
export function BusInfoSheet({
  view,
  refreshFailed,
  brandColor,
  onHeightChange
}: BusInfoSheetProps) {
  // Phones start collapsed so the map keeps most of the screen (web default < sm).
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  const position = view.position;
  if (!view.bus || !position) {
    return null;
  }

  const stale = isStale(position.lastSeen, now);
  const fresh = !stale;
  const heading = view.bus.routeNumber ?? `Bus ${view.bus.busNumber}`;
  const stop = stopForTrip(view.stops, tripAt(now));
  const statusColor = stale
    ? BUS_STATUS_META.offline.color
    : BUS_STATUS_META[position.status].color;
  const pillTone = stale
    ? { bg: "#F3F4F6", text: "#4B5563" }
    : position.status === "live"
      ? { bg: "#DCFCE7", text: "#15803D" }
      : { bg: "#FFEDD5", text: "#C2410C" };
  const statusIcon: keyof typeof Ionicons.glyphMap = stale
    ? "cloud-offline-outline"
    : position.status === "live"
      ? "speedometer-outline"
      : "pause";

  let freshness: string | null = null;
  if (refreshFailed) {
    freshness = "Can't refresh right now. Showing the last known position.";
  } else if (stale) {
    const age = now - new Date(position.lastSeen).getTime();
    freshness = `Last signal ${formatDuration(age)} ago. The bus may be in a low-signal area.`;
  }

  const onLayout = (event: LayoutChangeEvent) => {
    onHeightChange?.(Math.round(event.nativeEvent.layout.height));
  };

  return (
    <View style={styles.sheet} onLayout={onLayout}>
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        style={styles.handleBtn}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? "Hide bus details" : "Show bus details"}
      >
        <View style={styles.handleBar} />
        <Ionicons
          name="chevron-down"
          size={16}
          color="#9CA3AF"
          style={{ transform: [{ rotate: expanded ? "0deg" : "180deg" }] }}
        />
      </Pressable>

      <View style={styles.headerRow}>
        <View style={styles.headingBlock}>
          <View style={[styles.accentBar, { backgroundColor: brandColor }]} />
          <View style={styles.headingText}>
            <Text style={styles.heading} numberOfLines={1}>
              {heading}
            </Text>
            <View style={styles.updatedRow}>
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: fresh ? statusColor : "#9CA3AF" },
                  fresh ? styles.liveDotPulse : null
                ]}
              />
              <Text style={styles.updatedText}>
                {fresh ? "Updated" : "Last update"} {formatAgo(position.lastSeen, now)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: pillTone.bg }]}>
          <Ionicons name={statusIcon} size={16} color={pillTone.text} />
          <Text style={[styles.statusPillText, { color: pillTone.text }]}>
            {statusLabel(position, now)}
          </Text>
        </View>
      </View>

      {freshness ? (
        <View style={styles.freshnessNotice}>
          <Text style={styles.freshnessText}>{freshness}</Text>
        </View>
      ) : null}

      {!expanded && stop ? (
        <View style={styles.collapsedStop}>
          <Ionicons name="location-outline" size={16} color={brandColor} />
          <Text style={styles.collapsedStopText}>
            {stop.label}: {stop.name}
          </Text>
        </View>
      ) : null}

      {expanded ? (
        <View style={styles.details}>
          <BusDetails view={view} />
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#2563EB" style={styles.infoIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Live tracking information</Text>
              <Text style={styles.infoBody}>
                Bus location updates are available while the vehicle is on its route.
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8
  },
  handleBtn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    gap: 2
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB"
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  headingBlock: { flexDirection: "row", alignItems: "stretch", gap: 12, flex: 1, minWidth: 0 },
  accentBar: { width: 4, borderRadius: 999 },
  headingText: { flex: 1, minWidth: 0 },
  heading: { fontSize: 20, fontWeight: "800", color: "#111827", lineHeight: 24 },
  updatedRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveDotPulse: { opacity: 1 },
  updatedText: { fontSize: 13, color: "#6B7280" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: "48%"
  },
  statusPillText: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
  freshnessNotice: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  freshnessText: { fontSize: 13, color: "#92400E" },
  collapsedStop: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  collapsedStopText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#111827" },
  details: { marginTop: 12, gap: 10 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  infoIcon: { marginTop: 2 },
  infoTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  infoBody: { fontSize: 12, color: "#4B5563", marginTop: 2 }
});
