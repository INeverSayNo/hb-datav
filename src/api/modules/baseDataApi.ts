import { LBS_URL } from "@/axios-config/request";
import { BaseApi, type Rsp8, baseApi } from "../baseApi";
import type { WeatherInfo } from "@/types/weather";
import type { ScreenBaseData } from "@/store/useScreenBaseData";

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
