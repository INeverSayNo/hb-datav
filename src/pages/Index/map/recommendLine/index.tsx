import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { MOUSE, TOUCH, type PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { RecommendRoute } from "../../recommendLineRoutes";
import { MapRoot, useControlSpeed } from "../threeShared";
import RecommendLineScene from "./Scene";
import { ENTER_DURATION } from "./constants";
import {
  cancelScheduledTextureRelease,
  getMotionDurations,
  prepareRoute,
  scheduleTextureRelease,
} from "./resources";
import { MapCanvasLayer } from "./styled";
import type { MapTransitionPhase, PreparedRoute, ProjectedRouteLayout } from "./types";

export type RecommendLineMapProps = {
  onReady?: () => void;
  onRouteTransitionEnd?: (route: RecommendRoute) => void;
  onRouteTransitionError?: (route: RecommendRoute) => void;
  /** 上层交叉淡入时标记为淡出层，冻结渲染循环。 */
  paused?: boolean;
  route: RecommendRoute;
};

function RecommendLineMap({
  onReady,
  onRouteTransitionEnd,
  onRouteTransitionError,
  paused = false,
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

  useEffect(() => {
    // 重新挂载：取消上一次卸载时排定的贴图释放。
    cancelScheduledTextureRelease();
    return () => {
      requestIdRef.current += 1;
      clearTransitionTimer();
      // 离开精品线路视图后归还贴图显存；投影/布局缓存保留，重进无需重算。
      scheduleTextureRelease();
    };
  }, [clearTransitionTimer]);

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
          // 淡出期间冻结渲染循环：此时整层 opacity 正在归零，3D 内容无需继续走帧。
          // 注意只能在 "exiting" 降级——"hidden" 阶段要靠 SceneReady 的 useFrame
          // 触发 handleSceneReady 才能进入 "entering"，停帧会导致永久卡在空白。
          frameloop={paused || phase === "exiting" ? "demand" : "always"}
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
            enablePan
            enableZoom
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
      </MapCanvasLayer>
    </MapRoot>
  );
}

RecommendLineMap.preload = (route: RecommendRoute) => {
  // 预加载意味着马上还要用，取消排定中的释放，避免刚载入就被丢弃。
  cancelScheduledTextureRelease();
  return prepareRoute(route).then(() => undefined);
};

export default RecommendLineMap;
