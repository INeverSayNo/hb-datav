import type { MonitorTable } from "@/types/monitor";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface MonitorData extends MonitorTable {
  loading: boolean; // 请求状态
  updateStore: (payload: Partial<MonitorTable>) => void;
}

export const useMonitorData = create<MonitorData>()(
  subscribeWithSelector((set) => ({
    summary: {
      wayBill: 0,
      shipper: 0,
      provider: 0,
    },
    shipperList: [],
    providerList: [],
    waybillList: [],
    nodeFlowList: [],
    requestEventList: [],
    transportCapacityList: [],
    exceptionWarningList: [],
    loading: false,
    updateStore: (payload) => set(payload),
  })),
);

