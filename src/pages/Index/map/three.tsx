import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Html,
  Line,
  OrbitControls,
  shaderMaterial,
  useTexture,
} from "@react-three/drei";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { geoMercator } from "d3-geo";
import styled from "styled-components";
import {
  AdditiveBlending,
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
  type ShaderMaterial as ThreeShaderMaterial,
  type Texture,
} from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

import hubeiHighwayData from "@/assets/hb-highway.json";
import hubeiMapData from "@/assets/hb.json";
import hubeiOutlineData from "@/assets/hb_outline.json";
import hubeiDem from "@/assets/hb_dem.png";
import worldTerrain from "@/assets/scene-transparent.png";
import type { CityGeoJSON } from "@/types/map";
import ShapeBox from "./shape";

/** 省份挤出厚度（墨卡托投影单位，湖北宽约 21） */
const MAP_DEPTH = 0.66;
const MAP_GLOW_COLOR = "#20dbdb";
const testColor = "#20dbdb24";
/** toneMapped=false 时颜色超过 1 会被渲染为高亮霓虹色 */
const GLOW_EMISSIVE_COLOR = new Color(MAP_GLOW_COLOR).multiplyScalar(2.6);
/** 省界描边宽度（px，与设计稿 1:1） */
const OUTLINE_WIDTH = 2;
/** 高速公路线宽（屏幕像素） */
const HIGHWAY_WIDTH = 4;

/** 世界地形背景贴图宽高比 2262 / 1478 */
const WORLD_ASPECT = 1478 / 2262;
const WORLD_WIDTH = 92;
/** 贴图上湖北大致位置（u 从左、v 从上），用于把它对齐到省份下方 */
const WORLD_HUBEI_U = 0.435;
const WORLD_HUBEI_V = 0.376;

const MapRoot = styled.section`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 0 16px rgba(32, 219, 219, 0.4))
    drop-shadow(0 0 42px rgba(32, 219, 219, 0.18));
`;

const CityLabel = styled.div`
  color: rgba(232, 250, 255, 0.9);
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  font-size: 32px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  text-shadow: 0 2px 4px rgba(0, 18, 28, 0.95), 0 0 6px rgba(0, 18, 28, 0.9);
`;

/**
 * 顶面材质：采样 DEM/卫星影像的亮度，重新映射到
 * 深蓝 → 亮蓝 → 青色高光 的渐变，得到 demo 中"明亮偏蓝"的地形效果。
 */
const TerrainTopMaterial = extend(
  shaderMaterial(
    {
      uMap: null as Texture | null,
      uDeep: new Color("#289ec0"),
      uMid: new Color("#20dbdb"),
      uHigh: new Color("#55e2ff"),
      uOpacity: 1,
    },
    /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    /* glsl */ `
    uniform sampler2D uMap;
    uniform vec3 uDeep;
    uniform vec3 uMid;
    uniform vec3 uHigh;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
      vec3 tex = texture2D(uMap, vUv).rgb;
      float luma = dot(tex, vec3(0.299, 0.587, 0.114));
      luma = pow(clamp(luma * 1.5, 0.0, 1.0), 0.85);

      vec3 color = mix(uDeep, uMid, smoothstep(0.0, 0.55, luma));
      color = mix(color, uHigh, smoothstep(0.55, 1.0, luma));
      gl_FragColor = vec4(color, uOpacity);
    }`
  )
);

/**
 * 侧面材质：底部深海蓝渐变到顶部亮蓝，并带一道缓慢上移的扫光。
 */
