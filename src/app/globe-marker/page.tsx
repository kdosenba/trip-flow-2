"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { StyleSpecification } from "maplibre-gl";
import { initialPaperGlobeStyle } from "../../config/paper-globe-style";
import { useTripFlowStore } from "../../store";
import { Marker } from "../../components/Marker";
import { CityHubCard } from "../../components/marker-cards/CityHubCard";
import { OriginCityCard } from "../../components/marker-cards/OriginCityCard";
import { TransitCard } from "../../components/marker-cards/TransitCard";
import { SuggestionCard } from "../../components/marker-cards/SuggestionCard";
import {
  CityHub,
  Transit,
  Suggestion,
  LocationId,
  CityHubId,
  TransitId,
  SuggestionId,
  LocationCategory,
  CityHubType,
  TransportationMode,
  SuggestionType,
} from "../../types/schema";
import "maplibre-gl/dist/maplibre-gl.css";

// Mock Data structure conforming strictly to our schemas
const MOCK_LOCATIONS = {
  loc_north_pole: {
    id: "loc_north_pole" as LocationId,
    name: "Geographical North Pole",
    address: "Arctic Ocean",
    coordinates: { lat: 90, lng: 0 },
    category: "ACTIVITY" as LocationCategory,
    price: { typicalCost: 12000, unit: "PERSON" as const },
  },
  loc_nyc_airport: {
    id: "loc_nyc_airport" as LocationId,
    name: "John F. Kennedy International Airport",
    address: "New York, USA",
    coordinates: { lat: 40.6413, lng: -73.7781 },
    category: "TRANSIT_POINT" as LocationCategory,
  },
  loc_paris_airport: {
    id: "loc_paris_airport" as LocationId,
    name: "Charles de Gaulle Airport",
    address: "Paris, France",
    coordinates: { lat: 49.0097, lng: 2.5479 },
    category: "TRANSIT_POINT" as LocationCategory,
  },
  loc_ushuaia_port: {
    id: "loc_ushuaia_port" as LocationId,
    name: "Port of Ushuaia",
    address: "Ushuaia, Argentina",
    coordinates: { lat: -54.8064, lng: -68.3005 },
    category: "ACTIVITY" as LocationCategory,
    price: { typicalCost: 120, unit: "PERSON" as const },
  },
};

const MOCK_CITY_HUBS: Record<string, CityHub> = {
  hub_north_pole: {
    id: "hub_north_pole" as CityHubId,
    cityName: "North Pole",
    country: "Arctic",
    coordinates: { lat: 90, lng: 0 },
    type: "HUB" as CityHubType,
    itinerary: [],
    resolvedTravelerCount: 1,
    timezone: "UTC",
  },
  hub_nyc: {
    id: "hub_nyc" as CityHubId,
    cityName: "New York",
    country: "United States",
    coordinates: { lat: 40.7128, lng: -74.006 },
    type: "ORIGIN" as CityHubType,
    itinerary: [],
    travelerCount: 3,
    timezone: "America/New_York",
  },
  hub_paris: {
    id: "hub_paris" as CityHubId,
    cityName: "Paris",
    country: "France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
    type: "HUB" as CityHubType,
    itinerary: [],
    resolvedTravelerCount: 3,
    timezone: "Europe/Paris",
  },
  hub_ushuaia: {
    id: "hub_ushuaia" as CityHubId,
    cityName: "Ushuaia",
    country: "Argentina",
    coordinates: { lat: -54.8019, lng: -68.303 },
    type: "HUB" as CityHubType,
    itinerary: [],
    resolvedTravelerCount: 2,
    timezone: "America/Argentina/Ushuaia",
  },
};

const MOCK_TRANSITS: Record<string, Transit> = {
  transit_nyc_paris: {
    id: "transit_nyc_paris" as TransitId,
    fromCityId: "hub_nyc" as CityHubId,
    toCityId: "hub_paris" as CityHubId,
    segments: [
      {
        fromLocationId: "loc_nyc_airport" as LocationId,
        toLocationId: "loc_paris_airport" as LocationId,
        transportMode: "FLIGHT" as TransportationMode,
        startTime: "2026-07-01T08:00:00Z",
        endTime: "2026-07-01T20:00:00Z",
      },
    ],
    price: { typicalCost: 650, unit: "PERSON" as const },
    resolvedTravelerCount: 3,
  },
};

const MOCK_SUGGESTIONS: Record<string, Suggestion> = {
  suggest_arctic: {
    id: "suggest_arctic" as SuggestionId,
    type: "LOCATION_SUGGESTION" as SuggestionType,
    title: "Arctic Expedition",
    description: "Explore the geographic North Pole on a premium icebreaker.",
    targetCityId: "hub_north_pole" as CityHubId,
    suggestedLocation: MOCK_LOCATIONS.loc_north_pole,
    price: { typicalCost: 12000, unit: "PERSON" as const },
  },
};

