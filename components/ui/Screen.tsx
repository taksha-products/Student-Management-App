import type { ReactElement, ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../contexts/ThemeContext";

/**
 * Height of the floating tab bar above the system inset (circle lift + gap +
 * bar). Keep in sync with app/(app)/(tabs)/_layout.tsx.
 */
const TAB_BAR_BODY = 34 + 6 + 76;

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
  const insets = useSafeAreaInsets();
  // Space under the content: the phone's own bottom inset (Android back / home /
  // recents bar, iOS home indicator) plus the floating tab bar on tab screens.
  const bottomSpace = withTabBar
    ? TAB_BAR_BODY + Math.max(insets.bottom, 10) + 20
    : insets.bottom + 28;

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top"]}>
        <View style={[styles.flex, padded && styles.padded, { paddingBottom: bottomSpace }]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top"]}>
      {/* Lift content above the keyboard (Android is edge-to-edge, so it won't resize itself). */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={[styles.content, padded && styles.padded, { paddingBottom: bottomSpace }]}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  padded: { paddingHorizontal: 16, paddingTop: 8 }
});
