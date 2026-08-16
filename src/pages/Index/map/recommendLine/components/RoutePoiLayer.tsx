import { Html } from "@react-three/drei";
import { memo, useMemo } from "react";

import { useScreenBaseDataStore } from "@/store/useScreenBaseData";

import {
  buildXinjiangCoalPoiEntry,
  poiData,
  type RecommendRoute,
  type XinjiangCoalPoiSegment,
} from "../../../recommendLineRoutes";
import { calculateMapHtmlPosition } from "../../threeShared";
import {
  AIR_PLANE_SIZE,
  POI_LINE_Z,
  POI_NODE_Z,
  POI_SEGMENT_COLORS,
} from "../constants";
import { bakePoiPoint, getRegionScaleAt } from "../routeLayout";
import { PoiLabel, PoiMarkerWrap, PoiNode } from "../styled";
import type { ProjectedRouteLayout } from "../types";
import RouteSegment from "./RouteSegment";

/** 精品线路 POI 层：按类型画虚线路线，并在有名称的途经点渲染节点图标与标签。 */
function RoutePoiLayerBase({
  layout,
  route,
}: {
  layout: ProjectedRouteLayout;
  route: RecommendRoute;
}) {
  const isAirRoute = route.label === "楚天翼连";
  const isXinjiangCoal = route.label === "疆煤入鄂";
  // 疆煤入鄂使用接口动态数据（异步到达后自动重渲染），其余线路使用静态 poiData
  const xinjiangCoalRoutes = useScreenBaseDataStore(
    (s) => s.xinjiangCoalRoutes,
  );
    const segments = useMemo(() => {
    const poi =
      route.label === "疆煤入鄂"
        ? buildXinjiangCoalPoiEntry(xinjiangCoalRoutes)
        : poiData.find((entry) => entry.key === route.label);
    if (!poi) return [];

    return poi.poiInfo.map((segment, segmentIndex) => {
      // 先烘焙 xy 并记录各控制点所在区域 scale。
      const bakedPoints = segment.routes.map((point) => {
        const [x, y] = bakePoiPoint(layout, point.value[0], point.value[1]);
        return {
          name: point.name,
          x,
          y,
          scale: getRegionScaleAt(layout, point.value[0], point.value[1]),
        };
      });
      // 整条航线统一悬浮于所有途经区域顶面上方：线高/节点高都用最大
      // scale 抬升，避免曲线在跨区域过渡段塌到高 scale 区域顶面之下
      // （如楚天翼连中被放大 1.28 倍的中国地图，其顶面远高于周边小图）。
      const lineScale = Math.max(...bakedPoints.map((point) => point.scale), 1);
      const points = bakedPoints.map((point) => ({
        name: point.name,
        position: [
          point.x,
          point.y,
          POI_LINE_Z * lineScale,
        ] as [number, number, number],
        nodePosition: [
          point.x,
          point.y,
          POI_NODE_Z * lineScale,
        ] as [number, number, number],
      }));
      return {
        type: segment.type,
        // 疆煤入鄂按 line 统一配色（同一 line 内所有 path 同色），
        // 其余静态线路按 segment 依次取色，超出调色板后循环
        color: isXinjiangCoal
          ? POI_SEGMENT_COLORS[
              (segment as XinjiangCoalPoiSegment).lineIndex %
                POI_SEGMENT_COLORS.length
            ]
          : POI_SEGMENT_COLORS[segmentIndex % POI_SEGMENT_COLORS.length],
        points,
        positions: points.map((point) => point.position),
      };
    });
  }, [isXinjiangCoal, layout, route.label, xinjiangCoalRoutes]);

  return (
    <>
      {segments.map((segment, segmentIndex) => {
        if (segment.points.length < 2) return null;

        return (
          <group key={segmentIndex}>
            <RouteSegment
              color={segment.color}
              planeSize={AIR_PLANE_SIZE / layout.fitScale}
              points={segment.positions}
              showFlyDots={segment.type !== "airway"}
              showPlane={isAirRoute && segment.type === "airway"}
            />

            {segment.points.map((point, pointIndex) => {
              if (!point.name) return null; // name 为空不显示节点图标
              const [nodeX, nodeY, nodeZ] = point.nodePosition;
              return (
                <Html
                  calculatePosition={calculateMapHtmlPosition}
                  key={`${point.name}-${pointIndex}`}
                  center
                  eps={0}
                  position={[nodeX, nodeY, nodeZ]}
                  distanceFactor={22 / layout.fitScale}
                  zIndexRange={[30, 0]}
                >
                  <PoiMarkerWrap>
                    <PoiNode $isWuhan={point.name === "武汉"} />
                    <PoiLabel $isAirRoute={isAirRoute}>{point.name}</PoiLabel>
                  </PoiMarkerWrap>
                </Html>
              );
            })}
          </group>
        );
      })}
    </>
  );
}
const RoutePoiLayer = memo(RoutePoiLayerBase);

export default RoutePoiLayer;
