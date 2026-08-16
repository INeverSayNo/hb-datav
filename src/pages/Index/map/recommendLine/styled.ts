import styled from "styled-components";

import {
  POI_INNER_WHITE,
  POI_RING_NORMAL,
  POI_RING_WUHAN,
} from "./constants";
import type { MapTransitionPhase } from "./types";

export const MapCanvasLayer = styled.div<{
  $duration: number;
  $phase: MapTransitionPhase;
}>`
  width: 100%;
  height: 100%;
  opacity: ${({ $phase }) =>
    $phase === "visible" || $phase === "entering" ? 1 : 0};
  transform: ${({ $phase }) =>
    $phase === "hidden" || $phase === "exiting" ? "scale(0.985)" : "scale(1)"};
  transform-origin: 50% 52%;
  pointer-events: ${({ $phase }) => ($phase === "visible" ? "auto" : "none")};
  transition:
    opacity ${({ $duration }) => $duration}ms cubic-bezier(0.22, 1, 0.36, 1),
    transform ${({ $duration }) => $duration}ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;

  @media (prefers-reduced-motion: reduce) {
    transform: none;
  }
`;

/** 节点 + 标签的定位容器（中心对齐到 position）。 */
export const PoiMarkerWrap = styled.div`
  position: relative;
  width: 0;
  height: 0;
  pointer-events: none;
`;

/** 节点图标：外环 3px（蓝/红）+ 白色内环 6px（约为外环 2 倍）。 */
export const PoiNode = styled.div<{ $isWuhan?: boolean }>`
  position: absolute;
  left: -13px;
  top: -13px;
  width: 26px;
  height: 26px;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid
      ${({ $isWuhan }) => ($isWuhan ? POI_RING_WUHAN : POI_RING_NORMAL)};
    box-shadow: 0 0 10px
      ${({ $isWuhan }) =>
        $isWuhan ? "rgba(255, 77, 79, 0.7)" : "rgba(47, 140, 255, 0.7)"};
  }

  &::after {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    border: 6px solid ${POI_INNER_WHITE};
  }
`;

/** 节点名称：白底黑字。 */
export const PoiLabel = styled.span<{ $isAirRoute?: boolean }>`
  position: absolute;
  left: 50%;
  top: 17px;
  transform: translateX(-50%);
  background: #ffffff;
  color: #000000;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  font-size: ${({ $isAirRoute }) => ($isAirRoute ? 16 : 38)}px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  padding: ${({ $isAirRoute }) => ($isAirRoute ? "5px 7px" : "10px 12px")};
  border-radius: ${({ $isAirRoute }) => ($isAirRoute ? 5 : 10)}px;
`;
