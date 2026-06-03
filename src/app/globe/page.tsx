"use client";

import React, { useState, useEffect, useRef } from "react";
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        height: "100vh",
        background: "#09090b",
        color: "#e4e4e7",
        fontFamily: "monospace",
        overflow: "hidden",
      }}
    >
      {/* --- LEFT SIDE: JSON EDITOR --- */}
      <section
        style={{
          borderRight: "1px solid #27272a",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header Title & Preset Config */}
        <header
          style={{
            background: "#121215",
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid #27272a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                fontWeight: "bold",
                fontSize: "1rem",
                background: "linear-gradient(90deg, #a855f7, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🗺️ Globe Style Studio
            </h1>
            <span style={{ fontSize: "0.7rem", color: "#71717a" }}>
              Dynamic WebGL 3D Globe Sandbox
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
              Preset:
            </span>
            <select
              value={selectedPreset}
              onChange={(e) => applyPreset(e.target.value)}
              style={{
                background: "#18181b",
                color: "#f4f4f5",
                border: "1px solid #3f3f46",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "0.75rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="paper">Paper Craft Globe</option>
              <option value="dark-neon">Dark Neon Cyberpunk</option>
              <option value="emerald">Emerald Forest Sanctuary</option>
            </select>
          </div>
        </header>

        {/* Dynamic Editor Tabs */}
        <div
          style={{
            background: "#18181b",
            borderBottom: "1px solid #27272a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.25rem 1rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button
              onClick={() => setEditorTab("tree")}
              style={{
                background: editorTab === "tree" ? "#27272a" : "transparent",
                color: editorTab === "tree" ? "#f4f4f5" : "#71717a",
                border: "none",
                borderRadius: "4px",
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              🌳 Interactive Tree Editor
            </button>
            <button
              onClick={() => setEditorTab("raw")}
              style={{
                background: editorTab === "raw" ? "#27272a" : "transparent",
                color: editorTab === "raw" ? "#f4f4f5" : "#71717a",
                border: "none",
                borderRadius: "4px",
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              📝 Raw JSON Code
            </button>
          </div>

          <span
            style={{
              fontSize: "0.7rem",
              color: validationError ? "#ef4444" : "#22c55e",
              background: validationError ? "#450a0a" : "#064e3b",
              padding: "2px 8px",
              borderRadius: "12px",
              fontWeight: "bold",
            }}
          >
            {validationError ? "⚠️ Syntax Error" : "✓ Active / Live"}
          </span>
        </div>

        {/* Editor Render Panel */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "1.25rem",
            background: "#0c0c0f",
          }}
        >
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
              style={{
                width: "100%",
                height: "100%",
                background: "transparent",
                color: "#22c55e",
                border: "none",
                outline: "none",
                resize: "none",
                fontFamily: "monospace",
                fontSize: "0.875rem",
                lineHeight: "1.5",
              }}
            />
          )}
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div
            style={{
              background: "#450a0a",
              borderTop: "1px solid #ef4444",
              color: "#fca5a5",
              padding: "0.75rem 1rem",
              fontSize: "0.8rem",
              whiteSpace: "pre-wrap",
            }}
          >
            <strong>JSON Error:</strong> {validationError}
          </div>
        )}
      </section>

      {/* --- RIGHT SIDE: MAP & CONTROLS --- */}
      <section
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* The Live Map Container */}
        <div ref={mapContainerRef} style={{ width: "100%", flex: 1 }} />

        {/* Floating Flight Presets */}
        <div
          style={{
            position: "absolute",
            top: "1.25rem",
            left: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#a1a1aa",
              textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              letterSpacing: "0.05em",
            }}
          >
            ✈️ FLY TO 3D REGIONS:
          </span>
          <div
            style={{
              display: "flex",
              gap: "0.4rem",
              flexWrap: "wrap",
              maxWidth: "420px",
            }}
          >
            {FLIGHT_DESTINATIONS.map((dest) => (
              <button
                key={dest.name}
                onClick={() => flyToDestination(dest)}
                style={{
                  background: "rgba(18, 18, 22, 0.75)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "20px",
                  padding: "5px 12px",
                  color: "#f4f4f5",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#a855f7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.1)";
                }}
              >
                {dest.name}
              </button>
            ))}
          </div>
        </div>

        {/* Elegant Controller Console Panel (Bottom Overlay) */}
        <div
          style={{
            position: "absolute",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(12, 12, 16, 0.8)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(63, 63, 70, 0.5)",
            borderRadius: "16px",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            width: "85%",
            maxWidth: "680px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
            zIndex: 10,
          }}
        >
          {/* Spin Animation Toggle */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            <span
              style={{
                fontSize: "0.65rem",
                color: "#a1a1aa",
                textTransform: "uppercase",
              }}
            >
              Auto Orbit
            </span>
            <button
              onClick={() => setIsSpinning(!isSpinning)}
              style={{
                background: isSpinning
                  ? "linear-gradient(135deg, #a855f7, #6b21a8)"
                  : "#27272a",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isSpinning
                  ? "0 0 12px rgba(168, 85, 247, 0.6)"
                  : "none",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  background: isSpinning ? "#ffffff" : "#71717a",
                  borderRadius: "50%",
                  animation: isSpinning ? "pulse 1.5s infinite" : "none",
                }}
              />
              {isSpinning ? "Spinning On" : "Spin Globe"}
            </button>
          </div>

          {/* Vertical Divider */}
          <div
            style={{
              width: "1px",
              height: "36px",
              background: "rgba(255,255,255,0.1)",
            }}
          />

          {/* Terrain 3D Elevation Toggle */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            <span
              style={{
                fontSize: "0.65rem",
                color: "#a1a1aa",
                textTransform: "uppercase",
              }}
            >
              Terrain 3D
            </span>
            <button
              onClick={toggleTerrain}
              style={{
                background: terrainOn
                  ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                  : "#27272a",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: terrainOn
                  ? "0 0 12px rgba(59, 130, 246, 0.6)"
                  : "none",
              }}
            >
              Elevation: {terrainOn ? "Enabled" : "Disabled"}
            </button>
          </div>

          {/* Vertical Divider */}
          <div
            style={{
              width: "1px",
              height: "36px",
              background: "rgba(255,255,255,0.1)",
            }}
          />

          {/* Terrain Exaggeration Slider */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.65rem",
                color: "#a1a1aa",
              }}
            >
              <span>MOUNTAIN RELIEF</span>
              <span style={{ color: "#3b82f6", fontWeight: "bold" }}>
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
              style={{
                width: "100%",
                accentColor: "#3b82f6",
                cursor: terrainOn ? "pointer" : "not-allowed",
                opacity: terrainOn ? 1 : 0.4,
                transition: "opacity 0.2s",
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
