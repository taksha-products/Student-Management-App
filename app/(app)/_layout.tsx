import { Redirect, Stack } from "expo-router";

import { BrandSplash } from "../../components/ui/BrandSplash";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Authenticated shell: Stack so child/receipt push over tabs with proper back.
 */
export default function AppLayout() {
  const { user, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <BrandSplash />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" />
      {/* Map WebView pans / edge swipe must not pop the whole child stack back to tabs. */}
      <Stack.Screen
        name="child/[studentId]"
        options={{ gestureEnabled: false, fullScreenGestureEnabled: false }}
      />
      <Stack.Screen name="receipt/[receiptNumber]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
    </Stack>
  );
}
