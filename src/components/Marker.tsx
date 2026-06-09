import React, { useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import type maplibregl from "maplibre-gl";

interface CustomTransform {
  locationToScreenPoint(
    lngLat: { lng: number; lat: number } | [number, number],
    terrainProvider?: {
      getElevationForLngLatZoom: (
        lngLat: { lng: number; lat: number } | [number, number],
        zoom: number
      ) => number;
      getElevationForLngLat: (
        lngLat: { lng: number; lat: number } | [number, number]
      ) => number;
    }
  ): { x: number; y: number } | null;
  isLocationOccluded(lngLat: { lng: number; lat: number } | [number, number]): boolean;
}

interface MapLibreMapWithTransform {
  transform: CustomTransform;
}

function getCardOffset(dx: number, dy: number, w: number, h: number, r: number = 12): { ox: number; oy: number } {
  const len = Math.hypot(dx, dy);
  if (len < 1) return { ox: 0, oy: 0 };

  const ux = dx / len;
  const uy = dy / len;

  const halfW = w / 2;
  const halfH = h / 2;
  const innerW = halfW - r;
  const innerH = halfH - r;

  const tx = ux !== 0 ? halfW / Math.abs(ux) : Infinity;
  const ty = uy !== 0 ? halfH / Math.abs(uy) : Infinity;

  const t = Math.min(tx, ty);
  const ix = t * ux;
  const iy = t * uy;

  if (r > 0 && Math.abs(ix) > innerW && Math.abs(iy) > innerH) {
    const cx = Math.sign(ux) * innerW;
    const cy = Math.sign(uy) * innerH;

    const b = -2 * (ux * cx + uy * cy);
    const c = cx * cx + cy * cy - r * r;
    const discriminant = b * b - 4 * c;

    if (discriminant >= 0) {
      const t1 = (-b + Math.sqrt(discriminant)) / 2;
      const t2 = (-b - Math.sqrt(discriminant)) / 2;
      const tCircle = Math.max(t1, t2);
      return { ox: tCircle * ux, oy: tCircle * uy };
    }
  }

  return { ox: ix, oy: iy };
}

interface MarkerProps {
  map: maplibregl.Map | null;
  lng: number;
  lat: number;
  children: React.ReactNode;
}

export const Marker: React.FC<MarkerProps> = ({ map, lng, lat, children }) => {
  // Create a container element that persists for the lifetime of this component
  const el = useMemo(() => {
    if (typeof window === "undefined") return null as unknown as HTMLDivElement;
    const div = document.createElement("div");
    div.style.position = "absolute";
    // We want to avoid pointer events interfering with map dragging on the toothpick,
    // but the card itself should be clickable.
    div.style.pointerEvents = "none";
    return div;
  }, []);

  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!map || !el) return;

    // Load maplibre-gl dynamically to get the constructor
    let active = true;
    let markerInstance: maplibregl.Marker | null = null;

    import("maplibre-gl").then((maplibreglModule) => {
      if (!active) return;
      markerInstance = new maplibreglModule.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .addTo(map);

      markerRef.current = markerInstance;
    });

    return () => {
      active = false;
      if (markerInstance) {
        markerInstance.remove();
      }
      markerRef.current = null;
    };
  }, [map, el, lng, lat]);

  useEffect(() => {
    if (!map || !el) return;

    const updatePosition = () => {
      if (!map || !markerRef.current) return;

      // 1. Get screen coordinates of marker (elevation 0)
      const pos = map.project([lng, lat]);

      // 2. Calculate dynamic altitude based on zoom level.
      // We scale the altitude exponentially with the zoom level to keep the toothpick's screen length
      // nearly constant, which ensures the card stays hovered above the city dot and never blocks it.
      // We cap the minimum altitude at 10 meters to prevent terrain collisions at extreme zoom levels.
      const zoom = map.getZoom();
      const altitude = Math.min(1500000, Math.max(10, 1000000 * Math.pow(2, 3 - zoom)));
      const lineOpacity = 1;

      // Project a point in the sky directly above the anchor to get the 3D normal vector on screen
      let dx = 0;
      let dy = -100; // Default fallback

      const customMap = map as unknown as MapLibreMapWithTransform;
      if (customMap.transform) {
        const posSky = customMap.transform.locationToScreenPoint(
          { lng, lat },
          {
            getElevationForLngLatZoom: (_lngLat, _z) => altitude,
            getElevationForLngLat: (_lngLat) => altitude,
          }
        );

        if (posSky) {
          dx = posSky.x - pos.x;
          dy = posSky.y - pos.y;
        }
      }

      // 3. Occlusion check: Native MapLibre globe occlusion detector
      const isBehindGlobe = customMap.transform
        ? customMap.transform.isLocationOccluded({ lng, lat })
        : false;

      if (isBehindGlobe) {
        // Position behind the canvas (zIndex 0) and faded out
        el.style.zIndex = "0";
        el.style.opacity = "0.2";
        el.style.pointerEvents = "none";
      } else {
        // Position in front of the canvas (zIndex 2) and fully visible
        el.style.zIndex = "2";
        el.style.opacity = "1";
        el.style.pointerEvents = "auto";
      }

      // 4. Update style attributes of children inside DOM directly for maximum smoothness
      const line = el.querySelector(".toothpick-line-svg") as SVGLineElement | null;
      const cardContainer = el.querySelector(".marker-card-container") as HTMLElement | null;

      if (line) {
        line.setAttribute("x2", (500 + dx).toString());
        line.setAttribute("y2", (500 + dy).toString());
        line.style.opacity = lineOpacity.toString();
      }

      if (cardContainer) {
        // Retrieve dynamic card dimensions (fallback to standard sizes)
        const w = cardContainer.offsetWidth || 240;
        const h = cardContainer.offsetHeight || 120;
        
        // Retrieve dynamic computed border radius from the actual card child
        const firstChild = cardContainer.firstElementChild;
        let r = 12;
        if (firstChild) {
          const computedStyle = window.getComputedStyle(firstChild);
          r = parseFloat(computedStyle.borderTopLeftRadius) || 12;
        }
        
        // Calculate offset so the toothpick tip touches the exact boundary of the card
        const { ox, oy } = getCardOffset(dx, dy, w, h, r);
        
        cardContainer.style.transform = `translate(calc(-50% + ${dx + ox}px), calc(-50% + ${dy + oy}px))`;
      }
    };

    // Listen to move and render events
    map.on("move", updatePosition);
    map.on("render", updatePosition);

    // Initial position update
    updatePosition();

    return () => {
      map.off("move", updatePosition);
      map.off("render", updatePosition);
    };
  }, [map, el, lng, lat]);

  if (!el) return null;

  return ReactDOM.createPortal(
    <div className="relative size-0">
      {/* 1. Anchor dot on the globe surface */}
      <div className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-md bg-transit-color" />

      {/* 2. Toothpick line connecting surface anchor (0,0) to sky point (dx,dy) */}
      <svg
        className="absolute pointer-events-none overflow-visible"
        style={{
          left: -500,
          top: -500,
          width: 1000,
          height: 1000,
        }}
      >
        <line
          x1={500}
          y1={500}
          x2={500}
          y2={500}
          stroke="currentColor"
          strokeWidth={2.5}
          className="toothpick-line-svg text-text-primary"
          style={{ opacity: 0.75 }}
        />
      </svg>

      {/* 3. Card container (floating at offset) */}
      <div
        className="marker-card-container absolute top-1/2 left-1/2 pointer-events-auto transition-all duration-75"
        style={{
          transform: "translate(-50%, -50%)",
        }}
      >
        {children}
      </div>
    </div>,
    el,
  );
};
