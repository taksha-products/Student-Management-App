import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import type { Pastel } from "../../lib/pastel";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/**
 * Decorative right-side artwork for pastel feature cards:
 * soft blobs, a flowing ribbon and a large tilted icon.
 */
export const PastelArt = ({ pastel, icon }: { pastel: Pastel; icon: IconName }) => (
  <View pointerEvents="none" style={styles.wrap}>
    <Svg width="100%" height="100%" viewBox="0 0 200 180" preserveAspectRatio="xMaxYMid slice">
      <Circle cx={130} cy={70} r={62} fill={pastel.soft} />
      <Circle cx={40} cy={30} r={4} fill="#FFFFFF" opacity={0.8} />
      <Circle cx={185} cy={150} r={5} fill="#FFFFFF" opacity={0.8} />
      <Circle cx={70} cy={150} r={3} fill="#FFFFFF" opacity={0.7} />
      <Path
        d="M0 150 C 50 115, 90 175, 140 140 S 200 120, 220 128 L 220 150 C 190 140, 160 165, 130 168 S 50 140, 0 172 Z"
        fill={pastel.accent}
        opacity={0.22}
      />
    </Svg>
    <View style={styles.iconWrap}>
      <MaterialCommunityIcons name={icon} size={92} color={pastel.accent} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "58%"
  },
  iconWrap: {
    position: "absolute",
    right: 26,
    top: 22,
    transform: [{ rotate: "-10deg" }]
  }
});
