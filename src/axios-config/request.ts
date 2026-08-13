import type { CryptoType } from "@dczy/tie-tools";

export type RuntimeEnvironmentMap = Record<string, string>;
export type RuntimeSuccessCode = string | number;
export type RuntimeCryptoType = "Ecdh" | "SM";
export type RuntimeTokenStorage = "localStorage" | "sessionStorage";

export interface RuntimeRequestOptions {
  timeout: number;
  isJwt: boolean;
  tokenStorage: RuntimeTokenStorage;
  tokenKey: string;
  tokenPrefix: string;
  crypto: boolean;
  cryptoType: RuntimeCryptoType;
}

export interface RuntimeConfigFile {
  env: string;
  successCodes?: RuntimeSuccessCode[];
  gateway_url: RuntimeEnvironmentMap;
  login_url: RuntimeEnvironmentMap;
  file_url?: RuntimeEnvironmentMap;
  getfile_url?: RuntimeEnvironmentMap;
  jssdk_url?: RuntimeEnvironmentMap;
  request?: Partial<RuntimeRequestOptions>;
}

export interface RuntimeConfig {
  env: string;
  successCodes: RuntimeSuccessCode[];
  GATEWAY_URL: string;
  PATH_URL: string;
  LOGIN_URL: string;
  FILE_URL: string;
  GETFILE_URL: string;
  JSSDK_URL: string;
  CRYPT_TYPE: CryptoType;
  request: RuntimeRequestOptions;
}

export class RuntimeConfigError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RuntimeConfigError";
  }
}

const defaultRequestOptions: RuntimeRequestOptions = {
  timeout: 90000,
  isJwt: true,
  tokenStorage: "localStorage",
  tokenKey: "JsToken",
  tokenPrefix: "bearer ",
  crypto: false,
  cryptoType: "Ecdh",
};

// Keep this module lightweight during bootstrap. These values mirror the
// CryptoType enum exposed by tie-tools without loading its crypto runtime.
const cryptoTypeValues = {
  SM: 0 as CryptoType,
  Ecdh: 1 as CryptoType,
};

let runtimeConfig: RuntimeConfig | null = null;
let runtimeConfigPromise: Promise<RuntimeConfig> | null = null;

// Live bindings are assigned during loadRuntimeConfig(). Application bootstrap
// guarantees configuration is ready before any business module is imported.
export let env = "";
export let GATEWAY_URL = "";
export let PATH_URL = "";
export let LOGIN_URL = "";
export let FILE_URL = "";
export let GETFILE_URL = "";
export let JSSDK_URL = "";
export let CRYPT_TYPE: CryptoType = cryptoTypeValues.Ecdh;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertEnvironmentMap(
  value: unknown,
  fieldName: string
): asserts value is RuntimeEnvironmentMap {
  if (!isRecord(value)) {
    throw new RuntimeConfigError(`config.json 中的 ${fieldName} 必须是环境映射对象`);
  }

  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== "string") {
      throw new RuntimeConfigError(
        `config.json 中的 ${fieldName}.${key} 必须是字符串`
      );
    }
  }
}

function getEnvironmentValue(
  mapping: RuntimeEnvironmentMap | undefined,
  currentEnv: string,
  fieldName: string,
  required: boolean
) {
  if (mapping === undefined && !required) return "";

  assertEnvironmentMap(mapping, fieldName);
  if (!Object.prototype.hasOwnProperty.call(mapping, currentEnv)) {
    throw new RuntimeConfigError(
      `config.json 中缺少 ${fieldName}.${currentEnv} 配置`
    );
  }

  const value = mapping[currentEnv];
  if (required && value.trim() === "") {
    throw new RuntimeConfigError(
      `config.json 中的 ${fieldName}.${currentEnv} 不能为空`
    );
  }
  return value;
}

