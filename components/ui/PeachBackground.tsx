import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";

/**
 * Product (pre-login) backdrop, drawn from the login design reference:
 * warm peach base, a big convex orange blob top-left, an orange sweep from
 * the right edge curving in under the logo, and soft waves in both bottom
 * corners. Shapes use a 400×600 canvas stretched to the screen.
 */
export const PeachBackground = ({ showCap = true }: { showCap?: boolean }) => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LinearGradient
      colors={["#FCE3CE", "#FDEBDD", "#FCE6D4"]}
      locations={[0, 0.55, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={StyleSheet.absoluteFill}
    />

    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="none">
        <Defs>
          <SvgGradient id="pbTopLeft" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F7843A" />
            <Stop offset="0.55" stopColor="#F9A468" />
            <Stop offset="1" stopColor="#FCD2B1" />
          </SvgGradient>
          <SvgGradient id="pbRight" x1="1" y1="0.2" x2="0" y2="0.8">
            <Stop offset="0" stopColor="#F7843A" />
            <Stop offset="0.5" stopColor="#FAA870" />
            <Stop offset="1" stopColor="#FCDCC2" stopOpacity={0.2} />
          </SvgGradient>
          <SvgGradient id="pbRightSoft" x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FBC59C" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#FCE0CA" stopOpacity={0} />
          </SvgGradient>
          <SvgGradient id="pbBottomLeft" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#F79552" />
            <Stop offset="1" stopColor="#FCD4B5" stopOpacity={0.3} />
          </SvgGradient>
          <SvgGradient id="pbBottomRight" x1="1" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#F7843A" />
            <Stop offset="1" stopColor="#FBBE92" stopOpacity={0.5} />
          </SvgGradient>
        </Defs>

        {/* big convex blob, top-left */}
        <Path d="M0 0 H170 C170 78 102 136 0 136 Z" fill="url(#pbTopLeft)" />

        {/* soft lighter wave behind the main right sweep */}
        <Path
          d="M400 95 C 352 108 318 150 286 176 C 262 195 240 205 214 210 L 400 210 Z"
          fill="url(#pbRightSoft)"
        />

        {/* main orange sweep from the right edge, curving in under the logo */}
        <Path
          d="M400 128 C 352 140 312 186 262 208 C 236 219 212 223 186 226 C 286 230 360 290 400 450 Z"
          fill="url(#pbRight)"
        />

        {/* bottom-left wave */}
        <Path d="M0 532 C 70 528 140 552 192 600 H0 Z" fill="url(#pbBottomLeft)" />

        {/* bottom-right curve */}
        <Path d="M400 540 C 366 552 342 576 334 600 H400 Z" fill="url(#pbBottomRight)" />
      </Svg>
    </View>

    {/* small dot inside the top-left blob */}
    <View style={styles.dot} />

    {showCap ? (
      <View style={styles.cap}>
        <MaterialCommunityIcons name="school" size={112} color="#F59A5C" />
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    top: "16%",
    left: "12%",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F49A5E",
    opacity: 0.75
  },
  cap: {
    position: "absolute",
    top: "12%",
    right: "3%",
    opacity: 0.32,
    transform: [{ rotate: "-12deg" }]
  }
});
