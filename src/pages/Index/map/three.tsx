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
  Path,
  Shape,
  ShapeUtils,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type ShaderMaterial as ThreeShaderMaterial,
} from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

import hubeiHighwayData from "@/assets/hb-highway.json";
import hubeiMapData from "@/assets/hb.json";
import hubeiOutlineData from "@/assets/hb_outline.json";
import hubeiDem from "@/assets/hb_dem.png";
import type { CityGeoJSON } from "@/types/map";
import ShapeBox from "./shape";
import {
  GLOW_EMISSIVE_COLOR,
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
import MapWaterPort from "@/assets/map-waterway-port.png";
import MapAirPort from "@/assets/map-airway.png";
import MapRailwayStation from "@/assets/map-railway-station.png";
import MapWarehouse from "@/assets/map-warehouse.png";

const poiList = [
  {
    lat: "30.86",
    lng: "110.96",
    label: "秭归港",
    icon: MapWaterPort,
  },
  {
    lat: "30.31",
    lng: "112.25",
    label: "荆州港",
    icon: MapWaterPort,
  },
  {
    lat: "30.67",
    lng: "114.57",
    label: "阳逻港",
    icon: MapWaterPort,
  },
  {
    lat: "29.84",
    lng: "113.55",
    label: "洪湖港",
    icon: MapWaterPort,
  },
  {
    lat: "32.02",
    lng: "112.17",
    label: "襄阳南站",
    icon: MapRailwayStation,
  },
  {
    lat: "31.73",
    lng: "113.42",
    label: "随州站",
    icon: MapRailwayStation,
  },
  {
    lat: "30.92717865",
    lng: "113.65160654",
    label: "应城东站",
    icon: MapRailwayStation,
  },
  {
    lat: "30.27",
    lng: "109.46",
    label: "恩施仓库",
    icon: MapWarehouse,
  },
  {
    lat: "30.34",
    lng: "115.05",
    label: "花湖机场",
    icon: MapAirPort,
  },
];

/** 高速公路线宽（屏幕像素） */
const HIGHWAY_WIDTH = 4;

const PoiMarker = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: none;

  img {
    width: 88px;
    height: 88px;
    object-fit: contain;
    filter: drop-shadow(0 2px 6px rgba(0, 18, 28, 0.9));
  }

  span {
    color: rgba(232, 250, 255, 0.95);
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    line-height: 1;
    white-space: nowrap;
    border-radius: 4px;
    border: 1px solid rgba(32, 219, 219, 0.35);
    background: #003a55c9;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 32px;
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

function MapMesh() {
  const demTexture = useTexture(hubeiDem);
  const sideMaterialRef = useRef<ThreeShaderMaterial>(null!);

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
    },
    [projected],
  );

  useFrame((_, delta) => {
    if (sideMaterialRef.current) {
      sideMaterialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group position={[-projected.center.x, -projected.center.y, 0]}>
      <ShapeBox
        bbox={projected.bbox}
        args={[
          projected.shapes,
          { depth: MAP_DEPTH, bevelEnabled: false, curveSegments: 2 },
        ]}
      >
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

      <OutlineGlow rings={projected.outlineRings} />

      {projected.pois.map((poi) => (
        <Html
          key={poi.label}
          center
          position={poi.position}
          distanceFactor={18}
          zIndexRange={[20, 0]}
        >
          <PoiMarker>
            <img src={poi.icon} alt={poi.label} />
            <span>{poi.label}</span>
          </PoiMarker>
        </Html>
      ))}

      {projected.cities.map((city) => (
        <Html
          key={city.name}
          center
          position={city.center}
          distanceFactor={18}
          zIndexRange={[20, 0]}
        >
          <MapLabel>{city.name}</MapLabel>
        </Html>
      ))}
    </group>
  );
}

export type ThreeHubeiMapProps = {
  onReady?: () => void;
};

export default function ThreeHubeiMap({ onReady }: ThreeHubeiMapProps) {
  const controlSpeed = useControlSpeed();

  return (
    <MapRoot role="img" aria-label="湖北省三维地形地图">
      <Canvas
        dpr={[1, 1.5]}
        resize={{ offsetSize: true }}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: 28.5, near: 0.1, far: 300, position: [0, 22.5, 18.5] }}
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
        />
      </Canvas>
    </MapRoot>
  );
}
