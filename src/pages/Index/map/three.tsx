import { Suspense, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { Html, OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { geoMercator } from "d3-geo";
import styled from "styled-components";
import {
  Box2,
  BufferGeometry,
  Color,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  MOUSE,
  Path,
  Quaternion,
  Shape,
  ShapeUtils,
  SRGBColorSpace,
  TOUCH,
  Vector2,
  Vector3,
  type Camera,
  type Group,
  type ShaderMaterial as ThreeShaderMaterial,
} from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

import hubeiHighwayData from "@/assets/hb-highway.json";
import hubeiRailwayData from "@/assets/hb-railway.json";
import hubeiWaterwayData from "@/assets/hb-waterway.json";

import hubeiMapData from "@/assets/hb.json";
import hubeiOutlineData from "@/assets/hb_outline.json";
import hubeiDem from "@/assets/hb_dem.webp";
import type { CityGeoJSON } from "@/types/map";
import ShapeBox, { type ShapeProps } from "./shape";
import {
  GLOW_EMISSIVE_COLOR,
  MAP_DEPTH,
  MAP_EXTRUDE_OPTIONS,
  MapLabel,
  MapRoot,
  OutlineGlow,
  SceneReady,
  TerrainSideMaterial,
  TerrainTopMaterial,
  WorldBase,
  calculateMapHtmlPosition,
  useControlSpeed,
} from "./threeShared";
import MapWaterPort from "@/assets/map-waterway-port.png";
import MapAirPort from "@/assets/map-airway.png";
import MapRailwayStation from "@/assets/map-railway-station.png";
import MapWarehouse from "@/assets/map-warehouse.png";
import { resolvePoiLabelCollisions } from "./poiLabelCollision";
import type {
  PoiLabelBounds,
  PoiLabelPlacement,
} from "./poiLabelCollision";

/** 标注连线方向：top 向上连接、bottom 向下连接 */
type PoiDirection = "top" | "bottom";

type PoiListItem = {
  lat: string;
  lng: string;
  label: string;
  icon: string;
  /** 手动指定连线方向；缺省时朝距离该 POI 最近的那条地图边缘出图 */
  direction?: PoiDirection;
};

const POI_PLACEMENT_BY_DIRECTION = {
  top: "above",
  bottom: "below",
} as const satisfies Record<PoiDirection, PoiLabelPlacement>;

const poiList: PoiListItem[] = [
  {
    lat: "30.2274",
    lng: "115.1620",
    label: "棋盘洲港区",
    icon: MapWaterPort,
    direction: "bottom"

  },
  {
    lat: "30.4175",
    lng: "111.2461",
    label: "云池/白洋港区",
    icon: MapWaterPort,
  },
  {
    lat: "30.6628",
    lng: "114.5637",
    label: "阳逻港区",
    icon: MapWaterPort,
  },
  {
    lat: "30.3147",
    lng: "112.2813",
    label: "盐卡港区",
    icon: MapWaterPort,
  },
  {
    lat: "30.4963",
    lng: "114.8275",
    label: "唐家渡港区",
    icon: MapWaterPort,
    direction: "bottom"

  },
  {
    lat: "30.6447",
    lng: "114.120",
    label: "吴家山站",
    icon: MapRailwayStation,
  },
  {
    lat: "30.6681",
    lng: "114.5496",
    label: "香炉山站",
    icon: MapRailwayStation,
  },
  {
    lat: "32.2074",
    lng: "112.2782",
    label: "襄州北站",
    icon: MapRailwayStation,
  },
  {
    lat: "30.6837",
    lng: "111.3401",
    label: "宜昌东站货场",
    icon: MapRailwayStation,
  },

  {
    lat: "30.34",
    lng: "115.05",
    label: "花湖机场",
    icon: MapAirPort,
    direction: "bottom"
  },
  {
    lat: "30.6341",
    lng: "114.1172",
    label: "武汉传化公路港",
    icon: MapWarehouse,
    direction: "bottom"

  },
  {
    lat: "30.5221",
    lng: "114.8742",
    label: "黄冈禹王物流园",
    icon: MapWarehouse,
  },
];

/** 高速公路线宽（屏幕像素） */
const HIGHWAY_WIDTH = 4;
/** 铁路线宽（屏幕像素） */
const RAILWAY_WIDTH = 8;
/**
 * 铁路红白色块长度（世界单位，与投影后的坐标同尺度）。
 * 按弧长而非源数据线段数切分，源数据点疏密不影响色块长度。
 * 参考换算：相机距离 10~48 对应约 198~41 px/世界单位，
 * 0.2 即最远约 8px、最近约 40px，需明显大于 RAILWAY_WIDTH 才不会被端帽糊住。
 */
const RAILWAY_DASH_LENGTH = 0.2;
/** 铁路红/白两色 */
const RAILWAY_RED = "#848484";
const RAILWAY_WHITE = "#ffffff";
/** 水运主线宽（屏幕像素） */
const WATERWAY_WIDTH = 12;
/**
 * 水运中心虚线宽（屏幕像素）。demo-line.png 实测虚线约为主线粗细的 1/5，
 * 但本图主线只有 WATERWAY_WIDTH 像素，按 1/5 会细到走样，故取约 1/3。
 */
const WATERWAY_DASH_WIDTH = 4;
/** 水运主线沿线渐变：两端 EDGE、中点 CENTER，对应 demo 的 #0074d3 → #00b0d4 → #0074d3 */
const WATERWAY_EDGE_COLOR = "#0074d3";
const WATERWAY_CENTER_COLOR = "#00b0d4";
/** 中心虚线：demo 采样 #80c8e9 = 主线色上叠 50% 白，故用白色 + 0.5 透明度 */
const WATERWAY_DASH_COLOR = "#ffffff";
const WATERWAY_DASH_OPACITY = 0.5;
/**
 * 中心虚线的实线段 / 间隔长度（世界单位）。demo 中实线段约 0.7 倍、间隔约 1.0 倍
 * 主线粗细，按默认相机距离（约 102 px/世界单位）换算得到下面两个值。
 */
const WATERWAY_DASH_LENGTH = 0.08;
const WATERWAY_GAP_LENGTH = 0.12;
/** Drei Html 会在每个 POI 外创建独立 stacking context，两个区间必须互不重叠。 */
const POI_LEADER_Z_INDEX_RANGE: [number, number] = [19, 0];
const POI_LABEL_Z_INDEX_RANGE: [number, number] = [40, 20];
/** 地图轮廓采样点预算：省界外环 2000+ 点按此抽稀，够标签定位精度即可 */
const MAP_SILHOUETTE_POINT_BUDGET = 600;

const PoiMarker = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: none;

  img {
    position: relative;
    z-index: 2;
    width: 60px;
    height: 60px;
    object-fit: contain;
    filter: drop-shadow(0 2px 6px rgba(0, 18, 28, 0.9));
  }
`;

const PoiTextLabel = styled.span`
  position: relative;
  z-index: 2;
  color: rgba(232, 250, 255, 0.95);
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  font-size: 32px;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid rgba(32, 219, 219, 0.35);
  border-radius: 10px;
  background: #003a55c9;
  padding: 10px 14px;
  transform: translateY(var(--poi-label-offset-y, 0px));
  transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
`;

const PoiLeader = styled.i`
  position: absolute;
  top: var(--poi-leader-top, 0px);
  left: 50%;
  z-index: 1;
  display: var(--poi-leader-display, none);
  width: 4px;
  height: var(--poi-leader-height, 0px);
  transform: translateX(-50%);
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(143, 233, 255, 0.45),
    rgba(85, 226, 255, 0.95)
  );
  box-shadow: 0 0 7px rgba(32, 219, 219, 0.75);

  &::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -1px;
    width: 9px;
    height: 9px;
    border-right: 3px solid #8fe9ff;
    border-bottom: 3px solid #8fe9ff;
    transform: translateX(-50%) rotate(45deg);
  }

  /* 向下连接时整条线上下翻转：渐变亮端与箭头都要贴着节点那一侧 */
  [data-poi-direction="bottom"] & {
    background: linear-gradient(
      to top,
      rgba(143, 233, 255, 0.45),
      rgba(85, 226, 255, 0.95)
    );

    &::after {
      top: -1px;
      bottom: auto;
      transform: translateX(-50%) rotate(225deg);
    }
  }