const MOCK_GRAPH = {
  Locations: MOCK_LOCATIONS,
  CityHubs: MOCK_CITY_HUBS,
  Transits: MOCK_TRANSITS,
  suggestions: MOCK_SUGGESTIONS,
  clientContext: {
    location: {
      iata: "JFK",
      name: "New York",
      country_name: "United States",
      country_code: "US",
      coordinates: { lat: 40.7128, lng: -74.006 },
    },
    language: "en-US",
    currency: "USD",
    timezone: "America/New_York",
  },
};

// Define coordinates and data details for our 5 markers
const MARKER_LOCATIONS = [
  {
    id: "marker_north_pole",
    name: "North Pole (90° N)",
    lat: 90,
    lng: 0,
    type: "SUGGESTION",
    dataId: "suggest_arctic",
  },
  {
    id: "marker_mid_north",
    name: "Paris, France (45° N)",
    lat: 48.8566,
    lng: 2.3522,
    type: "HUB",
    dataId: "hub_paris",
  },
  {
    id: "marker_equator",
    name: "Equator (0° N)",
    lat: 0,
    lng: -60, // Spread longitude for a nicer layout
    type: "ORIGIN",
    dataId: "hub_nyc",
  },
  {
    id: "marker_mid_south",
    name: "Transit Route Connection",
    lat: -20, // Between equator and Ushuaia
    lng: 120, // Spread longitude
    type: "TRANSIT",
    dataId: "transit_nyc_paris",
  },
  {
    id: "marker_south_pole",
    name: "Ushuaia, Argentina (54° S)",
    lat: -54.8019,
    lng: -68.303,
    type: "HUB",
    dataId: "hub_ushuaia",
  },
];

