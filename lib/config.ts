/**
 * API base URL for the shared School Management backend.
 * Physical device: use your machine LAN IP (not localhost).
 * Android emulator: http://10.0.2.2:5000
 * iOS simulator: http://localhost:5000
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
