import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Html, OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { geoMercator } from "d3-geo";
import styled from "styled-components";
import {
  Box2,
  BufferGeometry,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  MOUSE,
  Path,
  Quaternion,
  Shape,
  ShapeUtils,
  SRGBColorSpace,
  TOUCH,
  Vector2,
  Vector3,
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

const poiList = [
  {
    lat: "30.2274",
    lng: "115.1620",
    label: "棋盘洲港区",
    icon: MapWaterPort,
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
  },
  {
    lat: "30.6341",
    lng: "114.1172",
    label: "武汉传化公路港",
    icon: MapWarehouse,
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
const RAILWAY_WIDTH = 12;
/** 铁路红白交替的线段数量（每 8 个线段交替一次颜色） */
const RAILWAY_SEGMENT_LENGTH = 2;
/** 铁路红/白两色 */
const RAILWAY_RED = "#d81e06";
const RAILWAY_WHITE = "#ffffff";
/** 水运线宽（屏幕像素） */
const WATERWAY_WIDTH = 12;
/** 水运颜色 */
const WATERWAY_COLOR = "#1e90ff";
/** Drei Html 会在每个 POI 外创建独立 stacking context，两个区间必须互不重叠。 */
const POI_LEADER_Z_INDEX_RANGE: [number, number] = [19, 0];
const POI_LABEL_Z_INDEX_RANGE: [number, number] = [40, 20];

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

/** 将一组线段顶点（6 个数 = 2 点 × 3 分量）构建为带像素线宽的 Line2 线对象 */
function createLine(
  positions: number[],
  color: string,
  width: number,
  renderOrder: number,
) {
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(positions);
  const material = new LineMaterial({
    color,
    linewidth: width,
    worldUnits: false,
    toneMapped: false,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const line = new LineSegments2(geometry, material);
  line.renderOrder = renderOrder;
  line.raycast = () => {};
  return line;
}

function MapMesh() {
  const demTexture = useTexture(hubeiDem);
  const sideMaterialRef = useRef<ThreeShaderMaterial>(null!);
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

    // 铁路线：红/白每 RAILWAY_SEGMENT_LENGTH（8）个线段交替渲染，色块等长
    const railwayData = hubeiRailwayData as unknown as HighwayMultiLineString;
    const railwayRedPositions: number[] = [];
    const railwayWhitePositions: number[] = [];
    const railwayZ = MAP_DEPTH + 0.085;

    const railwaySegments: number[] = [];
    railwayData.coordinates.forEach((coordinates) => {
      if (coordinates.length < 2) return;
      let previous = project(coordinates[0]);
      for (let index = 1; index < coordinates.length; index += 1) {
        const current = project(coordinates[index]);
        railwaySegments.push(
          previous.x,
          previous.y,
          railwayZ,
          current.x,
          current.y,
          railwayZ,
        );
        previous = current;
      }
    });

    for (let index = 0; index < railwaySegments.length; index += 6) {
      const isRed =
        (index / 6) % (RAILWAY_SEGMENT_LENGTH * 2) < RAILWAY_SEGMENT_LENGTH;
      const target = isRed ? railwayRedPositions : railwayWhitePositions;
      target.push(
        railwaySegments[index],
        railwaySegments[index + 1],
        railwaySegments[index + 2],
        railwaySegments[index + 3],
        railwaySegments[index + 4],
        railwaySegments[index + 5],
      );
    }

    const railwayRedLine = createLine(
      railwayRedPositions,
      RAILWAY_RED,
      RAILWAY_WIDTH,
      15,
    );
    const railwayWhiteLine = createLine(
      railwayWhitePositions,
      RAILWAY_WHITE,
      RAILWAY_WIDTH,
      16,
    );

    // 水运线：单一蓝色线条
    const waterwayData = hubeiWaterwayData as unknown as HighwayMultiLineString;
    const waterwayPositions: number[] = [];
    const waterwayZ = MAP_DEPTH + 0.09;

    waterwayData.coordinates.forEach((coordinates) => {
      if (coordinates.length < 2) return;
      let previous = project(coordinates[0]);
      for (let index = 1; index < coordinates.length; index += 1) {
        const current = project(coordinates[index]);
        waterwayPositions.push(
          previous.x,
          previous.y,
          waterwayZ,
          current.x,
          current.y,
          waterwayZ,
        );
        previous = current;
      }
    });

    const waterwayLine = createLine(
      waterwayPositions,
      WATERWAY_COLOR,
      WATERWAY_WIDTH,
      17,
    );

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
      };
    });

    return {
      bbox,
      center,
      shapes,
      cities,
      cityBoundaryGeometry,
      provinceEdgeGeometry,
      outlineRings,
      highwayLine,
      railwayRedLine,
      railwayWhiteLine,
      waterwayLine,
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
      projected.railwayRedLine.geometry.dispose();
      projected.railwayRedLine.material.dispose();
      projected.railwayWhiteLine.geometry.dispose();
      projected.railwayWhiteLine.material.dispose();
      projected.waterwayLine.geometry.dispose();
      projected.waterwayLine.material.dispose();
    },
    [projected],
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
    <group position={[-projected.center.x, -projected.center.y, 0]}>
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
      <primitive object={projected.railwayRedLine} />
      <primitive object={projected.railwayWhiteLine} />
      <primitive object={projected.waterwayLine} />

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
