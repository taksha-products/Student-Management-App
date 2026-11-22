import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { apiRequest } from "../lib/api";
import { API_URL } from "../lib/config";
import { buildTheme, type AppTheme } from "../lib/theme";
import type { OrgThemePayload } from "../lib/types";
import { useAuth } from "./AuthContext";

interface ThemeContextValue {
  /** Fetched school branding (read-only for parents). */
  theme: AppTheme;
  loading: boolean;
  refreshTheme: () => Promise<void>;
  resolveLogoUrl: (path?: string | null) => string | null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const resolveLogoUrl = (path?: string | null): string | null => {
  if (!path) {
    return null;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

/**
 * Loads org theme from GET /api/org/theme after parent login.
 * Parents never edit branding — admin configures it on web.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<AppTheme>(buildTheme());
  const [loading, setLoading] = useState(false);

  const refreshTheme = useCallback(async () => {
    if (!user?.organizationId) {
      setTheme(buildTheme());
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest<{ data: OrgThemePayload }>("/api/org/theme");
      setTheme(
        buildTheme({
          brandColor: result.data.brandColor,
          displayName: result.data.displayName,
          orgName: result.data.orgName,
          logoUrl: resolveLogoUrl(result.data.logoUrl)
        })
      );
    } catch {
      setTheme(buildTheme());
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    void refreshTheme();
  }, [refreshTheme]);

  const value = useMemo(
    () => ({
      theme,
      loading,
      refreshTheme,
      resolveLogoUrl
    }),
    [theme, loading, refreshTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
};
