import styled from "styled-components";

import serviceIcon1 from "@/assets/intermodal-manufacturing-enterprise.png";
import serviceIcon2 from "@/assets/intermodal-logistic-enterprise.png";
import serviceIcon3 from "@/assets/intermodal-demand-count.png";
import serviceIcon4 from "@/assets/intermodal-order-count.png";
import serviceIcon5 from "@/assets/intermodal-order-total-price.png";
import serviceIcon6 from "@/assets/intermodal-boutique-line.png";

import nodeImage1 from "@/assets/platform-node-logistic-park.png";
import nodeImage2 from "@/assets/platform-node-highway.png";
import nodeImage3 from "@/assets/platform-node-railway-privateline.png";
import nodeImage4 from "@/assets/platform-node-waterway-port.png";
import nodeImage5 from "@/assets/platform-node-railway-station.png";
import nodeImage6 from "@/assets/platform-node-waterway-ship.png";

import routeBlue from "@/assets/line-service-blue-bg.png";
import routeGreen from "@/assets/line-service-cyan-blue-bg.png";
import routeGold from "@/assets/line-service-orange-bg.png";
import routeArrow from "@/assets/translate.png";
import nodeServiceCardBg from "@/assets/platform-node-service-card-bg.png"

import { nodeMetrics, routes, serviceMetrics, type RouteItem } from "../data";
import SectionTitle from "./SectionTitle";

const RightRail = styled.aside`
  position: absolute;
  left: 4110px;
  top: 284px;
  width: 1420px;
  height: 1880px;
  z-index: 2;
`;

const Panel = styled.section`
  position: absolute;
  left: 0;
  width: 100%;
`;

const ServicePanel = styled(Panel)`
  top: 0;
  height: 620px;
`;

const NodePanel = styled(Panel)`
  top: 690px;
  height: 610px;
`;

const RoutePanel = styled(Panel)`
  top: 1370px;
  height: 480px;
`;

const ServiceGrid = styled.div`
  position: absolute;
  left: 22px;
  right: 22px;
  top: 128px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 205px;
  gap: 20px 16px;
`;

const ServiceItem = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const ServiceIcon = styled.img`
  width: 141px;
  height: 159px;
  flex: 0 0 auto;
  object-fit: contain;
  margin-right: 14px;
`;

const MetricContent = styled.div`
  min-width: 0;
  color: #fff;
  position: relative
`;

const ServiceValue = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 56px;
  line-height: 58px;
  font-weight: 800;
  white-space: nowrap;
  text-shadow: 0 0 13px rgba(119, 219, 255, 0.42);

  small {
    font-size: 30px;
    font-weight: 500;
  }
`;

const ServiceLabel = styled.div`
  margin-top: 10px;
  color: #c6d6de;
  font-size: 30px;
  line-height: 38px;
  white-space: nowrap;
`;

const NodeGrid = styled.div`
  position: absolute;
  left: 22px;
  right: 18px;
  top: 126px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 205px;
  column-gap: 18px;
  row-gap: 20px;
`;

const NodeItemBackground = styled.img`
  position: absolute;
      position: absolute;
    left: -46px;
    width: 266px;
    height: 146px;
    top: -14px;
`

const NodeItem = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const NodeImage = styled.img`
  width: 184px;
  height: 194px;
  flex: 0 0 auto;
  object-fit: contain;
  margin-right: 4px;
`;

const NodeValue = styled.div`
  color: #fff;
  font-size: 56px;
  line-height: 56px;
  font-weight: 800;
  white-space: nowrap;
  text-shadow: 0 0 14px rgba(107, 218, 255, 0.42);
`;

const NodeLabel = styled.div`
  color: #c4d3dc;
  font-size: 30px;
  line-height: 38px;
  white-space: nowrap;
  margin-top: 18px;
`;

const RouteList = styled.div`
  position: absolute;
  right: 64px;
  top: 130px;
  width: 1180px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 18px;
`;

const RouteRow = styled.button<{
  $idx?: number;
}>`
  position: relative;
  width: 1120px;
  height: 90px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f4faff;
  cursor: pointer;
  transition: filter 160ms ease, transform 160ms ease;
  ${(props) => ({
    left: props.$idx === 1 ? '250px' : '0px',
    margin: props.$idx === 1 ?'22px 0' :'auto'
  })}
  
  &:hover,
  &:focus-visible {
    filter: brightness(1.25);
    transform: translateX(-10px);
    outline: none;
  }

  &:active {
    transform: translateX(-6px) scale(0.995);
  }
`;

const RouteBackground = styled.img`
  position: absolute;
  inset: 0;
  width: 640px;
  height: 90px;
  object-fit: fill;
  opacity: 0.9;
`;

const RouteContent = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding-left: 92px;
  font-size: 36px;
  letter-spacing: 1px;
  white-space: nowrap;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
`;

const Province = styled.strong`
  margin-right: 22px;
  font-size: 36px;
`;

const RouteArrow = styled.img`
  width: 46px;
  height: 46px;
  margin-right: 20px;
`;

const serviceIcons = [
  serviceIcon1,
  serviceIcon2,
  serviceIcon3,
  serviceIcon4,
  serviceIcon5,
  serviceIcon6,
];

const nodeImages = [
  nodeImage1,
  nodeImage2,
  nodeImage3,
  nodeImage4,
  nodeImage5,
  nodeImage6,
];

const routeBackgrounds: Record<RouteItem["tone"], string> = {
  blue: routeBlue,
  green: routeGreen,
  gold: routeGold,
};

export default function RightPanels() {
  return (
    <RightRail aria-label="右侧数据面板">
      <ServicePanel>
        <SectionTitle align="right">多式联运服务</SectionTitle>
        <ServiceGrid>
          {serviceMetrics.map((metric, index) => (
            <ServiceItem key={metric.label}>
              <ServiceIcon src={serviceIcons[index]} alt="" />
              <MetricContent>
                <ServiceValue>
                  {metric.value}<small>{metric.unit}</small>
                </ServiceValue>
                <ServiceLabel>{metric.label}</ServiceLabel>
              </MetricContent>
            </ServiceItem>
          ))}
        </ServiceGrid>
      </ServicePanel>

      <NodePanel>
        <SectionTitle align="right">平台节点服务数据</SectionTitle>
        <NodeGrid>
          {nodeMetrics.map((metric, index) => (
            <NodeItem key={metric.label}>
              <NodeImage src={nodeImages[index]} alt="" />
              <MetricContent>
                <NodeItemBackground src={nodeServiceCardBg}/>
                
                <NodeValue>{metric.value}</NodeValue>
                <NodeLabel>{metric.label}</NodeLabel>
              </MetricContent>
            </NodeItem>
          ))}
        </NodeGrid>
      </NodePanel>

      <RoutePanel>
        <SectionTitle align="right">平台精品线路服务概览</SectionTitle>
        <RouteList>
          {routes.map((route, idx) => (
            <RouteRow type="button" key={`${route.province}-${route.text}`} $idx={idx}>
              <RouteBackground src={routeBackgrounds[route.tone]} alt="" />
              <RouteContent>
                <Province>{route.province}</Province>
                <RouteArrow src={routeArrow} alt="" />
                {route.text}
              </RouteContent>
            </RouteRow>
          ))}
        </RouteList>
      </RoutePanel>
    </RightRail>
  );
}