`;

/**
 * 连接线使用与可见 marker 完全相同的尺寸，确保两个 Html 根节点的 center
 * 锚点一致；图标和文字只作为布局占位，不参与显示。
 */
const PoiLeaderMarker = styled(PoiMarker)`
  > img,
  > span {
    visibility: hidden;
  }
`;

type ProjectedCity = {
  name: string;
  center: Vector3;
};

type HighwayMultiLineString = {
  type: "MultiLineString";
  coordinates: [number, number][][];
};

/** 投影地图轮廓点用的暂存向量，避免每帧分配 */
const silhouetteProjection = new Vector3();

function MapMesh() {
  const demTexture = useTexture(hubeiDem);
  const sideMaterialRef = useRef<ThreeShaderMaterial>(null!);
  const mapGroupRef = useRef<Group>(null);
  const poiMarkerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const poiLeaderMarkerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const collisionFramesRef = useRef(3);
  const lastCameraPositionRef = useRef(new Vector3());
  const lastCameraQuaternionRef = useRef<Quaternion | null>(null);
  const lastCanvasSizeRef = useRef<[number, number]>([0, 0]);

  const projected = useMemo(() => {
    const mapData = hubeiMapData as CityGeoJSON;
    const outlineData = hubeiOutlineData as CityGeoJSON;
    const projection = geoMercator()
      .center(outlineData.features[0].properties.centroid)
      .translate([0, 0]);
    const bbox = new Box2();

    const project = (coordinate: number[]) => {
      const [x, y] = projection(coordinate as [number, number])!;
      const point = new Vector2(x, -y);
      bbox.expandByPoint(point);
      return point;
    };

    const shapes: Shape[] = [];
    outlineData.features.forEach((feature) => {
      feature.geometry.coordinates.forEach((polygon) => {
        const rings = polygon.map((ring) => ring.map(project));
        const outer = rings[0];
        if (!ShapeUtils.isClockWise(outer)) outer.reverse();

        const shape = new Shape(outer);
        rings.slice(1).forEach((ring) => {
          if (ShapeUtils.isClockWise(ring)) ring.reverse();
          shape.holes.push(new Path(ring));
        });
        shapes.push(shape);
      });
    });

    const boundaryPositions: number[] = [];
    mapData.features.forEach((feature) => {
      feature.geometry.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          const points = ring.map(project);
          for (let index = 1; index < points.length; index += 1) {
            const previous = points[index - 1];
            const current = points[index];
            boundaryPositions.push(
              previous.x,
              previous.y,
              MAP_DEPTH + 0.022,
              current.x,
              current.y,
              MAP_DEPTH + 0.022,
            );
          }
        });
      });
    });

    const cityBoundaryGeometry = new BufferGeometry();
    cityBoundaryGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(boundaryPositions, 3),
    );

    const highwayData = hubeiHighwayData as unknown as HighwayMultiLineString;
    const highwaySegmentCount = highwayData.coordinates.reduce(
      (total, coordinates) => total + Math.max(0, coordinates.length - 1),
      0,
    );
    const highwayPositions = new Float32Array(highwaySegmentCount * 6);
    let highwayPositionOffset = 0;

    highwayData.coordinates.forEach((coordinates) => {
      if (coordinates.length < 2) return;
      let [previousX, previousY] = projection(coordinates[0])!;
      for (let index = 1; index < coordinates.length; index += 1) {
        const [currentX, currentY] = projection(coordinates[index])!;
        highwayPositions[highwayPositionOffset++] = previousX;
        highwayPositions[highwayPositionOffset++] = -previousY;
        highwayPositions[highwayPositionOffset++] = MAP_DEPTH + 0.08;
        highwayPositions[highwayPositionOffset++] = currentX;
        highwayPositions[highwayPositionOffset++] = -currentY;
        highwayPositions[highwayPositionOffset++] = MAP_DEPTH + 0.08;
        previousX = currentX;
        previousY = currentY;
      }
    });

    const highwayGeometry = new LineSegmentsGeometry();
    highwayGeometry.setPositions(highwayPositions);
    const highwayMaterial = new LineMaterial({
      color: "#ffce4d",
      linewidth: HIGHWAY_WIDTH,
      worldUnits: false,
      toneMapped: false,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const highwayLine = new LineSegments2(highwayGeometry, highwayMaterial);
    highwayLine.renderOrder = 14;
    highwayLine.raycast = () => {};

    // 铁路线：沿弧长每 RAILWAY_DASH_LENGTH 切换红/白，色块严格等长。
    // 红白必须合并进同一个对象、用顶点色区分：LineMaterial 会为每段线沿线方向
    // 外扩 linewidth/2 画端帽，若拆成两个对象则后画的那色总是啃掉先画的那色，
    // 缩得越小啃得越狠（色块屏幕长度接近线宽时直接被盖没）。合并后重叠只发生在
    // 沿线相邻色块之间，红白对称各让一半，任何缩放下都保持 50/50。
    const railwayData = hubeiRailwayData as unknown as HighwayMultiLineString;
    const railwayPositions: number[] = [];
    const railwayColors: number[] = [];
    const railwayZ = MAP_DEPTH + 0.085;
    const railwayRedColor = new Color(RAILWAY_RED);
    const railwayWhiteColor = new Color(RAILWAY_WHITE);
    /** 浮点容差：避免切点恰好落在源数据顶点上时产生零长度线段 */
    const EPSILON = 1e-9;

    railwayData.coordinates.forEach((coordinates) => {
      if (coordinates.length < 2) return;
      let previous = project(coordinates[0]);
      // 每条折线独立从红色色块起始
      let isRed = true;
      let dashRemaining = RAILWAY_DASH_LENGTH;

      for (let index = 1; index < coordinates.length; index += 1) {
        const current = project(coordinates[index]);
        const segmentLength = previous.distanceTo(current);
        if (segmentLength <= EPSILON) {
          previous = current;
          continue;
        }

        // 在当前源线段内部按剩余色块长度反复切分
        let consumed = 0;
        while (consumed < segmentLength - EPSILON) {
          const step = Math.min(dashRemaining, segmentLength - consumed);
          const startRatio = consumed / segmentLength;
          const endRatio = (consumed + step) / segmentLength;
          railwayPositions.push(
            previous.x + (current.x - previous.x) * startRatio,
            previous.y + (current.y - previous.y) * startRatio,
            railwayZ,
            previous.x + (current.x - previous.x) * endRatio,
            previous.y + (current.y - previous.y) * endRatio,
            railwayZ,
          );
          const color = isRed ? railwayRedColor : railwayWhiteColor;
          // 一段线的首尾各一个颜色，保持纯色不渐变
          railwayColors.push(
            color.r,
            color.g,
            color.b,
            color.r,
            color.g,
            color.b,
          );

          consumed += step;
          dashRemaining -= step;
          if (dashRemaining <= EPSILON) {
            dashRemaining = RAILWAY_DASH_LENGTH;
            isRed = !isRed;
          }
        }

        previous = current;
      }
    });

    const railwayGeometry = new LineSegmentsGeometry();
    railwayGeometry.setPositions(railwayPositions);
    railwayGeometry.setColors(railwayColors);
    const railwayMaterial = new LineMaterial({
      vertexColors: true,
      linewidth: RAILWAY_WIDTH,
      worldUnits: false,
      toneMapped: false,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const railwayLine = new LineSegments2(railwayGeometry, railwayMaterial);
    railwayLine.renderOrder = 15;
    railwayLine.raycast = () => {};

    // 水运线：主线沿线做 #0074d3 → #00b0d4 → #0074d3 渐变，中心叠一条半透明白虚线。
    // 这里不需要像铁路那样重采样切段：渐变按累计弧长归一化取色、由顶点色插值得到，
    // 虚线交给 LineMaterial 的 USE_DASH 分支在片元里按 instanceDistance 裁切，
    // 两者都只跟弧长有关，源数据分段长短完全不影响观感。
    const waterwayData = hubeiWaterwayData as unknown as HighwayMultiLineString;
    const waterwayPositions: number[] = [];
    const waterwayColors: number[] = [];
    /** 每段起止的累计弧长，供虚线着色器裁切使用 */
    const waterwayDistances: number[] = [];
    const waterwayZ = MAP_DEPTH + 0.09;
    const waterwayEdgeColor = new Color(WATERWAY_EDGE_COLOR);
    const waterwayCenterColor = new Color(WATERWAY_CENTER_COLOR);
    const waterwayGradientColor = new Color();

    /** 取归一化位置 t∈[0,1] 处的渐变色写入颜色缓冲（t=0.5 最亮，两端最暗） */
    const pushWaterwayColor = (t: number) => {
      waterwayGradientColor
        .copy(waterwayEdgeColor)
        .lerp(waterwayCenterColor, 1 - Math.abs(t * 2 - 1));
      waterwayColors.push(
        waterwayGradientColor.r,
        waterwayGradientColor.g,
        waterwayGradientColor.b,
      );
    };

    waterwayData.coordinates.forEach((coordinates) => {
      if (coordinates.length < 2) return;
      const points = coordinates.map(project);

      // 先量出整条线的累计弧长，渐变才能按长度而非顶点序号归一化
      const cumulative = [0];
      for (let index = 1; index < points.length; index += 1) {
        cumulative.push(
          cumulative[index - 1] + points[index - 1].distanceTo(points[index]),
        );
      }
      const total = cumulative[points.length - 1];
      if (total <= EPSILON) return;

      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        waterwayPositions.push(
          previous.x,
          previous.y,
          waterwayZ,
          current.x,
          current.y,
          waterwayZ,
        );
        pushWaterwayColor(cumulative[index - 1] / total);
        pushWaterwayColor(cumulative[index] / total);
        // 每条线独立从 0 起算，保证都从实线段开头
        waterwayDistances.push(cumulative[index - 1], cumulative[index]);
      }
    });

    const waterwayGeometry = new LineSegmentsGeometry();
    waterwayGeometry.setPositions(waterwayPositions);
    waterwayGeometry.setColors(waterwayColors);
    const waterwayMaterial = new LineMaterial({
      vertexColors: true,
      linewidth: WATERWAY_WIDTH,
      worldUnits: false,
      toneMapped: false,
      transparent: true,
      // 主线不透明，渐变才等于给定的 #0074d3/#00b0d4；虚线的 50% 白叠上去
      // 正好还原 demo 采样到的 #80c8e9。transparent 仍保留以走 renderOrder 排序。
      opacity: 1,
      depthWrite: false,
    });
    const waterwayLine = new LineSegments2(waterwayGeometry, waterwayMaterial);
    waterwayLine.renderOrder = 17;
    waterwayLine.raycast = () => {};

    // 中心虚线与主线共用顶点，只是额外挂上累计弧长属性（LineSegments2.computeLineDistances
    // 会把 53 条线首尾串成一条连续距离，这里改为手写以保证每条线各自从 0 开始）。
    const waterwayDashGeometry = new LineSegmentsGeometry();
    waterwayDashGeometry.setPositions(waterwayPositions);
    const waterwayDistanceBuffer = new InstancedInterleavedBuffer(
      new Float32Array(waterwayDistances),
      2,
      1,
    );
    waterwayDashGeometry.setAttribute(
      "instanceDistanceStart",
      new InterleavedBufferAttribute(waterwayDistanceBuffer, 1, 0),
    );
    waterwayDashGeometry.setAttribute(
      "instanceDistanceEnd",
      new InterleavedBufferAttribute(waterwayDistanceBuffer, 1, 1),
    );
    const waterwayDashMaterial = new LineMaterial({
      color: WATERWAY_DASH_COLOR,
      linewidth: WATERWAY_DASH_WIDTH,
      dashed: true,
      dashSize: WATERWAY_DASH_LENGTH,
      gapSize: WATERWAY_GAP_LENGTH,
      worldUnits: false,
      toneMapped: false,
      transparent: true,
      opacity: WATERWAY_DASH_OPACITY,
      depthWrite: false,
    });
    const waterwayDashLine = new LineSegments2(
      waterwayDashGeometry,
      waterwayDashMaterial,
    );
    waterwayDashLine.renderOrder = 18;
    waterwayDashLine.raycast = () => {};

    const extruded = new ExtrudeGeometry(shapes, {
      depth: MAP_DEPTH,
      bevelEnabled: false,
    });
    const provinceEdgeGeometry = new EdgesGeometry(extruded, 18);
    extruded.dispose();

    // 省界顶部轮廓环（外环 + 内环），用于绘制加粗发光描边
    const outlineRings: [number, number, number][][] = [];
    shapes.forEach((shape) => {
      [shape.getPoints(), ...shape.holes.map((hole) => hole.getPoints())]
        .filter((ring) => ring.length > 1)
        .forEach((ring) => {
          outlineRings.push(
            [...ring, ring[0]].map((point) => [
              point.x,
              point.y,
              MAP_DEPTH + 0.03,
            ]),
          );
        });
    });

    const center = bbox.getCenter(new Vector2());
    const cities: ProjectedCity[] = mapData.features.map((feature) => {
      const [x, y] = projection(
        feature.properties.centroid ?? feature.properties.center,
      )!;
      return {
        name: feature.properties.name,
        center: new Vector3(x, -y, MAP_DEPTH + 0.12),
      };
    });

    const pois = poiList.map((poi) => {
      const [x, y] = projection([Number(poi.lng), Number(poi.lat)])!;
      return {
        label: poi.label,
        icon: poi.icon,
        position: new Vector3(x, -y, MAP_DEPTH + 0.2),
        placement: poi.direction
          ? POI_PLACEMENT_BY_DIRECTION[poi.direction]
          : undefined,
      };
    });

    // 地图轮廓采样点（省界外环，顶面 + 底面各一份，把挤出侧面也算进轮廓），
    // 每次解算碰撞时投影到屏幕，供标签按本地区间就近出图。
    // 外环有 2000+ 点，按预算抽稀：标签宽度上百像素，几像素的轮廓精度已足够。
    const silhouettePoints = shapes.flatMap((shape) => shape.getPoints());
    const silhouetteStride = Math.max(
      1,
      Math.ceil(silhouettePoints.length / MAP_SILHOUETTE_POINT_BUDGET),
    );
    const mapSilhouette: Vector3[] = [];
    silhouettePoints.forEach((point, index) => {
      if (index % silhouetteStride !== 0) return;
      mapSilhouette.push(
        new Vector3(point.x, point.y, MAP_DEPTH),
        new Vector3(point.x, point.y, 0),
      );
    });

    return {
      bbox,
      center,
      shapes,
      cities,
      cityBoundaryGeometry,
      provinceEdgeGeometry,
      outlineRings,
      mapSilhouette,
      highwayLine,
      railwayLine,
      waterwayLine,
      waterwayDashLine,
      pois,
    };
  }, []);

  useLayoutEffect(() => {
    demTexture.colorSpace = SRGBColorSpace;
    demTexture.anisotropy = 8;
    demTexture.needsUpdate = true;
  }, [demTexture]);

  useLayoutEffect(
    () => () => {
      projected.highwayLine.geometry.dispose();
      projected.highwayLine.material.dispose();
      projected.railwayLine.geometry.dispose();
      projected.railwayLine.material.dispose();
      projected.waterwayLine.geometry.dispose();
      projected.waterwayLine.material.dispose();
      projected.waterwayDashLine.geometry.dispose();
      projected.waterwayDashLine.material.dispose();
    },
    [projected],
  );

  const poiPlacements = useMemo(
    () => projected.pois.map((poi) => poi.placement),
    [projected.pois],
  );

  /** 轮廓投影结果缓存（client 坐标），长度固定，避免每次解算都分配 */
  const silhouetteScreen = useMemo(
    () => ({
      x: new Float64Array(projected.mapSilhouette.length),
      y: new Float64Array(projected.mapSilhouette.length),
    }),
    [projected.mapSilhouette],
  );

  /**
   * 把地图轮廓采样点投影到 client 坐标系，得到标签的出图基准。
   * 用 canvas 的 getBoundingClientRect 换算，AutoFit 的整页 CSS 缩放自动被吃掉。
   * 返回的 edgeAt 让每个标签只按自己那一段横向区间的轮廓出图，
   * 否则右侧 POI 会被统一排到全局最低/最高点，连线白白拉很长。
   */
  const measureMapBounds = useCallback(
    (camera: Camera, canvas: HTMLCanvasElement): PoiLabelBounds | undefined => {
      const group = mapGroupRef.current;
      if (!group) return undefined;

      const canvasRect = canvas.getBoundingClientRect();
      if (canvasRect.height === 0) return undefined;

      const { x: screenX, y: screenY } = silhouetteScreen;
      let mapTop = Infinity;
      let mapBottom = -Infinity;
      projected.mapSilhouette.forEach((point, index) => {
        silhouetteProjection
          .copy(point)
          .applyMatrix4(group.matrixWorld)
          .project(camera);
        const clientX =
          canvasRect.left +
          (silhouetteProjection.x * 0.5 + 0.5) * canvasRect.width;
        const clientY =
          canvasRect.top +
          (0.5 - silhouetteProjection.y * 0.5) * canvasRect.height;
        screenX[index] = clientX;
        screenY[index] = clientY;
        if (clientY < mapTop) mapTop = clientY;
        if (clientY > mapBottom) mapBottom = clientY;
      });

      return {
        mapBottom,
        mapTop,
        viewBottom: canvasRect.bottom,
        viewTop: canvasRect.top,
        edgeAt: (left, right) => {
          let top = Infinity;
          let bottom = -Infinity;
          for (let index = 0; index < screenX.length; index += 1) {
            const x = screenX[index];
            if (x < left || x > right) continue;
            const y = screenY[index];
            if (y < top) top = y;
            if (y > bottom) bottom = y;
          }
          return top === Infinity ? undefined : { bottom, top };
        },
      };
    },
    [projected.mapSilhouette, silhouetteScreen],
  );

  useFrame((state, delta) => {
    if (sideMaterialRef.current) {
      sideMaterialRef.current.uniforms.uTime.value += delta;
    }

    const cameraMoved =
      lastCameraQuaternionRef.current === null ||
      lastCameraPositionRef.current.distanceToSquared(state.camera.position) >
        0.000001 ||
      1 -
          Math.abs(
            lastCameraQuaternionRef.current.dot(state.camera.quaternion),
          ) >
        0.000001;
    const canvasResized =
      lastCanvasSizeRef.current[0] !== state.size.width ||
      lastCanvasSizeRef.current[1] !== state.size.height;
    const markersReady =
      poiMarkerRefs.current.length === projected.pois.length &&
      poiMarkerRefs.current.every(Boolean) &&
      poiLeaderMarkerRefs.current.length === projected.pois.length &&
      poiLeaderMarkerRefs.current.every(Boolean);

    if (cameraMoved || canvasResized) collisionFramesRef.current = 2;
    if (!markersReady) collisionFramesRef.current = 3;

    if (markersReady && collisionFramesRef.current > 0) {
      resolvePoiLabelCollisions(poiMarkerRefs.current, {
        leaderMarkers: poiLeaderMarkerRefs.current,
        placements: poiPlacements,
        bounds: measureMapBounds(state.camera, state.gl.domElement),
      });
      collisionFramesRef.current -= 1;
    }

    lastCameraPositionRef.current.copy(state.camera.position);
    if (!lastCameraQuaternionRef.current) {
      lastCameraQuaternionRef.current = new Quaternion();
    }
    lastCameraQuaternionRef.current.copy(state.camera.quaternion);
    lastCanvasSizeRef.current[0] = state.size.width;
    lastCanvasSizeRef.current[1] = state.size.height;
  });

  // 稳定 args 引用，避免 R3F 每次 render 重建 ExtrudeGeometry。
  const extrudeArgs = useMemo<ShapeProps["args"]>(
    () => [projected.shapes, MAP_EXTRUDE_OPTIONS],
    [projected.shapes],
  );

  return (
    <group
      ref={mapGroupRef}
      position={[-projected.center.x, -projected.center.y, 0]}
    >
      <ShapeBox bbox={projected.bbox} args={extrudeArgs}>
        <TerrainTopMaterial attach="material-0" uMap={demTexture} />
        <TerrainSideMaterial
          attach="material-1"
          ref={sideMaterialRef}
          transparent
        />
      </ShapeBox>

      <lineSegments
        geometry={projected.cityBoundaryGeometry}
        raycast={() => null}
      >
        <lineBasicMaterial
          color="#8fe9ff"
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </lineSegments>

      <lineSegments
        geometry={projected.provinceEdgeGeometry}
        renderOrder={10}
        raycast={() => null}
      >
        <lineBasicMaterial color={GLOW_EMISSIVE_COLOR} toneMapped={false} />
      </lineSegments>

      <primitive object={projected.highwayLine} />
      <primitive object={projected.railwayLine} />
      <primitive object={projected.waterwayLine} />
      <primitive object={projected.waterwayDashLine} />

      <OutlineGlow rings={projected.outlineRings} />

      {projected.pois.map((poi, poiIndex) => (
        <Html
          calculatePosition={calculateMapHtmlPosition}
          key={`${poi.label}-${poiIndex}-leader`}
          center
          position={poi.position}
          distanceFactor={18}
          eps={0}
          zIndexRange={POI_LEADER_Z_INDEX_RANGE}
        >
          <PoiLeaderMarker
            ref={(element) => {
              poiLeaderMarkerRefs.current[poiIndex] = element;
              collisionFramesRef.current = 3;
            }}
            aria-hidden="true"
          >
            <PoiLeader aria-hidden="true" />
            <img src={poi.icon} alt="" />
            <PoiTextLabel>{poi.label}</PoiTextLabel>
          </PoiLeaderMarker>
        </Html>
      ))}

      {projected.pois.map((poi, poiIndex) => (
        <Html
          calculatePosition={calculateMapHtmlPosition}
          key={`${poi.label}-${poiIndex}-label`}
          center
          position={poi.position}
          distanceFactor={18}
          eps={0}
          zIndexRange={POI_LABEL_Z_INDEX_RANGE}
        >
          <PoiMarker
            ref={(element) => {
              poiMarkerRefs.current[poiIndex] = element;
              collisionFramesRef.current = 3;
            }}
          >
            <img data-poi-icon src={poi.icon} alt={poi.label} />
            <PoiTextLabel data-poi-label>{poi.label}</PoiTextLabel>
          </PoiMarker>
        </Html>
      ))}

      {projected.cities.map((city) => (
        <Html
          calculatePosition={calculateMapHtmlPosition}
          key={city.name}
          center
          position={city.center}
          distanceFactor={18}
          eps={0}
          zIndexRange={POI_LABEL_Z_INDEX_RANGE}
        >
          <MapLabel>{city.name}</MapLabel>
        </Html>
      ))}
    </group>
  );
}

export type ThreeHubeiMapProps = {
  onReady?: () => void;
  /** 上层交叉淡入时标记为淡出层，冻结渲染循环。 */
  paused?: boolean;
};

export default function ThreeHubeiMap({
  onReady,
  paused = false,
}: ThreeHubeiMapProps) {
  const controlSpeed = useControlSpeed();

  return (
    <MapRoot role="img" aria-label="湖北省三维地形地图">
      <Canvas
        dpr={[1, 1.5]}
        resize={{ offsetSize: true }}
        // 被上层标记为淡出时冻结渲染循环，避免交叉淡入期间两个 WebGL 场景同时满帧。
        frameloop={paused ? "demand" : "always"}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: 30.5, near: 0.1, far: 300, position: [0, 22.5, 18.5] }}
      >
        <Suspense fallback={null}>
          {/* 地图数据位于 XY 平面，整体翻转到 XZ 地面上（+Y 朝上），便于 OrbitControls 交互 */}
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <WorldBase />
            <MapMesh />
            <SceneReady onReady={onReady} />
          </group>
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={controlSpeed}
          panSpeed={controlSpeed}
          zoomSpeed={0.9}
          minDistance={10}
          maxDistance={48}
          minPolarAngle={0.3}
          maxPolarAngle={1.35}
          minAzimuthAngle={-0.9}
          maxAzimuthAngle={0.9}
          screenSpacePanning={false}
          zoomToCursor
          mouseButtons={{
            LEFT: MOUSE.PAN,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.ROTATE,
          }}
          touches={{
            ONE: TOUCH.PAN,
            TWO: TOUCH.DOLLY_ROTATE,
          }}
        />
      </Canvas>
    </MapRoot>
  );
}
