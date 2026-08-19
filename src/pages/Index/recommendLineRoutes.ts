import type { XinJiangCoalRoutes } from "@/store/useScreenBaseData";

export const ALL_RECOMMEND_PROVINCE_IDS = [
  "anhui",
  "beijing",
  "chongqing",
  "fujian",
  "gansu",
  "guangdong",
  "guangxi",
  "guizhou",
  // "hainan",
  "hebei",
  "heilongjiang",
  "henan",
  "hubei",
  "hunan",
  "jiangsu",
  "jiangxi",
  "jilin",
  "liaoning",
  "neimenggu",
  "ningxia",
  "qinghai",
  "shaanxi",
  "shandong",
  "shanghai",
  "shanxi",
  "sichuan",
  "tianjing",
  "xinjiang",
  "xizang",
  "yunnan",
  "zhejiang",
] as const;

export type ProvinceId = (typeof ALL_RECOMMEND_PROVINCE_IDS)[number];

export type OutRecommendMapId = `out-${string}`;

export type OutMapPlacement = {
  /**
   * 地图中心在 MapStage 2340×1570 设计坐标中的位置。
   * 原点位于左上角，x 向右、y 向下。
   */
  positionPx: [number, number];
  /**
   * 地图允许占用的最大宽高，渲染时保持 GeoJSON 原始比例，不会拉伸。
   */
  sizePx: [number, number];
};

export type MainMapPlacement = {
  /** 国内主体地图中心位置；不填时由 out 占位情况自动计算。 */
  positionPx?: [number, number];
  /** 国内主体地图最大占用宽高；不填时自动使用无碰撞区域。 */
  sizePx?: [number, number];
};

export type MapVisualAdjustment = {
  /** 相对共享投影尺寸的倍率，围绕该地图自身中心缩放。 */
  scale?: number;
  /** 在 MapStage 设计像素中的视觉偏移，[向右, 向下]。 */
  offsetPx?: [number, number];
};

export type RecommendMapId = ProvinceId | "china" | OutRecommendMapId;

export const mapRelation = [
  {
    label: "北粮南运",
    map: [
      "sichuan",
      "chongqing",
      "hunan",
      "jiangxi",
      "zhejiang",
      "shanghai",
      "anhui",
      "hubei",
      "henan",
      "jiangsu",
      "shandong",
      "hebei",
      "tianjing",
      "beijing",
      "liaoning",
    ],
    camera: {
      position: [0, 33, 15],
      fov: 26,
      target: [0, 0, 0],
      minDistance: 12,
      maxDistance: 60,
      minPolarAngle: 0.25,
      maxPolarAngle: 1.2,
      minAzimuthAngle: -0.8,
      maxAzimuthAngle: 0.8,
    },
  },
  {
    label: "赶肉下江",
    map: [
      "sichuan",
      "chongqing",
      "hunan",
      "jiangxi",
      "zhejiang",
      "shanghai",
      "anhui",
      "hubei",
      "henan",
      "jiangsu",
      "shandong",
      "shaanxi",
      "shanxi",
      "guizhou",
      "guangxi",
      "guangdong",
      "fujian",
      "out-br",
    ],
    out: ["out-br"],
    outPlacements: {
      "out-br": { positionPx: [320, 1270], sizePx: [480, 380] },
    },
  },
  {
    label: "棉纺丝路",
    map: [
      "sichuan",
      "chongqing",
      "hunan",
      "jiangxi",
      "zhejiang",
      "anhui",
      "hubei",
      "henan",
      "jiangsu",
      "shandong",
      "shaanxi",
      "shanxi",
      "guizhou",
      "guangxi",
      "guangdong",
      "fujian",
      "xinjiang",
      "xizang",
      "qinghai",
      "gansu",
      "ningxia",
    ],
     camera: {
      position: [0, 32, 18],
      fov: 25,
      target: [0, 0, 0],
      minDistance: 12,
      maxDistance: 60,
      minPolarAngle: 0.25,
      maxPolarAngle: 1.2,
      minAzimuthAngle: -0.8,
      maxAzimuthAngle: 0.8,
    },
  },
  {
    label: "楚天翼连",
    map: ["china", "out-europe", "out-jp", "out-kz"],
    // 亚洲组共享投影和变换，保持 China、KZ、JP 的真实地理关系。
    mainGroup: ["china", "out-jp", "out-kz"],
    // MapStage 为 2340×1570。positionPx 表示地图中心，原点在左上角。
    // 中国主体右移，为左侧的哈萨克斯坦和欧洲国家预留空间。
    mainPlacement: { positionPx: [1020, 820], sizePx: [2220, 460] },
    visualAdjustments: {
      china: { scale: 1.28, offsetPx: [20, 60] },
      "out-kz": { scale: 0.62, offsetPx: [-90, 20] },
      "out-jp": { scale: 0.62, offsetPx: [100, 30] },
    },
    outPlacements: {
      // 欧洲五国作为第二个布局组，与亚洲组分离。
      "out-europe": { positionPx: [200, 750], sizePx: [480, 310] },
    },
  },
  {
    label: "疆煤入鄂",
    map: [
      "xinjiang",
      "qinghai",
      "gansu",
      "sichuan",
      "chongqing",
      "shaanxi",
      "hubei",
      "hunan",
      "anhui",
      "jiangxi",
    ],
    camera: {
      position: [0, 30, 18],
      fov: 28,
      target: [0, 0, 0],
      minDistance: 12,
      maxDistance: 60,
      minPolarAngle: 0.25,
      maxPolarAngle: 1.2,
      minAzimuthAngle: -0.8,
      maxAzimuthAngle: 0.8,
    },
  },
];

