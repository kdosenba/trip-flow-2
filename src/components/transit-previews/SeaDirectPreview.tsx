import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { getGeodesicPath } from "../../lib/utils/geo";

export const SeaDirectPreview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: maplibregl.Map | null = null;
    let isMounted = true;

    const initMap = async () => {
      const maplibreglModule = await import("maplibre-gl");
      if (!isMounted || !containerRef.current) return;

      try {
        const lon: [number, number] = [-0.1278, 51.5074];
        const ams: [number, number] = [4.9041, 52.3676];
        const seaPoints = getGeodesicPath(lon, ams, 30);

        const options = {
          container: containerRef.current,
          style: "https://tiles.openfreemap.org/styles/dark",
          center: [2.3, 52.0] as [number, number], // Center on Southern North Sea
          zoom: 4,
          projection: { type: "globe" },
          attributionControl: false,
          interactive: false,
        };

        const mapInstance = new maplibreglModule.Map(
          options as unknown as maplibregl.MapOptions,
        );
        map = mapInstance;

        mapInstance.on("load", () => {
          if (!isMounted) return;

          mapInstance.addSource("sea-route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: seaPoints,
              },
            },
          });

          // Markers
          new maplibreglModule.Marker({ color: "#3b82f6" })
            .setLngLat(lon)
            .addTo(mapInstance);

          new maplibreglModule.Marker({ color: "#10b981" })
            .setLngLat(ams)
            .addTo(mapInstance);

          // Dotted Sea Route
          mapInstance.addLayer({
            id: "sea-dotted",
            type: "line",
            source: "sea-route",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#10b981",
              "line-width": 3,
              "line-dasharray": [2, 4],
            },
          });
        });
      } catch (err) {
        console.error("SeaDirectPreview MapLibre load failure:", err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (map) {
        map.remove();
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "200px" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "8px",
          background: "rgba(13, 14, 20, 0.8)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "4px",
          padding: "2px 6px",
          fontSize: "0.65rem",
          fontWeight: 700,
          color: "#10b981",
        }}
      >
        SEA DIRECT (DIRECT)
      </div>
    </div>
  );
};
