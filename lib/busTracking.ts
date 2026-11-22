/** Beyond this the last status is no longer trustworthy (matches web). */
export const STALE_AFTER_MS = 60_000;

export const BUS_STATUS_META = {
  live: { label: "Moving", color: "#16a34a" },
  stopped: { label: "Stopped", color: "#ea580c" },
  offline: { label: "Offline", color: "#64748b" },
  no_device: { label: "No tracker", color: "#9ca3af" }
} as const;

/** "less than a minute", "4 min", "1 h 5 min". */
export const formatDuration = (ms: number): string => {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  if (totalMinutes < 1) {
    return "less than a minute";
  }
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
};

/** "just now", "30 sec ago", "4 min ago". */
export const formatAgo = (iso: string, now: number): string => {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (Number.isNaN(seconds)) {
    return "—";
  }
  if (seconds < 15) {
    return "just now";
  }
  if (seconds < 60) {
    return `${seconds} sec ago`;
  }
  return `${formatDuration(seconds * 1000)} ago`;
};

export const isStale = (lastSeen: string, now = Date.now()): boolean => {
  const age = now - new Date(lastSeen).getTime();
  return !Number.isNaN(age) && age > STALE_AFTER_MS;
};

export const statusLabel = (
  position: {
    status: "live" | "stopped";
    speed: number;
    lastSeen: string;
    stoppedSince: string | null;
  },
  now = Date.now()
): string => {
  if (isStale(position.lastSeen, now)) {
    return "No recent signal";
  }
  if (position.status === "live") {
    return `Moving ${Math.round(position.speed)} km/h`;
  }
  const stoppedMs = position.stoppedSince
    ? now - new Date(position.stoppedSince).getTime()
    : 0;
  return stoppedMs >= 60_000 ? `Stopped for ${formatDuration(stoppedMs)}` : "Stopped";
};
