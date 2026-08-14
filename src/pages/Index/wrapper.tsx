import styled from "styled-components";

import AutoFit from "@/components/autoFit";
import dashboardBackground from "@/assets/datav-bg.png";
import BottomNavigation from "./components/BottomNavigation";
import CenterControls from "./components/CenterControls";
import DashboardHeader from "./components/DashboardHeader";
import LeftPanels from "./components/LeftPanels";
import RightPanels from "./components/RightPanels";
import EChartsHubeiMap from "./map";
import ThreeHubeiMap from "./map/three";

const HubeiMap =
  new URLSearchParams(window.location.search).get("map") === "echarts"
    ? EChartsHubeiMap
    : ThreeHubeiMap;

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
  left: 1580px;
  top: 580px;
  z-index: 2;
  width: 2440px;
  height: 1370px;
`;

export default function IndexDashboard() {
  return (
    <AutoFit dw={5600} dh={2320} aria-label="武汉多式联运服务中心数据大屏">
      <Dashboard>
        <Background src={dashboardBackground} alt="" />
        <CenterGlow />
        <MapStage>
          <HubeiMap />
        </MapStage>
        <DashboardHeader />
        <LeftPanels />
        <CenterControls />
        <RightPanels />
        <BottomNavigation />
      </Dashboard>
    </AutoFit>
  );
}