export type RecommendPoiType = "waterway" | "highway" | "railway" | "airway";

export type RecommendPoiPoint = {
  /** 是否为航线中转节点。 */
  isTransit?: boolean;
  name: string;
  /** 经纬度 [lng, lat] */
  value: [number, number];
};

export type RecommendPoiSegment = {
  routes: RecommendPoiPoint[];
  type: RecommendPoiType;
};

export type RecommendPoiEntry = {
  key: string;
  poiInfo: RecommendPoiSegment[];
};

export type CameraPreset = {
  position: [number, number, number];
  fov: number;
  target?: [number, number, number];
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  minAzimuthAngle?: number;
  maxAzimuthAngle?: number;
};

export const poiData: RecommendPoiEntry[] = [
  {
    key: "楚天翼连",
    poiInfo: [
      {
        routes: [
          {
            name: "花湖机场",
            value: [115.06, 30.36],
          },
          {
            name: "",
            value: [125.47, 39.88],
          },
          {
            name: "成田国际机场",
            value: [140.39, 35.77],
          },
        ],
        type: "airway",
      },

      {
        routes: [
          {
            name: "花湖机场",
            value: [115.06, 30.36],
          },
          {
            name: "",
            value: [100.53, 42.12],
          },
          {
            name: "图尔克斯坦机场",
            value: [68.27, 43.3],
          },
        ],
        type: "airway",
      },

      {
        routes: [
          {
            name: "花湖机场",
            value: [115.06, 30.36],
          },
          {
            name: "",
            value: [79.61, 48.62],
          },
          {
            isTransit: true,
            name: "米兰国际机场",
            value: [8.7281, 45.6306],
          },
        ],
        type: "airway",
      },
      {
        routes: [
          {
            name: "德国仓",
            value: [13.405, 52.52],
          },
          {
            isTransit: true,
            name: "米兰国际机场",
            value: [8.7281, 45.6306],
          },
        ],
        type: "airway",
      },
      {
        routes: [
          {
            name: "波兰仓",
            value: [21.0122, 52.2297],
          },
          {
            isTransit: true,
            name: "米兰国际机场",
            value: [8.7281, 45.6306],
          },
        ],
        type: "airway",
      },
      {
        routes: [
          {
            name: "西班牙仓",
            value: [-4.0249, 39.8577],
          },
          {
            isTransit: true,
            name: "米兰国际机场",
            value: [8.7281, 45.6306],
          },
        ],
        type: "airway",
      },
      {
        routes: [
          {
            name: "法国仓",
            value: [2.2, 46.2],
          },
          {
            isTransit: true,
            name: "米兰国际机场",
            value: [8.7281, 45.6306],
          },
        ],
        type: "airway",
      },
    ],
  },
  {
    key: "北粮南运",
    poiInfo: [
      {
        routes: [
          {
            name: "营口",
            value: [122.462106, 40.676166],
          },
          {
            name: "大连",
            value: [122, 39.6627],
          },
          {
            name: "",
            value: [120.4, 38.97],
          },
          {
            name: "",
            value: [123.65, 37.93],
          },
          {
            name: "太仓",
            value: [121.41, 31.4],
          },
        ],
        type: "waterway",
      },
      {
        routes: [
          {
            name: "太仓",
            value: [121.41, 31.4],
          },
          {
            name: "南通",
            value: [120.8646, 32.0162],
          },
          {
            name: "江阴",
            value: [120.36, 32.01],
          },
          {
            name: "靖江",
            value: [120.2745, 32.0143],
          },
          {
            name: "南京",
            value: [118.78, 32.06],
          },
          {
            name: "芜湖",
            value: [118.01, 31.33],
          },
          {
            name: "九江",
            value: [115.99, 29.71],
          },
          {
            name: "武汉",
            value: [114.31, 30.57],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "武汉",
            value: [114.31, 30.57],
          },
          {
            name: "吉安",
            value: [115.99, 29.71],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "武汉",
            value: [114.31, 30.57],
          },
          {
            name: "益阳",
            value: [111.991301, 28.986784],
          },
          {
            name: "湘潭",
            value: [113.03, 27.92],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "武汉",
            value: [114.31, 30.57],
          },
          {
            name: "重庆",
            value: [106.65, 29.57],
          },
          {
            name: "成都",
            value: [104.3179, 30.8347],
          },
        ],
        type: "highway",
      },
    ],
  },
  {
    key: "赶肉下江",
    poiInfo: [
      {
        routes: [
          {
            name: "巴西",
            value: [-54.07, -8.2],
          },
          {
            name: "",
            value: [106.11, 19.67],
          },
          {
            name: "",
            value: [111.35, 20.35],
          },
          {
            name: "",
            value: [115.5, 21.0],
          },
          {
            name: "",
            value: [119.28, 24.07],
          },
          {
            name: "",
            value: [123.4, 29.4],
          },
          {
            name: "",
            value: [123.48, 30.85],
          },
          {
            name: "太仓",
            value: [121.41, 31.4],
          },
        ],
        type: "waterway",
      },
      {
        routes: [
          {
            name: "太仓",
            value: [121.41, 31.4],
          },
          {
            name: "江阴",
            value: [120.36, 32.01],
          },
          {
            name: "南京",
            value: [118.78, 32.06],
          },
          {
            name: "芜湖",
            value: [118.01, 31.33],
          },
          {
            name: "九江",
            value: [115.99, 29.71],
          },
          {
            name: "武汉",
            value: [114.31, 30.57],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "武汉",
            value: [114.31, 30.57],
          },
          {
            name: "郑州",
            value: [113.6254, 34.7466],
          },
        ],
        type: "highway",
      },

      {
        routes: [
          {
            name: "武汉",
            value: [114.31, 30.57],
          },
          {
            name: "长沙",
            value: [112.9388, 28.2282],
          },
        ],
        type: "highway",
      },

      {
        routes: [
          {
            name: "武汉",
            value: [114.31, 30.57],
          },
          {
            name: "南昌",
            value: [115.8582, 28.6829],
          },
        ],
        type: "highway",
      },

      {
        routes: [
          {
            name: "武汉",
            value: [114.31, 30.57],
          },
          {
            name: "西安",
            value: [108.9398, 34.3416],
          },
        ],
        type: "highway",
      },

      {
        routes: [
          {
            name: "武汉",
            value: [114.31, 30.57],
          },
          {
            name: "成都",
            value: [104.07, 30.67],
          },
        ],
        type: "highway",
      },
    ],
  },
  {
    key: "棉纺丝路",
    poiInfo: [
      {
        routes: [
          {
            name: "新疆",
            value: [86.1459, 41.764],
          },
          {
            name: "",
            value: [102.29,33.37],
          },
          {
            name: "荆州",
            value: [112.2397, 30.3352],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "新疆",
            value: [86.1459, 41.764],
          },
          {
            name: "",
            value: [103.31,36.86],
          },
          {
            name: "安阳",
            value: [114.3924, 36.0977],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "新疆",
            value: [86.1459, 41.764],
          },
          {
            name: "南通",
            value: [120.8646, 32.0162],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "新疆",
            value: [86.1459, 41.764],
          },
          {
            name: "",
            value: [102.78,37.98],
          },
           {
            name: "",
            value: [104.16,37.28],
          },
          {
            name: "",
            value: [106.09,37.52],
          },
          {
            name: "",
            value: [114.21,37.40],
          },
          {
            name: "青岛",
            value: [120.3826, 36.0671],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "新疆",
            value: [86.1459, 41.764],
          },
          {
            name: "绍兴",
            value: [120.92, 29.82],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "新疆",
            value: [86.1459, 41.764],
          },
          {
            name: "杭州",
            value: [119.82, 31],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "新疆",
            value: [86.1459, 41.764],
          },
          {
            name: "芜湖",
            value: [117.68, 32.12],
          },
        ],
        type: "highway",
      },
      {
        routes: [
          {
            name: "新疆",
            value: [86.1459, 41.764],
          },
          {
            name: "",
            value: [97.54,36.72],
          },
          {
            name: "",
            value: [105.27,31.61],
          },
          {
            name: "",
            value: [108.12,30.45],
          },
          {
            name: "",
            value: [111.48,27.95],
          },
          {
            name: "佛山",
            value: [113.1227, 23.0288],
          },
        ],
        type: "highway",
      },
    ],
  },
];

