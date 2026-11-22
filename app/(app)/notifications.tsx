import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { useTheme } from "../../contexts/ThemeContext";
import { ApiError } from "../../lib/api";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ParentNotification
} from "../../lib/inbox";
import { INK, SOFT_TEXT } from "../../lib/pastel";
import { goBackOr } from "../../lib/navigation";

const typeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case "fee":
      return "wallet-outline";
    case "bus":
      return "bus-outline";
    case "announcement":
      return "megaphone-outline";
    default:
      return "notifications-outline";
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ParentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const data = await fetchNotifications();
    setItems(data.items ?? []);
    setUnreadCount(data.unreadCount ?? 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        try {
          await load();
        } catch (err) {
          if (active) {
            setError(err instanceof ApiError ? err.message : "Unable to load notifications");
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [load])
  );

  const onOpen = async (item: ParentNotification) => {
    if (!item.read) {
      try {
        await markNotificationRead(item.id);
        setItems((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, read: true } : row))
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Keep list usable even if mark-read fails.
      }
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => goBackOr(router, "/(app)/(tabs)")}
          style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.sub}>
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <Pressable
            onPress={() => {
              void markAllNotificationsRead()
                .then(load)
                .catch(() => undefined);
            }}
          >
            <Text style={{ color: theme.brand, fontWeight: "700", fontSize: 13 }}>Mark all</Text>
          </Pressable>
        ) : null}
      </View>

      <Screen
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load()
                .catch((err) =>
                  setError(err instanceof ApiError ? err.message : "Unable to refresh")
                )
                .finally(() => setRefreshing(false));
            }}
            tintColor={theme.brand}
          />
        }
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <View style={styles.list}>
            {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
            {items.length === 0 && !error ? (
              <Card>
                <Text style={{ color: theme.muted }}>
                  No notifications yet. School announcements will appear here.
                </Text>
              </Card>
            ) : null}
            {items.map((item) => (
              <Pressable key={item.id} onPress={() => void onOpen(item)}>
                <Card style={[styles.row, !item.read && styles.unread]}>
                  <View style={[styles.icon, { backgroundColor: theme.brandSoft }]}>
                    <Ionicons name={typeIcon(item.type)} size={20} color={theme.brand} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemBody} numberOfLines={3}>
                      {item.body}
                    </Text>
                    <Text style={styles.meta}>
                      {new Date(item.publishedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </Text>
                  </View>
                  {!item.read ? <View style={[styles.dot, { backgroundColor: theme.brand }]} /> : null}
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth
  },
  title: { fontSize: 18, fontWeight: "800", color: INK },
  sub: { fontSize: 13, color: SOFT_TEXT, marginTop: 2 },
  center: { paddingVertical: 48, alignItems: "center" },
  list: { gap: 10, paddingBottom: 24 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  unread: { borderWidth: 1, borderColor: "#FED7AA" },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  itemTitle: { fontSize: 15, fontWeight: "700", color: INK },
  itemBody: { marginTop: 4, fontSize: 13, color: SOFT_TEXT, lineHeight: 18 },
  meta: { marginTop: 6, fontSize: 11, color: "#A1A1AA" },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 }
});
