import type { ReactElement, ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../contexts/ThemeContext";

export const Screen = ({
  children,
  scroll = true,
  refreshControl,
  padded = true,
  withTabBar = false
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: ReactElement;
  padded?: boolean;
  /** Tab screens: leave room for the floating bottom bar. */
  withTabBar?: boolean;
}) => {
  const { theme } = useTheme();

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top"]}>
        <View style={[styles.flex, padded && styles.padded]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[styles.content, padded && styles.padded, withTabBar && styles.tabBarSpace]}
        refreshControl={refreshControl}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 28 },
  /** Floating tab bar height (circle lift + bar + margins) plus breathing room. */
  tabBarSpace: { paddingBottom: 150 },
  padded: { paddingHorizontal: 16, paddingTop: 8 }
});
