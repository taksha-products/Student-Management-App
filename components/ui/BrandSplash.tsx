import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { CompanyLogo } from "./CompanyLogo";

/** Three orange dots pulsing in sequence. */
const LoadingDots = () => {
  const values = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const animations = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(value, { toValue: 1, duration: 360, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.3, duration: 360, useNativeDriver: true }),
          Animated.delay((2 - index) * 160)
        ])
      )
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [values]);

  return (
    <View style={styles.dots}>
      {values.map((value, index) => (
        <Animated.View key={index} style={[styles.dot, { opacity: value }]} />
      ))}
    </View>
  );
};

/**
 * Product loading screen in the clean minimal login style: white page,
 * one soft peach accent circle, the company logo centred and orange dots.
 */
export const BrandSplash = ({ showSpinner = true }: { showSpinner?: boolean }) => {
  useEffect(() => {
    // Drop the native Expo splash once our branded screen is on screen.
    void SplashScreen.hideAsync();
  }, []);

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.blobClip}>
      <View style={styles.blob} />
    </View>
      <View style={styles.center}>
        <CompanyLogo size="lg" />
        <View style={styles.dotsSlot}>{showSpinner ? <LoadingDots /> : null}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", backgroundColor: "#FFFFFF" },
  // Clipped corner box: keeps the circle from widening the page (web scrolls
  // overflow-hidden containers sideways when an input is focused).
  blobClip: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 170,
    height: 160,
    overflow: "hidden"
  },
  blob: {
    position: "absolute",
    top: -120,
    left: 0,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#FFF1E7"
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  dotsSlot: { height: 40, marginTop: 28, justifyContent: "center" },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#FF7A2F" }
});
