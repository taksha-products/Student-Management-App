import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { ApiError } from "../../lib/api";
import { fetchProfile, updateProfile, type ParentProfile } from "../../lib/inbox";
import { INK, SOFT_TEXT } from "../../lib/pastel";
import { showDialog } from "../../lib/dialog";
import { goBackOr } from "../../lib/navigation";

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        try {
          const data = await fetchProfile();
          if (!active) {
            return;
          }
          setProfile(data);
          setName(data.name);
        } catch (err) {
          if (active) {
            showDialog({
              tone: "error",
              title: "Couldn't load profile",
              message: err instanceof ApiError ? err.message : "Unable to load profile"
            });
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

  const onSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      showDialog({ tone: "warning", title: "Name too short", message: "Enter at least 2 characters." });
      return;
    }
    setSaving(true);
    try {
      const data = await updateProfile(trimmed);
      setProfile(data);
      showDialog({ tone: "success", title: "Saved", message: "Your display name was updated." });
    } catch (err) {
      showDialog({
        tone: "error",
        title: "Save failed",
        message: err instanceof ApiError ? err.message : "Unable to save"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => goBackOr(router, "/(app)/(tabs)/account")}
          style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>Account Settings</Text>
      </View>

      <Screen>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <Card style={{ gap: 14 }}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={SOFT_TEXT}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Mobile</Text>
            <Text style={styles.locked}>
              {profile?.phone ? `+91 ${profile.phone}` : "Not set"}
            </Text>
            <Text style={styles.hint}>Phone is used for OTP login and can’t be changed here.</Text>

            <Text style={styles.label}>Email</Text>
            <Text style={styles.locked}>{profile?.email || "—"}</Text>

            <Button label={saving ? "Saving…" : "Save changes"} onPress={() => void onSave()} loading={saving} />
          </Card>
        )}
      </Screen>
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
  label: { fontSize: 13, fontWeight: "600", color: SOFT_TEXT },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600"
  },
  locked: { fontSize: 16, fontWeight: "600", color: INK },
  hint: { fontSize: 12, color: SOFT_TEXT, marginTop: -6 }
});
