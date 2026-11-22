import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";

import {
  RazorpayCheckoutModal,
  type RazorpayCheckoutParams
} from "../../../../components/RazorpayCheckoutModal";
import { AppHeader } from "../../../../components/ui/AppHeader";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";
import { PastelArt } from "../../../../components/ui/PastelArt";
import { Screen } from "../../../../components/ui/Screen";
import { useAuth } from "../../../../contexts/AuthContext";
import { useTheme } from "../../../../contexts/ThemeContext";
import { apiRequest, ApiError } from "../../../../lib/api";
import { formatDate, formatINR, statusLabel } from "../../../../lib/format";
import {
  INK,
  INK_MUTED,
  pastelAt,
  SOFT_TEXT,
  SUCCESS_GREEN,
  TILE
} from "../../../../lib/pastel";
import {
  createPaymentOrder,
  createSchoolPaymentIntent,
  verifyPayment
} from "../../../../lib/payments";
import type {
  ChildTransport,
  DueItem,
  FeePaymentRow,
  ParentChild,
  StudentFeeLedgerView
} from "../../../../lib/types";
import { showDialog } from "../../../../lib/dialog";

type Tab = "dues" | "history" | "transport";

const resolveParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

export default function ChildDetailScreen() {
  const params = useLocalSearchParams<{ studentId: string | string[] }>();
  const studentId = resolveParam(params.studentId);
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [tab, setTab] = useState<Tab>("dues");
  const [ledger, setLedger] = useState<StudentFeeLedgerView | null>(null);
  const [transport, setTransport] = useState<ChildTransport | null>(null);
  const [payments, setPayments] = useState<FeePaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingKey, setPayingKey] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<RazorpayCheckoutParams | null>(null);
  const [activeFeePaymentId, setActiveFeePaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<string>("");
  const [childIndex, setChildIndex] = useState(0);
  /** Same pastel as this child's card on Home. */
  const summaryPastel = pastelAt(childIndex);

  const load = useCallback(async () => {
    if (!studentId) {
      return;
    }
    setError(null);

    const childrenRes = await apiRequest<{ data: ParentChild[] }>("/api/parent/children");
    const index = childrenRes.data.findIndex((c) => c._id === studentId);
    const child = childrenRes.data[index];
    if (!child) {
      throw new ApiError("Child not found for this parent account", 404);
    }
    setChildIndex(index);

    const year =
      child.academicYear ||
      `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    setAcademicYear(year);
    setTransport(child.transport ?? null);

    const fees = await apiRequest<{ data: StudentFeeLedgerView }>(
      `/api/parent/children/${studentId}/fees?academicYear=${encodeURIComponent(year)}`
    );
    setLedger(fees.data);

    // Prefer explicit children transport; fall back to normalized ledger bus.
    const ledgerBus = fees.data.student.bus;
    setTransport(child.transport ?? ledgerBus ?? null);

    const history = await apiRequest<{ data: FeePaymentRow[] }>(
      `/api/parent/children/${studentId}/payments?academicYear=${encodeURIComponent(year)}`
    );
    setPayments(history.data ?? []);
  }, [studentId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to load child fees");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const dues = useMemo(() => {
    const all: DueItem[] =
      ledger?.feeHeads.flatMap((h) =>
        h.periods.map((p) => ({
          feeHeadName: h.feeHeadName,
          periodLabel: p.periodLabel,
          displayLabel: p.displayLabel,
          amountDue: p.amountDue,
          balance: p.balance,
          dueDate: p.dueDate,
          status: p.status
        }))
      ) ?? [];
    return all.filter((d) => d.balance > 0);
  }, [ledger]);

  const onPay = async (item: DueItem) => {
    if (!studentId || !ledger || !academicYear) {
      return;
    }

    const key = `${item.feeHeadName}-${item.displayLabel}`;
    setPayingKey(key);
    setSuccessReceipt(null);
    try {
      // Pay exact outstanding balance (late fee already included in ledger balance).
      const intent = await createSchoolPaymentIntent(studentId, academicYear, [
        {
          feeHeadName: item.feeHeadName,
          periodLabel: item.periodLabel,
          amountPaid: item.balance
        }
      ]);

      if (!intent?.feePaymentId || !intent.amount) {
        throw new Error("Payment intent was not created");
      }

      const order = await createPaymentOrder(intent.feePaymentId, intent.amount);
      if (!order?.orderId || !order.keyId) {
        throw new Error("Razorpay order was not created. Check Razorpay keys.");
      }

      setActiveFeePaymentId(intent.feePaymentId);
      setCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: theme.displayName,
        description: intent.description || `${item.feeHeadName} · ${item.displayLabel}`,
        themeColor: theme.brand,
        prefillName: user?.name,
        prefillContact: ledger.student.parentPhone || user?.phone,
        prefillEmail: user?.email
      });
    } catch (err) {
      showDialog({
        tone: "error",
        title: "Payment unavailable",
        message:
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Could not start payment. Try again."
      });
    } finally {
      setPayingKey(null);
    }
  };

  const onCheckoutSuccess = async (result: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    if (!activeFeePaymentId) {
      return;
    }
    try {
      const verified = await verifyPayment({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
        feePaymentId: activeFeePaymentId
      });
      setSuccessReceipt(verified.receiptNumber);
      setCheckout(null);
      setActiveFeePaymentId(null);
      await load();
      showDialog({
        tone: "success",
        title: "Payment successful",
        message: `Receipt ${verified.receiptNumber}`
      });
    } catch (err) {
      showDialog({
        tone: "error",
        title: "Verification failed",
        message: err instanceof ApiError ? err.message : "Contact school if amount was deducted"
      });
    }
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load().finally(() => setRefreshing(false));
          }}
          tintColor={theme.brand}
        />
      }
    >
      <AppHeader
        showBack
        title={ledger?.student.name ?? "Child"}
        subtitle={ledger ? `Grade ${ledger.student.grade} · ${academicYear}` : "Loading…"}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={INK} />
        </View>
      ) : (
        <>
          <View style={[styles.summaryCard, { backgroundColor: summaryPastel.bg }]}>
            <PastelArt pastel={summaryPastel} icon="wallet-outline" />
            <Text style={styles.summaryLabel}>Outstanding balance</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    (ledger?.summary.outstandingBalance ?? 0) > 0 ? theme.danger : SUCCESS_GREEN
                }
              ]}
            >
              {formatINR(ledger?.summary.outstandingBalance ?? 0)}
            </Text>
            <View style={styles.summaryChips}>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryChipText}>
                  Paid {formatINR(ledger?.summary.totalPaid ?? 0)}
                </Text>
              </View>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryChipText}>
                  Overdue {formatINR(ledger?.summary.overdueAmount ?? 0)}
                </Text>
              </View>
            </View>
          </View>

          {successReceipt ? (
            <Card style={styles.successCard}>
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle" size={22} color={SUCCESS_GREEN} />
                <Text style={styles.successText}>Payment successful</Text>
              </View>
              <Button
                label={`View receipt ${successReceipt}`}
                variant="ghost"
                onPress={() => router.push(`/(app)/receipt/${successReceipt}`)}
              />
            </Card>
          ) : null}

          {error ? <Text style={{ color: theme.danger, marginBottom: 8 }}>{error}</Text> : null}

          <View style={styles.tabs}>
            {(
              [
                ["dues", "Dues"],
                ["history", "History"],
                ["transport", "Bus"]
              ] as const
            ).map(([id, label]) => {
              const active = tab === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setTab(id)}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {tab === "dues" ? (
            <View style={styles.list}>
              {dues.length === 0 ? (
                <Card>
                  <Text style={styles.muted}>No outstanding dues. You're all clear.</Text>
                </Card>
              ) : (
                dues.map((item) => {
                  const key = `${item.feeHeadName}-${item.displayLabel}`;
                  return (
                    <Card key={key} style={styles.dueCard}>
                      <View style={styles.dueTop}>
                        <View style={styles.rowIcon}>
                          <Ionicons name="document-text-outline" size={20} color={INK} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.dueTitle}>{item.feeHeadName}</Text>
                          <Text style={styles.dueSub}>
                            {item.displayLabel} · Due {formatDate(item.dueDate)}
                          </Text>
                        </View>
                        <Badge
                          label={statusLabel(item.status)}
                          tone={
                            item.status === "overdue"
                              ? "danger"
                              : item.status === "partial"
                                ? "warning"
                                : "neutral"
                          }
                        />
                      </View>
                      <View style={styles.dueBottom}>
                        <Text style={styles.dueAmount}>{formatINR(item.balance)}</Text>
                        <Button
                          label="Pay now"
                          loading={payingKey === key}
                          onPress={() => void onPay(item)}
                        />
                      </View>
                    </Card>
                  );
                })
              )}
            </View>
          ) : null}

          {tab === "history" ? (
            <View style={styles.list}>
              {payments.length === 0 ? (
                <Card>
                  <Text style={styles.muted}>No payments yet.</Text>
                </Card>
              ) : (
                payments.map((payment) => (
                  <Card
                    key={payment._id}
                    onPress={() => router.push(`/(app)/receipt/${payment.receiptNumber}`)}
                    style={styles.historyRow}
                  >
                    <View style={styles.rowIcon}>
                      <Ionicons name="receipt-outline" size={20} color={INK} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.dueTitle} numberOfLines={1}>
                        {payment.receiptNumber}
                      </Text>
                      <Text style={styles.dueSub}>
                        {formatDate(payment.paymentDate)} · {payment.paymentMode || "online"}
                      </Text>
                    </View>
                    <Text style={styles.paidAmount}>{formatINR(payment.totalAmountPaid)}</Text>
                  </Card>
                ))
              )}
            </View>
          ) : null}

          {tab === "transport" ? (
            <Card>
              {transport?.busNumber ? (
                <View style={styles.busBlock}>
                  <Text style={styles.eyebrow}>Bus {transport.busNumber}</Text>
                  <Text style={styles.busTitle}>{transport.routeName || "School route"}</Text>
                  <View style={styles.busGrid}>
                    {(
                      [
                        ["Pickup", transport.pickupStop || "—"],
                        ["Drop", transport.dropStop || "—"],
                        [
                          "Monthly fee",
                          transport.monthlyTransportFee != null
                            ? formatINR(transport.monthlyTransportFee)
                            : "—"
                        ]
                      ] as const
                    ).map(([label, value]) => (
                      <View key={label} style={styles.busCell}>
                        <Text style={styles.eyebrow}>{label}</Text>
                        <Text style={styles.busValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ marginTop: 6 }}>
                    {transport.trackingEnabled ? (
                      <Button
                        label="Track live"
                        icon={<Ionicons name="navigate" size={16} color="#FFFFFF" />}
                        onPress={() => router.push(`/(app)/child/${studentId}/bus`)}
                      />
                    ) : (
                      <Text style={styles.muted}>
                        Live tracking is not enabled for your school yet.
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={styles.muted}>No active transport linked for this child.</Text>
              )}
            </Card>
          ) : null}
        </>
      )}


      <RazorpayCheckoutModal
        visible={!!checkout}
        params={checkout}
        onDismiss={() => {
          setCheckout(null);
          setActiveFeePaymentId(null);
        }}
        onError={(message) => {
          setCheckout(null);
          setActiveFeePaymentId(null);
          showDialog({ tone: "error", title: "Payment failed", message });
        }}
        onSuccess={(result) => void onCheckoutSuccess(result)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 48, alignItems: "center" },
  muted: { color: SOFT_TEXT, fontSize: 14 },
  eyebrow: { fontSize: 13, color: SOFT_TEXT },
  summaryCard: {
    height: 180,
    borderRadius: 22,
    overflow: "hidden",
    padding: 20,
    justifyContent: "flex-end",
    marginBottom: 14
  },
  summaryLabel: { fontSize: 14, color: "#52525B" },
  summaryValue: { marginTop: 2, fontSize: 32, fontWeight: "800", letterSpacing: -0.8 },
  summaryChips: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  summaryChip: {
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  summaryChipText: { fontSize: 12, fontWeight: "600", color: "#3F3F46" },
  successCard: { marginBottom: 14, gap: 12 },
  successRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  successText: { fontSize: 15, fontWeight: "700", color: INK },
  tabs: {
    flexDirection: "row",
    backgroundColor: TILE,
    borderRadius: 999,
    padding: 4,
    marginBottom: 14
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 999 },
  tabActive: { backgroundColor: INK },
  tabText: { fontSize: 14, fontWeight: "600", color: INK_MUTED },
  tabTextActive: { color: "#FFFFFF" },
  list: { gap: 10 },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  dueCard: { gap: 14, padding: 16 },
  dueTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  dueTitle: { fontSize: 15, fontWeight: "700", color: INK },
  dueSub: { marginTop: 3, fontSize: 13, color: SOFT_TEXT },
  dueBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  dueAmount: { fontSize: 22, fontWeight: "800", color: INK, letterSpacing: -0.4 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  paidAmount: { fontSize: 16, fontWeight: "800", color: SUCCESS_GREEN },
  busBlock: { gap: 10 },
  busTitle: { fontSize: 22, fontWeight: "800", color: INK, letterSpacing: -0.4 },
  busGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  busCell: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12
  },
  busValue: { marginTop: 3, fontSize: 14, fontWeight: "600", color: INK }
});
