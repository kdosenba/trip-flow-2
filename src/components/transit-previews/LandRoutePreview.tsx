import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

export const LandRoutePreview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: maplibregl.Map | null = null;
    let isMounted = true;

    const initMap = async () => {
      const maplibreglModule = await import("maplibre-gl");
      if (!isMounted || !containerRef.current) return;

      try {
        const par: [number, number] = [2.3522, 48.8566];
        const lon: [number, number] = [-0.1278, 51.5074];

        // Custom multi-stop land route Paris -> Amiens -> Calais -> Folkestone -> London
        const routePoints: [number, number][] = [
          par,
          [2.2957, 49.8942],
          [1.8587, 50.9513],
          [1.1782, 51.0814],
          lon,
        ];

        const options = {
          container: containerRef.current,
          style: "https://tiles.openfreemap.org/styles/dark",
          center: [1.1, 50.2] as [number, number], // Center on English Channel
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

          mapInstance.addSource("land-route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: routePoints,
              },
            },
          });

          // Markers
          new maplibreglModule.Marker({ color: "#ec4899" })
            .setLngLat(par)
            .addTo(mapInstance);

          new maplibreglModule.Marker({ color: "#3b82f6" })
            .setLngLat(lon)
            .addTo(mapInstance);

          // Casing
          mapInstance.addLayer({
            id: "route-casing",
            type: "line",
            source: "land-route",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#1e293b",
              "line-width": 5,
            },
          });

          // Core
          mapInstance.addLayer({
            id: "route-core",
            type: "line",
            source: "land-route",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#3b82f6",
              "line-width": 2.5,
            },
          });
        });
      } catch (err) {
        console.error("LandRoutePreview MapLibre load failure:", err);
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
          color: "#3b82f6",
        }}
      >
        LAND ROUTES (ROUTE)
      </div>
    </div>
  );
};
