import type { Box2, Shape, Texture, Vector2 } from "three";

import type { RecommendMapId } from "../../recommendLineRoutes";

export type Coordinate = [number, number];
export type PolygonCoordinates = Coordinate[][];

export type AdministrativeGeometry =
  | { type: "Polygon"; coordinates: PolygonCoordinates }
  | { type: "MultiPolygon"; coordinates: PolygonCoordinates[] };

export type AdministrativeProperties = {
  name: string;
  center?: Coordinate;
  centroid?: Coordinate;
};

export type AdministrativeFeature = {
  type: "Feature";
  properties: AdministrativeProperties;
  geometry: AdministrativeGeometry;
};

export type AdministrativeGeoJSON = {
  type: "FeatureCollection";
  features: AdministrativeFeature[];
};

export type MapRegionId = RecommendMapId | "sansha";

export type MapRegionSource = {
  id: MapRegionId;
  data: AdministrativeGeoJSON;
  kind?: "china" | "out" | "province" | "sansha";
  label?: string;
  texture?: string;
};

export type ProjectedMapRegion = MapRegionSource & {
  bbox: Box2;
  shapes: Shape[];
  boundarySegments: [number, number, number][];
  labels: Array<{
    position: [number, number, number];
    text: string;
  }>;
  transform?: {
    position: [number, number, 0];
    scale: number;
  };
};

export type ProjectedRouteLayout = {
  boundarySegments: [number, number, number][];
  chinaBoundarySegments: [number, number, number][];
  center: Vector2;
  fitScale: number;
  mapKey: string;
  regions: ProjectedMapRegion[];
  viewMode: "regional" | "world";
};

export type PreparedRoute = {
  layout: ProjectedRouteLayout;
  textures: ReadonlyMap<RecommendMapId, Texture>;
};

export type MapTransitionPhase = "hidden" | "entering" | "visible" | "exiting";
