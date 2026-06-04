"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { StyleSpecification } from "maplibre-gl";
import { CollapsibleJsonViewer } from "../../components/CollapsibleJsonViewer";
import { initialPaperGlobeStyle } from "../../config/paper-globe-style";
import { produce } from "immer";
import "maplibre-gl/dist/maplibre-gl.css";

// Dynamic style presets
const DARK_NEON_PRESET: StyleSpecification = {
  ...initialPaperGlobeStyle,
  name: "Dark Neon Cyberpunk",
  layers: (initialPaperGlobeStyle.layers as Record<string, unknown>[]).map(
    (layer) => {
      if (layer.id === "background") {
        return {
          ...layer,
          paint: { "background-color": "#09090c" },
        };
      }
      if (layer.id === "hills") {
        return {
          ...layer,
          paint: {
            "hillshade-shadow-color": "#110c1a",
            "hillshade-exaggeration": 0.6,
          },
        };
      }
      if (layer.id === "landcover_wood") {
        return {
          ...layer,
          paint: { "fill-color": "#12101e", "fill-opacity": 0.8 },
        };
      }
      if (layer.id === "park") {
        return {
          ...layer,
          paint: { "fill-color": "#18142c", "fill-opacity": 0.9 },
        };
      }
      if (layer.id === "water") {
        return {
          ...layer,
          paint: { "fill-color": "#030712" },
        };
      }
      if (layer.id === "admin_country") {
        return {
          ...layer,
          paint: {
            "line-color": "#8b5cf6",
            "line-width": 1.5,
            "line-dasharray": [1, 2],
          },
        };
      }
      if (layer.id === "road_primary_ground_top") {
        return {
          ...layer,
          paint: {
            "line-color": "#ec4899",
            "line-width": {
              base: 1.2,
              stops: [
                [5, 0.5],
                [12, 3],
                [16, 7],
                [20, 16],
              ],
            },
          },
        };
      }
      if (layer.id === "road_motorway_ground_top") {
        return {
          ...layer,
          paint: {
            "line-color": "#3b82f6",
            "line-width": {
              base: 1.2,
              stops: [
                [5, 0.5],
                [12, 3.5],
                [16, 10],
                [20, 22],
              ],
            },
          },
        };
      }
      if (typeof layer.id === "string" && layer.id.startsWith("label_")) {
        return {
          ...layer,
          paint: {
            ...(layer.paint as Record<string, unknown> | undefined),
            "text-color": "#c084fc",
            "text-halo-color": "#09090c",
            "text-halo-width": 1.5,
          },
        };
      }
      return layer;
    },
  ) as StyleSpecification["layers"],
};

