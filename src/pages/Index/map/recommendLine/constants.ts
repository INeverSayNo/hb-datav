import { MAP_DEPTH } from "../threeShared";

// 注：投影后整图宽度（原 GLOBAL_MAP_WIDTH = 27）现由 PROJECTION_SCALE 固化，
// 定义在 scripts/precompute-projection.mjs 中；改动那里后需重跑脚本。
export const TARGET_MAP_WIDTH = 27;
export const TARGET_MAP_HEIGHT = 17.5;
export const WORLD_TARGET_MAP_WIDTH = 30;
export const WORLD_TARGET_MAP_HEIGHT = 18;
export const MAP_STAGE_WIDTH = 2340;
export const MAP_STAGE_HEIGHT = 1570;
export const MAP_LAYOUT_MARGIN = 70;
export const MAP_COLLISION_GAP = 36;
export const DEFAULT_OUT_SIZE: [number, number] = [360, 300];
export const EXIT_DURATION = 180;
export const ENTER_DURATION = 240;
export const REDUCED_MOTION_DURATION = 80;

/** 修改中国地图颜色时只需调整这一处。 */
export const RECOMMEND_CHINA_THEME = {
  boundary: "#86f4ff",
  glow: "#20dbdb",
  glowOpacity: 0.24,
  sideBottom: "#031d38",
  sideScan: "#7ef7ff",
  sideTop: "#21bce0",
  top: "#168f9f",
} as const;

/**
 * 逐条线路配色：同一线路内按 segment 索引循环取色，
 * 使每条路径走向可用颜色区分。相邻色相差异大，深色地图背景上均清晰可辨。
 */
export const POI_SEGMENT_COLORS = [
  "#2f8cff", // 蓝
  "#ff6b6b", // 红
  "#2ecc71", // 绿
  "#ffce4d", // 黄
  "#c56cf0", // 紫
  "#ff8c42", // 橙
  "#1e90ff", // 亮蓝
  "#ff69b4", // 粉
  "#00e5a0", // 青绿
  "#ff3d81", // 玫红
  "#54a0ff", // 天蓝
  "#f5cd79", // 米黄
] as const;

/** 普通节点外环（蓝） */
export const POI_RING_NORMAL = "#2f8cff";
/** 中转节点外环（橙） */
export const POI_RING_TRANSIT = "#ff8c42";
/** 武汉节点外环（红） */
export const POI_RING_WUHAN = "#ff4d4f";
/** 节点白色内环 */
export const POI_INNER_WHITE = "#ffffff";
/** 路线虚线所在高度 */
export const POI_LINE_Z = MAP_DEPTH + 0.08;
/** 节点图标所在高度 */
export const POI_NODE_Z = MAP_DEPTH + 0.14;

/** 主虚线宽度（屏幕像素） */
export const POI_LINE_WIDTH = 4;
/** 半透明衬底宽度（屏幕像素），衬托主虚线更醒目 */
export const POI_LINE_BACK_WIDTH = 12;
/** 主虚线 dashSize / gapSize（世界单位，地图宽约 27 单位） */
export const POI_DASH_SIZE = 0.3;
export const POI_GAP_SIZE = 0.16;
/** 虚线每秒流动的距离（世界单位） */
export const POI_FLOW_SPEED = 0.22;
/** 每条路线飞线光点数量 */
export const FLY_DOT_COUNT = 2;
/** 飞线光点每秒沿曲线行进的弧长比例 */
export const FLY_SPEED = 0.14;
/** 飞机每秒沿整条航线前进的弧长比例。 */
export const AIR_PLANE_SPEED = 0.1;
/** 飞机在最终地图坐标中的显示尺寸，组件内会抵消线路布局缩放。 */
export const AIR_PLANE_SIZE = 0.82;
export const AIR_PLANE_Z = POI_LINE_Z + 0.15;
/** 单条路线曲线的最大采样点数，防止控制点变多时 Line2 顶点数失控。 */
export const MAX_CURVE_SAMPLES = 2048;
