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
      "out-br": { positionPx: [520, 1270], sizePx: [480, 380] },
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
  },
  {
    label: "楚天翼连",
    map: ["china", "out-europe", "out-jp", "out-kz"],
    // MapStage 为 2340×1570。positionPx 表示地图中心，原点在左上角。
    // 中国主体右移，为左侧的哈萨克斯坦和欧洲国家预留空间。
    mainPlacement: { positionPx: [1720, 860], sizePx: [900, 1000] },
    outPlacements: {
      // 所有 out 均与中国上沿持平或低于中国，不再贴地图舞台顶部。
      // JP：中国右侧。
      "out-jp": { positionPx: [2190, 980], sizePx: [220, 360] },
      // KZ：中国左侧，与中国上部大致持平。
      "out-kz": { positionPx: [1130, 710], sizePx: [340, 220] },
      // 欧洲五国共用同一投影和变换，保持真实接壤关系；右缘距 KZ 约 50px。
      "out-europe": { positionPx: [500, 950], sizePx: [820, 600] },
    },
  },
  {
    label: "疆煤入鄂",
    map: ["china"],
  },
];

export const poiData = [
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
            value: [91, 21.1],
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
];

export type RecommendRoute = {
  label: string;
  mainPlacement?: MainMapPlacement;
  mapIds: readonly RecommendMapId[];
  mapKey: string;
  outPlacements?: Partial<Record<OutRecommendMapId, OutMapPlacement>>;
};

type PayloadRoute = {
  label: string;
  mainPlacement?: MainMapPlacement;
  map: string[];
  outPlacements?: Partial<Record<OutRecommendMapId, OutMapPlacement>>;
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
    return {
      label,
      mainPlacement: route.mainPlacement,
      mapIds,
      mapKey: JSON.stringify({
        mapIds: [...mapIds].sort(),
        mainPlacement: route.mainPlacement,
        outPlacements: route.outPlacements,
      }),
      outPlacements: route.outPlacements,
    };
  },
);

export const DEFAULT_RECOMMEND_ROUTE = RECOMMEND_ROUTES[0];

export function getRecommendRoute(label: string) {
  return RECOMMEND_ROUTES.find((route) => route.label === label);
}
