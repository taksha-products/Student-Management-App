import type { Href, useRouter } from "expo-router";

type AppRouter = ReturnType<typeof useRouter>;

/**
 * Go back if there is a screen to return to; otherwise replace with `fallback`.
 * Screens opened directly (deep link, notification, web URL) have no history,
 * and a bare `router.back()` would do nothing (and warn "GO_BACK not handled").
 */
export const goBackOr = (router: AppRouter, fallback: Href): void => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
};
