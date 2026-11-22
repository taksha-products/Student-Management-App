import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { useTheme } from "../../contexts/ThemeContext";
import { mixWithWhite } from "../../lib/theme";

/** Soft brand-colored wave sweeping in from the top-right corner of a screen header. */
export const HeaderWave = ({ height = 220 }: { height?: number }) => {
  const { theme } = useTheme();
  const tint = mixWithWhite(theme.brand, 0.8);

  return (
    <View pointerEvents="none" style={[styles.wrap, { height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMaxYMin slice">
        <Defs>
          <LinearGradient id="wave" x1="1" y1="0" x2="0.2" y2="1">
            <Stop offset="0" stopColor={tint} stopOpacity={0.95} />
            <Stop offset="1" stopColor={tint} stopOpacity={0.1} />
          </LinearGradient>
        </Defs>
        <Path
          d="M180 0 H400 V200 C350 205 320 170 270 160 C215 150 200 90 180 0 Z"
          fill="url(#wave)"
        />
        <Path
          d="M260 0 H400 V120 C360 120 330 95 300 70 C280 50 268 25 260 0 Z"
          fill={tint}
          opacity={0.45}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0
  }
});