function parseRequestOptions(value: unknown): RuntimeRequestOptions {
  if (value !== undefined && !isRecord(value)) {
    throw new RuntimeConfigError("config.json 中的 request 必须是对象");
  }

  const options = {
    ...defaultRequestOptions,
    ...(value as Partial<RuntimeRequestOptions> | undefined),
  };

  if (!Number.isFinite(options.timeout) || options.timeout <= 0) {
    throw new RuntimeConfigError("config.json 中的 request.timeout 必须是正数");
  }
  if (typeof options.isJwt !== "boolean") {
    throw new RuntimeConfigError("config.json 中的 request.isJwt 必须是布尔值");
  }
  if (typeof options.crypto !== "boolean") {
    throw new RuntimeConfigError("config.json 中的 request.crypto 必须是布尔值");
  }
  if (options.tokenStorage !== "localStorage" && options.tokenStorage !== "sessionStorage") {
    throw new RuntimeConfigError(
      "config.json 中的 request.tokenStorage 只能是 localStorage 或 sessionStorage"
    );
  }
  if (typeof options.tokenKey !== "string" || options.tokenKey.trim() === "") {
    throw new RuntimeConfigError("config.json 中的 request.tokenKey 不能为空");
  }
  if (typeof options.tokenPrefix !== "string") {
    throw new RuntimeConfigError("config.json 中的 request.tokenPrefix 必须是字符串");
  }
  if (options.cryptoType !== "Ecdh" && options.cryptoType !== "SM") {
    throw new RuntimeConfigError(
      "config.json 中的 request.cryptoType 只能是 Ecdh 或 SM"
    );
  }

  return options;
}

function resolveRuntimeConfig(value: unknown): RuntimeConfig {
  if (!isRecord(value)) {
    throw new RuntimeConfigError("config.json 的根节点必须是对象");
  }

  const raw = value as unknown as RuntimeConfigFile;
  if (typeof raw.env !== "string" || raw.env.trim() === "") {
    throw new RuntimeConfigError("config.json 中的 env 不能为空");
  }

  const successCodes = raw.successCodes ?? [0, "0", 200, "200"];
  if (
    !Array.isArray(successCodes) ||
    successCodes.length === 0 ||
    successCodes.some(
      (code) => typeof code !== "string" && typeof code !== "number"
    )
  ) {
    throw new RuntimeConfigError(
      "config.json 中的 successCodes 必须是非空字符串/数字数组"
    );
  }

  const request = parseRequestOptions(raw.request);
  const gatewayUrl = getEnvironmentValue(
    raw.gateway_url,
    raw.env,
    "gateway_url",
    true
  );

  return {
    env: raw.env,
    successCodes: [...successCodes],
    GATEWAY_URL: gatewayUrl,
    PATH_URL: gatewayUrl,
    LOGIN_URL: getEnvironmentValue(
      raw.login_url,
      raw.env,
      "login_url",
      true
    ),
    FILE_URL: getEnvironmentValue(raw.file_url, raw.env, "file_url", false),
    GETFILE_URL: getEnvironmentValue(
      raw.getfile_url,
      raw.env,
      "getfile_url",
      false
    ),
    JSSDK_URL: getEnvironmentValue(
      raw.jssdk_url,
      raw.env,
      "jssdk_url",
      false
    ),
    CRYPT_TYPE:
      request.cryptoType === "SM" ? cryptoTypeValues.SM : cryptoTypeValues.Ecdh,
    request,
  };
}

function applyRuntimeConfig(config: RuntimeConfig) {
  runtimeConfig = config;
  env = config.env;
  GATEWAY_URL = config.GATEWAY_URL;
  PATH_URL = config.PATH_URL;
  LOGIN_URL = config.LOGIN_URL;
  FILE_URL = config.FILE_URL;
  GETFILE_URL = config.GETFILE_URL;
  JSSDK_URL = config.JSSDK_URL;
  CRYPT_TYPE = config.CRYPT_TYPE;
  return config;
}

export function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (runtimeConfig) return Promise.resolve(runtimeConfig);
  if (runtimeConfigPromise) return runtimeConfigPromise;

  const configUrl = `${import.meta.env.BASE_URL}config.json?t=${Date.now()}`;
  runtimeConfigPromise = fetch(configUrl, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new RuntimeConfigError(
          `无法加载运行时配置（HTTP ${response.status}）`
        );
      }

      try {
        return await response.json();
      } catch (error) {
        throw new RuntimeConfigError("config.json 不是有效的 JSON", {
          cause: error,
        });
      }
    })
    .then(resolveRuntimeConfig)
    .then(applyRuntimeConfig)
    .catch((error: unknown) => {
      if (error instanceof RuntimeConfigError) throw error;
      throw new RuntimeConfigError("加载运行时配置失败", { cause: error });
    });

  return runtimeConfigPromise;
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!runtimeConfig) {
    throw new RuntimeConfigError(
      "运行时配置尚未初始化，请先调用 loadRuntimeConfig()"
    );
  }
  return runtimeConfig;
}
