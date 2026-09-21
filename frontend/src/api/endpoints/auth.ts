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
import { abortable } from "../mock/middleware";

export async function login(
  req: LoginRequest,
  options: RequestOptions = {},
): Promise<LoginResponse> {
  if (env.dataSource === "mock") {
    return abortable(mock.login(req), options.signal);
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
    return abortable(mock.refresh(), options.signal);
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
    return abortable(mock.logout(), options.signal);
  }
  await request<null>("/auth/logout", {
    ...options,
    method: "POST",
    body: req,
  });
}

export async function getMe(options: RequestOptions = {}): Promise<User> {
  if (env.dataSource === "mock") {
    return abortable(mock.getMe(), options.signal);
  }
  return request<User>("/auth/me", options);
}
