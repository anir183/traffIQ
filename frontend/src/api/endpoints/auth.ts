import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
} from "../../types/contract/auth";
import type { User } from "../../types/contract/user";
import { env } from "../env";
import { request } from "../http";
import type { RequestOptions } from "../http";
import * as mock from "../mock/handlers";

export async function login(
  req: LoginRequest,
  options: RequestOptions = {},
): Promise<LoginResponse> {
  if (env.dataSource === "mock") {
    return mock.login(req);
  }
  return request<LoginResponse>("/auth/login", {
    ...options,
    method: "POST",
    body: req,
  });
}

export async function refresh(
  req: RefreshRequest,
  options: RequestOptions = {},
): Promise<RefreshResponse> {
  if (env.dataSource === "mock") {
    return mock.refresh();
  }
  return request<RefreshResponse>("/auth/refresh", {
    ...options,
    method: "POST",
    body: req,
  });
}

export async function logout(
  req: LogoutRequest,
  options: RequestOptions = {},
): Promise<void> {
  if (env.dataSource === "mock") {
    return mock.logout();
  }
  await request<null>("/auth/logout", {
    ...options,
    method: "POST",
    body: req,
  });
}

export async function getMe(options: RequestOptions = {}): Promise<User> {
  if (env.dataSource === "mock") {
    return mock.getMe();
  }
  return request<User>("/auth/me", options);
}
