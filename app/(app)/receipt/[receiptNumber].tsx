import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../../../components/ui/AppHeader";
import { Card } from "../../../components/ui/Card";
import { PastelArt } from "../../../components/ui/PastelArt";
import { Screen } from "../../../components/ui/Screen";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiRequest, ApiError } from "../../../lib/api";
import { formatDate, formatINR } from "../../../lib/format";
import { INK, pastelAt, SOFT_TEXT, SUCCESS_GREEN } from "../../../lib/pastel";

interface ReceiptView {
  receiptNumber: string;
  paymentDate?: string;
  paymentMode?: string;
  totalAmountPaid?: number;
  totalAmountDue?: number;
  student?: { name?: string; grade?: string };
  organization?: { name?: string; displayName?: string };
  feeHeadPayments?: Array<{
    feeHeadName: string;
    periodLabel: string;
    amountPaid: number;
  }>;
}

export default function ReceiptScreen() {
  const { receiptNumber } = useLocalSearchParams<{ receiptNumber: string }>();
  const { theme } = useTheme();
  const [receipt, setReceipt] = useState<ReceiptView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pastel = pastelAt(3);

  useEffect(() => {
    void (async () => {
      if (!receiptNumber) {
        return;
      }
      setLoading(true);
      try {
        const result = await apiRequest<{ data: ReceiptView }>(
          `/api/parent/receipt/${receiptNumber}`
        );
        setReceipt(result.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to load receipt");
      } finally {
        setLoading(false);
      }
    })();
  }, [receiptNumber]);

  return (
    <Screen>
      <AppHeader showBack title="Receipt" subtitle={receiptNumber} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={INK} />
        </View>
      ) : error ? (
        <Card>
          <Text style={{ color: theme.danger }}>{error}</Text>
        </Card>
      ) : (
        <>
          <View style={[styles.hero, { backgroundColor: pastel.bg }]}>
            <PastelArt pastel={pastel} icon="check-decagram-outline" />
            <Text style={styles.heroLabel}>Amount paid</Text>
            <Text style={styles.heroAmount}>{formatINR(receipt?.totalAmountPaid ?? 0)}</Text>
            <View style={styles.pill}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              <Text style={styles.pillText}>Paid · {receipt?.paymentMode || "online"}</Text>
            </View>
          </View>

          <Card style={styles.details}>
            <Text style={styles.eyebrow}>
              {receipt?.organization?.displayName || receipt?.organization?.name || theme.displayName}
            </Text>
            {receipt?.student?.name ? (
              <Text style={styles.student}>{receipt.student.name}</Text>
            ) : null}
            <Text style={styles.sub}>
              {[
                receipt?.student?.grade ? `Grade ${receipt.student.grade}` : null,
                formatDate(receipt?.paymentDate)
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>

            <View style={styles.lines}>
              {(receipt?.feeHeadPayments ?? []).map((line, index) => (
                <View key={`${line.feeHeadName}-${index}`} style={styles.line}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.lineTitle}>{line.feeHeadName}</Text>
                    <Text style={styles.sub}>{line.periodLabel}</Text>
                  </View>
                  <Text style={styles.lineAmount}>{formatINR(line.amountPaid)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />
            <View style={styles.line}>
              <Text style={[styles.lineTitle, { flex: 1 }]}>Total</Text>
              <Text style={[styles.lineAmount, { color: SUCCESS_GREEN, fontSize: 18 }]}>
                {formatINR(receipt?.totalAmountPaid ?? 0)}
              </Text>
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 48, alignItems: "center" },
  hero: {
    height: 170,
    borderRadius: 22,
    overflow: "hidden",
    padding: 20,
    justifyContent: "flex-end",
    marginBottom: 12
  },
  heroLabel: { fontSize: 14, color: "#52525B" },
  heroAmount: { marginTop: 2, fontSize: 32, fontWeight: "800", color: INK, letterSpacing: -0.8 },
  pill: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: SUCCESS_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  pillText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  details: { gap: 2 },
  eyebrow: { fontSize: 13, color: SOFT_TEXT },
  student: { marginTop: 4, fontSize: 19, fontWeight: "700", color: INK },
  sub: { marginTop: 2, fontSize: 13, color: SOFT_TEXT },
  lines: { marginTop: 14, gap: 8 },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12
  },
  lineTitle: { fontSize: 15, fontWeight: "600", color: INK },
  lineAmount: { fontSize: 15, fontWeight: "700", color: INK },
  divider: { height: 1, backgroundColor: "#E4E4E7", marginVertical: 12 }
});
