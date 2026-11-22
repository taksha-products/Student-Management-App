import { StyleSheet, View } from "react-native";

import { useTheme } from "../../contexts/ThemeContext";

/** Soft brand-colored blobs for the home header atmosphere. */
export const BrandDecor = () => {
  const { theme } = useTheme();

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={[styles.blobA, { backgroundColor: theme.brandSoft }]} />
      <View style={[styles.blobB, { backgroundColor: theme.brandSofter }]} />
      <View style={[styles.blobC, { backgroundColor: theme.brandSoft }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden"
  },
  blobA: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.7
  },
  blobB: {
    position: "absolute",
    top: 40,
    right: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.9
  },
  blobC: {
    position: "absolute",
    top: -20,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.45
  }
});
