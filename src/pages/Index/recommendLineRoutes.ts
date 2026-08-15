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
    map: ["china", "out-it", "out-jp", "out-kz", "out-de", "out-fr"],
  },
  {
    label: "疆煤入鄂",
    map: ["china"],
  },
];

export const brMeatToChinaLIne = {
  赶肉下江: [
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
};

export const NorthToSouth = {
  "北粮南运 ": [
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
};

export type RecommendRoute = {
  label: string;
  mapKey: string;
  provinceIds: readonly ProvinceId[];
};

type PayloadRoute = {
  label: string;
  map: string[];
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

function resolveProvinceIds(route: PayloadRoute): readonly ProvinceId[] {
  if (route.map.length === 1 && route.map[0] === "all") {
    return ALL_RECOMMEND_PROVINCE_IDS;
  }

  if (route.map.includes("all")) {
    throw new Error(`线路“${route.label}”的 all 不能与其他省份同时配置`);
  }

  const invalidIds = route.map.filter((id) => !provinceIdSet.has(id));
  if (invalidIds.length > 0) {
    throw new Error(
      `线路“${route.label}”包含未知省份：${invalidIds.join(", ")}`,
    );
  }

  return [...new Set(route.map)] as ProvinceId[];
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

    const provinceIds = resolveProvinceIds(route);
    return {
      label,
      mapKey:
        provinceIds === ALL_RECOMMEND_PROVINCE_IDS
          ? "all"
          : [...provinceIds].sort().join("|"),
      provinceIds,
    };
  },
);

export const DEFAULT_RECOMMEND_ROUTE = RECOMMEND_ROUTES[0];

export function getRecommendRoute(label: string) {
  return RECOMMEND_ROUTES.find((route) => route.label === label);
}
