import { apiRequest } from "./api";

export type ParentBusState = "no_bus" | "tracking_unavailable" | "not_running" | "running";

export interface ChildStops {
  pickup: string | null;
  drop: string | null;
}

export interface ParentBusPosition {
  lat: number;
  lng: number;
  speed: number;
  bearing: number;
  lastSeen: string;
  status: "live" | "stopped";
  stoppedSince: string | null;
}

/** Deliberately minimal bus view for parents (mirrors web / backend). */
export interface ParentBusView {
  state: ParentBusState;
  studentName: string;
  stops: ChildStops | null;
  bus: {
    busId: string;
    busNumber: string;
    routeName: string;
    routeNumber: string | null;
    driverName: string;
  } | null;
  position: ParentBusPosition | null;
}

/** [latitude, longitude, epoch milliseconds] */
export type ParentTrailPoint = [number, number, number];

export const RUNNING_POLL_MS = 10_000;
export const IDLE_POLL_MS = 30_000;
export const TRAIL_POLL_MS = 60_000;
export const MAX_LIVE_TRAIL_POINTS = 200;

export const STATE_COPY: Record<Exclude<ParentBusState, "running">, { title: string; body: string }> =
  {
    no_bus: {
      title: "No school bus assigned",
      body: "Your child isn't assigned to a school bus yet. Contact the school office to set one up."
    },
    tracking_unavailable: {
      title: "Live tracking isn't set up for this bus",
      body: "The school hasn't connected a GPS tracker to this bus yet."
    },
    not_running: {
      title: "The bus isn't running right now",
      body: "You'll see it here when it's on its route."
    }
  };

export const fetchParentBus = async (studentId: string): Promise<ParentBusView> => {
  const result = await apiRequest<{ data: ParentBusView }>(
    `/api/parent/children/${studentId}/bus`
  );
  return result.data;
};

export const fetchParentBusTrail = async (studentId: string): Promise<ParentTrailPoint[]> => {
  const result = await apiRequest<{ data: { points: ParentTrailPoint[] } }>(
    `/api/parent/children/${studentId}/bus/trail`
  );
  return result.data?.points ?? [];
};

/** Merge stored trail + live poll points into lat/lng pairs (oldest → newest). */
export const mergeTrailCoordinates = (
  stored: ParentTrailPoint[],
  live: ParentTrailPoint[]
): Array<{ latitude: number; longitude: number }> => {
  const lastStoredTime = stored.length > 0 ? stored[stored.length - 1]![2] : 0;
  const combined = [...stored, ...live.filter((point) => point[2] > lastStoredTime)];
  const coordinates: Array<{ latitude: number; longitude: number }> = [];
  for (const point of combined) {
    const previous = coordinates[coordinates.length - 1];
    if (!previous || previous.latitude !== point[0] || previous.longitude !== point[1]) {
      coordinates.push({ latitude: point[0], longitude: point[1] });
    }
  }
  return coordinates;
};
