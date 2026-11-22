import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { INK } from "../../lib/pastel";

/**
 * Company (app vendor) logo shown on the loading and login screens.
 */
export const CompanyLogo = ({
  size = "md",
  showTagline = true
}: {
  size?: "md" | "lg";
  showTagline?: boolean;
}) => {
  const mark = size === "lg" ? 96 : 80;

  return (
    <View style={styles.wrap} accessibilityLabel="EduNex logo">
      <View style={[styles.markShadow, { width: mark, height: mark }]}>
        <Image
          source={require("../../assets/company-logo.png")}
          style={{ width: mark, height: mark }}
          contentFit="contain"
        />
      </View>
      <Text style={[styles.name, { fontSize: size === "lg" ? 40 : 36 }]}>EduNex</Text>
      {showTagline ? (
        <View style={styles.taglineRow}>
          <View style={styles.rule} />
          <Text style={styles.tagline}>Parent Portal</Text>
          <View style={styles.rule} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  markShadow: { boxShadow: "0 12px 28px rgba(255, 106, 26, 0.35)" },
  name: { marginTop: 16, fontWeight: "800", color: INK, letterSpacing: -1 },
  taglineRow: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 12 },
  rule: { width: 36, height: 1, backgroundColor: "#D6D3D1" },
  tagline: { fontSize: 17, color: "#6B6B73", letterSpacing: 0.3 }
});
