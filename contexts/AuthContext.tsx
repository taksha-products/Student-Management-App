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
import {
  clearSession,
  getRefreshToken,
  getStoredUser,
  saveSession
} from "../lib/auth-storage";
import {
  resetSessionExpiredGate,
  setSessionExpiredHandler
} from "../lib/sessionEvents";
import type { AuthUser, ParentSchoolOption } from "../lib/types";
import { showDialog } from "../lib/dialog";

interface SessionResponse {
  success?: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
}

interface OtpVerifyResponse extends SessionResponse {
  requiresSchoolSelection?: boolean;
  selectionToken?: string;
  schools?: ParentSchoolOption[];
  message?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  bootstrapping: boolean;
  requestOtp: (phone: string) => Promise<{ message: string; debugOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<OtpVerifyResponse>;
  selectSchool: (selectionToken: string, orgCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const persistSession = async (data: SessionResponse): Promise<AuthUser> => {
  if (!data.accessToken || !data.refreshToken || !data.user) {
    throw new Error("Invalid session response from server");
  }
  if (data.user.role !== "parent") {
    throw new Error("This app is for parents only");
  }
  await saveSession(data.accessToken, data.refreshToken, data.user);
  return data.user;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      showDialog({ tone: "warning", title: "Session expired", message: "Sign in again to continue." });
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await getStoredUser();
        const refreshToken = await getRefreshToken();
        if (!stored || !refreshToken) {
          setUser(null);
          return;
        }

        const me = await apiRequest<{ user?: AuthUser; data?: AuthUser }>("/api/auth/me");
        const nextUser = me.user ?? me.data;
        if (!nextUser || nextUser.role !== "parent") {
          await clearSession();
          setUser(null);
          return;
        }
        setUser(nextUser as AuthUser);
        resetSessionExpiredGate();
      } catch {
        await clearSession();
        setUser(null);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    return apiRequest<{ message: string; debugOtp?: string }>("/api/auth/otp/request", {
      method: "POST",
      body: { phone },
      auth: false
    });
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const result = await apiRequest<OtpVerifyResponse>("/api/auth/otp/verify", {
      method: "POST",
      body: { phone, otp },
      auth: false
    });

    if (result.requiresSchoolSelection) {
      return result;
    }

    const nextUser = await persistSession(result);
    setUser(nextUser);
    resetSessionExpiredGate();
    return result;
  }, []);

  const selectSchool = useCallback(async (selectionToken: string, orgCode: string) => {
    const result = await apiRequest<SessionResponse>("/api/auth/otp/select-school", {
      method: "POST",
      body: { selectionToken, orgCode },
      auth: false
    });
    const nextUser = await persistSession(result);
    setUser(nextUser);
    resetSessionExpiredGate();
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await getRefreshToken();
      await apiRequest("/api/auth/logout", {
        method: "POST",
        body: { refreshToken },
        auth: false
      });
    } catch {
      // Clear local session even if logout API fails.
    } finally {
      await clearSession();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      bootstrapping,
      requestOtp,
      verifyOtp,
      selectSchool,
      logout
    }),
    [user, bootstrapping, requestOtp, verifyOtp, selectSchool, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