/**
 * 疆煤入鄂 segment：额外携带所属 line 的索引，渲染时用于按 line 统一配色。
 */
export type XinjiangCoalPoiSegment = RecommendPoiSegment & {
  lineIndex: number;
};

/**
 * 将接口返回的疆煤入鄂线路数据重组为与 poiData 同构的结构。
 * 每条 line 下的每条 path 生成一个 segment：
 *   origin（带名称） → geom 途经点（name 置空，不渲染节点） → dest（带名称）
 * transportType 映射未知，统一按 highway 渲染。
 */
export function buildXinjiangCoalPoiEntry(
  data: XinJiangCoalRoutes | null | undefined,
): { key: string; poiInfo: XinjiangCoalPoiSegment[] } | null {
  if (!data || !Array.isArray(data.lines)) return null;

  const poiInfo: XinjiangCoalPoiSegment[] = [];
  data.lines.forEach((line, lineIndex) => {
    if (!Array.isArray(line.paths)) return;
    line.paths.forEach((path) => {
      const routes: RecommendPoiPoint[] = [
        {
          name: path.origin,
          value: [path.originGeom.lng, path.originGeom.lat],
        },
      ];
      if (Array.isArray(path.geom)) {
        path.geom.forEach(([lng, lat]) => {
          routes.push({ name: "", value: [lng, lat] });
        });
      }
      routes.push({
        name: path.dest,
        value: [path.destGeom.lng, path.destGeom.lat],
      });
      poiInfo.push({ routes, type: "highway", lineIndex });
    });
  });

  if (poiInfo.length === 0) return null;
  return { key: "疆煤入鄂", poiInfo };
}

