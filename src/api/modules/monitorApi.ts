import type { MonitorTable } from "@/types/monitor";
import { type Rsp8, baseApi } from "../baseApi";

export function GetMonitorTable() {
  return baseApi.get<Rsp8<MonitorTable>>("/api/resource/screen/hb/panel2");
}
