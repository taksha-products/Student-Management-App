import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BusDetails } from "../../../../components/bus/BusDetails";
import { ParentBusMap } from "../../../../components/bus/ParentBusMap";
import { Card } from "../../../../components/ui/Card";
import { useTheme } from "../../../../contexts/ThemeContext";
import { apiRequest, ApiError } from "../../../../lib/api";
import { INK, pastelAt, TILE } from "../../../../lib/pastel";
import {
  fetchParentBus,
  fetchParentBusTrail,
  IDLE_POLL_MS,
  MAX_LIVE_TRAIL_POINTS,
  mergeTrailCoordinates,
  RUNNING_POLL_MS,
  STATE_COPY,
  TRAIL_POLL_MS,
  type ParentBusView,
  type ParentTrailPoint
} from "../../../../lib/parentBus";
import type { ParentChild } from "../../../../lib/types";

const errorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "Live bus tracking isn't available for your school.";
    }
    if (error.status === 404) {
      return "We couldn't find this child.";
    }
    return error.message;
  }
  return "We couldn't load the bus right now. Check your connection and try again.";
};

const resolveParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

export default function ChildBusLiveScreen() {
  const params = useLocalSearchParams<{ studentId: string | string[] }>();
  const studentId = resolveParam(params.studentId);
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [view, setView] = useState<ParentBusView | null>(null);
  const [trailStored, setTrailStored] = useState<ParentTrailPoint[]>([]);
  const livePoints = useRef<ParentTrailPoint[]>([]);
  const hasViewRef = useRef(false);
  const [liveVersion, setLiveVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(tabs)/bus");
    }
  }, [router]);

  const assertOwnChild = useCallback(async (): Promise<void> => {
    if (!studentId) {
      throw new ApiError("Child not found for this parent account", 404);
    }
    const childrenRes = await apiRequest<{ data: ParentChild[] }>("/api/parent/children");
    const allowed = (childrenRes.data ?? []).some((child) => child._id === studentId);
    if (!allowed) {
      throw new ApiError("Child not found for this parent account", 404);
    }
  }, [studentId]);

  const loadBus = useCallback(async () => {
    if (!studentId) {
      return;
    }
    try {
      // Defense in depth: never hit live bus APIs for another parent's child ID.
      if (!hasViewRef.current) {
        await assertOwnChild();
      }
      const next = await fetchParentBus(studentId);
      hasViewRef.current = true;
      setView(next);
      setError(null);
      setRefreshFailed(false);

      const position = next.position;
      if (position) {
        const time = new Date(position.lastSeen).getTime();
        const last = livePoints.current[livePoints.current.length - 1];
        if (!Number.isNaN(time) && !(last && time <= last[2])) {
          livePoints.current.push([position.lat, position.lng, time]);
          if (livePoints.current.length > MAX_LIVE_TRAIL_POINTS) {
            livePoints.current.splice(0, livePoints.current.length - MAX_LIVE_TRAIL_POINTS);
          }
          setLiveVersion((value) => value + 1);
        }
      }
    } catch (err) {
      if (hasViewRef.current) {
        setRefreshFailed(true);
      } else {
        setError(errorMessage(err));
      }
    }
  }, [studentId, assertOwnChild]);

  const loadTrail = useCallback(async () => {
    if (!studentId || view?.state !== "running") {
      return;
    }
    try {
      const points = await fetchParentBusTrail(studentId);
      setTrailStored(points);
    } catch {
      // Trail is best-effort; map still works with live points.
    }
  }, [studentId, view?.state]);

  useEffect(() => {
    livePoints.current = [];
    hasViewRef.current = false;
    setTrailStored([]);
    setView(null);
    setError(null);
    setLoading(true);
    void (async () => {
      try {
        await loadBus();
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId, loadBus]);

  useEffect(() => {
    if (!studentId || loading) {
      return;
    }
    const intervalMs = view?.state === "running" ? RUNNING_POLL_MS : IDLE_POLL_MS;
    const id = setInterval(() => {
      void loadBus();
    }, intervalMs);
    return () => clearInterval(id);
  }, [studentId, loading, view?.state, loadBus]);

  useEffect(() => {
    if (view?.state !== "running") {
      return;
    }
    void loadTrail();
    const id = setInterval(() => {
      void loadTrail();
    }, TRAIL_POLL_MS);
    return () => clearInterval(id);
  }, [view?.state, loadTrail]);

  const trail = useMemo(
    () => mergeTrailCoordinates(trailStored, livePoints.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trailStored, liveVersion]
  );

  const showMap =
    view?.state === "running" && view.position !== null && view.bus !== null;

  const floatingBack = (
    <Pressable
      onPress={goBack}
      style={styles.floatingBack}
      accessibilityLabel="Back to your children"
    >
      <Ionicons name="arrow-back" size={20} color="#374151" />
    </Pressable>
  );

  // Live map: full-bleed under the status bar, chrome floats on the map (same as web phone layout).
  if (!loading && showMap && view?.position && view.bus) {
    return (
      <View style={[styles.root, { backgroundColor: "#E5E7EB", paddingTop: insets.top }]}>
        <View style={styles.mapFull}>
          <ParentBusMap
            view={view}
            position={view.position}
            trail={trail}
            refreshFailed={refreshFailed}
            topLeft={floatingBack}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={INK} />
        </Pressable>
        <View style={styles.topMeta}>
          <Text style={styles.title} numberOfLines={1}>
            {view?.studentName ? `${view.studentName}'s bus` : "Live bus"}
          </Text>
        </View>
        {view?.bus?.routeNumber ? (
          <View style={[styles.routeChip, { backgroundColor: theme.brandSoft }]}>
            <Text style={[styles.routeChipText, { color: theme.brand }]} numberOfLines={1}>
              {view.bus.routeNumber}
            </Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : error && !view ? (
        <View style={styles.padded}>
          <Card>
            <Text style={[styles.stateTitle, { color: theme.text }]}>Bus unavailable</Text>
            <Text style={{ color: theme.muted, marginTop: 6 }}>{error}</Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                void loadBus().finally(() => setLoading(false));
              }}
              style={styles.retry}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </Card>
        </View>
      ) : view ? (
        <View style={styles.padded}>
          {view.state !== "running" ? (
            <Card style={styles.stateCard}>
              <View style={[styles.iconCircle, { backgroundColor: pastelAt(1).bg }]}>
                <Ionicons name="bus-outline" size={32} color={pastelAt(1).accent} />
              </View>
              <Text style={[styles.stateTitle, { color: theme.text }]}>
                {STATE_COPY[view.state].title}
              </Text>
              <Text style={{ color: theme.muted, textAlign: "center", marginTop: 6 }}>
                {STATE_COPY[view.state].body}
              </Text>
            </Card>
          ) : null}

          {view.bus ? (
            <View style={{ marginTop: 12 }}>
              <BusDetails view={view} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapFull: { flex: 1, paddingHorizontal: 0, paddingBottom: 0 },
  floatingBack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TILE,
    alignItems: "center",
    justifyContent: "center"
  },
  topMeta: { flex: 1, minWidth: 0 },
  title: { fontSize: 24, fontWeight: "800", color: INK, letterSpacing: -0.5 },
  routeChip: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: "40%"
  },
  routeChipText: { fontSize: 15, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  padded: { paddingHorizontal: 16, paddingTop: 8 },
  stateCard: { alignItems: "center", paddingVertical: 28 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  stateTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  retry: {
    marginTop: 16,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: INK
  },
  retryText: { color: "#fff", fontWeight: "700" }
});
