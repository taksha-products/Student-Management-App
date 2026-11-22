import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from "react-native";

import { BrandHeader } from "../../../components/ui/BrandHeader";
import { Screen } from "../../../components/ui/Screen";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiRequest, ApiError } from "../../../lib/api";
import { INK, pastelAt } from "../../../lib/pastel";
import type { ChildTransport, ParentChild } from "../../../lib/types";

/** Coarse live status for the pill / avatar dot, from the children list's transport info. */
const liveStatus = (transport?: ChildTransport | null): { label: string; color: string } => {
  if (!transport?.busNumber) {
    return { label: "No bus", color: "#D4D4D8" };
  }
  switch (transport.liveState) {
    case "live":
      return { label: "Moving now", color: "#4CB963" };
    case "stopped":
      return { label: "Stopped", color: "#EA8A3B" };
    case "not_running":
      return { label: "Not running", color: "#A1A1AA" };
    default:
      return transport.trackingEnabled
        ? { label: "Track bus", color: "#4CB963" }
        : { label: "Tracking unavailable", color: "#A1A1AA" };
  }
};

interface BusGroup {
  busNumber: string;
  routeName?: string;
  children: ParentChild[];
}

export default function BusScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(windowWidth - 32);

  const load = useCallback(async () => {
    setError(null);
    const result = await apiRequest<{ data: ParentChild[] }>("/api/parent/children");
    setChildren(result.data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        try {
          await load();
        } catch (err) {
          if (active) {
            setError(err instanceof ApiError ? err.message : "Unable to load bus details");
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [load])
  );

  /** One featured slide per bus; children sharing a bus are grouped. */
  const buses = useMemo<BusGroup[]>(() => {
    const map = new Map<string, BusGroup>();
    for (const child of children) {
      const busNumber = child.transport?.busNumber;
      if (!busNumber) {
        continue;
      }
      const group = map.get(busNumber) ?? {
        busNumber,
        routeName: child.transport?.routeName,
        children: []
      };
      group.children.push(child);
      map.set(busNumber, group);
    }
    return [...map.values()];
  }, [children]);

  const onCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    setSlide(Math.round(x / Math.max(carouselWidth, 1)));
  };

  return (
    <Screen withTabBar
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load()
              .catch((err) =>
                setError(err instanceof ApiError ? err.message : "Unable to refresh")
              )
              .finally(() => setRefreshing(false));
          }}
          tintColor={theme.brand}
        />
      }
    >
      <BrandHeader title="Bus" tagline="Track your children's school bus" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={INK} />
        </View>
      ) : (
        <View>
          {error ? <Text style={{ color: theme.danger, marginBottom: 12 }}>{error}</Text> : null}

          {buses.length === 0 && !error ? (
            <View style={styles.featured}>
              <Text style={styles.eyebrow}>Transport</Text>
              <Text style={styles.featuredTitle}>No bus assigned</Text>
              <Text style={styles.featuredSub}>Contact the school office to add transport.</Text>
            </View>
          ) : null}

          {buses.length > 0 ? (
            <View
              onLayout={(event: LayoutChangeEvent) =>
                setCarouselWidth(event.nativeEvent.layout.width)
              }
            >
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onCarouselScroll}
                scrollEventThrottle={16}
              >
                {buses.map((bus) => {
                  const status = liveStatus(bus.children[0]?.transport);
                  return (
                  <View key={bus.busNumber} style={{ width: carouselWidth }}>
                    <Pressable
                      onPress={() => router.push(`/(app)/child/${bus.children[0]._id}/bus`)}
                      style={({ pressed }) => [styles.featured, { opacity: pressed ? 0.92 : 1 }]}
                    >
                      <View style={styles.featuredText}>
                        <Text style={styles.eyebrow}>Bus {bus.busNumber}</Text>
                        <Text style={styles.featuredTitle} numberOfLines={2}>
                          {bus.routeName ?? "School route"}
                        </Text>
                        <View style={[styles.statusPill, { backgroundColor: status.color }]}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>{status.label}</Text>
                        </View>
                      </View>
                      <View style={styles.featuredArt}>
                        <View style={styles.featuredBlob} />
                        <MaterialCommunityIcons name="bus-school" size={110} color="#E2A93B" />
                      </View>
                    </Pressable>
                  </View>
                  );
                })}
              </ScrollView>

              {buses.length > 1 ? (
                <View style={styles.dots}>
                  {buses.map((bus, index) => (
                    <View
                      key={bus.busNumber}
                      style={[styles.dot, index === slide && styles.dotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {children.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Your children</Text>
              <View style={styles.grid}>
                {children.map((child, index) => {
                  const pastel = pastelAt(index);
                  const bus = child.transport;
                  return (
                    <Pressable
                      key={child._id}
                      disabled={!bus?.busNumber}
                      onPress={() => router.push(`/(app)/child/${child._id}/bus`)}
                      style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.85 : 1 }]}
                    >
                      <View>
                        <View style={[styles.tileAvatar, { backgroundColor: pastel.bg }]}>
                          <Text style={[styles.tileInitial, { color: pastel.accent }]}>
                            {child.name.slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.onlineDot,
                            { backgroundColor: liveStatus(bus).color }
                          ]}
                        />
                      </View>
                      <Text style={styles.tileName} numberOfLines={1}>
                        {child.name}
                      </Text>
                      <Text style={styles.tileSub} numberOfLines={2}>
                        {bus?.busNumber
                          ? `Pickup: ${bus.pickupStop ?? "—"}`
                          : "No bus assigned"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 48, alignItems: "center" },
  featured: {
    height: 200,
    borderRadius: 22,
    backgroundColor: "#F4F5F6",
    paddingHorizontal: 22,
    paddingVertical: 22,
    flexDirection: "row",
    overflow: "hidden"
  },
  featuredText: { flex: 1, minWidth: 0, justifyContent: "space-between", zIndex: 1 },
  eyebrow: { fontSize: 13, color: "#A1A1AA" },
  featuredTitle: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: "800",
    color: INK,
    letterSpacing: -0.6,
    lineHeight: 30
  },
  featuredSub: { marginTop: 8, fontSize: 14, color: "#71717A" },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4CB963",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFFFFF" },
  statusText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  featuredArt: { width: 130, alignItems: "center", justifyContent: "center" },
  featuredBlob: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#EBECEE"
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 14 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#D4D4D8" },
  dotActive: { width: 14, backgroundColor: INK },
  sectionTitle: {
    marginTop: 26,
    marginBottom: 14,
    fontSize: 19,
    fontWeight: "700",
    color: INK,
    letterSpacing: -0.3
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  tile: {
    width: "48.5%",
    backgroundColor: "#F4F5F6",
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center"
  },
  tileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  tileInitial: { fontSize: 24, fontWeight: "800" },
  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 3,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  tileName: { marginTop: 12, fontSize: 16, fontWeight: "600", color: INK },
  tileSub: { marginTop: 4, fontSize: 13, color: "#A1A1AA", textAlign: "center" }
});
