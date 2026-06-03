import React, { useEffect, useRef } from "react";
import { getGeodesicPath } from "../../lib/utils/geo";

export const AirArcPreview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("maplibre-gl").Map | null = null;
    let isMounted = true;

    const initMap = async () => {
      const maplibregl = await import("maplibre-gl");
      if (!isMounted || !containerRef.current) return;

      try {
        const nyc: [number, number] = [-74.006, 40.7128];
        const par: [number, number] = [2.3522, 48.8566];
        const geodesicPoints = getGeodesicPath(nyc, par, 60);

        const options = {
          container: containerRef.current,
          style: "https://tiles.openfreemap.org/styles/dark",
          center: [-35.0, 45.0] as [number, number],
          zoom: 1.5,
          projection: { type: "globe" },
          attributionControl: false,
          interactive: false,
        };

        const mapInstance = new maplibregl.Map(
          options as unknown as maplibregl.MapOptions,
        );
        map = mapInstance;

        mapInstance.on("load", () => {
          if (!isMounted) return;

          // Add source for the arc
          mapInstance.addSource("air-arc", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: geodesicPoints,
              },
            },
          });

          // Add markers at coordinates
          new maplibregl.Marker({ color: "#8b5cf6" })
            .setLngLat(nyc)
            .addTo(mapInstance);

          new maplibregl.Marker({ color: "#ec4899" })
            .setLngLat(par)
            .addTo(mapInstance);

          // Add casing/glow layer
          mapInstance.addLayer({
            id: "arc-glow",
            type: "line",
            source: "air-arc",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#8b5cf6",
              "line-width": 5,
              "line-opacity": 0.4,
            },
          });

          // Add core layer
          mapInstance.addLayer({
            id: "arc-core",
            type: "line",
            source: "air-arc",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#ec4899",
              "line-width": 2,
              "line-opacity": 0.95,
            },
          });
        });
      } catch (err) {
        console.error("AirArcPreview MapLibre load failure:", err);
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
          color: "#ec4899",
        }}
      >
        AIR TRAVEL (ARC)
      </div>
    </div>
  );
};
