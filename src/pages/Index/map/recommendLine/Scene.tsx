import { Line } from "@react-three/drei";
import { memo } from "react";
import { AdditiveBlending } from "three";

import type { RecommendRoute } from "../../recommendLineRoutes";
import { SceneReady } from "../threeShared";
import MapRegionMesh from "./components/MapRegionMesh";
import RoutePoiLayer from "./components/RoutePoiLayer";
import { RECOMMEND_CHINA_THEME } from "./constants";
import type { PreparedRoute } from "./types";

function RecommendLineSceneBase({
  onReady,
  prepared,
  route,
}: {
  onReady: () => void;
  prepared: PreparedRoute;
  route: RecommendRoute;
}) {
  const { layout, textures } = prepared;
  const labelDistanceFactor = 22 / layout.fitScale;

  return (
    <group scale={layout.fitScale}>
      <group position={[-layout.center.x, -layout.center.y, 0]}>
        {layout.regions.map((region) => (
          <group
            key={region.id}
            position={region.transform?.position ?? [0, 0, 0]}
            scale={region.transform?.scale ?? 1}
          >
            <MapRegionMesh
              labelDistanceFactor={labelDistanceFactor}
              region={region}
              showLabel={
                layout.viewMode !== "world" ||
                region.kind === "china" ||
                region.kind === "sansha"
              }
              texture={
                region.id === "sansha" ? undefined : textures.get(region.id)
              }
            />
          </group>
        ))}
        {layout.boundarySegments.length > 0 && (
          <Line
            points={layout.boundarySegments}
            segments
            lineWidth={0.75}
            color="#8fe9ff"
            transparent
            opacity={0.52}
            depthWrite={false}
            toneMapped={false}
            renderOrder={9}
            raycast={() => null}
          />
        )}
        {layout.chinaBoundarySegments.length > 0 && (
          <group>
            <Line
              points={layout.chinaBoundarySegments}
              segments
              lineWidth={5}
              color={RECOMMEND_CHINA_THEME.glow}
              transparent
              opacity={RECOMMEND_CHINA_THEME.glowOpacity}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
              renderOrder={8}
              raycast={() => null}
            />
            <Line
              points={layout.chinaBoundarySegments}
              segments
              lineWidth={0.9}
              color={RECOMMEND_CHINA_THEME.boundary}
              transparent
              opacity={0.82}
              depthWrite={false}
              toneMapped={false}
              renderOrder={9}
              raycast={() => null}
            />
          </group>
        )}
        <RoutePoiLayer layout={layout} route={route} />
        <SceneReady key={layout.mapKey} onReady={onReady} />
      </group>
    </group>
  );
}
const RecommendLineScene = memo(RecommendLineSceneBase);

export default RecommendLineScene;
