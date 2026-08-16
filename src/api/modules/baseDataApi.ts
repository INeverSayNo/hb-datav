import { LBS_URL } from "@/axios-config/request";
import { BaseApi, type Rsp8, baseApi } from "../baseApi";
import type { WeatherInfo } from "@/types/weather";
import type { ScreenBaseData, XinJiangCoalRoutes } from "@/store/useScreenBaseData";

const lbsApi = new BaseApi({
  baseURL: LBS_URL,
});

export function GetWeather(district: string) {
  return lbsApi.get<Rsp8<WeatherInfo>>(
    "/api/lbs/location-geoserver/weather-now",
    {
      district,
    },
  );
}

export function GetScreenBaseData() {
  return baseApi.get<ScreenBaseData>("/api/resource/screen/hb/panel");
}

export function GetXinjiangCoalRoutes(params: {
  channelId: string,
  thinOut: boolean
}) {
  return baseApi.get<Rsp8<XinJiangCoalRoutes>>("/api/solution/premium-channels/channel-base/line-list", params);
}

