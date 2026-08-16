import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AdditiveBlending,
  CatmullRomCurve3,
  LineCurve3,
  SRGBColorSpace,
  Vector3,
  type Group,
  type Sprite as ThreeSprite,
} from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

import airPlaneIcon from "@/assets/air-plan.png";

import {
  AIR_PLANE_SPEED,
  AIR_PLANE_Z,
  FLY_DOT_COUNT,
  FLY_SPEED,
  MAX_CURVE_SAMPLES,
  POI_DASH_SIZE,
  POI_FLOW_SPEED,
  POI_GAP_SIZE,
  POI_LINE_BACK_WIDTH,
  POI_LINE_WIDTH,
  POI_LINE_Z,
} from "../constants";

/**
 * 单段路线：Catmull-Rom 平滑转角 + 加粗虚线（Line2/LineMaterial）+ 虚线流动 + 飞线光点。
 */
function RouteSegmentBase({
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
  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);
  const planeTexture = useTexture(airPlaneIcon);
  const planeRef = useRef<ThreeSprite>(null);
  const planeStartTimeRef = useRef<number | null>(null);

  // drei 的 useTexture 全局缓存同一个 Texture，这里只在首个 RouteSegment 配置一次。
  // 重复设置 needsUpdate=true 会让已上传的贴图整张重传 GPU。
  useLayoutEffect(() => {
    if (planeTexture.colorSpace === SRGBColorSpace) return;
    planeTexture.colorSpace = SRGBColorSpace;
    planeTexture.anisotropy = 8;
    planeTexture.needsUpdate = true;
  }, [planeTexture]);

  useEffect(() => {
    planeStartTimeRef.current = null;
  }, [points, showPlane]);

  /**
   * Line2 / LineGeometry / LineMaterial 都持有 GPU 资源，必须在 effect 里创建。
   *
   * 原本放在 useMemo 中：useMemo 会在 StrictMode 的双调用、或渲染被并发中断丢弃时
   * 重复执行，产生**未提交**的实例；而清理函数只闭包到已提交的那一对，未提交的那些
   * 既不在场景里也永远不会被 dispose，直接泄漏显存。
   *
   * 放进 useLayoutEffect 后，创建与释放成对出现在同一次 effect 生命周期内，
   * 任何被创建的实例都保证会被释放。
   */
  const [lines, setLines] = useState<{
    curve: CatmullRomCurve3 | LineCurve3;
    backLine: Line2;
    mainLine: Line2;
  } | null>(null);

  useLayoutEffect(() => {
    if (points.length < 2) {
      setLines(null);
      return;
    }

    const pts = points.map(([x, y]) => new Vector3(x, y, POI_LINE_Z));
    const curve =
      pts.length === 2
        ? new LineCurve3(pts[0], pts[1])
        : new CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    // 采样点数封顶：控制点数量随接口数据变化，不加上限会让 Line2 顶点数失控。
    const sampled = curve.getPoints(
      Math.min(MAX_CURVE_SAMPLES, Math.max(96, pts.length * 6)),
    );
    const positions = sampled.flatMap((p) => [p.x, p.y, p.z]);

    const buildLine = (opts: {
      dashed: boolean;
      linewidth: number;
      opacity: number;
      renderOrder: number;
    }) => {
      const geometry = new LineGeometry();
      geometry.setPositions(positions);
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

    setLines({ curve, backLine, mainLine });

    return () => {
      backLine.geometry.dispose();
      backLine.material.dispose();
      mainLine.geometry.dispose();
      mainLine.material.dispose();
    };
  }, [color, points]);

  const curve = lines?.curve ?? null;
  const backLine = lines?.backLine ?? null;
  const mainLine = lines?.mainLine ?? null;

  // 像素线宽依赖渲染缓冲尺寸，与视口同步
  useLayoutEffect(() => {
    if (!backLine || !mainLine) return;
    const width = size.width * viewport.dpr;
    const height = size.height * viewport.dpr;
    backLine.material.resolution.set(width, height);
    mainLine.material.resolution.set(width, height);
  }, [backLine, mainLine, size, viewport.dpr]);

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
      const planeElapsed = state.clock.elapsedTime - planeStartTimeRef.current;
      const planeProgress = (planeElapsed * AIR_PLANE_SPEED) % 1;
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
      {showFlyDots &&
        Array.from({ length: FLY_DOT_COUNT }, (_, index) => (
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
const RouteSegment = memo(RouteSegmentBase);

export default RouteSegment;
