import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import { TILE, type Pastel } from "../../lib/pastel";

/**
 * Soft, flat tile (light grey by default). `pastel` tints it with a card colour;
 * `accent` uses the school's soft brand tint.
 */
export const Card = ({
  children,
  onPress,
  style,
  accent,
  pastel
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accent?: boolean;
  pastel?: Pastel;
}) => {
  const { theme } = useTheme();
  const backgroundColor = pastel ? pastel.bg : accent ? theme.brandSofter : TILE;
  const content = <View style={[styles.card, { backgroundColor }, style]}>{children}</View>;

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    overflow: "hidden"
  }
});
