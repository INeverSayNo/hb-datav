import {
  DcToolsRequest,
  type defineConfig,
  type interceptorsUse,
} from "@dczy/tie-tools";

import { getRuntimeConfig } from "@/axios-config/request";
import {
  handleFulfilled,
  handleRejected,
  handleRequestFulfilled,
} from "./utils";

export type { Rsp, Rsp8 } from "./types";
export { ApiError } from "./types";

const defaultInterceptors: interceptorsUse = {
  onRejected: handleRejected,
  onFulfilled: handleFulfilled,
  onRequestFulfilled: handleRequestFulfilled,
};

export class BaseApi extends DcToolsRequest {
  constructor(config: defineConfig = {}, use: interceptorsUse = defaultInterceptors) {
    const runtimeConfig = getRuntimeConfig();
    const requestConfig = runtimeConfig.request;
    const hasCryptoOverride = Object.prototype.hasOwnProperty.call(
      config,
      "crypto"
    );

    const baseConfig: defineConfig = {
      baseURL: config.baseURL || runtimeConfig.GATEWAY_URL,
      timeout: requestConfig.timeout,
      isJwt: requestConfig.isJwt,
      tokenStorage: requestConfig.tokenStorage,
      tokenKey: requestConfig.tokenKey,
      tokenPrefix: requestConfig.tokenPrefix,
      cryptoType: runtimeConfig.CRYPT_TYPE,
      ...config,
      crypto: hasCryptoOverride ? config.crypto : requestConfig.crypto,
    };

    super(baseConfig, use);
  }
}

export const baseApi = new BaseApi();
