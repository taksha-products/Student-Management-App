import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

import { BusInfoSheet } from "./BusInfoSheet";
import { useTheme } from "../../contexts/ThemeContext";
import { BUS_STATUS_META, formatAgo, isStale } from "../../lib/busTracking";
import {
  buildLeafletMapHtml,
  leafletUpdateScript,
  type LeafletMapPayload
} from "../../lib/leafletMapHtml";
import type { ParentBusPosition, ParentBusView } from "../../lib/parentBus";

interface ParentBusMapProps {
  view: ParentBusView;
  position: ParentBusPosition;
  trail: Array<{ latitude: number; longitude: number }>;
  refreshFailed: boolean;
  /** Floating controls over the top-left of the map (back button). */
  topLeft?: ReactNode;
}

/**
 * Parent live bus map — Leaflet + OpenStreetMap chrome matching
 * School_Management web (`frontend/components/gps/ParentBusMap.tsx`).
 */
export function ParentBusMap({
  view,
  position,
  trail,
  refreshFailed,
  topLeft
}: ParentBusMapProps) {
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webRef = useRef<any>(null);
  const [follow, setFollow] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [mapReady, setMapReady] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  const stale = isStale(position.lastSeen, now);
  const statusColor = stale
    ? BUS_STATUS_META.offline.color
    : BUS_STATUS_META[position.status].color;
  const label = view.bus?.routeNumber?.trim() || view.bus?.busNumber || "Bus";

  const payload: LeafletMapPayload = useMemo(
    () => ({
      lat: position.lat,
      lng: position.lng,
      bearing: position.bearing || 0,
      statusColor,
      stale,
      label,
      trail,
      follow,
      bottomInset: sheetHeight
    }),
    [
      position.lat,
      position.lng,
      position.bearing,
      statusColor,
      stale,
      label,
      trail,
      follow,
      sheetHeight
    ]
  );

  const initialHtml = useMemo(
    () =>
      buildLeafletMapHtml({
        lat: position.lat,
        lng: position.lng,
        bearing: position.bearing || 0,
        statusColor,
        stale,
        label,
        trail,
        follow: true,
        bottomInset: 0
      }),
    // Mount once per bus session; live updates go through inject.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    webRef.current?.injectJavaScript?.(leafletUpdateScript(payload));
  }, [mapReady, payload]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type?: string };
      if (data.type === "ready") {
        setMapReady(true);
      }
      if (data.type === "user-move") {
        setFollow(false);
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: initialHtml }}
        style={styles.map}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url ?? "";
          if (
            url === "" ||
            url.startsWith("about:") ||
            url.startsWith("data:") ||
            url.startsWith("file:")
          ) {
            return true;
          }
          if (request.isTopFrame === false) {
            return true;
          }
          return !(url.startsWith("http://") || url.startsWith("https://"));
        }}
      />

      {topLeft ? <View style={styles.topLeft}>{topLeft}</View> : null}

      <Pressable
        style={[
          styles.followBtn,
          follow ? { backgroundColor: theme.brand } : styles.followOff
        ]}
        onPress={() => setFollow((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ selected: follow }}
        accessibilityLabel={
          follow ? "Following the bus. Tap to stop following" : "Re-centre the map on the bus"
        }
      >
        <Ionicons
          name={follow ? "navigate" : "locate-outline"}
          size={16}
          color={follow ? "#FFFFFF" : "#1F2937"}
        />
        <Text style={[styles.followText, { color: follow ? "#FFFFFF" : "#1F2937" }]}>
          {follow ? "Following" : "Re-centre"}
        </Text>
      </Pressable>

      <View style={[styles.liveChip, { bottom: sheetHeight + 12 }]}>
        <Ionicons
          name="location-sharp"
          size={20}
          color={stale ? "#9CA3AF" : "#16A34A"}
        />
        <View>
          <Text style={styles.liveChipTitle}>
            {stale ? "Last known location" : "Live Location"}
          </Text>
          <View style={styles.liveChipMeta}>
            <View
              style={[
                styles.liveChipDot,
                { backgroundColor: stale ? "#9CA3AF" : "#22C55E" }
              ]}
            />
            <Text style={styles.liveChipAgo}>Updated {formatAgo(position.lastSeen, now)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sheetAnchor}>
        <BusInfoSheet
          view={view}
          refreshFailed={refreshFailed}
          brandColor={theme.brand}
          onHeightChange={setSheetHeight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#E5E7EB"
  },
  map: { flex: 1, backgroundColor: "#E5E7EB" },
  topLeft: {
    position: "absolute",
    left: 12,
    top: 12,
    zIndex: 20
  },
  followBtn: {
    position: "absolute",
    right: 12,
    top: 88,
    zIndex: 20,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  followOff: { backgroundColor: "#FFFFFF" },
  followText: { fontSize: 14, fontWeight: "600" },
  liveChip: {
    position: "absolute",
    left: 12,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  liveChipTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  liveChipMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  liveChipDot: { width: 6, height: 6, borderRadius: 3 },
  liveChipAgo: { fontSize: 12, color: "#6B7280" },
  sheetAnchor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20
  }
});
