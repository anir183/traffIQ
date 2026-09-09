import type { ErrorCode } from "./errorCodes";

export interface ApiMeta {
  request_id: string;
  timestamp: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
  meta: ApiMeta;
}

export interface ApiFailure {
  success: false;
  data: null;
  error: {
    code: ErrorCode;
    message: string;
  };
  meta: ApiMeta;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;