const TerrainSideMaterial = extend(
  shaderMaterial(
    {
      uTime: 0,
      uDepth: MAP_DEPTH,
      uTop: new Color("#2aa4e6"),
      uBottom: new Color("#041f3a"),
      uScan: new Color("#57e6ff"),
    },
    /* glsl */ `
    varying float vHeight;
    void main() {
      vHeight = position.z;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    /* glsl */ `
    uniform float uTime;
    uniform float uDepth;
    uniform vec3 uTop;
    uniform vec3 uBottom;
    uniform vec3 uScan;
    varying float vHeight;

    void main() {
      float h = clamp(vHeight / uDepth, 0.0, 1.0);
      vec3 color = mix(uBottom, uTop, pow(h, 1.35));

      float band = fract(uTime * 0.28);
      float scan = smoothstep(0.18, 0.0, abs(h - band));
      color = mix(color, uScan, scan * 0.55);

      gl_FragColor = vec4(color, mix(0.55, 0.95, h));
    }`
  )
);

/**
 * 世界地形背景材质：亮度 → 淡蓝色调，整体保持很低的透明度，
 * 作为 demo 中省份下方隐约可见的全球地形底图。
 */
const WorldBaseMaterial = extend(
  shaderMaterial(
    {
      uMap: null as Texture | null,
      uDeep: new Color("#0c3050"),
      uHigh: new Color("#55c4e8"),
      uOpacity: 1,
    },
    /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    /* glsl */ `
    uniform sampler2D uMap;
    uniform vec3 uDeep;
    uniform vec3 uHigh;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
      vec4 tex = texture2D(uMap, vUv);
      float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      vec3 color = mix(uDeep, uHigh, smoothstep(0.05, 0.9, luma));
      float alpha = tex.a * (0.05 + luma * 0.3) * uOpacity;
      gl_FragColor = vec4(color, alpha);
    }`
  )
);

type ProjectedCity = {
  name: string;
  center: Vector3;
};

type HighwayMultiLineString = {
  type: "MultiLineString";
  coordinates: [number, number][][];
};

/** 补偿 AutoFit 的 CSS 缩放：缩放越小鼠标位移越小，需要放大控制器速度 */
function useControlSpeed() {
  const [speed, setSpeed] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      const scale = Math.min(
        window.innerWidth / 5600,
        window.innerHeight / 2320
      );
      setSpeed(Math.min(4, 1 / Math.max(scale, 0.2)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return speed;
}

function WorldBase() {
  const texture = useTexture(worldTerrain);
  const height = WORLD_WIDTH * WORLD_ASPECT;
  // 平移贴图，让湖北所在位置正好落在省份模型下方
  const offsetX = (0.5 - WORLD_HUBEI_U) * WORLD_WIDTH;
  const offsetY = (WORLD_HUBEI_V - 0.5) * height;

  useLayoutEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh position={[offsetX, offsetY, -0.12]} raycast={() => null}>
      <planeGeometry args={[WORLD_WIDTH, height]} />
      <WorldBaseMaterial
        transparent
        depthWrite={false}
        uMap={texture}
        uOpacity={0.9}
      />
    </mesh>
  );
}

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

    const highwayData = hubeiHighwayData as unknown as HighwayMultiLineString;
    const highwaySegmentCount = highwayData.coordinates.reduce(
      (total, coordinates) => total + Math.max(0, coordinates.length - 1),
      0
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
    const highwayLine = new LineSegments2(
      highwayGeometry,
      highwayMaterial
    );
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
            ])
          );
        });
    });

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
      outlineRings,
      highwayLine,
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
    [projected]
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
        ]}>
        <TerrainTopMaterial attach="material-0" uMap={demTexture} />
        <TerrainSideMaterial
          attach="material-1"
          ref={sideMaterialRef}
          transparent
        />
      </ShapeBox>

      <lineSegments
        geometry={projected.cityBoundaryGeometry}
        raycast={() => null}>
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
        raycast={() => null}>
        <lineBasicMaterial color={GLOW_EMISSIVE_COLOR} toneMapped={false} />
      </lineSegments>

      <primitive object={projected.highwayLine} />

      {/* 省界加粗发光描边：外层光晕 + 中层辉光 + 内层亮色主线 */}
      {projected.outlineRings.map((ring, index) => (
        <group key={index}>
          <Line
            points={ring}
            lineWidth={OUTLINE_WIDTH * 4}
            color={MAP_GLOW_COLOR}
            transparent
            opacity={0.16}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            renderOrder={11}
            raycast={() => null}
          />
          <Line
            points={ring}
            lineWidth={OUTLINE_WIDTH * 14}
            color={testColor}
            transparent
            opacity={0.01}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            renderOrder={22}
            raycast={() => null}
          />
          <Line
            points={ring}
            lineWidth={OUTLINE_WIDTH}
            color={GLOW_EMISSIVE_COLOR}
            toneMapped={false}
            renderOrder={13}
            raycast={() => null}
          />
        </group>
      ))}

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
  const controlSpeed = useControlSpeed();

  return (
    <MapRoot role="img" aria-label="湖北省三维地形地图">
      <Canvas
        dpr={[1, 1.5]}
        resize={{ offsetSize: true }}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: 28.5, near: 0.1, far: 300, position: [0, 22.5, 18.5] }}>
        <Suspense fallback={null}>
          {/* 地图数据位于 XY 平面，整体翻转到 XZ 地面上（+Y 朝上），便于 OrbitControls 交互 */}
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <WorldBase />
            <MapMesh />
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
