import { useLayoutEffect, useMemo } from "react";
import { Html, useTexture } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { geoMercator } from "d3-geo";
import styled from "styled-components";
import {
  Box2,
  BufferGeometry,
  Color,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeUtils,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";

import hubeiMapData from "@/assets/hb.json";
import hubeiOutlineData from "@/assets/hb_outline.json";
import hubeiDem from "@/assets/hb_dem.png";
import type { CityGeoJSON } from "@/types/map";
import ShapeBox from "./shape";

const MAP_DEPTH = 0.72;
const MAP_BACKGROUND_COLOR = "#289ec0";
const MAP_GLOW_COLOR = "#20dbdb";
const GLOW_EMISSIVE_COLOR = new Color(MAP_GLOW_COLOR).multiplyScalar(3.2);

const MapRoot = styled.section`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 0 14px rgba(32, 219, 219, 0.48))
    drop-shadow(0 0 30px rgba(32, 219, 219, 0.2));
`;

const CityLabel = styled.div`
  color: rgba(230, 252, 255, 0.88);
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  font-size: 24px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  text-shadow: 0 2px 4px rgba(0, 18, 28, 0.95),
    0 0 5px rgba(0, 18, 28, 0.9);
`;

type ProjectedCity = {
  name: string;
  center: Vector3;
};

function CameraRig() {
  const camera = useThree((state) => state.camera);

  useLayoutEffect(() => {
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function MapMesh() {
  const demTexture = useTexture(hubeiDem);
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
              MAP_DEPTH + 0.022
            );
          }
        });
      });
    });

    const cityBoundaryGeometry = new BufferGeometry();
    cityBoundaryGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(boundaryPositions, 3)
    );

    const extruded = new ExtrudeGeometry(shapes, {
      depth: MAP_DEPTH,
      bevelEnabled: false,
    });
    const provinceEdgeGeometry = new EdgesGeometry(extruded, 18);
    extruded.dispose();

    const center = bbox.getCenter(new Vector2());
    const cities: ProjectedCity[] = mapData.features.map((feature) => {
      const [x, y] = projection(
        feature.properties.centroid ?? feature.properties.center
      )!;
      return {
        name: feature.properties.name,
        center: new Vector3(x, -y, MAP_DEPTH + 0.12),
      };
    });

    return {
      bbox,
      center,
      shapes,
      cities,
      cityBoundaryGeometry,
      provinceEdgeGeometry,
    };
  }, []);

  useLayoutEffect(() => {
    demTexture.colorSpace = SRGBColorSpace;
    demTexture.needsUpdate = true;
  }, [demTexture]);

  return (
    <group position={[-projected.center.x, -projected.center.y, 0]}>
      <ShapeBox
        bbox={projected.bbox}
        args={[
          projected.shapes,
          { depth: MAP_DEPTH, bevelEnabled: false, curveSegments: 2 },
        ]}
        castShadow
        receiveShadow>
        <meshStandardMaterial
          attach="material-0"
          color={MAP_BACKGROUND_COLOR}
          map={demTexture}
          emissive="#0b5366"
          emissiveIntensity={0.2}
          metalness={0.08}
          roughness={0.82}
        />
        <meshStandardMaterial
          attach="material-1"
          color="#0b5264"
          emissive="#062f3a"
          emissiveIntensity={0.45}
          metalness={0.32}
          roughness={0.58}
        />
      </ShapeBox>

      <lineSegments geometry={projected.cityBoundaryGeometry}>
        <lineBasicMaterial
          color="#54c7d7"
          transparent
          opacity={0.72}
          toneMapped={false}
        />
      </lineSegments>

      <lineSegments geometry={projected.provinceEdgeGeometry} renderOrder={10}>
        <lineBasicMaterial color={GLOW_EMISSIVE_COLOR} toneMapped={false} />
      </lineSegments>

      {projected.cities.map((city) => (
        <Html
          key={city.name}
          center
          position={city.center}
          distanceFactor={18}
          zIndexRange={[20, 0]}>
          <CityLabel>{city.name}</CityLabel>
        </Html>
      ))}
    </group>
  );
}

export default function ThreeHubeiMap() {
  return (
    <MapRoot role="img" aria-label="湖北省三维地形地图">
      <Canvas
        dpr={[1, 1.75]}
        shadows
        resize={{ offsetSize: true }}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: 37, near: 0.1, far: 100, position: [0, -11.5, 23] }}>
        <CameraRig />
        <ambientLight color="#b7f7ff" intensity={0.95} />
        <directionalLight
          castShadow
          color="#d8fbff"
          intensity={1.85}
          position={[-7, -9, 18]}
        />
        <pointLight color={MAP_GLOW_COLOR} intensity={4.5} position={[0, 2, 7]} />
        <MapMesh />
      </Canvas>
    </MapRoot>
  );
}
