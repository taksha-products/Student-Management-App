import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState, type ComponentProps } from "react";
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { BrandHeader } from "../../../components/ui/BrandHeader";
import { PastelArt } from "../../../components/ui/PastelArt";
import { Screen } from "../../../components/ui/Screen";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiRequest, ApiError } from "../../../lib/api";
import { formatINR } from "../../../lib/format";
import { INK, pastelAt } from "../../../lib/pastel";
import type { ParentChild, StudentFeeLedgerView } from "../../../lib/types";

interface ChildCardData extends ParentChild {
  outstanding?: number;
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const CARD_ICONS: IconName[] = [
  "book-open-page-variant-outline",
  "pencil-ruler",
  "school-outline",
  "palette-outline"
];

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [children, setChildren] = useState<ChildCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const result = await apiRequest<{ data: ParentChild[] }>("/api/parent/children");
    const list = result.data ?? [];

    const withBalances = await Promise.all(
      list.map(async (child) => {
        try {
          const year = child.academicYear
            ? `?academicYear=${encodeURIComponent(child.academicYear)}`
            : "";
          const fees = await apiRequest<{ data: StudentFeeLedgerView }>(
            `/api/parent/children/${child._id}/fees${year}`
          );
          return { ...child, outstanding: fees.data.summary.outstandingBalance };
        } catch {
          return { ...child, outstanding: undefined };
        }
      })
    );
    setChildren(withBalances);
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
            setError(err instanceof ApiError ? err.message : "Unable to load children");
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
      <BrandHeader />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={INK} />
        </View>
      ) : (
        <View style={styles.list}>
          {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}

          {children.length === 0 && !error ? (
            <Text style={styles.empty}>No children linked to this account.</Text>
          ) : null}

          {children.map((child, index) => {
            const pastel = pastelAt(index);
            const due = child.outstanding ?? 0;
            return (
              <Pressable
                key={child._id}
                onPress={() => router.push(`/(app)/child/${child._id}`)}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: pastel.bg, opacity: pressed ? 0.92 : 1 }
                ]}
              >
                <PastelArt pastel={pastel} icon={CARD_ICONS[index % CARD_ICONS.length]} />

                <View style={styles.chip}>
                  <Text style={styles.chipText}>Grade {child.grade}</Text>
                </View>

                <View style={styles.cardText}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {child.name}
                  </Text>
                  <Text
                    style={[styles.amount, { color: due > 0 ? theme.danger : "#2E7349" }]}
                    numberOfLines={1}
                  >
                    {child.outstanding === undefined
                      ? "Fees unavailable"
                      : due > 0
                        ? `${formatINR(due)} due`
                        : "All fees paid"}
                  </Text>
                  <View style={styles.moreRow}>
                    <Text style={styles.moreText}>View fees</Text>
                    <Ionicons name="arrow-forward" size={15} color="#52525B" />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 48, alignItems: "center" },
  empty: { color: "#71717A", fontSize: 15, paddingVertical: 24 },
  list: { gap: 12 },
  card: {
    height: 176,
    borderRadius: 20,
    overflow: "hidden",
    padding: 18,
    justifyContent: "flex-end"
  },
  chip: {
    position: "absolute",
    top: 16,
    left: 18,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#3F3F46" },
  cardText: { maxWidth: "62%" },
  cardTitle: { fontSize: 19, fontWeight: "700", color: INK, letterSpacing: -0.3 },
  amount: { marginTop: 3, fontSize: 15, fontWeight: "700" },
  moreRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  moreText: { fontSize: 15, color: "#52525B" }
});
