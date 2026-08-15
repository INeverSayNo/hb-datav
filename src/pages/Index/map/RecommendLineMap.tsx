import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { geoMercator } from "d3-geo";
import styled from "styled-components";
import {
  Box2,
  Path,
  Shape,
  ShapeUtils,
  SRGBColorSpace,
  TextureLoader,
  type PerspectiveCamera,
  type Texture,
  Vector2,
  type ShaderMaterial as ThreeShaderMaterial,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

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

import {
  ALL_RECOMMEND_PROVINCE_IDS,
  type OutRecommendMapId,
  type RecommendMapId,
  type ProvinceId,
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

type AdministrativeGeoJSON = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: AdministrativeProperties;
    geometry: AdministrativeGeometry;
  }>;
};

type MapRegionSource = {
  id: RecommendMapId;
  data: AdministrativeGeoJSON;
  kind?: "china" | "out" | "province";
  texture?: string;
};

type ProjectedMapRegion = MapRegionSource & {
  bbox: Box2;
  shapes: Shape[];
  boundarySegments: [number, number, number][];
  labelPosition: [number, number, number];
};

type ProjectedRouteLayout = {
  boundarySegments: [number, number, number][];
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

type MapTransitionPhase =
  | "hidden"
  | "entering"
  | "visible"
  | "exiting";

const GLOBAL_MAP_WIDTH = 27;
const TARGET_MAP_WIDTH = 27;
const TARGET_MAP_HEIGHT = 17.5;
const WORLD_TARGET_MAP_WIDTH = 30;
const WORLD_TARGET_MAP_HEIGHT = 18;
const EXIT_DURATION = 180;
const ENTER_DURATION = 240;
const REDUCED_MOTION_DURATION = 80;

function asAdministrativeData(data: unknown): AdministrativeGeoJSON {
  return data as AdministrativeGeoJSON;
}

const provinceSourceById: Record<ProvinceId, MapRegionSource> = {
  anhui: { id: "anhui", data: asAdministrativeData(anhuiData), kind: "province", texture: anhuiTexture },
  beijing: { id: "beijing", data: asAdministrativeData(beijingData), kind: "province", texture: beijingTexture },
  chongqing: { id: "chongqing", data: asAdministrativeData(chongqingData), texture: chongqingTexture },
  fujian: { id: "fujian", data: asAdministrativeData(fujianData), texture: fujianTexture },
  gansu: { id: "gansu", data: asAdministrativeData(gansuData), texture: gansuTexture },
  guangdong: { id: "guangdong", data: asAdministrativeData(guangdongData), texture: guangdongTexture },
  guangxi: { id: "guangxi", data: asAdministrativeData(guangxiData), texture: guangxiTexture },
  guizhou: { id: "guizhou", data: asAdministrativeData(guizhouData), texture: guizhouTexture },
  // hainan: { id: "hainan", data: asAdministrativeData(hainanData), texture: hainanTexture },
  hebei: { id: "hebei", data: asAdministrativeData(hebeiData), texture: hebeiTexture },
  heilongjiang: { id: "heilongjiang", data: asAdministrativeData(heilongjiangData), texture: heilongjiangTexture },
  henan: { id: "henan", data: asAdministrativeData(henanData), texture: henanTexture },
  hubei: { id: "hubei", data: asAdministrativeData(hubeiData), texture: hubeiTexture },
  hunan: { id: "hunan", data: asAdministrativeData(hunanData), texture: hunanTexture },
  jiangsu: { id: "jiangsu", data: asAdministrativeData(jiangsuData), texture: jiangsuTexture },
  jiangxi: { id: "jiangxi", data: asAdministrativeData(jiangxiData), texture: jiangxiTexture },
  jilin: { id: "jilin", data: asAdministrativeData(jilinData), texture: jilinTexture },
  liaoning: { id: "liaoning", data: asAdministrativeData(liaoningData), texture: liaoningTexture },
  neimenggu: { id: "neimenggu", data: asAdministrativeData(neimengguData), texture: neimengguTexture },
  ningxia: { id: "ningxia", data: asAdministrativeData(ningxiaData), texture: ningxiaTexture },
  qinghai: { id: "qinghai", data: asAdministrativeData(qinghaiData), texture: qinghaiTexture },
  shaanxi: { id: "shaanxi", data: asAdministrativeData(ShaanxiData), texture: ShaanxiTexture },
  shandong: { id: "shandong", data: asAdministrativeData(shandongData), texture: shandongTexture },
  shanghai: { id: "shanghai", data: asAdministrativeData(shanghaiData), texture: shanghaiTexture },
  shanxi: { id: "shanxi", data: asAdministrativeData(shanxiData), texture: shanxiTexture },
  sichuan: { id: "sichuan", data: asAdministrativeData(sichuanData), texture: sichuanTexture },
  tianjing: { id: "tianjing", data: asAdministrativeData(tianjingData), texture: tianjingTexture },
  xinjiang: { id: "xinjiang", data: asAdministrativeData(xinjiangData), texture: xinjiangTexture },
  xizang: { id: "xizang", data: asAdministrativeData(xizangData), texture: xizangTexture },
  yunnan: { id: "yunnan", data: asAdministrativeData(yunnanData), texture: yunnanTexture },
  zhejiang: { id: "zhejiang", data: asAdministrativeData(zhejiangData), texture: zhejiangTexture },
};

const provinceSources = ALL_RECOMMEND_PROVINCE_IDS.map(
  (id) => provinceSourceById[id],
);
const externalMapDataByPath = import.meta.glob<AdministrativeGeoJSON>(
  "/src/assets/recommendLine/out-*.json",
  { eager: true, import: "default" },
);
const externalMapSourceById = Object.fromEntries(
  Object.entries(externalMapDataByPath).map(([path, data]) => {
    const filename = path.split("/").at(-1);
    const id = filename?.replace(/\.json$/, "") as OutRecommendMapId;
    return [id, { id, data: asAdministrativeData(data), kind: "out" }] as const;
  }),
) as Record<OutRecommendMapId, MapRegionSource>;
const mapRegionSourceById: Partial<Record<RecommendMapId, MapRegionSource>> = {
  ...provinceSourceById,
  china: { id: "china", data: asAdministrativeData(chinaData), kind: "china" },
  ...externalMapSourceById,
};

function getMapRegionSource(id: RecommendMapId) {
  const source = mapRegionSourceById[id];
  if (!source) {
    throw new Error(`未找到地图资源：assets/recommendLine/${id}.json`);
  }
  return source;
}
const projectedMapRegionCache = new Map<RecommendMapId, ProjectedMapRegion>();
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
    $phase === "hidden" || $phase === "exiting"
      ? "scale(0.985)"
      : "scale(1)"};
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
  const project = (coordinate: Coordinate) => {
    const [x, y] = projection(coordinate)!;
    const point = new Vector2(x, -y);
    bbox.expandByPoint(point);
    return point;
  };

  const shapes: Shape[] = [];
  source.data.features.forEach((feature) => {
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

  const properties = source.data.features[0]?.properties;
  const labelCoordinate = properties?.centroid ?? properties?.center;
  const labelPoint = labelCoordinate
    ? (() => {
        const [x, y] = projection(labelCoordinate)!;
        return new Vector2(x, -y);
      })()
    : bbox.getCenter(new Vector2());

  return {
    ...source,
    bbox,
    shapes,
    boundarySegments,
    labelPosition: [labelPoint.x, labelPoint.y, MAP_DEPTH + 0.12],
  };
}

function getProjectedMapRegion(id: RecommendMapId) {
  const cached = projectedMapRegionCache.get(id);
  if (cached) return cached;

  const projected = buildMapRegion(getMapRegionSource(id));
  projectedMapRegionCache.set(id, projected);
  return projected;
}

function getRouteLayout(route: RecommendRoute): ProjectedRouteLayout {
  const cached = routeLayoutCache.get(route.mapKey);
  if (cached) return cached;

  const regions = route.mapIds.map(getProjectedMapRegion);
  const bounds = new Box2();
  regions.forEach(({ bbox }) => bounds.union(bbox));
  const size = bounds.getSize(new Vector2());
  const viewMode = route.mapIds.some((id) => id.startsWith("out-"))
    ? "world"
    : "regional";
  const targetWidth =
    viewMode === "world" ? WORLD_TARGET_MAP_WIDTH : TARGET_MAP_WIDTH;
  const targetHeight =
    viewMode === "world" ? WORLD_TARGET_MAP_HEIGHT : TARGET_MAP_HEIGHT;
  const fitScale = Math.min(
    targetWidth / Math.max(size.x, 0.001),
    targetHeight / Math.max(size.y, 0.001),
  );
  const center = bounds.getCenter(new Vector2());

  const layout: ProjectedRouteLayout = {
    boundarySegments: regions.flatMap(
      ({ boundarySegments }) => boundarySegments,
    ),
    center,
    fitScale,
    mapKey: route.mapKey,
    regions,
    viewMode,
  };
  routeLayoutCache.set(route.mapKey, layout);
  return layout;
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

  const label = region.data.features[0]?.properties.name ?? region.id;

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
            color={region.kind === "china" ? "#168f9f" : "#19799b"}
            transparent
            opacity={0.9}
            toneMapped={false}
          />
        )}
        <TerrainSideMaterial
          attach="material-1"
          ref={sideMaterialRef}
          transparent
        />
      </ShapeBox>

      {showLabel && (
        <Html
          center
          position={region.labelPosition}
          distanceFactor={labelDistanceFactor}
          zIndexRange={[20, 0]}
        >
          <MapLabel>{label}</MapLabel>
        </Html>
      )}
    </group>
  );
}

function RecommendLineScene({
  onReady,
  prepared,
}: {
  onReady: () => void;
  prepared: PreparedRoute;
}) {
  const { layout, textures } = prepared;
  const labelDistanceFactor = 22 / layout.fitScale;

  return (
    <group scale={layout.fitScale}>
      <group position={[-layout.center.x, -layout.center.y, 0]}>
        {layout.regions.map((region) => (
          <MapRegionMesh
            key={region.id}
            labelDistanceFactor={labelDistanceFactor}
            region={region}
            showLabel={
              layout.viewMode !== "world" ||
              region.kind === "china" ||
              region.kind === "out"
            }
            texture={textures.get(region.id)}
          />
        ))}
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
      camera.position.set(0, 36, 10.5);
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
            minAzimuthAngle={prepared?.layout.viewMode === "world" ? -1.2 : -0.9}
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
