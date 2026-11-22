import { Stack } from "expo-router";

/** Keeps fees + live-bus screens on a stable nested stack (avoids instant pop). */
export default function ChildStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      {/* Map pans steal the iOS/Android edge-swipe and pop this screen — back via header only. */}
      <Stack.Screen
        name="bus"
        options={{ gestureEnabled: false, fullScreenGestureEnabled: false }}
      />
    </Stack>
  );
}
