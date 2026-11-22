import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState, type ComponentProps } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from "react-native";

import { BrandHeader } from "../../../components/ui/BrandHeader";
import { Card } from "../../../components/ui/Card";
import { PastelArt } from "../../../components/ui/PastelArt";
import { Screen } from "../../../components/ui/Screen";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiRequest, ApiError } from "../../../lib/api";
import { INK, pastelAt, SOFT_TEXT } from "../../../lib/pastel";
import type { ParentChild } from "../../../lib/types";

type McIcon = ComponentProps<typeof MaterialCommunityIcons>["name"];

/** What the Marks section will show once the school publishes results. */
const UPCOMING: Array<{ icon: McIcon; title: string; body: string }> = [
  {
    icon: "clipboard-text-outline",
    title: "Exam marks",
    body: "Subject-wise marks for every unit test and term exam."
  },
  {
    icon: "comment-quote-outline",
    title: "Teacher remarks",
    body: "Notes from class and subject teachers on your child."
  },
  {
    icon: "chart-line",
    title: "Progress over time",
    body: "See how scores change from term to term."
  }
];

const CHILD_ICONS: McIcon[] = ["medal-outline", "star-four-points-outline", "trophy-outline"];

/**
 * Marks & remarks — upcoming feature. Shows what's coming and a card per child;
 * results will appear here once the school starts publishing them.
 */
export default function MarksScreen() {
  const { theme } = useTheme();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <BrandHeader title="Marks" tagline="Exam marks and teacher remarks" />

      <Card style={styles.featured}>
        <View style={styles.featuredText}>
          <Text style={styles.eyebrow}>Coming soon</Text>
          <Text style={styles.featuredTitle}>Report{"\n"}cards</Text>
          <View style={styles.soonPill}>
            <Ionicons name="time-outline" size={13} color="#FFFFFF" />
            <Text style={styles.soonText}>Upcoming feature</Text>
          </View>
        </View>
        <View style={styles.featuredArt}>
          <View style={styles.featuredBlob} />
          <MaterialCommunityIcons name="book-education-outline" size={96} color={pastelAt(2).accent} />
        </View>
      </Card>

      <Text style={styles.section}>What you'll see here</Text>
      <View style={styles.list}>
        {UPCOMING.map((item, index) => (
          <Card key={item.title} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: pastelAt(index).bg }]}>
              <MaterialCommunityIcons name={item.icon} size={22} color={pastelAt(index).accent} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowSub}>{item.body}</Text>
            </View>
          </Card>
        ))}
      </View>

      <Text style={styles.section}>Your children</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={INK} />
        </View>
      ) : (
        <View style={styles.list}>
          {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
          {children.map((child, index) => {
            const pastel = pastelAt(index);
            return (
              <View key={child._id} style={[styles.childCard, { backgroundColor: pastel.bg }]}>
                <PastelArt pastel={pastel} icon={CHILD_ICONS[index % CHILD_ICONS.length]} />
                <View style={styles.chip}>
                  <Text style={styles.chipText}>Grade {child.grade}</Text>
                </View>
                <Text style={styles.childName} numberOfLines={1}>
                  {child.name}
                </Text>
                <Text style={styles.childSub}>Marks will appear here once published</Text>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 32, alignItems: "center" },
  eyebrow: { fontSize: 13, color: SOFT_TEXT },
  featured: { height: 190, flexDirection: "row", padding: 22 },
  featuredText: { flex: 1, minWidth: 0, justifyContent: "space-between", zIndex: 1 },
  featuredTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: INK,
    letterSpacing: -0.6,
    lineHeight: 32
  },
  soonPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EA8A3B",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999
  },
  soonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  featuredArt: { width: 130, alignItems: "center", justifyContent: "center" },
  featuredBlob: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#EBECEE"
  },
  section: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: "700",
    color: INK,
    letterSpacing: -0.3
  },
  list: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center"
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: "700", color: INK },
  rowSub: { marginTop: 3, fontSize: 13, color: SOFT_TEXT, lineHeight: 18 },
  childCard: {
    height: 140,
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
  childName: { fontSize: 19, fontWeight: "700", color: INK, maxWidth: "62%" },
  childSub: { marginTop: 3, fontSize: 14, color: "#52525B", maxWidth: "62%" }
});
