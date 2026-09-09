import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  getMe,
  login as loginEndpoint,
  logout as logoutEndpoint,
} from "../api/endpoints/auth";
import { setAuthTokenProvider } from "../api/http";
import { authEnabled } from "../api/sources";
import type { User } from "../types/contract/user";
import { AuthContext } from "./context";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokens";
import type { AuthContextValue } from "./types";

setAuthTokenProvider(() => (authEnabled ? getAccessToken() : null));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;

    async function bootstrap(): Promise<void> {
      if (!authEnabled) {
        try {
          const me = await getMe({ signal: controller.signal });
          if (!disposed) setUser(me);
        } catch {
          if (!disposed) setUser(null);
        }
        if (!disposed) setLoading(false);
        return;
      }
      if (!getAccessToken()) {
        queueMicrotask(() => {
          if (!disposed) setLoading(false);
        });
        return;
      }
      try {
        const me = await getMe({ signal: controller.signal });
        if (!disposed) setUser(me);
      } catch {
        if (!disposed) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      disposed = true;
      controller.abort();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginEndpoint({ email, password });
    setTokens(response.access_token, response.refresh_token);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (authEnabled && refreshToken) {
      try {
        await logoutEndpoint({ refresh_token: refreshToken });
      } catch {
        // ignore logout failures; tokens are cleared regardless
      }
    }
    clearTokens();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    authEnabled: authEnabled,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
