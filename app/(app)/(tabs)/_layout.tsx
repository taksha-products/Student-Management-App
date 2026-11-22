import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "expo-router/tabs";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { useTheme } from "../../../contexts/ThemeContext";
import { mixWithWhite } from "../../../lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

/** Visual order of the tabs in the bar (Home in the middle). */
const TAB_ORDER = ["payments", "marks", "index", "bus", "account"];

/** Outline icon for idle tabs; filled + outline pair for the two-tone active icon. */
const TAB_ICONS: Record<string, { outline: IconName; filled: IconName }> = {
  payments: { outline: "wallet-outline", filled: "wallet" },
  marks: { outline: "school-outline", filled: "school" },
  index: { outline: "home-outline", filled: "home" },
  bus: { outline: "bus-outline", filled: "bus" },
  account: { outline: "person-circle-outline", filled: "person-circle" }
};

const IDLE_ICON = "#5B6472";
const IDLE_LABEL = "#5B6472";
const ACTIVE_LABEL = "#111827";

const BAR_HEIGHT = 76;
/** Fully rounded (pill) ends: 50% of the bar height. */
const BAR_RADIUS = BAR_HEIGHT / 2;
/** Side padding so the end tabs sit clear of the pill's rounded ends. */
const SLOT_PAD = 48;
const CIRCLE = 64;
/** How far the active circle rises above the bar's top edge. */
const CIRCLE_LIFT = 34;

/** "#RRGGBB" → "rgba(r, g, b, a)". */
const withAlpha = (hex: string, alpha: number): string => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) {
    return `rgba(15, 23, 42, ${alpha})`;
  }
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/**
 * Floating glass bottom navigation. Frosted, translucent pill bar with outline
 * icons + labels; the active tab is a raised white circle with a two-tone brand
 * icon and a soft brand-coloured glow.
 *
 * One animated value (`x`, the circle centre) drives everything: the circle
 * slides, its icon crossfades between tabs, and each side icon/label fades as
 * the circle passes.
 */
