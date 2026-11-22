import "react-native-gesture-handler";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

import { ErrorBoundary } from "../components/ErrorBoundary";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";

// Keep native splash (solid peach) until BrandSplash / first route is ready.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }
});

