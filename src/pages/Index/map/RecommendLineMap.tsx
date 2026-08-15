import { Suspense, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { Html, Line, OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { geoMercator } from "d3-geo";
import {
  Box2,
  Path,
  Shape,
  ShapeUtils,
  SRGBColorSpace,
  Vector2,
  type ShaderMaterial as ThreeShaderMaterial,
} from "three";

import anhuiData from "@/assets/recommendLine/anhui.json";
import beijingData from "@/assets/recommendLine/beijing.json";
import chongqingData from "@/assets/recommendLine/chongqing.json";
import hebeiData from "@/assets/recommendLine/hebei.json";
import henanData from "@/assets/recommendLine/henan.json";
import hunanData from "@/assets/recommendLine/hunan.json";
import jiangsuData from "@/assets/recommendLine/jiangsu.json";
import jiangxiData from "@/assets/recommendLine/jiangxi.json";
import liaoningData from "@/assets/recommendLine/liaoning.json";
import shandongData from "@/assets/recommendLine/shandong.json";
import shanghaiData from "@/assets/recommendLine/shanghai.json";
import sichuanData from "@/assets/recommendLine/sichuan.json";
import tianjingData from "@/assets/recommendLine/tianjing.json";
import zhejiangData from "@/assets/recommendLine/zhejiang.json";
import hubeiOutlineData from "@/assets/recommendLine/hubei_outline.json";
import recommendLineOutlineData from "@/assets/recommendLine/outline.json";

import anhuiTexture from "@/assets/recommendLine/anhui.png";
import beijingTexture from "@/assets/recommendLine/beijing.png";
import chongqingTexture from "@/assets/recommendLine/chongqing.png";
import hebeiTexture from "@/assets/recommendLine/hebei.png";
import henanTexture from "@/assets/recommendLine/henan.png";
import hubeiTexture from "@/assets/recommendLine/hubei.png";
import hunanTexture from "@/assets/recommendLine/hunan.png";
import jiangsuTexture from "@/assets/recommendLine/jiangsu.png";
import jiangxiTexture from "@/assets/recommendLine/jiangxi.png";
import liaoningTexture from "@/assets/recommendLine/liaoning.png";
import shandongTexture from "@/assets/recommendLine/shandong.png";
import shanghaiTexture from "@/assets/recommendLine/shanghai.png";
import sichuanTexture from "@/assets/recommendLine/sichuan.png";
import tianjingTexture from "@/assets/recommendLine/tianjing.png";
import zhejiangTexture from "@/assets/recommendLine/zhejiang.png";

import ShapeBox from "./shape";
import {
  MAP_DEPTH,
  MapLabel,
  MapRoot,
  OutlineGlow,
  SceneReady,
  TerrainSideMaterial,
  TerrainTopMaterial,
  WorldBase,
  useControlSpeed,
} from "./threeShared";

type Coordinate = [number, number];
type PolygonCoordinates = Coordinate[][];

type AdministrativeGeometry =
  | { type: "Polygon"; coordinates: PolygonCoordinates }
  | { type: "MultiPolygon"; coordinates: PolygonCoordinates[] };

type AdministrativeProperties = {
  name: string;
  center: Coordinate;
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

type ProvinceSource = {
  id: string;
  data: AdministrativeGeoJSON;
  texture: string;
};

type ProjectedProvince = ProvinceSource & {
  bbox: Box2;
  shapes: Shape[];
  boundaryRings: [number, number, number][][];
  labelPosition: [number, number, number];
};

const TARGET_MAP_WIDTH = 27;

function asAdministrativeData(data: unknown): AdministrativeGeoJSON {
  return data as AdministrativeGeoJSON;
}

const provinceSources: ProvinceSource[] = [
  { id: "sichuan", data: asAdministrativeData(sichuanData), texture: sichuanTexture },
  { id: "chongqing", data: asAdministrativeData(chongqingData), texture: chongqingTexture },
  { id: "hubei", data: asAdministrativeData(hubeiOutlineData), texture: hubeiTexture },
  { id: "hunan", data: asAdministrativeData(hunanData), texture: hunanTexture },
  { id: "henan", data: asAdministrativeData(henanData), texture: henanTexture },
  { id: "jiangxi", data: asAdministrativeData(jiangxiData), texture: jiangxiTexture },
  { id: "anhui", data: asAdministrativeData(anhuiData), texture: anhuiTexture },
  { id: "jiangsu", data: asAdministrativeData(jiangsuData), texture: jiangsuTexture },
  { id: "zhejiang", data: asAdministrativeData(zhejiangData), texture: zhejiangTexture },
  { id: "shanghai", data: asAdministrativeData(shanghaiData), texture: shanghaiTexture },
  { id: "shandong", data: asAdministrativeData(shandongData), texture: shandongTexture },
  { id: "hebei", data: asAdministrativeData(hebeiData), texture: hebeiTexture },
  { id: "beijing", data: asAdministrativeData(beijingData), texture: beijingTexture },
  { id: "tianjing", data: asAdministrativeData(tianjingData), texture: tianjingTexture },
  { id: "liaoning", data: asAdministrativeData(liaoningData), texture: liaoningTexture },
];

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

function createProjection() {
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
    projection.scale() * (TARGET_MAP_WIDTH / projectedBounds.getSize(new Vector2()).x),
  );
  return projection;
}

function buildProvince(
  source: ProvinceSource,
  projection: ReturnType<typeof geoMercator>,
): ProjectedProvince {
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

  const boundaryRings: [number, number, number][][] = [];
  shapes.forEach((shape) => {
    [shape.getPoints(), ...shape.holes.map((hole) => hole.getPoints())]
      .filter((ring) => ring.length > 1)
      .forEach((ring) => {
        boundaryRings.push(
          [...ring, ring[0]].map((point) => [
            point.x,
            point.y,
            MAP_DEPTH + 0.018,
          ]),
        );
      });
  });

  const properties = source.data.features[0].properties;
  const [labelX, labelY] = projection(properties.centroid ?? properties.center)!;

  return {
    ...source,
    bbox,
    shapes,
    boundaryRings,
    labelPosition: [labelX, -labelY, MAP_DEPTH + 0.12],
  };
}

function buildAggregateOutline(
  projection: ReturnType<typeof geoMercator>,
): [number, number, number][][] {
  const data = asAdministrativeData(recommendLineOutlineData);
  const rings: [number, number, number][][] = [];

  data.features.forEach((feature) => {
    getPolygons(feature.geometry).forEach((polygon) => {
      const exterior = polygon[0];
      if (!exterior || exterior.length < 3) return;
      rings.push(
        exterior.map((coordinate) => {
          const [x, y] = projection(coordinate)!;
          return [x, -y, MAP_DEPTH + 0.04];
        }),
      );
    });
  });

  return rings;
}

function ProvinceMesh({ province }: { province: ProjectedProvince }) {
  const texture = useTexture(province.texture);
  const sideMaterialRef = useRef<ThreeShaderMaterial>(null!);

  useLayoutEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((_, delta) => {
    if (sideMaterialRef.current) {
      sideMaterialRef.current.uniforms.uTime.value += delta;
    }
  });

  const label = province.data.features[0].properties.name;

  return (
    <group>
      <ShapeBox
        bbox={province.bbox}
        args={[
          province.shapes,
          { depth: MAP_DEPTH, bevelEnabled: false, curveSegments: 2 },
        ]}
      >
        <TerrainTopMaterial attach="material-0" uMap={texture} />
        <TerrainSideMaterial
          attach="material-1"
          ref={sideMaterialRef}
          transparent
        />
      </ShapeBox>

      {province.boundaryRings.map((ring, index) => (
        <Line
          key={index}
          points={ring}
          lineWidth={0.75}
          color="#8fe9ff"
          transparent
          opacity={0.52}
          depthWrite={false}
          toneMapped={false}
          renderOrder={9}
          raycast={() => null}
        />
      ))}

      <Html
        center
        position={province.labelPosition}
        distanceFactor={22}
        zIndexRange={[20, 0]}
      >
        <MapLabel>{label}</MapLabel>
      </Html>
    </group>
  );
}

function RecommendLineScene({ onReady }: { onReady?: () => void }) {
  const projected = useMemo(() => {
    const projection = createProjection();
    const provinces = provinceSources.map((source) =>
      buildProvince(source, projection),
    );
    const bounds = new Box2();
    provinces.forEach((province) => {
      bounds.union(province.bbox);
    });
    const center = bounds.getCenter(new Vector2());
    const hubeiCenter = projection([114.3, 30.9])!;
    const aggregateOutline = buildAggregateOutline(projection);

    return {
      aggregateOutline,
      center,
      provinces,
      hubeiAnchor: [hubeiCenter[0], -hubeiCenter[1]] as [number, number],
    };
  }, []);

  return (
    <group position={[-projected.center.x, -projected.center.y, 0]}>
      <WorldBase hubeiAnchor={projected.hubeiAnchor} />
      {projected.provinces.map((province) => (
        <ProvinceMesh key={province.id} province={province} />
      ))}
      <OutlineGlow rings={projected.aggregateOutline} />
      <SceneReady onReady={onReady} />
    </group>
  );
}

export type RecommendLineMapProps = {
  onReady?: () => void;
};

export default function RecommendLineMap({ onReady }: RecommendLineMapProps) {
  const controlSpeed = useControlSpeed();
  const handleReady = useCallback(() => onReady?.(), [onReady]);

  return (
    <MapRoot role="img" aria-label="精品线路覆盖省份三维地形地图">
      <Canvas
        dpr={[1, 1.5]}
        resize={{ offsetSize: true }}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: 28.5, near: 0.1, far: 360, position: [0, 31, 25.5] }}
      >
        <Suspense fallback={null}>
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <RecommendLineScene onReady={handleReady} />
          </group>
        </Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={controlSpeed}
          panSpeed={controlSpeed}
          zoomSpeed={0.9}
          minDistance={14}
          maxDistance={70}
          minPolarAngle={0.3}
          maxPolarAngle={1.35}
          minAzimuthAngle={-0.9}
          maxAzimuthAngle={0.9}
          screenSpacePanning={false}
        />
      </Canvas>
    </MapRoot>
  );
}
