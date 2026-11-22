import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandHeader } from "../../../components/ui/BrandHeader";
import { Card } from "../../../components/ui/Card";
import { SchoolIllustration } from "../../../components/ui/SchoolIllustration";
import { Screen } from "../../../components/ui/Screen";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { INK, pastelAt, SOFT_TEXT, SUCCESS_GREEN } from "../../../lib/pastel";
import { showDialog } from "../../../lib/dialog";

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

/**
 * Profile only. School branding is fetched automatically and applied as theme —
 * parents cannot edit branding.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const avatarPastel = pastelAt(2);

  const phone = user?.phone ? `+91 ${user.phone}` : "Phone not set";
  const initial = (user?.name ?? "P").slice(0, 1).toUpperCase();
  const [firstName, ...rest] = (user?.name ?? "Parent").split(" ");

  const menuItems: MenuItem[] = [
    {
      key: "settings",
      label: "Account Settings",
      icon: "settings-outline",
      onPress: () => router.push("/(app)/settings")
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: "notifications-outline",
      onPress: () => router.push("/(app)/notifications")
    },
    {
      key: "help",
      label: "Help & Support",
      icon: "help-circle-outline",
      onPress: () => router.push("/(app)/help")
    },
    {
      key: "about",
      label: "About App",
      icon: "information-circle-outline",
      onPress: () =>
        showDialog({
          title: "About EduNex Parent",
          message: "Fees, bus tracking, and school updates in one place. Branding is set by your school."
        })
    }
  ];

  return (
    <Screen withTabBar>
      <BrandHeader title="Profile" tagline="Your parent account" />

      <Card style={styles.featured}>
        <View style={styles.featuredText}>
          <Text style={styles.eyebrow}>Parent account</Text>
          <Text style={styles.name} numberOfLines={2}>
            {firstName}
            {rest.length ? `\n${rest.join(" ")}` : ""}
          </Text>
          <View style={styles.pill}>
            <View style={styles.pillDot} />
            <Text style={styles.pillText}>{phone}</Text>
          </View>
        </View>
        <View style={[styles.bigAvatar, { backgroundColor: avatarPastel.bg }]}>
          <Text style={[styles.bigInitial, { color: avatarPastel.accent }]}>{initial}</Text>
        </View>
      </Card>

      <Card style={styles.schoolCard}>
        <View style={styles.schoolBadge}>
          {theme.logoUrl ? (
            <Image source={{ uri: theme.logoUrl }} style={styles.schoolLogo} contentFit="contain" />
          ) : (
            <SchoolIllustration width={44} height={36} />
          )}
        </View>
        <View style={styles.schoolText}>
          <Text style={styles.eyebrow}>School</Text>
          <Text style={styles.schoolName} numberOfLines={1}>
            {theme.orgName}
          </Text>
        </View>
      </Card>

      <Text style={styles.section}>Settings</Text>
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <Card key={item.key} onPress={item.onPress} style={styles.menuRow}>
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={20} color={INK} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={SOFT_TEXT} />
          </Card>
        ))}
      </View>

      <Pressable
        onPress={() => void logout()}
        style={({ pressed }) => [styles.logout, { borderColor: theme.danger, opacity: pressed ? 0.8 : 1 }]}
      >
        <Ionicons name="log-out-outline" size={22} color={theme.danger} />
        <Text style={[styles.logoutText, { color: theme.danger }]}>Log out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  featured: {
    height: 190,
    flexDirection: "row",
    alignItems: "center",
    padding: 22
  },
  featuredText: { flex: 1, minWidth: 0, height: "100%", justifyContent: "space-between" },
  eyebrow: { fontSize: 13, color: SOFT_TEXT },
  name: { fontSize: 26, fontWeight: "800", color: INK, letterSpacing: -0.6, lineHeight: 30 },
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SUCCESS_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFFFFF" },
  pillText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  bigAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center"
  },
  bigInitial: { fontSize: 48, fontWeight: "800" },
  schoolCard: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 14 },
  schoolBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  schoolLogo: { width: 38, height: 38 },
  schoolText: { flex: 1, minWidth: 0 },
  schoolName: { marginTop: 2, fontSize: 17, fontWeight: "700", color: INK },
  section: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: "700",
    color: INK,
    letterSpacing: -0.3
  },
  menu: { gap: 10 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: "500", color: INK },
  logout: {
    marginTop: 24,
    height: 54,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  logoutText: { fontSize: 17, fontWeight: "700" }
});
