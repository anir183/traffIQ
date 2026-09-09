import { readStorage, removeStorage, writeStorage } from "../services/storage";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken(): string | null {
  return readStorage(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return readStorage(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  writeStorage(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) writeStorage(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  removeStorage(ACCESS_TOKEN_KEY);
  removeStorage(REFRESH_TOKEN_KEY);
}
