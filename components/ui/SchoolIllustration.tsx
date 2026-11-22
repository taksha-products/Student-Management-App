import Svg, { Circle, Line, Path, Polygon, Rect } from "react-native-svg";

import { useTheme } from "../../contexts/ThemeContext";
import { darken, mixWithWhite } from "../../lib/theme";

/** Small brand-tinted schoolhouse with a flag, used in headers and the school card. */
export const SchoolIllustration = ({ width = 100, height = 80 }: { width?: number; height?: number }) => {
  const { theme } = useTheme();
  const brand = theme.brand;
  const dark = darken(brand, 0.15);
  const soft = mixWithWhite(brand, 0.75);
  const softer = mixWithWhite(brand, 0.88);

  return (
    <Svg width={width} height={height} viewBox="0 0 100 80">
      {/* trees */}
      <Circle cx={9} cy={58} r={7} fill={soft} />
      <Circle cx={91} cy={58} r={7} fill={soft} />
      <Rect x={8} y={60} width={2} height={8} fill={dark} />
      <Rect x={90} y={60} width={2} height={8} fill={dark} />

      {/* flag */}
      <Line x1={50} y1={2} x2={50} y2={15} stroke={dark} strokeWidth={1.4} />
      <Polygon points="50.5,2 61,5.5 50.5,9" fill={brand} />

      {/* tower */}
      <Polygon points="39,23 50,13 61,23" fill={dark} />
      <Rect x={42} y={23} width={16} height={14} fill="#FFFFFF" stroke={brand} strokeWidth={1.4} />
      <Circle cx={50} cy={29.5} r={3.2} fill={softer} stroke={brand} strokeWidth={1.2} />

      {/* wings */}
      <Rect x={10} y={33} width={80} height={6} rx={2} fill={dark} />
      <Rect x={14} y={39} width={72} height={28} fill="#FFFFFF" stroke={brand} strokeWidth={1.4} />

      {/* windows */}
      {[19, 29, 64, 74].map((x) => (
        <Rect
          key={x}
          x={x}
          y={45}
          width={7}
          height={8}
          rx={1}
          fill={softer}
          stroke={brand}
          strokeWidth={1.2}
        />
      ))}

      {/* door */}
      <Path d="M43 67 V54 a7 7 0 0 1 14 0 V67 Z" fill={brand} />
      <Line x1={50} y1={49} x2={50} y2={67} stroke="#FFFFFF" strokeWidth={0.8} />

      {/* ground */}
      <Rect x={2} y={67} width={96} height={4} rx={2} fill={soft} />
    </Svg>
  );
};
