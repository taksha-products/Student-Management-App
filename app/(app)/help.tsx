import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { useTheme } from "../../contexts/ThemeContext";
import { ApiError } from "../../lib/api";
import { fetchSupportInfo, type SupportInfo } from "../../lib/inbox";
import { INK, SOFT_TEXT } from "../../lib/pastel";
import { showDialog } from "../../lib/dialog";
import { goBackOr } from "../../lib/navigation";

/** Digits only after stripping common phone punctuation; 7–15 digits (E.164-ish). */
function sanitizePhoneForTel(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  const normalized = digits.startsWith("+")
    ? `+${digits.slice(1).replace(/\D/g, "")}`
    : digits.replace(/\D/g, "");
  const digitCount = normalized.replace(/\D/g, "").length;
  if (digitCount < 7 || digitCount > 15) {
    return null;
  }
  if (normalized.startsWith("+") && digitCount < 8) {
    return null;
  }
  return normalized;
}

function isValidEmail(raw: string): boolean {
  const email = raw.trim();
  // Practical allowlist — reject spaces and scheme injection.
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
    email
  );
}

async function openTel(phone: string) {
  const sanitized = sanitizePhoneForTel(phone);
  if (!sanitized) {
    showDialog({
      tone: "warning",
      title: "Invalid phone number",
      message: "This school’s contact number looks invalid."
    });
    return;
  }
  await Linking.openURL(`tel:${sanitized}`);
}

async function openMailto(email: string) {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) {
    showDialog({
      tone: "warning",
      title: "Invalid email",
      message: "This school’s support email looks invalid."
    });
    return;
  }
  await Linking.openURL(`mailto:${trimmed}`);
}

export default function HelpScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState<SupportInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        try {
          const data = await fetchSupportInfo();
          if (active) {
            setInfo(data);
            setError(null);
          }
        } catch (err) {
          if (active) {
            setError(err instanceof ApiError ? err.message : "Unable to load support info");
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
    }, [])
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => goBackOr(router, "/(app)/(tabs)/account")}
          style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <Screen>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : error ? (
          <Card>
            <Text style={{ color: theme.danger }}>{error}</Text>
          </Card>
        ) : info ? (
          <View style={{ gap: 12 }}>
            <Card>
              <Text style={styles.help}>{info.helpText}</Text>
            </Card>
            <Card style={{ gap: 10 }}>
              <Text style={styles.org}>{info.orgName}</Text>
              {info.address ? (
                <Row icon="location-outline" label={info.address} theme={theme} />
              ) : null}
              {info.phone ? (
                <Pressable onPress={() => void openTel(info.phone!)}>
                  <Row icon="call-outline" label={info.phone} theme={theme} link />
                </Pressable>
              ) : null}
              {info.email ? (
                <Pressable onPress={() => void openMailto(info.email!)}>
                  <Row icon="mail-outline" label={info.email} theme={theme} link />
                </Pressable>
              ) : null}
              {!info.phone && !info.email && !info.address ? (
                <Text style={{ color: theme.muted, fontSize: 13 }}>
                  Contact details are not published yet. Ask the school office for help.
                </Text>
              ) : null}
            </Card>
          </View>
        ) : null}
      </Screen>
    </View>
  );
}

function Row({
  icon,
  label,
  theme,
  link
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  theme: { text: string; brand: string; muted: string };
  link?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={link ? theme.brand : theme.muted} />
      <Text style={{ color: link ? theme.brand : theme.text, flex: 1, fontSize: 14 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth
  },
  title: { fontSize: 18, fontWeight: "800", color: INK },
  center: { paddingVertical: 48, alignItems: "center" },
  help: { fontSize: 14, color: SOFT_TEXT, lineHeight: 20 },
  org: { fontSize: 17, fontWeight: "800", color: INK },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 }
});