export default function GlobeMarkerPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const animationRef = useRef<number | null>(null);

  const [mapInstance, setMapInstance] = useState<import("maplibre-gl").Map | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [terrainOn, setTerrainOn] = useState<boolean>(true);
  const [exaggeration, setExaggeration] = useState<number>(1.0);

  const setGraph = useTripFlowStore((state) => state.setGraph);

  // Initialize store context with our mock graph
  useEffect(() => {
    setGraph(JSON.parse(JSON.stringify(MOCK_GRAPH)));
  }, [setGraph]);

  // MapLibre Initialization
  useEffect(() => {
    let isMounted = true;
    let mapInst: import("maplibre-gl").Map | null = null;

    const initMap = async () => {
      const maplibregl = await import("maplibre-gl");
      if (!isMounted || !mapContainerRef.current) return;

      try {
        mapInst = new maplibregl.Map({
          container: mapContainerRef.current,
          style: initialPaperGlobeStyle as StyleSpecification,
          center: [0, 20],
          zoom: 1.5,
          pitch: 45,
          maxPitch: 85,
        });

        // Add standard navigation controls (zoom, compass/rotation)
        mapInst.addControl(new maplibregl.NavigationControl(), "top-right");

        // Add blank images to prevent missing icon crashes
        mapInst.on("styleimagemissing", (e) => {
          const id = e.id;
          const size = 16;
          const data = new Uint8Array(size * size * 4);
          if (mapInst) {
            mapInst.addImage(id, { width: size, height: size, data });
          }
        });

        mapInst.on("load", () => {
          if (!isMounted || !mapInst) return;

          // Set canvas zIndex to 1 to place it at the "middle" index
          const canvas = mapInst.getCanvas();
          canvas.style.zIndex = "1";

          if (terrainOn) {
            mapInst.setTerrain({
              source: "terrain-source",
              exaggeration: exaggeration,
            });
          }
        });

        // Intercept all forms of interaction to immediately freeze globe auto-spin
        mapInst.on("dragstart", () => setIsSpinning(false));
        mapInst.on("mousedown", () => setIsSpinning(false));
        mapInst.on("touchstart", () => setIsSpinning(false));
        mapInst.on("wheel", () => setIsSpinning(false));

        mapRef.current = mapInst;
        setMapInstance(mapInst);
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
      if (mapInst) {
        mapInst.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Terrain exaggeration
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      if (terrainOn) {
        mapRef.current.setTerrain({
          source: "terrain-source",
          exaggeration: exaggeration,
        });
      } else {
        mapRef.current.setTerrain(null);
      }
    }
  }, [terrainOn, exaggeration]);

  // Spinning rotation loop
  useEffect(() => {
    if (isSpinning && mapInstance) {
      const spinGlobe = () => {
        if (!mapInstance) return;
        const center = mapInstance.getCenter();
        center.lng += 0.08; // smooth horizontal drift
        mapInstance.jumpTo({ center });
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
  }, [isSpinning, mapInstance]);

  const toggleTerrain = () => {
    setTerrainOn(!terrainOn);
  };

  const flyToMarker = (lat: number, lng: number) => {
    setIsSpinning(false);
    if (mapInstance) {
      mapInstance.flyTo({
        center: [lng, lat],
        zoom: 3.5,
        pitch: 60,
        bearing: 0,
        duration: 3000,
        essential: true,
      });
    }
  };

  return (
    <div className="grid h-screen grid-cols-3 overflow-hidden bg-bg-darker font-mono text-text-primary">
      {/* LEFT PANEL: Overview & Quick Fly links */}
      <section className="flex flex-col overflow-hidden border-r border-border-color bg-bg-dark">
        <header className="border-b border-border-color bg-bg-dark px-5 py-4">
          <h1 className="text-base font-bold text-text-primary">
            📍 Globe Marker Projection
          </h1>
          <span className="text-xxs text-text-muted uppercase tracking-wider">
            3D Toothpick Marker Anchor Styling Sandbox
          </span>
        </header>

        <div className="flex-1 overflow-auto p-5">
          <div className="mb-6 rounded-lg bg-bg-card p-4 shadow-glass">
            <h3 className="m-0 mb-2 text-xs font-bold uppercase text-text-secondary">
              Description
            </h3>
            <p className="m-0 text-xs leading-relaxed text-text-muted">
              This sandbox validates toothpick-style markers projecting perpendicular from a 3D globe. 
              The toothpick lines remain aligned normal to the globe surface, while the embedded cards 
              remain upright (billboarded) and readable. Markers automatically occlude when on the backside of the globe.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xxs font-bold text-text-secondary uppercase tracking-wider">
              Fly to Coordinate Points:
            </span>
            {MARKER_LOCATIONS.map((marker) => (
              <button
                key={marker.id}
                onClick={() => flyToMarker(marker.lat, marker.lng)}
                className="flex cursor-pointer items-center justify-between rounded-md border border-border-color bg-bg-card p-3 text-left text-xs font-bold text-text-primary shadow-xs transition-all hover:-translate-y-0.5 hover:border-origin-color"
              >
                <span>{marker.name}</span>
                <span className="text-xxs text-text-muted uppercase">Fly to</span>
              </button>
            ))}
          </div>
        </div>

        <footer className="border-t border-border-color bg-bg-darker px-5 py-3 flex justify-between text-xs">
          <Link
            href="/globe"
            className="text-text-secondary no-underline hover:text-text-primary"
          >
            ← Style Studio
          </Link>
          <Link
            href="/debug"
            className="text-text-secondary no-underline hover:text-text-primary"
          >
            ⚡ Debug Panel
          </Link>
        </footer>
      </section>

      {/* RIGHT AREA: THE LIVE 3D GLOBE CANVAS (Span 2 columns) */}
      <section className="relative col-span-2 flex h-full flex-col">
        <div ref={mapContainerRef} className="w-full flex-1" />

        {/* Floating Custom Markers rendered in the MapLibre context */}
        {mapInstance &&
          MARKER_LOCATIONS.map((loc) => {
            if (loc.type === "ORIGIN") {
              const originCity = MOCK_CITY_HUBS[loc.dataId];
              return (
                <Marker key={loc.id} map={mapInstance} lat={loc.lat} lng={loc.lng}>
                  <OriginCityCard originCity={originCity!} />
                </Marker>
              );
            }
            if (loc.type === "HUB") {
              const cityHub = MOCK_CITY_HUBS[loc.dataId];
              return (
                <Marker key={loc.id} map={mapInstance} lat={loc.lat} lng={loc.lng}>
                  <CityHubCard cityHub={cityHub!} />
                </Marker>
              );
            }
            if (loc.type === "TRANSIT") {
              const transit = MOCK_TRANSITS[loc.dataId];
              return (
                <Marker key={loc.id} map={mapInstance} lat={loc.lat} lng={loc.lng}>
                  <TransitCard transit={transit!} />
                </Marker>
              );
            }
            if (loc.type === "SUGGESTION") {
              const suggestion = MOCK_SUGGESTIONS[loc.dataId];
              return (
                <Marker key={loc.id} map={mapInstance} lat={loc.lat} lng={loc.lng}>
                  <SuggestionCard
                    suggestion={suggestion!}
                    isAdded={false}
                    onToggleAdd={() => {}}
                  />
                </Marker>
              );
            }
            return null;
          })}

        {/* Elegant Controller Console Panel (Bottom Overlay) */}
        <div
          style={{ width: "85%", maxWidth: "600px" }}
          className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-6 rounded-2xl border border-border-color bg-white/90 p-4 px-6 shadow-glass-hover backdrop-blur-md"
        >
          {/* Spin Animation Toggle */}
          <div className="flex flex-col gap-1">
            <span className="text-text-secondary uppercase" style={{ fontSize: "0.65rem" }}>
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
                className={`inline-block size-1.5 rounded-full ${
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
            <span className="text-text-secondary uppercase" style={{ fontSize: "0.65rem" }}>
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
            <div className="flex justify-between text-text-secondary" style={{ fontSize: "0.65rem" }}>
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
              onChange={(e) => setExaggeration(parseFloat(e.target.value))}
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
