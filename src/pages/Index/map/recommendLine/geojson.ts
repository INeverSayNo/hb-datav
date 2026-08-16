import type {
  AdministrativeFeature,
  AdministrativeGeoJSON,
  AdministrativeGeometry,
  PolygonCoordinates,
} from "./types";

export function asAdministrativeData(data: unknown): AdministrativeGeoJSON {
  const geoData = data as AdministrativeGeoJSON | AdministrativeFeature;
  return geoData.type === "FeatureCollection"
    ? geoData
    : { type: "FeatureCollection", features: [geoData] };
}

export function getPolygons(geometry: AdministrativeGeometry): PolygonCoordinates[] {
  return geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.coordinates;
}
