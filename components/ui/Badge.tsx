import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../contexts/ThemeContext";

export const Badge = ({
  label,
  tone = "neutral",
  icon,
  iconName
}: {
  label: string;
  tone?: "neutral" | "brand" | "danger" | "success" | "warning";
  icon?: ReactNode;
  iconName?: ComponentProps<typeof Ionicons>["name"];
}) => {
  const { theme } = useTheme();

  const colors =
    tone === "brand"
      ? { bg: theme.brandSoft, fg: theme.brand }
      : tone === "danger"
        ? { bg: "#FEE2E2", fg: theme.danger }
        : tone === "success"
          ? { bg: "#D1FAE5", fg: theme.success }
          : tone === "warning"
            ? { bg: "#FEF3C7", fg: "#B45309" }
            : { bg: "#F3F4F6", fg: theme.muted };

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      {icon ??
        (iconName ? <Ionicons name={iconName} size={12} color={colors.fg} /> : null)}
      <Text style={[styles.text, { color: colors.fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  text: { fontSize: 11, fontWeight: "700" }
});