export type RecommendRoute = {
 label: string;
  mainMapIds?: readonly RecommendMapId[];
  mainPlacement?: MainMapPlacement;
  mapIds: readonly RecommendMapId[];
  mapKey: string;
  outPlacements?: Partial<Record<OutRecommendMapId, OutMapPlacement>>;
  visualAdjustments?: Partial<Record<RecommendMapId, MapVisualAdjustment>>;
  camera?: CameraPreset;
};

type PayloadRoute = {
  label: string;
  mainGroup?: string[];
  mainPlacement?: MainMapPlacement;
  map: string[];
  outPlacements?: Partial<Record<OutRecommendMapId, OutMapPlacement>>;
  visualAdjustments?: Partial<Record<RecommendMapId, MapVisualAdjustment>>;
  camera?: CameraPreset;
};

const ROUTE_BUTTON_ORDER = [
  "北粮南运",
  "赶肉下江",
  "楚天翼连",
  "棉纺丝路",
  "疆煤入鄂",
] as const;

const provinceIdSet = new Set<string>(ALL_RECOMMEND_PROVINCE_IDS);
const rawRoutes = mapRelation as PayloadRoute[];

function isRecommendMapId(id: string): id is RecommendMapId {
  return provinceIdSet.has(id) || id === "china" || id.startsWith("out-");
}

