import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";

import { BrandHeader } from "../../../components/ui/BrandHeader";
import { Card } from "../../../components/ui/Card";
import { PastelArt } from "../../../components/ui/PastelArt";
import { Screen } from "../../../components/ui/Screen";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiRequest, ApiError } from "../../../lib/api";
import { formatDate, formatINR } from "../../../lib/format";
import { INK, pastelAt, SOFT_TEXT, SUCCESS_GREEN } from "../../../lib/pastel";
import type { FeePaymentRow, ParentChild, StudentFeeLedgerView } from "../../../lib/types";

interface ChildDue extends ParentChild {
  outstanding?: number;
}

interface ReceiptRow extends FeePaymentRow {
  childName: string;
  childIndex: number;
}

/**
 * Everything money: total due, a pastel "Pay for …" card per child,
 * then all receipts (total paid + list grouped by month).
 */
export default function PaymentsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [children, setChildren] = useState<ChildDue[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const childrenRes = await apiRequest<{ data: ParentChild[] }>("/api/parent/children");
    const list = childrenRes.data ?? [];

    const perChild = await Promise.all(
      list.map(async (child, childIndex) => {
        const year = child.academicYear
          ? `?academicYear=${encodeURIComponent(child.academicYear)}`
          : "";
        const [fees, payments] = await Promise.all([
          apiRequest<{ data: StudentFeeLedgerView }>(
            `/api/parent/children/${child._id}/fees${year}`
          ).catch(() => null),
          apiRequest<{ data: FeePaymentRow[] }>(
            `/api/parent/children/${child._id}/payments`
          ).catch(() => null)
        ]);
        return {
          child: { ...child, outstanding: fees?.data.summary.outstandingBalance },
          rows: (payments?.data ?? []).map((payment) => ({
            ...payment,
            childName: child.name,
            childIndex
          }))
        };
      })
    );

    setChildren(perChild.map((item) => item.child));
    setReceipts(
      perChild
        .flatMap((item) => item.rows)
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    );
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
            setError(err instanceof ApiError ? err.message : "Unable to load payments");
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

  const totalDue = useMemo(
    () => children.reduce((sum, child) => sum + (child.outstanding ?? 0), 0),
    [children]
  );
  const totalPaid = useMemo(
    () => receipts.reduce((sum, row) => sum + (row.totalAmountPaid || 0), 0),
    [receipts]
  );

  const receiptGroups = useMemo(() => {
    const map = new Map<string, ReceiptRow[]>();
    for (const row of receipts) {
      const date = new Date(row.paymentDate);
      const key = Number.isNaN(date.getTime())
        ? "Earlier"
        : date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return [...map.entries()];
  }, [receipts]);

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
      <BrandHeader title="Payments" tagline="Pay school fees and view your receipts" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={INK} />
        </View>
      ) : (
        <>
          {error ? <Text style={{ color: theme.danger, marginBottom: 12 }}>{error}</Text> : null}

          <View style={styles.summaryRow}>
            <Card style={styles.summary}>
              <Text style={styles.eyebrow}>Total due</Text>
              <Text
                style={[styles.summaryValue, { color: totalDue > 0 ? theme.danger : SUCCESS_GREEN }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatINR(totalDue)}
              </Text>
            </Card>
            <Card style={styles.summary}>
              <Text style={styles.eyebrow}>Total paid</Text>
              <Text
                style={[styles.summaryValue, { color: SUCCESS_GREEN }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatINR(totalPaid)}
              </Text>
            </Card>
          </View>

          <Text style={styles.section}>Pay school fees</Text>
          {children.length === 0 ? (
            <Card>
              <Text style={styles.muted}>No children linked to this account.</Text>
            </Card>
          ) : (
            <View style={styles.payList}>
              {children.map((child, index) => {
                const pastel = pastelAt(index);
                const due = child.outstanding ?? 0;
                return (
                  <Pressable
                    key={child._id}
                    onPress={() => router.push(`/(app)/child/${child._id}`)}
                    style={({ pressed }) => [
                      styles.payCard,
                      { backgroundColor: pastel.bg, opacity: pressed ? 0.9 : 1 }
                    ]}
                  >
                    <PastelArt pastel={pastel} icon="cash-multiple" />
                    <Text style={styles.payEyebrow}>Grade {child.grade}</Text>
                    <Text style={styles.payTitle} numberOfLines={1}>
                      Pay for {child.name.split(" ")[0]}
                    </Text>
                    <Text
                      style={[styles.payDue, { color: due > 0 ? theme.danger : "#2E7349" }]}
                      numberOfLines={1}
                    >
                      {child.outstanding === undefined
                        ? "Fees unavailable"
                        : due > 0
                          ? `${formatINR(due)} due`
                          : "All fees paid"}
                    </Text>
                    <View style={styles.moreRow}>
                      <Text style={styles.moreText}>Pay now</Text>
                      <Ionicons name="arrow-forward" size={15} color="#52525B" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.receiptsHeader}>
            <Text style={[styles.section, { marginBottom: 0 }]}>Receipts</Text>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{receipts.length}</Text>
            </View>
          </View>

          {receipts.length === 0 ? (
            <Card>
              <Text style={styles.muted}>No receipts yet. They appear here after you pay a fee.</Text>
            </Card>
          ) : null}

          {receiptGroups.map(([month, items]) => (
            <View key={month} style={styles.group}>
              <Text style={styles.month}>{month}</Text>
              <View style={styles.list}>
                {items.map((row) => {
                  const pastel = pastelAt(row.childIndex);
                  return (
                    <Card
                      key={`${row._id}-${row.receiptNumber}`}
                      onPress={() => router.push(`/(app)/receipt/${row.receiptNumber}`)}
                      style={styles.row}
                    >
                      <View style={[styles.avatar, { backgroundColor: pastel.bg }]}>
                        <Text style={[styles.avatarText, { color: pastel.accent }]}>
                          {row.childName.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rowBody}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {row.childName}
                        </Text>
                        <Text style={styles.rowSub} numberOfLines={1}>
                          {formatDate(row.paymentDate)} · {row.receiptNumber}
                        </Text>
                      </View>
                      <Text style={styles.rowAmount}>{formatINR(row.totalAmountPaid)}</Text>
                      <Ionicons name="chevron-forward" size={18} color={SOFT_TEXT} />
                    </Card>
                  );
                })}
              </View>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 48, alignItems: "center" },
  muted: { color: SOFT_TEXT, fontSize: 14 },
  eyebrow: { fontSize: 13, color: SOFT_TEXT },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  summary: { flex: 1, minWidth: 0, padding: 16 },
  summaryValue: { marginTop: 2, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  section: { fontSize: 19, fontWeight: "700", color: INK, letterSpacing: -0.3, marginBottom: 12 },
  payList: { gap: 12 },
  payCard: {
    height: 150,
    borderRadius: 20,
    overflow: "hidden",
    padding: 18,
    justifyContent: "flex-end"
  },
  payEyebrow: { fontSize: 13, color: "#52525B" },
  payTitle: { marginTop: 2, fontSize: 19, fontWeight: "700", color: INK, maxWidth: "60%" },
  payDue: { marginTop: 2, fontSize: 15, fontWeight: "700", maxWidth: "60%" },
  moreRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  moreText: { fontSize: 15, color: "#52525B" },
  receiptsHeader: {
    marginTop: 28,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  countPill: {
    backgroundColor: SUCCESS_GREEN,
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignItems: "center"
  },
  countText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  group: { marginTop: 12 },
  month: { fontSize: 14, fontWeight: "600", color: SOFT_TEXT, marginBottom: 10 },
  list: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: { fontSize: 17, fontWeight: "800" },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: INK },
  rowSub: { marginTop: 3, fontSize: 12, color: SOFT_TEXT },
  rowAmount: { fontSize: 15, fontWeight: "800", color: SUCCESS_GREEN }
});
