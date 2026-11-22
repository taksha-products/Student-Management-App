import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { darken } from "../../lib/theme";
import { HeaderWave } from "./HeaderWave";
import { SchoolIllustration } from "./SchoolIllustration";

/**
 * App top header: school logo + name with notification & help icons.
 * Without `title` (Home) it adds the "Hi, <name> 👋" greeting, tagline,
 * soft brand wave and school illustration; with `title` it shows a plain
 * page title and subtitle instead.
 */
export const BrandHeader = ({
  tagline = "Manage your children's fees, bus and more",
  title
}: {
  tagline?: string;
  title?: string;
}) => {
  const isHome = !title;
  const { user } = useAuth();
  const { theme } = useTheme();
  const firstName = user?.name?.split(" ")[0] ?? "Parent";
  const brandDark = darken(theme.brand, 0.12);

  return (
    <View style={styles.hero}>
      {isHome ? <HeaderWave height={230} /> : null}

      <View style={styles.topBar}>
        <View style={styles.schoolRow}>
          {theme.logoUrl ? (
            <Image source={{ uri: theme.logoUrl }} style={styles.logo} contentFit="contain" />
          ) : (
            <View style={[styles.logoFallback, { backgroundColor: theme.brand }]}>
              <Ionicons name="leaf" size={20} color="#fff" />
            </View>
          )}
          <Text style={[styles.schoolName, { color: theme.text }]} numberOfLines={1}>
            {theme.orgName}
          </Text>
        </View>

        <View style={styles.topActions}>
          <Pressable
            hitSlop={8}
            style={styles.iconBtn}
            onPress={() => Alert.alert("Notifications", "No new notifications.")}
          >
            <Ionicons name="notifications-outline" size={26} color={brandDark} />
            <View style={[styles.notifDot, { backgroundColor: theme.danger }]} />
          </Pressable>
          <Pressable
            hitSlop={8}
            style={styles.iconBtn}
            onPress={() =>
              Alert.alert("Help", "Contact your school office for support with fees or bus.")
            }
          >
            <Ionicons name="help-circle-outline" size={28} color={brandDark} />
          </Pressable>
        </View>
      </View>

      {isHome ? (
        <>
          <View style={styles.greetingText}>
            <Text style={[styles.greeting, { color: theme.text }]}>Hi, {firstName} 👋</Text>
            <Text style={[styles.tagline, { color: theme.muted }]}>{tagline}</Text>
          </View>

          <View style={styles.illustration} pointerEvents="none">
            <SchoolIllustration width={100} height={80} />
          </View>
        </>
      ) : (
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.tagline, { color: theme.muted }]}>{tagline}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: -16,
    marginTop: -8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
    marginBottom: 8,
    overflow: "hidden"
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14
  },
  schoolRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  logo: { width: 38, height: 38, borderRadius: 10 },
  logoFallback: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  schoolName: { fontSize: 17, fontWeight: "700", flexShrink: 1, letterSpacing: -0.2 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 14, marginLeft: 8 },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  notifDot: {
    position: "absolute",
    top: 3,
    right: 5,
    width: 9,
    height: 9,
    borderRadius: 5
  },
  greetingText: { paddingRight: 64 },
  greeting: { fontSize: 30, fontWeight: "800", letterSpacing: -0.6 },
  tagline: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  illustration: { position: "absolute", right: 2, bottom: 2 }
});
