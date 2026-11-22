import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import { registerDialogHost, type DialogOptions, type DialogTone } from "../../lib/dialog";
import { INK, TILE } from "../../lib/pastel";
import { mixWithWhite } from "../../lib/theme";

const TONE_ICON: Record<DialogTone, keyof typeof Ionicons.glyphMap> = {
  info: "information-circle",
  success: "checkmark-circle",
  error: "close-circle",
  warning: "alert-circle"
};

const TONE_COLOR: Record<Exclude<DialogTone, "info">, string> = {
  success: "#16A34A",
  error: "#DC2626",
  warning: "#D97706"
};

/**
 * Renders dialogs requested via `showDialog()` as a centred white card with a
 * tinted icon, title, message and rounded buttons. Dialogs queue: closing one
 * shows the next.
 */
export const DialogHost = () => {
  const { theme } = useTheme();
  const [queue, setQueue] = useState<DialogOptions[]>([]);
  const current = queue[0];
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    registerDialogHost((options) => setQueue((prev) => [...prev, options]));
    return () => registerDialogHost(null);
  }, []);

  useEffect(() => {
    if (!current) {
      return;
    }
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      friction: 8,
      tension: 90,
      useNativeDriver: true
    }).start();
  }, [current, progress]);

  const close = useCallback(
    (after?: () => void) => {
      Animated.timing(progress, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      }).start(() => {
        setQueue((prev) => prev.slice(1));
        after?.();
      });
    },
    [progress]
  );

  if (!current) {
    return null;
  }

  const tone = current.tone ?? "info";
  const accent = tone === "info" ? theme.brand : TONE_COLOR[tone];
  const actions = current.actions?.length ? current.actions : [{ label: "OK" }];

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => close()}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityLabel="Close" />
        <Animated.View
          accessibilityRole="alert"
          style={[
            styles.card,
            {
              opacity: progress,
              transform: [
                { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }
              ]
            }
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: mixWithWhite(accent, 0.86) }]}>
            <Ionicons name={TONE_ICON[tone]} size={30} color={accent} />
          </View>
          <Text style={styles.title}>{current.title}</Text>
          {current.message ? <Text style={styles.message}>{current.message}</Text> : null}

          <View style={[styles.actions, actions.length > 1 && styles.actionsRow]}>
            {actions.map((action, index) => {
              const isLast = index === actions.length - 1;
              const kind = action.style ?? (isLast ? "primary" : "secondary");
              const filled = kind === "primary" || kind === "destructive";
              const fill = kind === "destructive" ? TONE_COLOR.error : accent;
              return (
                <Pressable
                  key={`${action.label}-${index}`}
                  onPress={() => close(action.onPress)}
                  style={({ pressed }) => [
                    styles.button,
                    actions.length > 1 && styles.buttonFlex,
                    { backgroundColor: filled ? fill : TILE, opacity: pressed ? 0.85 : 1 }
                  ]}
                >
                  <Text style={[styles.buttonText, { color: filled ? "#FFFFFF" : INK }]}>
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: "center",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)"
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  title: { fontSize: 20, fontWeight: "800", color: INK, textAlign: "center", letterSpacing: -0.3 },
  message: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    textAlign: "center"
  },
  actions: { alignSelf: "stretch", marginTop: 22, gap: 10 },
  actionsRow: { flexDirection: "row" },
  button: {
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  buttonFlex: { flex: 1 },
  buttonText: { fontSize: 16, fontWeight: "700" }
});
