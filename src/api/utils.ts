import type { defineConfig, interceptorsUse } from "@dczy/tie-tools";

import { getRuntimeConfig } from "@/axios-config/request";
import { ApiError } from "./types";

type UnknownRecord = Record<string, unknown>;

let loginRedirectStarted = false;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readCode(value: unknown): string | number | null {
  if (!isRecord(value)) return null;
  const code = value.code;
  return typeof code === "string" || typeof code === "number" ? code : null;
}

function readMessage(value: unknown, fallback: string) {
  if (!isRecord(value)) return fallback;
  const message = value.message;
  return typeof message === "string" || typeof message === "number"
    ? String(message)
    : fallback;
}

function isUnauthorized(code: unknown) {
  return code === 401 || code === "401";
}

function removeToken() {
  const { request } = getRuntimeConfig();
  window[request.tokenStorage].removeItem(request.tokenKey);
}

export function createLoginRedirectUrl(currentUrl = window.location.href) {
  const { LOGIN_URL } = getRuntimeConfig();
  const loginUrl = new URL(LOGIN_URL, window.location.origin);
  loginUrl.searchParams.set("redirect", currentUrl);
  return loginUrl.toString();
}

function redirectToLogin() {
  if (loginRedirectStarted) return;

  removeToken();
  const loginUrl = createLoginRedirectUrl();
  const currentUrl = new URL(window.location.href);
  const targetUrl = new URL(loginUrl);

  if (
    currentUrl.origin === targetUrl.origin &&
    currentUrl.pathname === targetUrl.pathname
  ) {
    return;
  }

  loginRedirectStarted = true;
  window.location.assign(loginUrl);
}

function createBusinessError(
  data: UnknownRecord,
  status: number,
  fallbackMessage: string
) {
  const code = readCode(data);
  return new ApiError(readMessage(data, fallbackMessage), {
    kind: "business",
    code,
    status,
    data,
    details: data.details ?? data.multipleMessage,
  });
}

function normalizeRejectedError(error: unknown) {
  if (error instanceof ApiError) return error;

  const errorRecord = isRecord(error) ? error : null;
  const response = isRecord(errorRecord?.response)
    ? errorRecord.response
    : null;
  const status =
    typeof response?.status === "number" ? response.status : null;
  const data = response?.data;
  const code = readCode(data);
  const fallbackMessage =
    typeof errorRecord?.message === "string"
      ? errorRecord.message
      : status
        ? `请求失败（HTTP ${status}）`
        : "网络请求失败";

  return new ApiError(readMessage(data, fallbackMessage), {
    kind: response ? "http" : "network",
    code,
    status,
    data,
    details: isRecord(data) ? data.details ?? data.multipleMessage : undefined,
    originalError: error,
  });
}

export const handleRequestFulfilled: NonNullable<
  interceptorsUse["onRequestFulfilled"]
> = async (config: defineConfig) => config;

export const handleFulfilled: NonNullable<
  interceptorsUse["onFulfilled"]
> = (response) => {
  const data: unknown = response.data;
  if (!isRecord(data)) return response;

  if (Object.prototype.hasOwnProperty.call(data, "isSuccessful")) {
    if (data.isSuccessful === true) return response;

    const error = createBusinessError(data, response.status, "请求处理失败");
    if (isUnauthorized(error.code)) redirectToLogin();
    return Promise.reject(error);
  }

  if (Object.prototype.hasOwnProperty.call(data, "code")) {
    const code = readCode(data);
    const { successCodes } = getRuntimeConfig();
    if (code !== null && successCodes.includes(code)) return response;

    const error = createBusinessError(data, response.status, "请求处理失败");
    if (isUnauthorized(error.code)) redirectToLogin();
    return Promise.reject(error);
  }

  return response;
};

export const handleRejected: NonNullable<
  interceptorsUse["onRejected"]
> = (error) => {
  const normalizedError = normalizeRejectedError(error);
  if (
    normalizedError.status === 401 ||
    isUnauthorized(normalizedError.code)
  ) {
    redirectToLogin();
  }
  return Promise.reject(normalizedError);
};

// Compatibility alias for projects that already use the historical typo.
export const handleRejecect = handleRejected;
