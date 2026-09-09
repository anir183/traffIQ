import type { User } from "../types/contract/user";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  authEnabled: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
