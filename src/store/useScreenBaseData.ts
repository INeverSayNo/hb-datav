import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface ScreenBaseData {
  leftTopPanel: {
    freightVolume: number;
    containerCount: number;
    lineCount: number;
  };
  leftMiddlePanel: {
    summary: { sum: number; yoyRate: number };
    items: { month: string; teu: number }[];
  };
  leftBottomPanel: {
    type: number;
    items: { year: string; teu: number; price: number }[];
  }[];
  rightTopPanel: {
    distributionCount: number;
    supplyCount: number;
    requestCount: number;
    waybillCount: number;
    freightVolume: number;
    lineCount: number;
  };
  rightMiddlePanel: {
    parkCount: number;
    stationCount: number;
    portCount: number;
    transportCapacity: number;
    privateLine: number;
    shipCount: number;
  };
  rightBottomPanel: { text1: string; text2: string }[];
}

interface ScreenBaseDataStore extends ScreenBaseData {
  loading: boolean;            // 请求状态
  updateStore: (payload: Partial<ScreenBaseData>) => void;
}

export const useScreenBaseDataStore = create<ScreenBaseDataStore>()(
  subscribeWithSelector((set, _, store) => ({
    leftTopPanel: {
      freightVolume: 0,
      containerCount: 0,
      lineCount: 0,
    },
    leftMiddlePanel: {
      summary: { sum: 0, yoyRate: 0 },
      items: [],
    },
    leftBottomPanel: [],
    rightTopPanel: {
      distributionCount: 0,
      supplyCount: 0,
      requestCount: 0,
      waybillCount: 0,
      freightVolume: 0,
      lineCount: 0,
    },
    rightMiddlePanel: {
      parkCount: 0,
      stationCount: 0,
      portCount: 0,
      transportCapacity: 0,
      privateLine: 0,
      shipCount: 0,
    },
    rightBottomPanel: [],
    loading: false,
    updateStore: (payload) => set(payload),
  })),
);