const GlassTabBar = ({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) => {
  const { theme } = useTheme();
  const brand = theme.brand;
  const brandTint = mixWithWhite(brand, 0.72);
  const [width, setWidth] = useState(0);

  const ordered = TAB_ORDER.map((name) => state.routes.find((route) => route.name === name)).filter(
    (route): route is (typeof state.routes)[number] => Boolean(route)
  );
  const activeKey = state.routes[state.index]?.key;
  const activeSlot = Math.max(
    0,
    ordered.findIndex((route) => route.key === activeKey)
  );

  const slotWidth = (width - SLOT_PAD * 2) / Math.max(ordered.length, 1);
  const centerOf = (slot: number) => SLOT_PAD + slotWidth * (slot + 0.5);

  const x = useRef(new Animated.Value(0)).current;
  /** 0→1 over a switch: drives the circle's hop arc and squash. */
  const hop = useRef(new Animated.Value(1)).current;
  /** Icon pop-in scale when the circle lands. */
  const pop = useRef(new Animated.Value(1)).current;
  const placed = useRef(false);

  useEffect(() => {
    if (!width) {
      return;
    }
    const target = centerOf(activeSlot);
    if (!placed.current) {
      placed.current = true;
      x.setValue(target);
      return;
    }
    hop.setValue(0);
    Animated.parallel([
      // slide
      Animated.spring(x, { toValue: target, useNativeDriver: false, friction: 9, tension: 68 }),
      // hop arc while travelling
      Animated.timing(hop, {
        toValue: 1,
        duration: 420,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false
      }),
      // icon shrinks on take-off, springs back on landing
      Animated.sequence([
        Animated.timing(pop, { toValue: 0.72, duration: 160, useNativeDriver: false }),
        Animated.spring(pop, { toValue: 1, friction: 4, tension: 140, useNativeDriver: false })
      ])
    ]).start();
    // centerOf depends on width only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlot, width, x, hop, pop]);

  const ready = width > 0 && slotWidth > 0;
  const shapes = ready ? { circleX: x } : null;

  /** 1 when the circle sits on `slot`, fading to 0 just over half a slot away. */
  const presence = (slot: number) => {
    const c = centerOf(slot);
    return x.interpolate({
      inputRange: [c - slotWidth * 0.6, c, c + slotWidth * 0.6],
      outputRange: [0, 1, 0],
      extrapolate: "clamp"
    });
  };

  const press = (routeKey: string, focused: boolean) => {
    const event = emitter.emit({ type: "tabPress", target: routeKey, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) {
      navigateToTab(routeKey);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View
        style={styles.barWrap}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      >
        {/* frosted glass body */}
        <View style={styles.glass}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.glassTint} />
        </View>

        {/* raised white circle; hops between tabs, its icon crossfades and pops in */}
        {shapes ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.circle,
              {
                boxShadow: `0 10px 26px ${withAlpha(brand, 0.42)}, 0 4px 10px ${withAlpha(brand, 0.22)}`,
                transform: [
                  { translateX: Animated.subtract(shapes.circleX, CIRCLE / 2) },
                  { translateY: hop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -14, 0] }) },
                  {
                    scaleX: hop.interpolate({ inputRange: [0, 0.5, 0.85, 1], outputRange: [1, 0.92, 1.06, 1] })
                  },
                  {
                    scaleY: hop.interpolate({ inputRange: [0, 0.5, 0.85, 1], outputRange: [1, 1.04, 0.93, 1] })
                  }
                ]
              }
            ]}
          >
            <Animated.View style={[styles.iconPop, { transform: [{ scale: pop }] }]}>
            {ordered.map((route, slot) => {
              const icons = TAB_ICONS[route.name] ?? { outline: "ellipse-outline", filled: "ellipse" };
              return (
                <Animated.View key={route.key} style={[styles.iconStack, { opacity: presence(slot) }]}>
                  <Ionicons name={icons.filled} size={30} color={brandTint} style={styles.iconLayer} />
                  <Ionicons name={icons.outline} size={30} color={brand} style={styles.iconLayer} />
                </Animated.View>
              );
            })}
            </Animated.View>
          </Animated.View>
        ) : null}

        <View style={styles.slots}>
          {ordered.map((route, slot) => {
            const focused = route.key === activeKey;
            const icons = TAB_ICONS[route.name] ?? { outline: "ellipse-outline", filled: "ellipse" };
            const label = descriptors[route.key].options.title ?? route.name;
            const here = ready ? presence(slot) : new Animated.Value(focused ? 1 : 0);
            const away = Animated.subtract(1, here);
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                onPress={() => press(route.key, focused)}
                onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
                style={({ pressed }) => [styles.slot, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Animated.View style={{ opacity: away }}>
                  <Ionicons name={icons.outline} size={25} color={IDLE_ICON} />
                </Animated.View>
                <View style={styles.labelBox}>
                  <Animated.Text
                    numberOfLines={1}
                    style={[styles.label, styles.labelIdle, { opacity: away }]}
                  >
                    {label}
                  </Animated.Text>
                  <Animated.Text
                    numberOfLines={1}
                    style={[styles.label, styles.labelActive, styles.labelOverlay, { opacity: here }]}
                  >
                    {label}
                  </Animated.Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="payments" options={{ title: "Payments" }} />
      <Tabs.Screen name="marks" options={{ title: "Marks" }} />
      <Tabs.Screen name="bus" options={{ title: "Bus" }} />
      <Tabs.Screen name="account" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Floats over the screen so content scrolls (and blurs) behind the glass.
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: CIRCLE_LIFT + 6
  },
  barWrap: { height: BAR_HEIGHT },
  glass: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: BAR_RADIUS,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.75)",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(15, 23, 42, 0.06)"
  },
  glassTint: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255, 255, 255, 0.62)"
  },
  slots: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: SLOT_PAD,
    flexDirection: "row"
  },
  slot: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 12,
    gap: 6
  },
  // Wider than a slot so bold labels like "Payments" never truncate.
  labelBox: { width: 84, height: 17, alignItems: "center" },
  label: { fontSize: 12, textAlign: "center" },
  labelIdle: { ...StyleSheet.absoluteFill, color: IDLE_LABEL, fontWeight: "500" },
  labelActive: { color: ACTIVE_LABEL, fontWeight: "800" },
  labelOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  circle: {
    position: "absolute",
    left: 0,
    top: -CIRCLE_LIFT,
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.16)"
  },
  iconPop: { width: 30, height: 30 },
  iconStack: { position: "absolute", width: 30, height: 30 },

  iconLayer: { position: "absolute", top: 0, left: 0 }
});
