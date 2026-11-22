import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import { BUS_STATUS_META, formatAgo, isStale, statusLabel } from "../../lib/busTracking";
import type { ParentBusPosition, ParentBusView } from "../../lib/parentBus";

interface ParentBusMapProps {
  view: ParentBusView;
  position: ParentBusPosition;
  trail: Array<{ latitude: number; longitude: number }>;
  refreshFailed: boolean;
  topLeft?: ReactNode;
}

/**
 * Web: open the same OSM coordinates in a browser map.
 * (Native uses Leaflet WebView; full react-leaflet is already on the School_Management site.)
 */
export function ParentBusMap({ view, position, refreshFailed }: ParentBusMapProps) {
  const { theme } = useTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  const stale = isStale(position.lastSeen, now);
  const statusColor = stale ? BUS_STATUS_META.offline.color : BUS_STATUS_META[position.status].color;
  const heading = view.bus?.routeNumber ?? `Bus ${view.bus?.busNumber ?? ""}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lng}#map=16/${position.lat}/${position.lng}`;

  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={styles.row}>
        <Ionicons name="bus" size={22} color={theme.brand} />
        <Text style={[styles.heading, { color: theme.text }]} numberOfLines={1}>
          {heading}
        </Text>
      </View>
      <Text style={{ color: theme.muted, marginTop: 8 }}>
        {statusLabel(position, now)} · updated {formatAgo(position.lastSeen, now)}
      </Text>
      {refreshFailed ? (
        <Text style={{ color: theme.danger, marginTop: 6, fontSize: 12 }}>
          Couldn't refresh — showing last known location.
        </Text>
      ) : null}
      <View style={[styles.pill, { backgroundColor: `${statusColor}22` }]}>
        <Text style={{ color: statusColor, fontWeight: "700", fontSize: 13 }}>
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </Text>
      </View>
      <Pressable
        onPress={() => void Linking.openURL(osmUrl)}
        style={[styles.btn, { backgroundColor: theme.brand }]}
      >
        <Ionicons name="map-outline" size={18} color="#fff" />
        <Text style={styles.btnText}>Open in OpenStreetMap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    justifyContent: "center"
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  heading: { flex: 1, fontSize: 18, fontWeight: "800" },
  pill: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  btn: {
    marginTop: 18,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12
  },
  btnText: { color: "#fff", fontWeight: "700" }
});