const EMERALD_FOREST_PRESET: StyleSpecification = {
  ...initialPaperGlobeStyle,
  name: "Emerald Forest Sanctuary",
  layers: (initialPaperGlobeStyle.layers as Record<string, unknown>[]).map(
    (layer) => {
      if (layer.id === "background") {
        return {
          ...layer,
          paint: { "background-color": "#e6f4ea" },
        };
      }
      if (layer.id === "hills") {
        return {
          ...layer,
          paint: {
            "hillshade-shadow-color": "#1b5e20",
            "hillshade-exaggeration": 0.4,
          },
        };
      }
      if (layer.id === "landcover_wood") {
        return {
          ...layer,
          paint: { "fill-color": "#a8e6cf", "fill-opacity": 0.7 },
        };
      }
      if (layer.id === "park") {
        return {
          ...layer,
          paint: { "fill-color": "#81c784", "fill-opacity": 0.8 },
        };
      }
      if (layer.id === "water") {
        return {
          ...layer,
          paint: { "fill-color": "#00bcd4" },
        };
      }
      if (layer.id === "admin_country") {
        return {
          ...layer,
          paint: {
            "line-color": "#2e7d32",
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        };
      }
      if (layer.id === "road_primary_ground_top") {
        return {
          ...layer,
          paint: {
            "line-color": "#ff8a65",
            "line-width": {
              base: 1.2,
              stops: [
                [5, 0.2],
                [12, 2.5],
                [16, 7],
                [20, 16],
              ],
            },
          },
        };
      }
      if (layer.id === "road_motorway_ground_top") {
        return {
          ...layer,
          paint: {
            "line-color": "#ffb74d",
            "line-width": {
              base: 1.2,
              stops: [
                [5, 0.5],
                [12, 3],
                [16, 10],
                [20, 22],
              ],
            },
          },
        };
      }
      if (typeof layer.id === "string" && layer.id.startsWith("label_")) {
        return {
          ...layer,
          paint: {
            ...(layer.paint as Record<string, unknown> | undefined),
            "text-color": "#1b5e20",
            "text-halo-color": "#e6f4ea",
            "text-halo-width": 1.5,
          },
        };
      }
      return layer;
    },
  ) as StyleSpecification["layers"],
};

const FLIGHT_DESTINATIONS = [
  {
    name: "New York City",
    center: [-73.97, 40.71] as [number, number],
    zoom: 13,
    pitch: 65,
    bearing: 0,
  },
  {
    name: "Swiss Alps (Matterhorn)",
    center: [7.6586, 45.9763] as [number, number],
    zoom: 12,
    pitch: 75,
    bearing: 120,
  },
  {
    name: "Grand Canyon",
    center: [-112.1129, 36.1069] as [number, number],
    zoom: 11,
    pitch: 65,
    bearing: -30,
  },
  {
    name: "Mount Everest",
    center: [86.925, 27.9881] as [number, number],
    zoom: 12.5,
    pitch: 70,
    bearing: 45,
  },
];

export default function GlobePage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const animationRef = useRef<number | null>(null);

  const [currentStyle, setCurrentStyle] = useState<StyleSpecification>(
    initialPaperGlobeStyle,
  );
  const [rawJsonText, setRawJsonText] = useState<string>("");
  const [editorTab, setEditorTab] = useState<"tree" | "raw">("tree");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Map Controls State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [exaggeration, setExaggeration] = useState<number>(1.0);
  const [terrainOn, setTerrainOn] = useState<boolean>(true);
  const [selectedPreset, setSelectedPreset] = useState<string>("paper");

  const [prevStyle, setPrevStyle] = useState<StyleSpecification>(currentStyle);
  if (currentStyle !== prevStyle) {
    setPrevStyle(currentStyle);
    setRawJsonText(JSON.stringify(currentStyle, null, 2));
  }

  // Load MapLibre GL dynamically to prevent SSR failures
  useEffect(() => {
    let isMounted = true;
    let mapInstance: import("maplibre-gl").Map | null = null;

    const initMap = async () => {
      const maplibregl = await import("maplibre-gl");
      if (!isMounted || !mapContainerRef.current) return;

      try {
        mapInstance = new maplibregl.Map({
          container: mapContainerRef.current,
          style: currentStyle,
          center: currentStyle.center || [-73.97, 40.71],
          zoom: currentStyle.zoom || 14,
          pitch: 60,
          maxPitch: 85,
        });

        mapInstance.on("styleimagemissing", (e) => {
          const id = e.id;
          const size = 16;
          const data = new Uint8Array(size * size * 4);
          if (mapInstance) {
            mapInstance.addImage(id, { width: size, height: size, data });
          }
        });

        mapRef.current = mapInstance;

        mapInstance.on("load", () => {
          if (!isMounted || !mapInstance) return;
          if (terrainOn) {
            mapInstance.setTerrain({
              source: "terrain-source",
              exaggeration: exaggeration,
            });
          }
        });

        mapInstance.on("dragstart", () => {
          setIsSpinning(false);
        });
      } catch (err) {
        console.error("MapLibre Initialization Error:", err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mapInstance) {
        mapInstance.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update MapLibre style dynamically when state changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      try {
        mapRef.current.setStyle(currentStyle, { diff: true });

        // Reapply terrain settings after style update
        if (terrainOn) {
          mapRef.current.setTerrain({
            source: "terrain-source",
            exaggeration: exaggeration,
          });
        } else {
          mapRef.current.setTerrain(null);
        }
      } catch (e) {
        console.warn("Map style diff warning:", e);
      }
    }
  }, [currentStyle, terrainOn, exaggeration]);

  // Smooth Globe Spin Animation Frame
  useEffect(() => {
    if (isSpinning && mapRef.current) {
      const spinGlobe = () => {
        if (!mapRef.current) return;
        const center = mapRef.current.getCenter();
        center.lng += 0.08; // smooth horizontal drift
        mapRef.current.jumpTo({ center });
        animationRef.current = requestAnimationFrame(spinGlobe);
      };
      animationRef.current = requestAnimationFrame(spinGlobe);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpinning]);

  // Handle raw text input parsing
  const handleRawJsonChange = (text: string) => {
    setRawJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setValidationError(null);
      setCurrentStyle(parsed);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid JSON syntax";
      setValidationError(errorMessage);
    }
  };

  const handleExaggerationSlider = (val: number) => {
    setExaggeration(val);
    // Update style state
    setCurrentStyle((prev) =>
      produce(prev, (draft) => {
        const d = draft as {
          terrain?: { source?: string; exaggeration?: number };
        };
        if (!d.terrain) {
          d.terrain = { source: "terrain-source", exaggeration: val };
        } else {
          d.terrain.exaggeration = val;
        }
      }),
    );
  };

  const toggleTerrain = () => {
    const nextState = !terrainOn;
    setTerrainOn(nextState);
    if (mapRef.current) {
      if (nextState) {
        mapRef.current.setTerrain({
          source: "terrain-source",
          exaggeration: exaggeration,
        });
      } else {
        mapRef.current.setTerrain(null);
      }
    }
  };

  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    let targetStyle: StyleSpecification = initialPaperGlobeStyle;
    if (presetKey === "dark-neon") {
      targetStyle = DARK_NEON_PRESET;
    } else if (presetKey === "emerald") {
      targetStyle = EMERALD_FOREST_PRESET;
    }
    setCurrentStyle(targetStyle);
    setValidationError(null);
  };

  const flyToDestination = (dest: (typeof FLIGHT_DESTINATIONS)[0]) => {
    setIsSpinning(false);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: dest.center,
        zoom: dest.zoom,
        pitch: dest.pitch,
        bearing: dest.bearing,
        duration: 3500,
        essential: true,
      });
    }
  };

  return (
    <div className="grid h-screen grid-cols-2 overflow-hidden bg-bg-darker font-mono text-text-primary">
      {/* --- LEFT SIDE: JSON EDITOR --- */}
      <section className="flex flex-col overflow-hidden border-r border-border-color">
        {/* Header Title & Preset Config */}
        <header className="flex items-center justify-between border-b border-border-color bg-bg-dark px-5 py-3">
          <div>
            <h1 className="text-base font-bold text-text-primary">
              🗺️ Globe Style Studio
            </h1>
            <span className="text-[0.7rem] text-text-muted">
              Dynamic WebGL 3D Globe Sandbox
            </span>
          </div>

          <div className="flex gap-4 text-xs">
            <Link
              href="/component-styling"
              className="text-text-secondary no-underline transition-colors hover:text-text-primary"
            >
              🎨 Styling
            </Link>
            <Link
              href="/debug"
              className="text-text-secondary no-underline transition-colors hover:text-text-primary"
            >
              ⚡ Debug
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Preset:</span>
            <select
              value={selectedPreset}
              onChange={(e) => applyPreset(e.target.value)}
              className="cursor-pointer rounded-md border border-border-color bg-bg-darker px-2 py-1 text-xs text-text-primary outline-none focus:border-border-hover"
            >
              <option value="paper">Paper Craft Globe</option>
              <option value="dark-neon">Dark Neon Cyberpunk</option>
              <option value="emerald">Emerald Forest Sanctuary</option>
            </select>
          </div>
        </header>

        {/* Dynamic Editor Tabs */}
        <div className="flex items-center justify-between border-b border-border-color bg-bg-darker px-4 py-1">
          <div className="flex gap-1">
            <button
              onClick={() => setEditorTab("tree")}
              className={`cursor-pointer rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
                editorTab === "tree"
                  ? "bg-bg-dark text-text-primary"
                  : "bg-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              🌳 Interactive Tree Editor
            </button>
            <button
              onClick={() => setEditorTab("raw")}
              className={`cursor-pointer rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
                editorTab === "raw"
                  ? "bg-bg-dark text-text-primary"
                  : "bg-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              📝 Raw JSON Code
            </button>
          </div>

          <span
            className={`rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${
              validationError
                ? "bg-budget-danger/15 text-budget-danger"
                : "bg-budget-safe/15 text-budget-safe"
            }`}
          >
            {validationError ? "⚠️ Syntax Error" : "✓ Active / Live"}
          </span>
        </div>

        {/* Editor Render Panel */}
        <div className="flex-1 overflow-auto bg-bg-darker p-5">
          {editorTab === "tree" ? (
            <CollapsibleJsonViewer
              data={currentStyle}
              depth={0}
              editable={true}
              onChange={(updated) => {
                setCurrentStyle(updated as StyleSpecification);
                setValidationError(null);
              }}
            />
          ) : (
            <textarea
              value={rawJsonText}
              onChange={(e) => handleRawJsonChange(e.target.value)}
              spellCheck="false"
              className="h-full w-full resize-none border-none bg-transparent font-mono text-sm leading-relaxed text-budget-safe outline-none"
            />
          )}
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="border-t border-budget-danger bg-budget-danger/15 p-4 text-xs text-text-primary whitespace-pre-wrap">
            <strong>JSON Error:</strong> {validationError}
          </div>
        )}
      </section>

      {/* --- RIGHT SIDE: MAP & CONTROLS --- */}
      <section className="relative flex h-full flex-col">
        {/* The Live Map Container */}
        <div ref={mapContainerRef} className="w-full flex-1" />

        {/* Floating Flight Presets */}
        <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
          <span className="text-xs font-bold tracking-wider text-text-secondary shadow-xs">
            ✈️ FLY TO 3D REGIONS:
          </span>
          <div className="flex max-w-[420px] flex-wrap gap-1.5">
            {FLIGHT_DESTINATIONS.map((dest) => (
              <button
                key={dest.name}
                onClick={() => flyToDestination(dest)}
                className="cursor-pointer rounded-full border border-border-color bg-bg-card px-3 py-1 text-xs text-text-primary shadow-glass backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-origin-color"
              >
                {dest.name}
              </button>
            ))}
          </div>
        </div>

        {/* Elegant Controller Console Panel (Bottom Overlay) */}
        <div className="absolute bottom-6 left-1/2 z-10 flex w-[85%] max-w-[680px] -translate-x-1/2 items-center gap-6 rounded-2xl border border-border-color bg-white/90 p-4 px-6 shadow-glass-hover backdrop-blur-md">
          {/* Spin Animation Toggle */}
          <div className="flex flex-col gap-1">
            <span className="text-[0.65rem] uppercase text-text-secondary">
              Auto Orbit
            </span>
            <button
              onClick={() => setIsSpinning(!isSpinning)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-300 ${
                isSpinning
                  ? "bg-origin-color text-white shadow-glass-hover"
                  : "bg-bg-dark text-text-primary"
              }`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  isSpinning ? "animate-pulse bg-white" : "bg-text-secondary"
                }`}
              />
              {isSpinning ? "Spinning On" : "Spin Globe"}
            </button>
          </div>

          {/* Vertical Divider */}
          <div className="h-9 w-px bg-border-color" />

          {/* Terrain 3D Elevation Toggle */}
          <div className="flex flex-col gap-1">
            <span className="text-[0.65rem] uppercase text-text-secondary">
              Terrain 3D
            </span>
            <button
              onClick={toggleTerrain}
              className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-all duration-300 ${
                terrainOn
                  ? "bg-transit-color text-white shadow-glass-hover"
                  : "bg-bg-dark text-text-primary"
              }`}
            >
              Elevation: {terrainOn ? "Enabled" : "Disabled"}
            </button>
          </div>

          {/* Vertical Divider */}
          <div className="h-9 w-px bg-border-color" />

          {/* Terrain Exaggeration Slider */}
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex justify-between text-[0.65rem] text-text-secondary">
              <span>MOUNTAIN RELIEF</span>
              <span className="font-bold text-transit-color">
                {exaggeration.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={exaggeration}
              disabled={!terrainOn}
              onChange={(e) =>
                handleExaggerationSlider(parseFloat(e.target.value))
              }
              className={`w-full accent-transit-color transition-opacity ${
                terrainOn ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40"
              }`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
