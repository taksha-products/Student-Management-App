import type { ChildStops } from "./parentBus";

export type BusTrip = "pickup" | "drop";

/**
 * Morning pickup / afternoon drop from India time — same rule as School_Management web.
 */
const TRIP_TIME_ZONE = "Asia/Kolkata";
const DROP_RUN_STARTS_HOUR = 12;

const hourInSchoolZone = (nowMs: number): number => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: TRIP_TIME_ZONE
  }).formatToParts(new Date(nowMs));
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  return Number.isFinite(hour) ? hour : 0;
};

export const tripAt = (nowMs: number): BusTrip =>
  hourInSchoolZone(nowMs) < DROP_RUN_STARTS_HOUR ? "pickup" : "drop";

export interface TripStop {
  label: string;
  name: string;
  other: { label: string; name: string } | null;
}

/** Stop that matters on the current run (matches web BusDetails / BusInfoSheet). */
export const stopForTrip = (stops: ChildStops | null, trip: BusTrip): TripStop | null => {
  const pickup = stops?.pickup?.trim() || null;
  const drop = stops?.drop?.trim() || null;

  if (!pickup && !drop) {
    return null;
  }
  if (!pickup || !drop || pickup === drop) {
    return { label: "Your stop", name: (pickup ?? drop) as string, other: null };
  }
  return trip === "pickup"
    ? { label: "Pickup stop", name: pickup, other: { label: "Drop stop", name: drop } }
    : { label: "Drop stop", name: drop, other: { label: "Pickup stop", name: pickup } };
};
