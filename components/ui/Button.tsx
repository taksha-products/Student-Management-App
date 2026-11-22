import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import { INK, TILE } from "../../lib/pastel";

export const Button = ({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  icon
}: {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dangerOutline";
  icon?: ReactNode;
}) => {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === "primary"
      ? INK
      : variant === "danger"
        ? theme.danger
        : variant === "secondary"
          ? TILE
          : variant === "dangerOutline"
            ? "#FFFFFF"
            : "transparent";

  const textColor =
    variant === "primary" || variant === "danger"
      ? "#FFFFFF"
      : variant === "dangerOutline"
        ? theme.danger
        : INK;

  const borderColor =
    variant === "ghost" ? "#E4E4E7" : variant === "dangerOutline" ? theme.danger : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderColor,
          borderWidth: variant === "ghost" || variant === "dangerOutline" ? 1.5 : 0
        }
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  label: { fontSize: 15, fontWeight: "700" }
});
