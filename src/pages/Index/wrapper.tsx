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
import RouteButtons from "./components/RouteButton";
import MatrixRain from "./components/MatrixRain";
import RightPanels from "./components/RightPanels";
import EChartsHubeiMap from "./map";
import ThreeHubeiMap from "./map/three";
import {
  DEFAULT_RECOMMEND_ROUTE,
  getRecommendRoute,
  RECOMMEND_ROUTES,
  type RecommendRoute,
} from "./recommendLineRoutes";
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
const loadRecommendLineMap = () => import("./map/RecommendLineMap");
const RecommendLineMap = lazy(loadRecommendLineMap);

function preloadRecommendLineMap(route: RecommendRoute) {
  return loadRecommendLineMap().then(({ default: RecommendLineMapModule }) => {
    return RecommendLineMapModule.preload(route);
  });
}

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
  top: 360px;
  z-index: 2;
  width: 2340px;
  height: 1570px;
`;

const MapLoadingOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  background: rgba(4, 20, 30, 0.5);
  backdrop-filter: blur(3px);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
  transition: opacity 240ms ease;
`;

const ScreenLoadingOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  background: rgba(4, 20, 30, 0.62);
  backdrop-filter: blur(4px);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
  transition: opacity 240ms ease;
`;

const LoadingSpinner = styled.div`
  width: 96px;
  height: 96px;
  border: 6px solid rgba(32, 219, 219, 0.18);
  border-top-color: #20dbdb;
  border-radius: 50%;
  animation: map-spin 0.9s linear infinite;
  box-shadow: 0 0 28px rgba(32, 219, 219, 0.35);

  @keyframes map-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: rgba(232, 250, 255, 0.92);
  font-size: 36px;
  letter-spacing: 6px;
  text-shadow: 0 0 14px rgba(32, 219, 219, 0.65);
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
  onRouteTransitionEnd,
  onRouteTransitionError,
  route,
  view,
}: {
  onReady?: () => void;
  onRouteTransitionEnd: (route: RecommendRoute) => void;
  onRouteTransitionError: (route: RecommendRoute) => void;
  route: RecommendRoute;
  view: DashboardMapView;
}) {
  return view === "province" ? (
    <HubeiMap onReady={onReady} />
  ) : (
    <Suspense fallback={null}>
      <RecommendLineMap
        route={route}
        onReady={onReady}
        onRouteTransitionEnd={onRouteTransitionEnd}
        onRouteTransitionError={onRouteTransitionError}
      />
    </Suspense>
  );
}

export default function IndexDashboard() {
  const updateStore = useScreenBaseDataStore((s) => s.updateStore);
  const screenLoading = useScreenBaseDataStore((s) => s.loading);
  const [currentView, setCurrentView] = useState<DashboardMapView>("province");
  const [incomingView, setIncomingView] = useState<DashboardMapView | null>(
    null,
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeRouteLabel, setActiveRouteLabel] = useState(
    DEFAULT_RECOMMEND_ROUTE.label,
  );
  const [displayedRouteLabel, setDisplayedRouteLabel] = useState(
    DEFAULT_RECOMMEND_ROUTE.label,
  );
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);
  const activeRoute =
    getRecommendRoute(activeRouteLabel) ?? DEFAULT_RECOMMEND_ROUTE;
  const displayedRoute =
    getRecommendRoute(displayedRouteLabel) ?? DEFAULT_RECOMMEND_ROUTE;

  useEffect(() => {
    let cancelled = false;
    updateStore({ loading: true });
    const fetchData = async () => {
      const [err, data] = await GetScreenBaseData();
      if (!err && data && Object.keys(data || {}).length && !cancelled) {
        updateStore(data);
      }
      updateStore({ loading: false });
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

  useEffect(() => {
    if (screenLoading || currentView === "recommendLine") return;

    let idleHandle: number | null = null;
    const timeoutHandle = window.setTimeout(() => {
      const preload = () => {
        void preloadRecommendLineMap(activeRoute).catch(() => {
          // 后台预加载失败时保留点击后的正常加载流程。
        });
      };

      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(preload, { timeout: 2000 });
      } else {
        preload();
      }
    }, 600);

    return () => {
      window.clearTimeout(timeoutHandle);
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [activeRoute, currentView, screenLoading]);

  const handleViewChange = useCallback(
    (nextView: DashboardMapView) => {
      if (
        nextView === currentView ||
        incomingView ||
        isAnimating ||
        isRouteTransitioning
      ) {
        return;
      }
      setIncomingView(nextView);
    },
    [currentView, incomingView, isAnimating, isRouteTransitioning],
  );

  const handleViewIntent = useCallback((nextView: DashboardMapView) => {
    if (nextView === "recommendLine") {
      void preloadRecommendLineMap(activeRoute).catch(() => {
        // 悬停预加载失败不影响用户点击后的正常加载。
      });
    }
  }, [activeRoute]);

  const handleRouteIntent = useCallback((route: RecommendRoute) => {
    void preloadRecommendLineMap(route).catch(() => {
      // 线路意图预加载失败时仍可在点击后重试。
    });
  }, []);

  const handleRouteChange = useCallback(
    (route: RecommendRoute) => {
      if (isRouteTransitioning || route.label === activeRoute.label) return;

      setActiveRouteLabel(route.label);
      if (route.mapKey === displayedRoute.mapKey) {
        setDisplayedRouteLabel(route.label);
        return;
      }
      setIsRouteTransitioning(true);
    },
    [activeRoute.label, displayedRoute.mapKey, isRouteTransitioning],
  );

  const handleRouteTransitionEnd = useCallback((route: RecommendRoute) => {
    setDisplayedRouteLabel(route.label);
    setIsRouteTransitioning(false);
  }, []);

  const handleRouteTransitionError = useCallback(() => {
    setActiveRouteLabel(displayedRoute.label);
    setIsRouteTransitioning(false);
  }, [displayedRoute.label]);

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
            <DashboardMap
              view={currentView}
              route={activeRoute}
              onRouteTransitionEnd={handleRouteTransitionEnd}
              onRouteTransitionError={handleRouteTransitionError}
            />
          </MapLayer>
          {incomingView && (
            <MapLayer
              key={incomingView}
              $phase={isAnimating ? "entering" : "incoming"}
              aria-hidden={!isAnimating}
            >
              <DashboardMap
                view={incomingView}
                route={activeRoute}
                onReady={handleIncomingReady}
                onRouteTransitionEnd={handleRouteTransitionEnd}
                onRouteTransitionError={handleRouteTransitionError}
              />
            </MapLayer>
          )}

          <MapLoadingOverlay $visible={incomingView !== null}>
            <LoadingSpinner />
            <LoadingText>地图加载中…</LoadingText>
          </MapLoadingOverlay>
        </MapStage>
        {currentView === "province" && <MapLegend />}
        {currentView === "recommendLine" && (
          <RouteButtons
            activeRoute={activeRoute.label}
            disabled={isRouteTransitioning}
            routes={RECOMMEND_ROUTES}
            onRouteChange={handleRouteChange}
            onRouteIntent={handleRouteIntent}
          />
        )}
        <DashboardHeader />
        <LeftPanels />
        <CenterControls />
        <RightPanels />
        <BottomNavigation
          activeView={navigationView}
          disabled={incomingView !== null || isRouteTransitioning}
          onViewIntent={handleViewIntent}
          onViewChange={handleViewChange}
        />

        <ScreenLoadingOverlay $visible={screenLoading}>
          <LoadingSpinner />
          <LoadingText>数据加载中…</LoadingText>
        </ScreenLoadingOverlay>
      </Dashboard>
    </AutoFit>
  );
}
