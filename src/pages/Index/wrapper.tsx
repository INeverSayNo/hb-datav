import styled from "styled-components";

import AutoFit from "@/components/autoFit";
import dashboardBackground from "@/assets/datav-bg.png";
import BottomNavigation, {
  type DashboardMapView,
} from "./components/BottomNavigation";
import CenterControls from "./components/CenterControls";
import DashboardHeader from "./components/DashboardHeader";
import LeftPanels from "./components/LeftPanels";
import MapLegend from "./components/MapLegend";
import MatrixRain from "./components/MatrixRain";
import RightPanels from "./components/RightPanels";
import EChartsHubeiMap from "./map";
import ThreeHubeiMap from "./map/three";
import { useScreenBaseDataStore } from "@/store/useScreenBaseData";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { GetScreenBaseData } from "@/api/modules/baseDataApi";

// 默认使用 three.js 三维地图，可通过 ?map=echarts 回退到 ECharts 版本
const HubeiMap =
  new URLSearchParams(window.location.search).get("map") === "echarts"
    ? EChartsHubeiMap
    : ThreeHubeiMap;
const RecommendLineMap = lazy(() => import("./map/RecommendLineMap"));

// 地图后方数字雨动画开关：
// - 代码控制：改为 false 即常驻隐藏
// - 运行时控制：URL 加 ?rain=off 隐藏
const SHOW_MATRIX_RAIN =
  new URLSearchParams(window.location.search).get("rain") !== "off";

const Dashboard = styled.div`
  position: relative;
  width: 5600px;
  height: 2320px;
  overflow: hidden;
  color: #fff;
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif;
  background: #061821;
  user-select: none;
`;

const Background = styled.img`
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 5600px;
  height: 2320px;
  object-fit: fill;
  pointer-events: none;
`;

const CenterGlow = styled.div`
  position: absolute;
  left: 1750px;
  top: 550px;
  width: 2100px;
  height: 1340px;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    rgba(6, 85, 100, 0.1) 0%,
    rgba(2, 29, 42, 0.035) 53%,
    rgba(2, 20, 29, 0) 74%
  );
`;

const MapStage = styled.div`
  position: absolute;
  left: 1600px;
  top: 460px;
  z-index: 2;
  width: 2340px;
  height: 1470px;
`;

type MapLayerPhase = "current" | "incoming" | "entering" | "exiting";

const MapLayer = styled.div<{ $phase: MapLayerPhase }>`
  position: absolute;
  inset: 0;
  opacity: ${({ $phase }) =>
    $phase === "current" || $phase === "entering" ? 1 : 0};
  transform: ${({ $phase }) => {
    if ($phase === "incoming") return "scale(1.02)";
    if ($phase === "exiting") return "scale(0.98)";
    return "scale(1)";
  }};
  transform-origin: 50% 52%;
  pointer-events: ${({ $phase }) => ($phase === "current" ? "auto" : "none")};
  transition:
    opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;

  @media (prefers-reduced-motion: reduce) {
    transform: none;
    transition-duration: 80ms;
  }
`;

function DashboardMap({
  onReady,
  view,
}: {
  onReady?: () => void;
  view: DashboardMapView;
}) {
  return view === "province" ? (
    <HubeiMap onReady={onReady} />
  ) : (
    <Suspense fallback={null}>
      <RecommendLineMap onReady={onReady} />
    </Suspense>
  );
}

export default function IndexDashboard() {
  const updateStore = useScreenBaseDataStore((s) => s.updateStore);
  const [currentView, setCurrentView] =
    useState<DashboardMapView>("province");
  const [incomingView, setIncomingView] =
    useState<DashboardMapView | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const [err, data] = await GetScreenBaseData();
      if (!err && data && Object.keys(data || {}).length && !cancelled) {
        updateStore(data);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [updateStore]);

  useEffect(
    () => () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    },
    [],
  );

  const handleViewChange = useCallback(
    (nextView: DashboardMapView) => {
      if (nextView === currentView || incomingView || isAnimating) return;
      setIncomingView(nextView);
    },
    [currentView, incomingView, isAnimating],
  );

  const handleIncomingReady = useCallback(() => {
    if (!incomingView || isAnimating) return;

    setIsAnimating(true);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    transitionTimerRef.current = window.setTimeout(
      () => {
        setCurrentView(incomingView);
        setIncomingView(null);
        setIsAnimating(false);
        transitionTimerRef.current = null;
      },
      reduceMotion ? 100 : 440,
    );
  }, [incomingView, isAnimating]);

  const navigationView = incomingView ?? currentView;

  return (
    <AutoFit dw={5600} dh={2320} aria-label="武汉多式联运服务中心数据大屏">
      <Dashboard>
        <Background src={dashboardBackground} alt="" />
        <CenterGlow />
        <MatrixRain visible={SHOW_MATRIX_RAIN} />
        <MapStage>
          <MapLayer
            key={currentView}
            $phase={isAnimating ? "exiting" : "current"}
            aria-hidden={isAnimating}
          >
            <DashboardMap view={currentView} />
          </MapLayer>
          {incomingView && (
            <MapLayer
              key={incomingView}
              $phase={isAnimating ? "entering" : "incoming"}
              aria-hidden={!isAnimating}
            >
              <DashboardMap
                view={incomingView}
                onReady={handleIncomingReady}
              />
            </MapLayer>
          )}
        </MapStage>
        <MapLegend />
        <DashboardHeader />
        <LeftPanels />
        <CenterControls />
        <RightPanels />
        <BottomNavigation
          activeView={navigationView}
          disabled={incomingView !== null}
          onViewChange={handleViewChange}
        />
      </Dashboard>
    </AutoFit>
  );
}
