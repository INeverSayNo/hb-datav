export interface OverviewMetric {
  value: string;
  label: string;
  tone: "cyan" | "blue" | "gold";
}

export interface ServiceMetric {
  value: string;
  unit: string;
  label: string;
}

export interface NodeMetric {
  value: string;
  label: string;
}

export interface YearSummary {
  year: string;
  volume: string;
  amount: string;
}

export interface RouteItem {
  province: string;
  text: string;
  tone: "blue" | "green" | "gold";
}

export const overviewMetrics: OverviewMetric[] = [
  { value: "56,589", label: "多式联运货运量", tone: "cyan" },
  { value: "56,589", label: "多式联运箱量", tone: "blue" },
  { value: "56,589", label: "多式联运重点线路", tone: "gold" },
];

export const monthlyFreight = [96, 132, 174, 82, 59, 63, 138, 81, 65, 61, 124, 58];

export const yearSummaries: YearSummary[] = ["2023", "2024", "2025"].map(
  (year) => ({ year, volume: "2546", amount: "2546" })
);

export const serviceMetrics: ServiceMetric[] = [
  { value: "56,589", unit: "家", label: "制造/商贸流通企业" },
  { value: "*****", unit: "家", label: "物流供应链企业" },
  { value: "*****", unit: "单", label: "运输需求数量" },
  { value: "56,589", unit: "单", label: "运单数量" },
  { value: "56,589", unit: "万元", label: "运费总额" },
  { value: "56,589", unit: "条", label: "精品线路" },
];

export const nodeMetrics: NodeMetric[] = [
  { value: "56,589", label: "物流/产业园区" },
  { value: "56,589", label: "铁路货运站点" },
  { value: "56,589", label: "水运货运港口" },
  { value: "56,589", label: "公路运力" },
  { value: "56,589", label: "铁路专用线" },
  { value: "56,589", label: "内河水运船舶" },
];

export const routes: RouteItem[] = [
  { province: "湖北", text: "黑龙江铁、海、江物流多式联运通道", tone: "blue" },
  { province: "湖北", text: "新疆江、铁物流多式联运通道", tone: "green" },
  { province: "湖北", text: "国际公、空物流快线通道", tone: "gold" },
];