function resolveMapIds(route: PayloadRoute): readonly RecommendMapId[] {
  const invalidIds = route.map.filter((id) => !isRecommendMapId(id));
  if (invalidIds.length > 0) {
    throw new Error(
      `线路“${route.label}”包含未知省份：${invalidIds.join(", ")}`,
    );
  }

  return [...new Set(route.map)] as RecommendMapId[];
}

function resolveMainMapIds(
  route: PayloadRoute,
  mapIds: readonly RecommendMapId[],
) {
  if (!route.mainGroup) return undefined;

  const invalidIds = route.mainGroup.filter(
    (id) => !isRecommendMapId(id) || !mapIds.includes(id as RecommendMapId),
  );
  if (invalidIds.length > 0) {
    throw new Error(
      `线路“${route.label}”的 mainGroup 包含未挂载地图：${invalidIds.join(", ")}`,
    );
  }
  return [...new Set(route.mainGroup)] as RecommendMapId[];
}

const payloadRouteByLabel = new Map(
  rawRoutes.map((route) => [route.label, route] as const),
);

const orderedLabels = [
  ...ROUTE_BUTTON_ORDER,
  ...rawRoutes
    .map(({ label }) => label)
    .filter(
      (label) =>
        !ROUTE_BUTTON_ORDER.includes(
          label as (typeof ROUTE_BUTTON_ORDER)[number],
        ),
    ),
];

export const RECOMMEND_ROUTES: readonly RecommendRoute[] = orderedLabels.map(
  (label) => {
    const route = payloadRouteByLabel.get(label);
    if (!route) {
      throw new Error(`payload.json 缺少线路配置：${label}`);
    }

    const mapIds = resolveMapIds(route);
    const mainMapIds = resolveMainMapIds(route, mapIds);
    return {
      label,
      mainMapIds,
      mainPlacement: route.mainPlacement,
      mapIds,
      mapKey: JSON.stringify({
        mapIds: [...mapIds].sort(),
        mainMapIds,
        mainPlacement: route.mainPlacement,
        outPlacements: route.outPlacements,
        visualAdjustments: route.visualAdjustments,
      }),
      outPlacements: route.outPlacements,
      visualAdjustments: route.visualAdjustments,
      camera: route.camera,
    };
  },
);

export const DEFAULT_RECOMMEND_ROUTE = RECOMMEND_ROUTES[0];

export function getRecommendRoute(label: string) {
  return RECOMMEND_ROUTES.find((route) => route.label === label);
}
