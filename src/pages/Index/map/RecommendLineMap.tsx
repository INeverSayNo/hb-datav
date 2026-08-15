import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Html, Line, OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { geoMercator } from "d3-geo";
import styled from "styled-components";
import {
  AdditiveBlending,
  Box2,
  CatmullRomCurve3,
  LineCurve3,
  Path,
  Shape,
  ShapeUtils,
  SRGBColorSpace,
  TextureLoader,
  type Group,
  type PerspectiveCamera,
  type Sprite as ThreeSprite,
  type Texture,
  Vector2,
  Vector3,
  type ShaderMaterial as ThreeShaderMaterial,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

import ShaanxiData from "@/assets/recommendLine/Shaanxi.json";
import anhuiData from "@/assets/recommendLine/anhui.json";
import beijingData from "@/assets/recommendLine/beijing.json";
import chongqingData from "@/assets/recommendLine/chongqing.json";
import chinaData from "@/assets/recommendLine/china.json";
import fujianData from "@/assets/recommendLine/fujian.json";
import gansuData from "@/assets/recommendLine/gansu.json";
import guangdongData from "@/assets/recommendLine/guangdong.json";
import guangxiData from "@/assets/recommendLine/guangxi.json";
import guizhouData from "@/assets/recommendLine/guizhou.json";
// import hainanData from "@/assets/recommendLine/hainan.json";
import hebeiData from "@/assets/recommendLine/hebei.json";
import heilongjiangData from "@/assets/recommendLine/heilongjiang.json";
import henanData from "@/assets/recommendLine/henan.json";
import hubeiData from "@/assets/recommendLine/hubei.json";
import hunanData from "@/assets/recommendLine/hunan.json";
import jiangsuData from "@/assets/recommendLine/jiangsu.json";
import jiangxiData from "@/assets/recommendLine/jiangxi.json";
import jilinData from "@/assets/recommendLine/jilin.json";
import liaoningData from "@/assets/recommendLine/liaoning.json";
import neimengguData from "@/assets/recommendLine/neimenggu.json";
import ningxiaData from "@/assets/recommendLine/ningxia.json";
import qinghaiData from "@/assets/recommendLine/qinghai.json";
import shandongData from "@/assets/recommendLine/shandong.json";
// import sanshaData from "@/assets/recommendLine/sansha.json";
import shanghaiData from "@/assets/recommendLine/shanghai.json";
import shanxiData from "@/assets/recommendLine/shanxi.json";
import sichuanData from "@/assets/recommendLine/sichuan.json";
import tianjingData from "@/assets/recommendLine/tianjing.json";
import xinjiangData from "@/assets/recommendLine/xinjiang.json";
import xizangData from "@/assets/recommendLine/xizang.json";
import yunnanData from "@/assets/recommendLine/yunnan.json";
import zhejiangData from "@/assets/recommendLine/zhejiang.json";

import ShaanxiTexture from "@/assets/recommendLine/Shaanxi.png";
import anhuiTexture from "@/assets/recommendLine/anhui.png";
import beijingTexture from "@/assets/recommendLine/beijing.png";
import chongqingTexture from "@/assets/recommendLine/chongqing.png";
import fujianTexture from "@/assets/recommendLine/fujian.png";
import gansuTexture from "@/assets/recommendLine/gansu.png";
import guangdongTexture from "@/assets/recommendLine/guangdong.png";
import guangxiTexture from "@/assets/recommendLine/guangxi.png";
import guizhouTexture from "@/assets/recommendLine/guizhou.png";
// import hainanTexture from "@/assets/recommendLine/hainan.png";
import hebeiTexture from "@/assets/recommendLine/hebei.png";
import heilongjiangTexture from "@/assets/recommendLine/heilongjiang.png";
import henanTexture from "@/assets/recommendLine/henan.png";
import hubeiTexture from "@/assets/recommendLine/hubei.png";
import hunanTexture from "@/assets/recommendLine/hunan.png";
import jiangsuTexture from "@/assets/recommendLine/jiangsu.png";
import jiangxiTexture from "@/assets/recommendLine/jiangxi.png";
import jilinTexture from "@/assets/recommendLine/jilin.png";
import liaoningTexture from "@/assets/recommendLine/liaoning.png";
import neimengguTexture from "@/assets/recommendLine/neimenggu.png";
import ningxiaTexture from "@/assets/recommendLine/ningxia.png";
import qinghaiTexture from "@/assets/recommendLine/qinghai.png";
import shandongTexture from "@/assets/recommendLine/shandong.png";
import shanghaiTexture from "@/assets/recommendLine/shanghai.png";
import shanxiTexture from "@/assets/recommendLine/shanxi.png";
import sichuanTexture from "@/assets/recommendLine/sichuan.png";
import tianjingTexture from "@/assets/recommendLine/tianjing.png";
import xinjiangTexture from "@/assets/recommendLine/xinjiang.png";
import xizangTexture from "@/assets/recommendLine/xizang.png";
import yunnanTexture from "@/assets/recommendLine/yunnan.png";
import zhejiangTexture from "@/assets/recommendLine/zhejiang.png";
import airPlaneIcon from "@/assets/air-plan.png";

import {
  ALL_RECOMMEND_PROVINCE_IDS,
  poiData,
  type OutMapPlacement,
  type OutRecommendMapId,
  type ProvinceId,
  type RecommendMapId,
  type RecommendPoiSegment,
  type RecommendRoute,
} from "../recommendLineRoutes";
import ShapeBox from "./shape";
import {
  MAP_DEPTH,
  MapLabel,
  MapRoot,
  SceneReady,
  TerrainSideMaterial,
  TerrainTopMaterial,
  useControlSpeed,
} from "./threeShared";

type Coordinate = [number, number];
type PolygonCoordinates = Coordinate[][];

type AdministrativeGeometry =
  | { type: "Polygon"; coordinates: PolygonCoordinates }
  | { type: "MultiPolygon"; coordinates: PolygonCoordinates[] };

type AdministrativeProperties = {
  name: string;
  center?: Coordinate;
  centroid?: Coordinate;
};

type AdministrativeFeature = {
  type: "Feature";
  properties: AdministrativeProperties;
  geometry: AdministrativeGeometry;
};

type AdministrativeGeoJSON = {
  type: "FeatureCollection";
  features: AdministrativeFeature[];
};

type MapRegionId = RecommendMapId | "sansha";

type MapRegionSource = {
  id: MapRegionId;
  data: AdministrativeGeoJSON;
  kind?: "china" | "out" | "province" | "sansha";
  label?: string;
  texture?: string;
};

type ProjectedMapRegion = MapRegionSource & {
  bbox: Box2;
  shapes: Shape[];
  boundarySegments: [number, number, number][];
  labels: Array<{
    position: [number, number, number];
    text: string;
  }>;
  transform?: {
    position: [number, number, 0];
    scale: number;
  };
};

type ProjectedRouteLayout = {
  boundarySegments: [number, number, number][];
  chinaBoundarySegments: [number, number, number][];
  center: Vector2;
  fitScale: number;
  mapKey: string;
  regions: ProjectedMapRegion[];
  viewMode: "regional" | "world";
};

type PreparedRoute = {
  layout: ProjectedRouteLayout;
  textures: ReadonlyMap<RecommendMapId, Texture>;
};

type MapTransitionPhase = "hidden" | "entering" | "visible" | "exiting";

const GLOBAL_MAP_WIDTH = 27;
const TARGET_MAP_WIDTH = 27;
const TARGET_MAP_HEIGHT = 17.5;
const WORLD_TARGET_MAP_WIDTH = 30;
const WORLD_TARGET_MAP_HEIGHT = 18;
const MAP_STAGE_WIDTH = 2340;
const MAP_STAGE_HEIGHT = 1570;
const MAP_LAYOUT_MARGIN = 70;
const MAP_COLLISION_GAP = 36;
const DEFAULT_OUT_SIZE: [number, number] = [360, 300];
const EXIT_DURATION = 180;
const ENTER_DURATION = 240;
const REDUCED_MOTION_DURATION = 80;

function asAdministrativeData(data: unknown): AdministrativeGeoJSON {
  const geoData = data as AdministrativeGeoJSON | AdministrativeFeature;
  return geoData.type === "FeatureCollection"
    ? geoData
    : { type: "FeatureCollection", features: [geoData] };
}

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

/** 路线类型 → 虚线颜色（waterway 绿 / highway 蓝 / railway 红） */
const ROUTE_TYPE_COLORS: Record<RecommendPoiSegment["type"], string> = {
  waterway: "#2ecc71",
  highway: "#2f8cff",
  railway: "#ff4d4f",
  airway: "#258bd6",
};

/** 普通节点外环（蓝） */
const POI_RING_NORMAL = "#2f8cff";
/** 武汉节点外环（红） */
const POI_RING_WUHAN = "#ff4d4f";
/** 节点白色内环 */
const POI_INNER_WHITE = "#ffffff";
/** 路线虚线所在高度 */
const POI_LINE_Z = MAP_DEPTH + 0.08;
/** 节点图标所在高度 */
const POI_NODE_Z = MAP_DEPTH + 0.14;

/** 主虚线宽度（屏幕像素） */
const POI_LINE_WIDTH = 4;
/** 半透明衬底宽度（屏幕像素），衬托主虚线更醒目 */
const POI_LINE_BACK_WIDTH = 12;
/** 主虚线 dashSize / gapSize（世界单位，地图宽约 27 单位） */
const POI_DASH_SIZE = 0.3;
const POI_GAP_SIZE = 0.16;
/** 虚线每秒流动的距离（世界单位） */
const POI_FLOW_SPEED = 0.22;
/** 每条路线飞线光点数量 */
const FLY_DOT_COUNT = 2;
/** 飞线光点每秒沿曲线行进的弧长比例 */
const FLY_SPEED = 0.14;
/** 飞机每秒沿整条航线前进的弧长比例。 */
const AIR_PLANE_SPEED = 0.1;
/** 飞机在最终地图坐标中的显示尺寸，组件内会抵消线路布局缩放。 */
const AIR_PLANE_SIZE = 0.82;
const AIR_PLANE_Z = POI_LINE_Z + 0.15;

const provinceSourceById: Record<ProvinceId, MapRegionSource> = {
  anhui: {
    id: "anhui",
    data: asAdministrativeData(anhuiData),
    kind: "province",
    texture: anhuiTexture,
  },
  beijing: {
    id: "beijing",
    data: asAdministrativeData(beijingData),
    kind: "province",
    texture: beijingTexture,
  },
  chongqing: {
    id: "chongqing",
    data: asAdministrativeData(chongqingData),
    texture: chongqingTexture,
  },
  fujian: {
    id: "fujian",
    data: asAdministrativeData(fujianData),
    texture: fujianTexture,
  },
  gansu: {
    id: "gansu",
    data: asAdministrativeData(gansuData),
    texture: gansuTexture,
  },
  guangdong: {
    id: "guangdong",
    data: asAdministrativeData(guangdongData),
    texture: guangdongTexture,
  },
  guangxi: {
    id: "guangxi",
    data: asAdministrativeData(guangxiData),
    texture: guangxiTexture,
  },
  guizhou: {
    id: "guizhou",
    data: asAdministrativeData(guizhouData),
    texture: guizhouTexture,
  },
  // hainan: { id: "hainan", data: asAdministrativeData(hainanData), texture: hainanTexture },
  hebei: {
    id: "hebei",
    data: asAdministrativeData(hebeiData),
    texture: hebeiTexture,
  },
  heilongjiang: {
    id: "heilongjiang",
    data: asAdministrativeData(heilongjiangData),
    texture: heilongjiangTexture,
  },
  henan: {
    id: "henan",
    data: asAdministrativeData(henanData),
    texture: henanTexture,
  },
  hubei: {
    id: "hubei",
    data: asAdministrativeData(hubeiData),
    texture: hubeiTexture,
  },
  hunan: {
    id: "hunan",
    data: asAdministrativeData(hunanData),
    texture: hunanTexture,
  },
  jiangsu: {
    id: "jiangsu",
    data: asAdministrativeData(jiangsuData),
    texture: jiangsuTexture,
  },
  jiangxi: {
    id: "jiangxi",
    data: asAdministrativeData(jiangxiData),
    texture: jiangxiTexture,
  },
  jilin: {
    id: "jilin",
    data: asAdministrativeData(jilinData),
    texture: jilinTexture,
  },
  liaoning: {
    id: "liaoning",
    data: asAdministrativeData(liaoningData),
    texture: liaoningTexture,
  },
  neimenggu: {
    id: "neimenggu",
    data: asAdministrativeData(neimengguData),
    texture: neimengguTexture,
  },
  ningxia: {
    id: "ningxia",
    data: asAdministrativeData(ningxiaData),
    texture: ningxiaTexture,
  },
  qinghai: {
    id: "qinghai",
    data: asAdministrativeData(qinghaiData),
    texture: qinghaiTexture,
  },
  shaanxi: {
    id: "shaanxi",
    data: asAdministrativeData(ShaanxiData),
    texture: ShaanxiTexture,
  },
  shandong: {
    id: "shandong",
    data: asAdministrativeData(shandongData),
    texture: shandongTexture,
  },
  shanghai: {
    id: "shanghai",
    data: asAdministrativeData(shanghaiData),
    texture: shanghaiTexture,
  },
  shanxi: {
    id: "shanxi",
    data: asAdministrativeData(shanxiData),
    texture: shanxiTexture,
  },
  sichuan: {
    id: "sichuan",
    data: asAdministrativeData(sichuanData),
    texture: sichuanTexture,
  },
  tianjing: {
    id: "tianjing",
    data: asAdministrativeData(tianjingData),
    texture: tianjingTexture,
  },
  xinjiang: {
    id: "xinjiang",
    data: asAdministrativeData(xinjiangData),
    texture: xinjiangTexture,
  },
  xizang: {
    id: "xizang",
    data: asAdministrativeData(xizangData),
    texture: xizangTexture,
  },
  yunnan: {
    id: "yunnan",
    data: asAdministrativeData(yunnanData),
    texture: yunnanTexture,
  },
  zhejiang: {
    id: "zhejiang",
    data: asAdministrativeData(zhejiangData),
    texture: zhejiangTexture,
  },
};

const provinceSources = ALL_RECOMMEND_PROVINCE_IDS.map(
  (id) => provinceSourceById[id],
);
const externalMapDataByPath = import.meta.glob<AdministrativeGeoJSON>(
  [
    "/src/assets/recommendLine/out-*.json",
    "!/src/assets/recommendLine/out-de.json",
    "!/src/assets/recommendLine/out-es.json",
    "!/src/assets/recommendLine/out-fr.json",
    "!/src/assets/recommendLine/out-it.json",
    "!/src/assets/recommendLine/out-pl.json",
  ],
  { eager: true, import: "default" },
);
const externalMapSourceById = Object.fromEntries(
  Object.entries(externalMapDataByPath).map(([path, data]) => {
    const filename = path.split("/").at(-1);
    const id = filename?.replace(/\.json$/, "") as OutRecommendMapId;
    return [id, { id, data: asAdministrativeData(data), kind: "out" }] as const;
  }),
) as Record<OutRecommendMapId, MapRegionSource>;
const mapRegionSourceById: Partial<Record<MapRegionId, MapRegionSource>> = {
  ...provinceSourceById,
  china: {
    id: "china",
    data: asAdministrativeData(chinaData),
    kind: "china",
    label: "中国",
  },
  // sansha: {
  //   id: "sansha",
  //   data: asAdministrativeData(sanshaData),
  //   kind: "sansha",
  //   label: "三沙市",
  // },
  ...externalMapSourceById,
};

function getMapRegionSource(id: MapRegionId) {
  const source = mapRegionSourceById[id];
  if (!source) {
    throw new Error(`未找到地图资源：assets/recommendLine/${id}.json`);
  }
  return source;
}
const projectedMapRegionCache = new Map<MapRegionId, ProjectedMapRegion>();
const routeLayoutCache = new Map<string, ProjectedRouteLayout>();
const textureCache = new Map<RecommendMapId, Texture>();
const texturePromiseCache = new Map<RecommendMapId, Promise<Texture>>();
const preparedRoutePromiseCache = new Map<string, Promise<PreparedRoute>>();
const textureLoader = new TextureLoader();
let projectionCache: ReturnType<typeof geoMercator> | undefined;

const MapCanvasLayer = styled.div<{
  $duration: number;
  $phase: MapTransitionPhase;
}>`
  width: 100%;
  height: 100%;
  opacity: ${({ $phase }) =>
    $phase === "visible" || $phase === "entering" ? 1 : 0};
  transform: ${({ $phase }) =>
    $phase === "hidden" || $phase === "exiting" ? "scale(0.985)" : "scale(1)"};
  transform-origin: 50% 52%;
  pointer-events: ${({ $phase }) => ($phase === "visible" ? "auto" : "none")};
  transition:
    opacity ${({ $duration }) => $duration}ms cubic-bezier(0.22, 1, 0.36, 1),
    transform ${({ $duration }) => $duration}ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;

  @media (prefers-reduced-motion: reduce) {
    transform: none;
  }
`;

/** 节点 + 标签的定位容器（中心对齐到 position）。 */
const PoiMarkerWrap = styled.div`
  position: relative;
  width: 0;
  height: 0;
  pointer-events: none;
`;

/** 节点图标：外环 3px（蓝/红）+ 白色内环 6px（约为外环 2 倍）。 */
const PoiNode = styled.div<{ $isWuhan?: boolean }>`
  position: absolute;
  left: -13px;
  top: -13px;
  width: 26px;
  height: 26px;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid
      ${({ $isWuhan }) => ($isWuhan ? POI_RING_WUHAN : POI_RING_NORMAL)};
    box-shadow: 0 0 10px
      ${({ $isWuhan }) =>
        $isWuhan ? "rgba(255, 77, 79, 0.7)" : "rgba(47, 140, 255, 0.7)"};
  }

  &::after {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    border: 6px solid ${POI_INNER_WHITE};
  }
`;

/** 节点名称：白底黑字。 */
const PoiLabel = styled.span<{ $isAirRoute?: boolean }>`
  position: absolute;
  left: 50%;
  top: 17px;
  transform: translateX(-50%);
  background: #ffffff;
  color: #000000;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  font-size: ${({ $isAirRoute }) => ($isAirRoute ? 16 : 38)}px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  padding: ${({ $isAirRoute }) => ($isAirRoute ? "5px 7px" : "10px 12px")};
  border-radius: ${({ $isAirRoute }) => ($isAirRoute ? 5 : 10)}px;
`;

function getPolygons(geometry: AdministrativeGeometry): PolygonCoordinates[] {
  return geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.coordinates;
}

function forEachCoordinate(
  data: AdministrativeGeoJSON,
  callback: (coordinate: Coordinate) => void,
) {
  data.features.forEach((feature) => {
    getPolygons(feature.geometry).forEach((polygon) => {
      polygon.forEach((ring) => ring.forEach(callback));
    });
  });
}

function getProjection() {
  if (projectionCache) return projectionCache;

  const geographicBounds = new Box2();
  provinceSources.forEach(({ data }) => {
    forEachCoordinate(data, ([longitude, latitude]) => {
      geographicBounds.expandByPoint(new Vector2(longitude, latitude));
    });
  });

  const geographicCenter = geographicBounds.getCenter(new Vector2());
  const projection = geoMercator()
    .center([geographicCenter.x, geographicCenter.y])
    .translate([0, 0]);
  const projectedBounds = new Box2();

  provinceSources.forEach(({ data }) => {
    forEachCoordinate(data, (coordinate) => {
      const [x, y] = projection(coordinate)!;
      projectedBounds.expandByPoint(new Vector2(x, -y));
    });
  });

  projection.scale(
    projection.scale() *
      (GLOBAL_MAP_WIDTH / projectedBounds.getSize(new Vector2()).x),
  );
  projectionCache = projection;
  return projection;
}

function buildMapRegion(source: MapRegionSource): ProjectedMapRegion {
  const projection = getProjection();
  const bbox = new Box2();
  const labelDataByName = new Map<
    string,
    { bounds: Box2; preferredPosition?: Vector2 }
  >();

  const shapes: Shape[] = [];
  source.data.features.forEach((feature) => {
    const featureBounds = new Box2();
    const project = (coordinate: Coordinate) => {
      const [x, y] = projection(coordinate)!;
      const point = new Vector2(x, -y);
      bbox.expandByPoint(point);
      featureBounds.expandByPoint(point);
      return point;
    };
    getPolygons(feature.geometry).forEach((polygon) => {
      const rings = polygon.map((ring) => ring.map(project));
      const outer = rings[0];
      if (!outer || outer.length < 3) return;
      if (!ShapeUtils.isClockWise(outer)) outer.reverse();

      const shape = new Shape(outer);
      rings.slice(1).forEach((ring) => {
        if (ring.length < 3) return;
        if (ShapeUtils.isClockWise(ring)) ring.reverse();
        shape.holes.push(new Path(ring));
      });
      shapes.push(shape);
    });

    const featureName = feature.properties.name || source.id;
    const labelData = labelDataByName.get(featureName) ?? {
      bounds: new Box2(),
    };
    labelData.bounds.union(featureBounds);
    const labelCoordinate =
      feature.properties.centroid ?? feature.properties.center;
    if (!labelData.preferredPosition && labelCoordinate) {
      const [x, y] = projection(labelCoordinate)!;
      labelData.preferredPosition = new Vector2(x, -y);
    }
    labelDataByName.set(featureName, labelData);
  });

  const boundarySegments: [number, number, number][] = [];
  shapes.forEach((shape) => {
    [shape.getPoints(), ...shape.holes.map((hole) => hole.getPoints())]
      .filter((ring) => ring.length > 1)
      .forEach((ring) => {
        const closedRing = [...ring, ring[0]];
        for (let index = 1; index < closedRing.length; index += 1) {
          const previous = closedRing[index - 1];
          const current = closedRing[index];
          boundarySegments.push(
            [previous.x, previous.y, MAP_DEPTH + 0.018],
            [current.x, current.y, MAP_DEPTH + 0.018],
          );
        }
      });
  });

  const labels = source.label
    ? [
        {
          position: [
            bbox.getCenter(new Vector2()).x,
            bbox.getCenter(new Vector2()).y,
            MAP_DEPTH + 0.12,
          ] as [number, number, number],
          text: source.label,
        },
      ]
    : Array.from(labelDataByName, ([text, labelData]) => {
        const labelPoint =
          labelData.preferredPosition ??
          labelData.bounds.getCenter(new Vector2());
        return {
          position: [labelPoint.x, labelPoint.y, MAP_DEPTH + 0.12] as [
            number,
            number,
            number,
          ],
          text,
        };
      });

  return {
    ...source,
    bbox,
    shapes,
    boundarySegments,
    labels,
  };
}

function getProjectedMapRegion(id: MapRegionId) {
  const cached = projectedMapRegionCache.get(id);
  if (cached) return cached;

  const projected = buildMapRegion(getMapRegionSource(id));
  projectedMapRegionCache.set(id, projected);
  return projected;
}

type PixelRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

function clampRect(rect: PixelRect): PixelRect {
  return {
    ...rect,
    x: Math.min(
      MAP_STAGE_WIDTH - MAP_LAYOUT_MARGIN - rect.width,
      Math.max(MAP_LAYOUT_MARGIN, rect.x),
    ),
    y: Math.min(
      MAP_STAGE_HEIGHT - MAP_LAYOUT_MARGIN - rect.height,
      Math.max(MAP_LAYOUT_MARGIN, rect.y),
    ),
  };
}

function rectanglesOverlap(a: PixelRect, b: PixelRect, gap = 0) {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

function defaultOutPlacement(index: number, count: number): OutMapPlacement {
  const columns = count <= 2 ? 1 : 2;
  const rows = Math.ceil(count / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  const columnWidth = 390;
  const usableHeight = MAP_STAGE_HEIGHT - MAP_LAYOUT_MARGIN * 2;

  return {
    positionPx: [
      MAP_STAGE_WIDTH - 260 - (columns - 1 - column) * columnWidth,
      MAP_LAYOUT_MARGIN + ((row + 0.5) * usableHeight) / rows,
    ],
    sizePx: DEFAULT_OUT_SIZE,
  };
}

function fitPlacementRect(
  region: ProjectedMapRegion,
  placement: OutMapPlacement,
): PixelRect {
  const size = region.bbox.getSize(new Vector2());
  const pixelScale = Math.min(
    placement.sizePx[0] / Math.max(size.x, 0.001),
    placement.sizePx[1] / Math.max(size.y, 0.001),
  );
  const width = size.x * pixelScale;
  const height = size.y * pixelScale;
  return clampRect({
    height,
    width,
    x: placement.positionPx[0] - width / 2,
    y: placement.positionPx[1] - height / 2,
  });
}

function avoidOutCollisions(rect: PixelRect, occupied: PixelRect[]) {
  if (
    !occupied.some((other) => rectanglesOverlap(rect, other, MAP_COLLISION_GAP))
  ) {
    return rect;
  }

  const originalCenter = new Vector2(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
  );
  for (let radius = 40; radius <= MAP_STAGE_WIDTH; radius += 40) {
    for (let step = 0; step < 16; step += 1) {
      const angle = (step / 16) * Math.PI * 2;
      const candidate = clampRect({
        ...rect,
        x: originalCenter.x + Math.cos(angle) * radius - rect.width / 2,
        y: originalCenter.y + Math.sin(angle) * radius - rect.height / 2,
      });
      if (
        !occupied.some((other) =>
          rectanglesOverlap(candidate, other, MAP_COLLISION_GAP),
        )
      ) {
        return candidate;
      }
    }
  }

  return rect;
}

function getAutomaticMainRect(outRects: PixelRect[]): PixelRect {
  const fullRect: PixelRect = {
    x: MAP_LAYOUT_MARGIN,
    y: MAP_LAYOUT_MARGIN,
    width: MAP_STAGE_WIDTH - MAP_LAYOUT_MARGIN * 2,
    height: MAP_STAGE_HEIGHT - MAP_LAYOUT_MARGIN * 2,
  };
  if (outRects.length === 0) return fullRect;

  const minLeft = Math.min(...outRects.map(({ x }) => x));
  const maxRight = Math.max(...outRects.map(({ x, width }) => x + width));
  const minTop = Math.min(...outRects.map(({ y }) => y));
  const maxBottom = Math.max(...outRects.map(({ y, height }) => y + height));
  const candidates: PixelRect[] = [
    { ...fullRect, width: minLeft - MAP_COLLISION_GAP - fullRect.x },
    {
      ...fullRect,
      x: maxRight + MAP_COLLISION_GAP,
      width: fullRect.x + fullRect.width - maxRight - MAP_COLLISION_GAP,
    },
    { ...fullRect, height: minTop - MAP_COLLISION_GAP - fullRect.y },
    {
      ...fullRect,
      y: maxBottom + MAP_COLLISION_GAP,
      height: fullRect.y + fullRect.height - maxBottom - MAP_COLLISION_GAP,
    },
  ];

  return (
    candidates
      .filter(({ width, height }) => width >= 520 && height >= 420)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0] ?? fullRect
  );
}

function getRouteLayout(route: RecommendRoute): ProjectedRouteLayout {
  const cached = routeLayoutCache.get(route.mapKey);
  if (cached) return cached;

  const regions = route.mapIds.map(getProjectedMapRegion);
  const viewMode = route.mapIds.some((id) => id.startsWith("out-"))
    ? "world"
    : "regional";

  // mainGroup 中的地图共享主体投影和变换；未配置时保持“国内主体 + 独立 out”的默认行为。
  const mainMapIdSet = route.mainMapIds
    ? new Set<MapRegionId>(route.mainMapIds)
    : undefined;
  const mainRegions = regions.filter(
    (region) => region.kind !== "out" || mainMapIdSet?.has(region.id) === true,
  );
  const outRegions = regions.filter((region) => !mainRegions.includes(region));
  const baseRegions = mainRegions.length > 0 ? mainRegions : regions;

  const occupiedOutRects: PixelRect[] = [];
  const outRectById = new Map<MapRegionId, PixelRect>();
  outRegions.forEach((region, index) => {
    const placement =
      route.outPlacements?.[region.id as OutRecommendMapId] ??
      defaultOutPlacement(index, outRegions.length);
    const rect = avoidOutCollisions(
      fitPlacementRect(region, placement),
      occupiedOutRects,
    );
    occupiedOutRects.push(rect);
    outRectById.set(region.id, rect);
  });

  const bounds = new Box2();
  baseRegions.forEach(({ bbox }) => bounds.union(bbox));
  const size = bounds.getSize(new Vector2());
  const automaticMainRect = getAutomaticMainRect(occupiedOutRects);
  const requestedMainRect = route.mainPlacement
    ? clampRect({
        width: route.mainPlacement.sizePx?.[0] ?? automaticMainRect.width,
        height: route.mainPlacement.sizePx?.[1] ?? automaticMainRect.height,
        x:
          (route.mainPlacement.positionPx?.[0] ??
            automaticMainRect.x + automaticMainRect.width / 2) -
          (route.mainPlacement.sizePx?.[0] ?? automaticMainRect.width) / 2,
        y:
          (route.mainPlacement.positionPx?.[1] ??
            automaticMainRect.y + automaticMainRect.height / 2) -
          (route.mainPlacement.sizePx?.[1] ?? automaticMainRect.height) / 2,
      })
    : automaticMainRect;
  const mainRect = occupiedOutRects.some((outRect) =>
    rectanglesOverlap(requestedMainRect, outRect, MAP_COLLISION_GAP),
  )
    ? automaticMainRect
    : requestedMainRect;
  const targetWidth =
    viewMode === "world" ? WORLD_TARGET_MAP_WIDTH : TARGET_MAP_WIDTH;
  const targetHeight =
    viewMode === "world" ? WORLD_TARGET_MAP_HEIGHT : TARGET_MAP_HEIGHT;
  const fitScale = Math.min(
    ((mainRect.width / MAP_STAGE_WIDTH) * targetWidth) /
      Math.max(size.x, 0.001),
    ((mainRect.height / MAP_STAGE_HEIGHT) * targetHeight) /
      Math.max(size.y, 0.001),
  );
  const mainPixelCenter = new Vector2(
    mainRect.x + mainRect.width / 2,
    mainRect.y + mainRect.height / 2,
  );
  const mainWorldCenter = new Vector2(
    (mainPixelCenter.x / MAP_STAGE_WIDTH - 0.5) * targetWidth,
    (0.5 - mainPixelCenter.y / MAP_STAGE_HEIGHT) * targetHeight,
  );
  const center = bounds
    .getCenter(new Vector2())
    .sub(mainWorldCenter.clone().divideScalar(fitScale));

  const transformById = new Map<
    MapRegionId,
    NonNullable<ProjectedMapRegion["transform"]>
  >();
  outRegions.forEach((region) => {
    const rect = outRectById.get(region.id)!;
    const outSize = region.bbox.getSize(new Vector2());
    const desiredWorldWidth = (rect.width / MAP_STAGE_WIDTH) * targetWidth;
    const desiredWorldHeight = (rect.height / MAP_STAGE_HEIGHT) * targetHeight;
    const localScale =
      Math.min(
        desiredWorldWidth / Math.max(outSize.x, 0.001),
        desiredWorldHeight / Math.max(outSize.y, 0.001),
      ) / fitScale;
    const pixelCenter = new Vector2(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    );
    const desiredWorldCenter = new Vector2(
      (pixelCenter.x / MAP_STAGE_WIDTH - 0.5) * targetWidth,
      (0.5 - pixelCenter.y / MAP_STAGE_HEIGHT) * targetHeight,
    );
    const rawCenter = region.bbox.getCenter(new Vector2());
    transformById.set(region.id, {
      position: [
        center.x + desiredWorldCenter.x / fitScale - rawCenter.x * localScale,
        center.y + desiredWorldCenter.y / fitScale - rawCenter.y * localScale,
        0,
      ],
      scale: localScale,
    });
  });

  mainRegions.forEach((region) => {
    if (region.id === "sansha") return;
    const adjustment = route.visualAdjustments?.[region.id];
    if (!adjustment) return;

    const visualScale = adjustment.scale ?? 1;
    const offsetPx = adjustment.offsetPx ?? [0, 0];
    const localOffset = new Vector2(
      ((offsetPx[0] / MAP_STAGE_WIDTH) * targetWidth) / fitScale,
      (-(offsetPx[1] / MAP_STAGE_HEIGHT) * targetHeight) / fitScale,
    );
    const rawCenter = region.bbox.getCenter(new Vector2());
    transformById.set(region.id, {
      position: [
        rawCenter.x * (1 - visualScale) + localOffset.x,
        rawCenter.y * (1 - visualScale) + localOffset.y,
        0,
      ],
      scale: visualScale,
    });
  });

  // 边界线段：out 区域按同样变换烘焙坐标，与网格组的 transform 保持一致
  const boundarySegments: [number, number, number][] = [];
  const chinaBoundarySegments: [number, number, number][] = [];
  regions.forEach((region) => {
    const transform = transformById.get(region.id);
    region.boundarySegments.forEach(([x, y, z]) => {
      const target =
        region.kind === "china" || region.kind === "sansha"
          ? chinaBoundarySegments
          : boundarySegments;
      if (!transform) {
        target.push([x, y, z]);
        return;
      }
      target.push([
        x * transform.scale + transform.position[0],
        y * transform.scale + transform.position[1],
        z * transform.scale,
      ]);
    });
  });

  const layout: ProjectedRouteLayout = {
    boundarySegments,
    chinaBoundarySegments,
    center,
    fitScale,
    mapKey: route.mapKey,
    regions: regions.map((region) => ({
      ...region,
      transform: transformById.get(region.id),
    })),
    viewMode,
  };
  routeLayoutCache.set(route.mapKey, layout);
  return layout;
}

/**
 * 将经纬度烘焙到中心组（position=[-center.x, -center.y]）局部坐标。
 * 优先选择包含该点的最小 bbox region 并应用其 transform，与 boundarySegments 的烘焙方式一致。
 */
function bakePoiPoint(
  layout: ProjectedRouteLayout,
  lng: number,
  lat: number,
): [number, number] {
  const projection = getProjection();
  const [x, y] = projection([lng, lat])!;
  const point = new Vector2(x, -y);

  let bestRegion: ProjectedMapRegion | undefined;
  let bestArea = Infinity;
  layout.regions.forEach((region) => {
    if (!region.bbox.containsPoint(point)) return;
    const size = region.bbox.getSize(new Vector2());
    const area = size.x * size.y;
    if (area < bestArea) {
      bestArea = area;
      bestRegion = region;
    }
  });

  const transform = bestRegion?.transform;
  if (!transform) return [point.x, point.y];
  return [
    point.x * transform.scale + transform.position[0],
    point.y * transform.scale + transform.position[1],
  ];
}

function loadMapRegionTexture(id: RecommendMapId) {
  const cachedTexture = textureCache.get(id);
  if (cachedTexture) return Promise.resolve(cachedTexture);

  const cachedPromise = texturePromiseCache.get(id);
  if (cachedPromise) return cachedPromise;

  const textureUrl = getMapRegionSource(id).texture;
  if (!textureUrl) {
    return Promise.reject(new Error(`地图资源“${id}”没有纹理`));
  }

  const texturePromise = textureLoader
    .loadAsync(textureUrl)
    .then((texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
      textureCache.set(id, texture);
      return texture;
    })
    .catch((error: unknown) => {
      texturePromiseCache.delete(id);
      throw error;
    });
  texturePromiseCache.set(id, texturePromise);
  return texturePromise;
}

function prepareRoute(route: RecommendRoute) {
  const cached = preparedRoutePromiseCache.get(route.mapKey);
  if (cached) return cached;

  const layout = getRouteLayout(route);
  const texturedMapIds = route.mapIds.filter(
    (id) => getMapRegionSource(id).texture,
  );
  const preparedPromise = Promise.all(
    texturedMapIds.map(
      async (id) => [id, await loadMapRegionTexture(id)] as const,
    ),
  )
    .then(
      (textures): PreparedRoute => ({
        layout,
        textures: new Map(textures),
      }),
    )
    .catch((error: unknown) => {
      preparedRoutePromiseCache.delete(route.mapKey);
      throw error;
    });
  preparedRoutePromiseCache.set(route.mapKey, preparedPromise);
  return preparedPromise;
}

function getMotionDurations() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  return reduceMotion
    ? { enter: REDUCED_MOTION_DURATION, exit: REDUCED_MOTION_DURATION }
    : { enter: ENTER_DURATION, exit: EXIT_DURATION };
}

function MapRegionMesh({
  labelDistanceFactor,
  region,
  showLabel,
  texture,
}: {
  labelDistanceFactor: number;
  region: ProjectedMapRegion;
  showLabel: boolean;
  texture?: Texture;
}) {
  const sideMaterialRef = useRef<ThreeShaderMaterial>(null!);

  useLayoutEffect(() => {
    if (!texture) return;
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((_, delta) => {
    if (sideMaterialRef.current) {
      sideMaterialRef.current.uniforms.uTime.value += delta;
    }
  });

  const usesChinaTheme = region.kind === "china" || region.kind === "sansha";

  return (
    <group>
      <ShapeBox
        bbox={region.bbox}
        args={[
          region.shapes,
          { depth: MAP_DEPTH, bevelEnabled: false, curveSegments: 2 },
        ]}
      >
        {texture ? (
          <TerrainTopMaterial attach="material-0" uMap={texture} />
        ) : (
          <meshBasicMaterial
            attach="material-0"
            color={usesChinaTheme ? RECOMMEND_CHINA_THEME.top : "#19799b"}
            transparent
            opacity={0.9}
            toneMapped={false}
          />
        )}
        <TerrainSideMaterial
          attach="material-1"
          ref={sideMaterialRef}
          transparent
          uBottom={
            usesChinaTheme ? RECOMMEND_CHINA_THEME.sideBottom : undefined
          }
          uScan={usesChinaTheme ? RECOMMEND_CHINA_THEME.sideScan : undefined}
          uTop={usesChinaTheme ? RECOMMEND_CHINA_THEME.sideTop : undefined}
        />
      </ShapeBox>

      {showLabel &&
        region.labels.map(({ position, text }) => (
          <Html
            center
            key={text}
            position={position}
            distanceFactor={labelDistanceFactor}
            zIndexRange={[20, 0]}
          >
            <MapLabel>{text}</MapLabel>
          </Html>
        ))}
    </group>
  );
}

/**
 * 单段路线：Catmull-Rom 平滑转角 + 加粗虚线（Line2/LineMaterial）+ 虚线流动 + 飞线光点。
 */
function RouteSegment({
  color,
  planeSize,
  points,
  showFlyDots,
  showPlane,
}: {
  color: string;
  planeSize: number;
  points: [number, number][];
  showFlyDots: boolean;
  showPlane: boolean;
}) {
  const { size, viewport } = useThree();
  const planeTexture = useTexture(airPlaneIcon);
  const planeRef = useRef<ThreeSprite>(null);
  const planeStartTimeRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    planeTexture.colorSpace = SRGBColorSpace;
    planeTexture.anisotropy = 8;
    planeTexture.needsUpdate = true;
  }, [planeTexture]);

  useEffect(() => {
    planeStartTimeRef.current = null;
  }, [points, showPlane]);

  const { curve, backLine, mainLine } = useMemo(() => {
    if (points.length < 2) {
      return { curve: null, backLine: null, mainLine: null };
    }

    const pts = points.map(([x, y]) => new Vector3(x, y, POI_LINE_Z));
    const curve =
      pts.length === 2
        ? new LineCurve3(pts[0], pts[1])
        : new CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    const sampled = curve.getPoints(Math.max(96, pts.length * 48));

    const buildLine = (opts: {
      dashed: boolean;
      linewidth: number;
      opacity: number;
      renderOrder: number;
    }) => {
      const geometry = new LineGeometry();
      geometry.setPositions(sampled.flatMap((p) => [p.x, p.y, p.z]));
      const material = new LineMaterial({
        color,
        linewidth: opts.linewidth,
        worldUnits: false,
        toneMapped: false,
        transparent: true,
        opacity: opts.opacity,
        depthWrite: false,
        dashed: opts.dashed,
        dashSize: POI_DASH_SIZE,
        gapSize: POI_GAP_SIZE,
      });
      const line = new Line2(geometry, material);
      line.renderOrder = opts.renderOrder;
      line.raycast = () => {};
      return line;
    };

    const backLine = buildLine({
      dashed: false,
      linewidth: POI_LINE_BACK_WIDTH,
      opacity: 0.16,
      renderOrder: 5,
    });
    const mainLine = buildLine({
      dashed: true,
      linewidth: POI_LINE_WIDTH,
      opacity: 0.95,
      renderOrder: 6,
    });

    return { curve, backLine, mainLine };
  }, [color, points]);

  // 像素线宽依赖渲染缓冲尺寸，与视口同步
  useLayoutEffect(() => {
    if (!backLine || !mainLine) return;
    const width = size.width * viewport.dpr;
    const height = size.height * viewport.dpr;
    backLine.material.resolution.set(width, height);
    mainLine.material.resolution.set(width, height);
  }, [backLine, mainLine, size, viewport.dpr]);

  useEffect(
    () => () => {
      backLine?.geometry.dispose();
      backLine?.material.dispose();
      mainLine?.geometry.dispose();
      mainLine?.material.dispose();
    },
    [backLine, mainLine],
  );

  const flyDotRefs = useRef<(Group | null)[]>([]);

  useFrame((state, delta) => {
    if (!curve || !mainLine) return;
    // 虚线沿路径流动
    mainLine.material.dashOffset -= delta * POI_FLOW_SPEED;

    // 飞线光点沿曲线前进
    if (showFlyDots) {
      const t = (state.clock.elapsedTime * FLY_SPEED) % 1;
      flyDotRefs.current.forEach((dot, index) => {
        if (!dot) return;
        const distance = (t + index / FLY_DOT_COUNT) % 1;
        const p = curve.getPointAt(distance);
        dot.position.set(p.x, p.y, POI_LINE_Z + 0.07);
      });
    }

    if (showPlane && planeRef.current) {
      planeStartTimeRef.current ??= state.clock.elapsedTime;
      const planeElapsed =
        state.clock.elapsedTime - planeStartTimeRef.current;
      const planeProgress =
        (planeElapsed * AIR_PLANE_SPEED) % 1;
      const position = curve.getPointAt(planeProgress);
      const tangent = curve.getTangentAt(planeProgress);
      planeRef.current.position.set(position.x, position.y, AIR_PLANE_Z);

      // 原图机头朝上（+Y），因此相对曲线切线角度减去 90°。
      planeRef.current.material.rotation =
        Math.atan2(tangent.y, tangent.x) - Math.PI / 2;
    }
  });

  if (!curve || !backLine || !mainLine) return null;

  return (
    <group>
      <primitive object={backLine} />
      <primitive object={mainLine} />
      {showPlane && (
        <sprite
          ref={planeRef}
          position={[points[0][0], points[0][1], AIR_PLANE_Z]}
          scale={[planeSize, planeSize, 1]}
          renderOrder={12}
        >
          <spriteMaterial
            map={planeTexture}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      )}
      {showFlyDots && Array.from({ length: FLY_DOT_COUNT }, (_, index) => (
        <group
          key={index}
          ref={(el) => {
            flyDotRefs.current[index] = el;
          }}
        >
          {/* 白色核心 */}
          <mesh>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          {/* 彩色光晕 */}
          <mesh>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.4}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** 精品线路 POI 层：按类型画虚线路线，并在有名称的途经点渲染节点图标与标签。 */
function RoutePoiLayer({
  layout,
  route,
}: {
  layout: ProjectedRouteLayout;
  route: RecommendRoute;
}) {
  const isAirRoute = route.label === "楚天翼连";
  const segments = useMemo(() => {
    const poi = poiData.find((entry) => entry.key === route.label);
    if (!poi) return [];

    return poi.poiInfo.map((segment) => {
      const points = segment.routes.map((point) => ({
        name: point.name,
        position: bakePoiPoint(layout, point.value[0], point.value[1]),
      }));
      return {
        type: segment.type,
        points,
        positions: points.map((point) => point.position),
      };
    });
  }, [layout, route.label]);

  return (
    <>
      {segments.map((segment, segmentIndex) => {
        if (segment.points.length < 2) return null;

        return (
          <group key={segmentIndex}>
            <RouteSegment
              color={ROUTE_TYPE_COLORS[segment.type]}
              planeSize={AIR_PLANE_SIZE / layout.fitScale}
              points={segment.positions}
              showFlyDots={segment.type !== "airway"}
              showPlane={isAirRoute && segment.type === "airway"}
            />

            {segment.points.map((point, pointIndex) => {
              if (!point.name) return null; // name 为空不显示节点图标
              const [x, y] = point.position;
              return (
                <Html
                  key={`${point.name}-${pointIndex}`}
                  center
                  position={[x, y, POI_NODE_Z]}
                  distanceFactor={22 / layout.fitScale}
                  zIndexRange={[30, 0]}
                >
                  <PoiMarkerWrap>
                    <PoiNode $isWuhan={point.name === "武汉"} />
                    <PoiLabel $isAirRoute={isAirRoute}>
                      {point.name}
                    </PoiLabel>
                  </PoiMarkerWrap>
                </Html>
              );
            })}
          </group>
        );
      })}
    </>
  );
}

function RecommendLineScene({
  onReady,
  prepared,
  route,
}: {
  onReady: () => void;
  prepared: PreparedRoute;
  route: RecommendRoute;
}) {
  const { layout, textures } = prepared;
  const labelDistanceFactor = 22 / layout.fitScale;

  return (
    <group scale={layout.fitScale}>
      <group position={[-layout.center.x, -layout.center.y, 0]}>
        {layout.regions.map((region) => (
          <group
            key={region.id}
            position={region.transform?.position ?? [0, 0, 0]}
            scale={region.transform?.scale ?? 1}
          >
            <MapRegionMesh
              labelDistanceFactor={labelDistanceFactor}
              region={region}
              showLabel={
                layout.viewMode !== "world" ||
                region.kind === "china" ||
                region.kind === "sansha"
              }
              texture={
                region.id === "sansha" ? undefined : textures.get(region.id)
              }
            />
          </group>
        ))}
        {layout.boundarySegments.length > 0 && (
          <Line
            points={layout.boundarySegments}
            segments
            lineWidth={0.75}
            color="#8fe9ff"
            transparent
            opacity={0.52}
            depthWrite={false}
            toneMapped={false}
            renderOrder={9}
            raycast={() => null}
          />
        )}
        {layout.chinaBoundarySegments.length > 0 && (
          <group>
            <Line
              points={layout.chinaBoundarySegments}
              segments
              lineWidth={5}
              color={RECOMMEND_CHINA_THEME.glow}
              transparent
              opacity={RECOMMEND_CHINA_THEME.glowOpacity}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
              renderOrder={8}
              raycast={() => null}
            />
            <Line
              points={layout.chinaBoundarySegments}
              segments
              lineWidth={0.9}
              color={RECOMMEND_CHINA_THEME.boundary}
              transparent
              opacity={0.82}
              depthWrite={false}
              toneMapped={false}
              renderOrder={9}
              raycast={() => null}
            />
          </group>
        )}
        <RoutePoiLayer layout={layout} route={route} />
        <SceneReady key={layout.mapKey} onReady={onReady} />
      </group>
    </group>
  );
}

export type RecommendLineMapProps = {
  onReady?: () => void;
  onRouteTransitionEnd?: (route: RecommendRoute) => void;
  onRouteTransitionError?: (route: RecommendRoute) => void;
  route: RecommendRoute;
};

function RecommendLineMap({
  onReady,
  onRouteTransitionEnd,
  onRouteTransitionError,
  route,
}: RecommendLineMapProps) {
  const controlSpeed = useControlSpeed();
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const [prepared, setPrepared] = useState<PreparedRoute | null>(null);
  const preparedRef = useRef<PreparedRoute | null>(null);
  const [phase, setPhaseState] = useState<MapTransitionPhase>("hidden");
  const phaseRef = useRef<MapTransitionPhase>("hidden");
  const [transitionDuration, setTransitionDuration] = useState(ENTER_DURATION);
  const requestIdRef = useRef(0);
  const transitionTimerRef = useRef<number | null>(null);
  const transitionTargetRef = useRef<RecommendRoute | null>(null);
  const hasSignalledInitialReadyRef = useRef(false);

  const setPhase = useCallback((nextPhase: MapTransitionPhase) => {
    phaseRef.current = nextPhase;
    setPhaseState(nextPhase);
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const applyCameraLayout = useCallback((layout: ProjectedRouteLayout) => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (layout.viewMode === "world") {
      camera.position.set(0, 31, 9);
      camera.fov = 32;
    } else {
      camera.position.set(0, 31, 25.5);
      camera.fov = 28.5;
    }
    camera.up.set(0, 1, 0);
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
      controls.saveState();
    } else {
      camera.lookAt(0, 0, 0);
    }
  }, []);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      clearTransitionTimer();
    },
    [clearTransitionTimer],
  );

  useEffect(() => {
    if (preparedRef.current?.layout.mapKey === route.mapKey) return;

    const requestId = ++requestIdRef.current;
    void prepareRoute(route)
      .then((nextPrepared) => {
        if (requestId !== requestIdRef.current) return;

        if (!preparedRef.current) {
          applyCameraLayout(nextPrepared.layout);
          preparedRef.current = nextPrepared;
          setPrepared(nextPrepared);
          setPhase("hidden");
          return;
        }

        transitionTargetRef.current = route;
        const durations = getMotionDurations();
        setTransitionDuration(durations.exit);
        setPhase("exiting");
        clearTransitionTimer();
        transitionTimerRef.current = window.setTimeout(() => {
          if (requestId !== requestIdRef.current) return;
          applyCameraLayout(nextPrepared.layout);
          preparedRef.current = nextPrepared;
          setPrepared(nextPrepared);
          setPhase("hidden");
          transitionTimerRef.current = null;
        }, durations.exit);
      })
      .catch((error: unknown) => {
        if (requestId !== requestIdRef.current) return;
        console.error(`精品线路“${route.label}”地图加载失败`, error);
        transitionTargetRef.current = null;
        onRouteTransitionError?.(route);
      });
  }, [
    applyCameraLayout,
    clearTransitionTimer,
    onRouteTransitionError,
    route,
    setPhase,
  ]);

  const handleSceneReady = useCallback(() => {
    if (phaseRef.current !== "hidden") return;

    const durations = getMotionDurations();
    setTransitionDuration(durations.enter);
    setPhase("entering");

    if (!hasSignalledInitialReadyRef.current) {
      hasSignalledInitialReadyRef.current = true;
      onReady?.();
    }

    const completedRoute = transitionTargetRef.current;
    clearTransitionTimer();
    transitionTimerRef.current = window.setTimeout(() => {
      setPhase("visible");
      transitionTimerRef.current = null;
      if (completedRoute) {
        transitionTargetRef.current = null;
        onRouteTransitionEnd?.(completedRoute);
      }
    }, durations.enter);
  }, [clearTransitionTimer, onReady, onRouteTransitionEnd, setPhase]);

  return (
    <MapRoot role="img" aria-label="精品线路覆盖省份三维地形地图">
      <MapCanvasLayer
        $duration={transitionDuration}
        $phase={phase}
        aria-busy={phase !== "visible"}
      >
        <Canvas
          dpr={[1, 1.5]}
          resize={{ offsetSize: true }}
          gl={{ alpha: true, antialias: true }}
          camera={{
            fov: 28.5,
            near: 0.1,
            far: 360,
            position: [0, 31, 25.5],
          }}
          onCreated={({ camera }) => {
            cameraRef.current = camera as PerspectiveCamera;
          }}
        >
          <Suspense fallback={null}>
            {prepared && (
              <group rotation={[-Math.PI / 2, 0, 0]}>
                <RecommendLineScene
                  prepared={prepared}
                  onReady={handleSceneReady}
                  route={route}
                />
              </group>
            )}
          </Suspense>
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={controlSpeed}
            panSpeed={controlSpeed}
            zoomSpeed={0.9}
            minDistance={prepared?.layout.viewMode === "world" ? 20 : 14}
            maxDistance={prepared?.layout.viewMode === "world" ? 100 : 70}
            minPolarAngle={prepared?.layout.viewMode === "world" ? 0.08 : 0.3}
            maxPolarAngle={prepared?.layout.viewMode === "world" ? 1.05 : 1.35}
            minAzimuthAngle={
              prepared?.layout.viewMode === "world" ? -1.2 : -0.9
            }
            maxAzimuthAngle={prepared?.layout.viewMode === "world" ? 1.2 : 0.9}
            screenSpacePanning={false}
          />
        </Canvas>
      </MapCanvasLayer>
    </MapRoot>
  );
}

RecommendLineMap.preload = (route: RecommendRoute) =>
  prepareRoute(route).then(() => undefined);

export default RecommendLineMap;
