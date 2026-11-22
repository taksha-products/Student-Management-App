type SessionExpiredHandler = () => void;

let handler: SessionExpiredHandler | null = null;
let notified = false;

/** AuthProvider registers this so API 401 can clear React auth state. */
export const setSessionExpiredHandler = (next: SessionExpiredHandler | null): void => {
  handler = next;
  if (next) {
    notified = false;
  }
};

/** Called once after tokens are wiped on hard auth failure. */
export const notifySessionExpired = (): void => {
  if (notified || !handler) {
    return;
  }
  notified = true;
  handler();
};

/** Allow a fresh notify after the user signs in again. */
export const resetSessionExpiredGate = (): void => {
  notified = false;
};
