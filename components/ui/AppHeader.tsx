import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { INK, SOFT_TEXT, TILE } from "../../lib/pastel";

/**
 * Inner-screen header: round grey back button, small muted eyebrow,
 * and a big bold title.
 */
export const AppHeader = ({
  title,
  subtitle,
  showBack = false,
  right
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
}) => {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {showBack || right ? (
        <View style={styles.topRow}>
          {showBack ? (
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(app)/(tabs)");
                }
              }}
              style={styles.backBtn}
              hitSlop={10}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={INK} />
            </Pressable>
          ) : (
            <View />
          )}
          {right}
        </View>
      ) : null}

      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingTop: 12, marginBottom: 20 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TILE,
    alignItems: "center",
    justifyContent: "center"
  },
  subtitle: { fontSize: 14, color: SOFT_TEXT, marginBottom: 4 },
  title: { fontSize: 30, fontWeight: "800", color: INK, letterSpacing: -0.7, lineHeight: 34 }
});
