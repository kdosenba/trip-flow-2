"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import "maplibre-gl/dist/maplibre-gl.css";

// Import schemas and types
import {
  TripFlowGraphSchema,
  CityHub,
  Location,
  Suggestion,
  Budget,
  TargetDateRange,
  Transit,
  TripFlowGraph,
  ItineraryItem,
  CityHubId,
  LocationId,
  TransitId,
  SuggestionId,
} from "../../types/schema";

// Import Zustand Store
import { useTripFlowStore } from "../../store";

// Import modular card components
import { OriginCityCard } from "../../components/marker-cards/OriginCityCard";
import { CityHubCard } from "../../components/marker-cards/CityHubCard";
import { ItineraryEventCard } from "../../components/marker-cards/ItineraryEventCard";
import { TransitLocationCard } from "../../components/marker-cards/TransitLocationCard";
import { SuggestionCard } from "../../components/marker-cards/SuggestionCard";
import { TransitCard } from "../../components/marker-cards/TransitCard";

// Import modular dashboard components
import { BudgetDashboard } from "../../components/dashboards/BudgetDashboard";
import { TargetDateRangeDashboard } from "../../components/dashboards/TargetDateRangeDashboard";
import { CityHubDashboard } from "../../components/dashboards/CityHubDashboard";

// Import transit preview components
import { AirArcPreview } from "../../components/transit-previews/AirArcPreview";
import { LandRoutePreview } from "../../components/transit-previews/LandRoutePreview";
import { SeaDirectPreview } from "../../components/transit-previews/SeaDirectPreview";

// Import utilities
import { DateTimeFormatter } from "../../lib/utils/date";

// Import Lucide icons for empty states
import { Database, PlusCircle, Trash2, ArrowRight } from "lucide-react";

export default function ComponentStylingPage() {
  const [hasHydrated, setHasHydrated] = useState(false);

  // --- ZUSTAND STORE CONNECTIONS ---
  const graph = useTripFlowStore((state) => state.graph);
  const activeCityId = useTripFlowStore((state) => state.activeCityId);
  const activeEdgeId = useTripFlowStore((state) => state.activeEdgeId);

  const setGraph = useTripFlowStore((state) => state.setGraph);
  const selectCity = useTripFlowStore((state) => state.selectCity);
  const selectEdge = useTripFlowStore((state) => state.selectEdge);
  const updateBudget = useTripFlowStore((state) => state.updateBudget);
  const updateTargetDateRange = useTripFlowStore(
    (state) => state.updateTargetDateRange,
  );
  const updateTravelerCount = useTripFlowStore(
    (state) => state.updateTravelerCount,
  );
  const deleteCityHub = useTripFlowStore((state) => state.deleteCityHub);
  const initializeClientContext = useTripFlowStore(
    (state) => state.initializeClientContext,
  );
  const clearGraph = useTripFlowStore((state) => state.clearGraph);

  // Active highlighted card ID (for visual selection effect in playground)
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Suggestion added triggers
  const [addedSuggestions, setAddedSuggestions] = useState<
    Record<string, boolean>
  >({});
  const toggleSuggestion = (id: string) => {
    setAddedSuggestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Initialize client context on mount if graph is empty
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
    if (!graph) {
      initializeClientContext();
    }
  }, [graph, initializeClientContext]);

  // --- MOCK DATA LOADER HANDLER ---
  const handleLoadMockData = () => {
    // 1. Define complete mock components conforming to types
    const mockOriginCity: CityHub = {
      id: "hub-nyc" as CityHubId,
      cityName: "New York",
      region: "NY",
      country: "United States",
      coordinates: { lat: 40.7128, lng: -74.006 },
      type: "ORIGIN",
      itinerary: [],
      travelerCount: 2,
      timezone: "America/New_York",
    };

    const mockCityHub: CityHub = {
      id: "hub-par" as CityHubId,
      cityName: "Paris",
      region: "Île-de-France",
      country: "France",
      coordinates: { lat: 48.8566, lng: 2.3522 },
      type: "HUB",
      itinerary: [
        {
          LocationId: "loc-hotel-ritz" as LocationId,
          startTime: "2026-07-10T15:00:00Z",
          endTime: "2026-07-15T11:00:00Z",
        },
        {
          LocationId: "loc-louvre" as LocationId,
          startTime: "2026-07-11T10:00:00Z",
          endTime: "2026-07-11T13:00:00Z",
        },
        {
          LocationId: "loc-jules-verne" as LocationId,
          startTime: "2026-07-12T19:30:00Z",
          endTime: "2026-07-12T22:30:00Z",
        },
      ],
      arrivalNodeId: "loc-cdg-arr" as LocationId,
      departureNodeId: "loc-cdg-dep" as LocationId,
      travelerCount: 2,
      timezone: "Europe/Paris",
    };

    const mockHotelRitz: Location = {
      id: "loc-hotel-ritz" as LocationId,
      name: "Hotel Ritz Paris",
      address: "15 Place Vendôme, 75001 Paris, France",
      coordinates: { lat: 48.8681, lng: 2.3294 },
      category: "LODGING",
      price: {
        actualCost: 950,
        typicalCost: 1100,
      },
    };

    const mockLouvre: Location = {
      id: "loc-louvre" as LocationId,
      name: "Louvre Museum Private Tour",
      address: "Rue de Rivoli, 75001 Paris, France",
      coordinates: { lat: 48.8606, lng: 2.3376 },
      category: "ACTIVITY",
      price: {
        actualCost: 45,
        typicalCost: 50,
      },
    };

    const mockJulesVerne: Location = {
      id: "loc-jules-verne" as LocationId,
      name: "Le Jules Verne (Eiffel Tower)",
      address: "Avenue Gustave Eiffel, 75007 Paris, France",
      coordinates: { lat: 48.8584, lng: 2.2945 },
      category: "MEAL",
      price: {
        actualCost: 215,
        typicalCost: 250,
      },
    };

    const mockTransitJFK: Location = {
      id: "loc-jfk-dep" as LocationId,
      name: "JFK International Airport - Terminal 4",
      address: "Queens, NY 11430, United States",
      coordinates: { lat: 40.6413, lng: -73.7781 },
      category: "TRANSIT_POINT",
      iata: "JFK",
      price: { typicalCost: 0 },
    };

    const mockTransitCDG: Location = {
      id: "loc-cdg-arr" as LocationId,
      name: "Paris Charles de Gaulle Airport - Terminal 2E",
      address: "95700 Roissy-en-France, France",
      coordinates: { lat: 49.0097, lng: 2.5479 },
      category: "TRANSIT_POINT",
      iata: "CDG",
      price: { typicalCost: 0 },
    };

    const mockTransitLHR: Location = {
      id: "loc-lhr-layover" as LocationId,
      name: "London Heathrow Airport - Terminal 5",
      address: "Hounslow TW6 2GA, United Kingdom",
      coordinates: { lat: 51.47, lng: -0.4543 },
      category: "TRANSIT_POINT",
      iata: "LHR",
      price: { typicalCost: 35 },
    };

    const mockTransitEdge: Transit = {
      id: "edge-nyc-par" as TransitId,
      fromCityId: "hub-nyc" as CityHubId,
      toCityId: "hub-par" as CityHubId,
      segments: [
        {
          fromLocationId: "loc-jfk-dep" as LocationId,
          toLocationId: "loc-lhr-layover" as LocationId,
          transportMode: "FLIGHT",
          startTime: "2026-07-09T22:30:00Z",
          endTime: "2026-07-10T06:10:00Z",
        },
        {
          fromLocationId: "loc-lhr-layover" as LocationId,
          toLocationId: "loc-cdg-arr" as LocationId,
          transportMode: "FLIGHT",
          startTime: "2026-07-10T08:30:00Z",
          endTime: "2026-07-10T10:50:00Z",
        },
      ],
      price: {
        actualCost: 650,
        typicalCost: 800,
      },
    };

    const mockEventSuggestion: Suggestion = {
      id: "sug-seine-cruise" as SuggestionId,
      type: "LOCATION_SUGGESTION",
      title: "Seine River Dinner Cruise",
      description:
        "A 2-hour gourmet dinner cruise past Paris' iconic landmarks, featuring a live band and classic French cuisine.",
      targetCityId: "hub-par" as CityHubId,
      suggestedLocation: {
        id: "loc-seine-cruise" as LocationId,
        name: "Bateaux Parisiens Seine Cruise",
        address: "Port de la Bourdonnais, 75007 Paris, France",
        coordinates: { lat: 48.8598, lng: 2.2928 },
        category: "ACTIVITY",
        price: {
          actualCost: 110,
          typicalCost: 130,
        },
      },
      price: {
        actualCost: 110,
        typicalCost: 130,
      },
    };

    const mockFlightSuggestion: Suggestion = {
      id: "sug-nyc-par-flight" as SuggestionId,
      type: "TRANSIT_SUGGESTION",
      title: "Delta Air Lines Flight 264",
      description:
        "Direct overnight flight from JFK to CDG with complimentary meals and cabin entertainment upgrades.",
      targetEdgeId: "edge-nyc-par" as TransitId,
      suggestedSegments: [
        {
          fromLocationId: "loc-jfk-dep" as LocationId,
          toLocationId: "loc-cdg-arr" as LocationId,
          transportMode: "FLIGHT",
          startTime: "2026-07-09T22:30:00Z",
          endTime: "2026-07-10T11:45:00Z",
        },
      ],
      price: {
        actualCost: 680,
        typicalCost: 820,
      },
    };

    const clientContext = graph?.clientContext || {
      location: {
        name: "New York",
        country_name: "United States",
        country_code: "US",
        coordinates: { lat: 40.7128, lng: -74.006 },
      },
      language: "en",
      currency: "USD",
      timezone: "America/New_York",
    };

    const payload: TripFlowGraph = {
      Locations: {
        "loc-hotel-ritz": mockHotelRitz,
        "loc-louvre": mockLouvre,
        "loc-jules-verne": mockJulesVerne,
        "loc-jfk-dep": mockTransitJFK,
        "loc-cdg-arr": mockTransitCDG,
        "loc-lhr-layover": mockTransitLHR,
      },
      CityHubs: {
        "hub-nyc": mockOriginCity,
        "hub-par": mockCityHub,
      },
      Transits: {
        "edge-nyc-par": mockTransitEdge,
      },
      suggestions: {
        "sug-seine-cruise": mockEventSuggestion,
        "sug-nyc-par-flight": mockFlightSuggestion,
      },
      budget: {
        budget: { min: 1200, max: 5000 },
        estimate: { low: 1800, high: 4200 },
      },
      targetDateRange: {
        target: {
          range: {
            start: "2026-07-10",
            end: "2026-07-18",
          },
        },
        context:
          "Summer holiday season in France. High hotel rates, warm weather.",
        actual: {
          start: "2026-07-10",
          end: "2026-07-13",
        },
      },
      clientContext,
    };

    // 2. Validate payload before pushing to store
    try {
      const validated = TripFlowGraphSchema.parse(payload);
      setGraph(validated);
      selectCity("hub-par" as CityHubId); // default highlight
      setActiveCardId("hub-par");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed to parse mock data schema:", errMsg);
    }
  };

  // Clear Zustand store graph data
  const handleClearData = () => {
    clearGraph();
    setActiveCardId(null);
  };

  // Ensure graph is loaded
  if (!hasHydrated || !graph) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-darker bg-page-gradient p-12 font-sans leading-relaxed text-text-primary md:p-8 md:py-12">
        <div className="rounded-2xl border border-border-color bg-bg-card p-10 text-center">
          <Database size={40} className="mx-auto mb-4 text-text-muted" />
          <h2 className="mb-2 text-xl font-semibold">No Active Model Graph</h2>
          <p className="mx-auto mb-6 max-w-xs text-sm text-text-secondary">
            Initialize context or load mock data to preview styling
            configurations.
          </p>
          <button
            className="cursor-pointer rounded border border-suggest-color/25 bg-suggest-color/10 px-4 py-2 text-sm font-semibold text-suggest-color transition-colors duration-200 hover:border-transparent hover:bg-suggest-color hover:text-black"
            onClick={handleLoadMockData}
          >
            Load Mock Data
          </button>
        </div>
      </main>
    );
  }

  // --- MODEL TOPOLOGY CALCULATIONS ---
  const hubs = Object.values(graph.CityHubs);
  const originCityHubs = hubs.filter((h) => h.type === "ORIGIN");
  const destinationCityHubs = hubs.filter((h) => h.type === "HUB");

  // Collect Planned Itinerary Items from the hubs
  const plannedEvents: Array<{
    item: ItineraryItem;
    location: Location;
    hubId: string;
  }> = [];
  hubs.forEach((hub) => {
    hub.itinerary.forEach((item) => {
      const loc = graph.Locations[item.LocationId];
      if (loc) {
        plannedEvents.push({ item, location: loc, hubId: hub.id });
      }
    });
  });

  // Calculate Transit Location Roles dynamically from Segments
  const transitRoles: Record<
    string,
    {
      isSource: boolean;
      isDestination: boolean;
      sourceCode: string;
      destCode: string;
      sourceTimeLabel: string;
      destTimeLabel: string;
      layoverDuration?: string | undefined;
      transitFee?: number | undefined;
    }
  > = {};

  // Find all locations with category TRANSIT_POINT
  Object.values(graph.Locations).forEach((loc) => {
    if (loc.category === "TRANSIT_POINT") {
      transitRoles[loc.id] = {
        isSource: false,
        isDestination: false,
        sourceCode: "NYC",
        destCode: "PAR",
        sourceTimeLabel: "Source",
        destTimeLabel: "Dest.",
        transitFee: loc.price?.typicalCost,
      };
    }
  });

  // Analyze segment topology in Transits
  Object.values(graph.Transits).forEach((transit) => {
    const segments = transit.segments;
    const sourceHub = graph.CityHubs[transit.fromCityId];
    const destHub = graph.CityHubs[transit.toCityId];

    segments.forEach((seg, idx) => {
      const fromLoc = transitRoles[seg.fromLocationId];
      if (fromLoc) {
        fromLoc.isSource = true;
        // set destination code based on next leg or end node
        const nextSeg = segments[idx + 1];
        if (nextSeg) {
          fromLoc.destCode =
            graph.Locations[nextSeg.fromLocationId]?.iata || "CONN";
        } else {
          fromLoc.destCode = graph.Locations[seg.toLocationId]?.iata || "DST";
        }
        try {
          const timeStr = DateTimeFormatter.format(
            seg.startTime,
            sourceHub?.timezone,
            { hour: "2-digit", minute: "2-digit", hour12: false },
          );
          fromLoc.sourceTimeLabel = `${timeStr} Dep`;
        } catch {}
      }

      const toLoc = transitRoles[seg.toLocationId];
      if (toLoc) {
        toLoc.isDestination = true;
        try {
          const timeStr = DateTimeFormatter.format(
            seg.endTime,
            destHub?.timezone,
            { hour: "2-digit", minute: "2-digit", hour12: false },
          );
          toLoc.destTimeLabel = `${timeStr} Arr`;
        } catch {}
      }
    });

    // Detect layover connections (nodes serving as both destination of leg N and source of leg N+1)
    if (segments.length > 1) {
      for (let i = 0; i < segments.length - 1; i++) {
        const currentSegment = segments[i];
        const nextSegment = segments[i + 1];
        if (!currentSegment || !nextSegment) continue;
        const layoverLocId = currentSegment.toLocationId;
        const role = transitRoles[layoverLocId];
        if (role) {
          role.isSource = true;
          role.isDestination = true;

          role.sourceCode =
            graph.Locations[currentSegment.fromLocationId]?.iata || "SRC";
          role.destCode =
            graph.Locations[nextSegment.toLocationId]?.iata || "DST";

          try {
            const arrTimeStr = DateTimeFormatter.format(
              currentSegment.endTime,
              destHub?.timezone,
              { hour: "2-digit", minute: "2-digit", hour12: false },
            );
            const depTimeStr = DateTimeFormatter.format(
              nextSegment.startTime,
              destHub?.timezone,
              { hour: "2-digit", minute: "2-digit", hour12: false },
            );

            role.sourceTimeLabel = `${arrTimeStr} Arr`;
            role.destTimeLabel = `${depTimeStr} Dep`;

            const arrTime = new Date(currentSegment.endTime);
            const depTime = new Date(nextSegment.startTime);
            const diff = depTime.getTime() - arrTime.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            role.layoverDuration = `${hours}h ${mins}m layover`;
          } catch {}
        }
      }
    }
  });

  // Calculate Itinerary details timeline items for selected hub
  const activeHub =
    graph.CityHubs[activeCityId || ""] ||
    hubs.find((h) => h.type === "HUB") ||
    hubs[0];

  // Suggestions lists
  const suggestions = Object.values(graph.suggestions);
  const locationSuggestions = suggestions.filter(
    (s) => s.type === "LOCATION_SUGGESTION",
  );
  const transitSuggestions = suggestions.filter(
    (s) => s.type === "TRANSIT_SUGGESTION",
  );

  // Validate Zod errors to show banner
  let schemaValidationError: string | null = null;
  try {
    TripFlowGraphSchema.parse(graph);
  } catch (err) {
    schemaValidationError = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="min-h-screen bg-bg-darker bg-page-gradient p-12 font-sans leading-relaxed text-text-primary md:p-8 md:py-12">
      {/* Back Link & Reset Control */}
      <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/globe"
            className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Globe View
          </Link>
          <span className="text-text-muted">|</span>
          <Link
            href="/debug"
            className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
          >
            ⚡ Debug Playground
          </Link>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="cursor-pointer rounded border border-suggest-color/25 bg-suggest-color/10 px-2.5 py-1 text-xs font-semibold text-suggest-color transition-colors duration-200 hover:border-transparent hover:bg-suggest-color hover:text-text-primary"
            onClick={handleLoadMockData}
          >
            Load Mock Data
          </button>
          {hubs.length > 0 && (
            <button
              type="button"
              className="cursor-pointer rounded border border-budget-danger/25 bg-budget-danger/10 px-2.5 py-1 text-xs font-semibold text-budget-danger transition-colors duration-200 hover:border-transparent hover:bg-budget-danger hover:text-white"
              onClick={handleClearData}
            >
              Clear Model
            </button>
          )}
        </div>
      </div>

      {/* Page Header */}
      <header className="mx-auto my-0 mb-12 max-w-7xl border-b border-border-color pb-8 text-center">
        <h1 className="mb-2 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          Trip Flow Component Design Arena
        </h1>
        <p className="mx-auto max-w-xl text-base text-text-secondary">
          Styling playground rendering map-anchored markers and screen-anchored
          dashboards directly from the Zustand store.
        </p>
      </header>

      {/* Zod Schema Validation Banner */}
      <div className="mx-auto max-w-7xl">
        {schemaValidationError ? (
          <div className="mb-6 flex items-start gap-4 rounded-xl border border-budget-danger/25 bg-budget-danger/10 p-4 text-text-primary">
            <span className="text-2xl">⚠️</span>
            <div>
              <strong>Schema Validation Failure:</strong> The active Zustand
              store contains data violating model constraints:
              <pre className="mt-2 text-xs whitespace-pre-wrap">
                {schemaValidationError}
              </pre>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex items-start gap-4 rounded-xl border border-budget-safe/25 bg-budget-safe/10 p-4 text-text-primary">
            <span className="text-2xl">✓</span>
            <div>
              <strong>Model Integrity Verified:</strong> Active components are
              rendering model state verified by the Zod domain schemas.
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Sandbox Layout */}
      <div className="mx-auto max-w-7xl lg:flex lg:gap-8">
        {/* --- LEFT PANEL: MODEL-DRIVEN MARKER CARDS (max-width: 200px) --- */}
        <div className="flex flex-col gap-8 lg:flex-1">
          {/* (1) ORIGIN CITIES */}
          <section className="rounded-xl border border-border-color bg-bg-dark/25 p-6 shadow-glass backdrop-blur">
            <div className="mb-6 flex items-center justify-between border-b border-border-color pb-3">
              <div>
                <h2 className="relative m-0 flex items-center gap-2 text-xl font-bold before:inline-block before:h-4 before:w-1.5 before:rounded-sm before:bg-origin-color before:shadow-glow-origin before:content-empty">
                  1. Origin Cities
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  On-globe markers representing traveler startup bases.
                </p>
              </div>
              <span className="rounded border border-border-color bg-bg-dark/50 px-1.5 py-0.5 text-xxs font-bold tracking-wider text-text-secondary uppercase">
                Map Marker
              </span>
            </div>

            <div className="flex flex-wrap items-start gap-5">
              {originCityHubs.length === 0 ? (
                <div className="text-sm text-text-muted italic">
                  No origin city hubs found in the active model.
                </div>
              ) : (
                originCityHubs.map((hub) => (
                  <OriginCityCard
                    key={hub.id}
                    originCity={hub}
                    isActive={activeCardId === hub.id}
                    onClick={() => {
                      setActiveCardId(hub.id);
                      selectCity(hub.id);
                    }}
                  />
                ))
              )}
            </div>
          </section>

          {/* (2) CITY HUBS */}
          <section className="rounded-xl border border-border-color bg-bg-dark/25 p-6 shadow-glass backdrop-blur">
            <div className="mb-6 flex items-center justify-between border-b border-border-color pb-3">
              <div>
                <h2 className="relative m-0 flex items-center gap-2 text-xl font-bold before:inline-block before:h-4 before:w-1.5 before:rounded-sm before:bg-hub-color before:shadow-glow-hub before:content-empty">
                  2. Destination City Hubs
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Pill-shaped map markers showing days durations & schedules.
                </p>
              </div>
              <span className="rounded border border-border-color bg-bg-dark/50 px-1.5 py-0.5 text-xxs font-bold tracking-wider text-text-secondary uppercase">
                Map Marker
              </span>
            </div>

            <div className="flex flex-wrap items-start gap-5">
              {destinationCityHubs.length === 0 ? (
                <div className="text-sm text-text-muted italic">
                  No destination city hubs found in the active model.
                </div>
              ) : (
                destinationCityHubs.map((hub) => (
                  <CityHubCard
                    key={hub.id}
                    cityHub={hub}
                    isActive={
                      activeCardId === hub.id || activeCityId === hub.id
                    }
                    onClick={() => {
                      setActiveCardId(hub.id);
                      selectCity(hub.id);
                    }}
                    onDelete={() => deleteCityHub(hub.id)}
                  />
                ))
              )}
            </div>
          </section>

          {/* (3) ITINERARY EVENTS */}
          <section className="rounded-xl border border-border-color bg-bg-dark/25 p-6 shadow-glass backdrop-blur">
            <div className="mb-6 flex items-center justify-between border-b border-border-color pb-3">
              <div>
                <h2 className="relative m-0 flex items-center gap-2 text-xl font-bold before:inline-block before:h-4 before:w-1.5 before:rounded-sm before:bg-event-color before:shadow-glow-event before:content-empty">
                  3. Itinerary Event Locations
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Sights, activities, lodgings, and meals planned inside
                  destination city bounds.
                </p>
              </div>
              <span className="rounded border border-border-color bg-bg-dark/50 px-1.5 py-0.5 text-xxs font-bold tracking-wider text-text-secondary uppercase">
                Map Marker
              </span>
            </div>

            <div className="flex flex-wrap items-start gap-5">
              {plannedEvents.length === 0 ? (
                <div className="text-sm text-text-muted italic">
                  No itinerary events scheduled. Add items to a city hub
                  itinerary to preview them here.
                </div>
              ) : (
                plannedEvents.map(({ item, location, hubId }) => {
                  const hub = graph.CityHubs[hubId];
                  return (
                    <ItineraryEventCard
                      key={`${hubId}-${location.id}`}
                      eventLocation={location}
                      startTime={item.startTime}
                      endTime={item.endTime}
                      timezone={hub?.timezone}
                      isActive={activeCardId === location.id}
                      onClick={() => setActiveCardId(location.id)}
                    />
                  );
                })
              )}
            </div>
          </section>

          {/* (4) TRANSIT LOCATIONS */}
          <section className="rounded-xl border border-border-color bg-bg-dark/25 p-6 shadow-glass backdrop-blur">
            <div className="mb-6 flex items-center justify-between border-b border-border-color pb-3">
              <div>
                <h2 className="relative m-0 flex items-center gap-2 text-xl font-bold before:inline-block before:h-4 before:w-1.5 before:rounded-sm before:bg-transit-color before:shadow-glow-transit before:content-empty">
                  4. Transit Terminals
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Station terminals classified dynamically based on active
                  segment connections.
                </p>
              </div>
              <span className="rounded border border-border-color bg-bg-dark/50 px-1.5 py-0.5 text-xxs font-bold tracking-wider text-text-secondary uppercase">
                Map Marker
              </span>
            </div>

            <div className="flex flex-col gap-7">
              {Object.keys(transitRoles).length === 0 ? (
                <div className="py-2.5 text-sm text-text-muted italic">
                  No transit point locations defined.
                </div>
              ) : (
                <>
                  {/* Category A: Departures */}
                  <div className="border-t border-dashed border-border-color pt-5 first:border-t-0 first:pt-0">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-text-primary">
                        Source Departures
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-start gap-5">
                      {Object.entries(transitRoles)
                        .filter(
                          ([_, role]) => role.isSource && !role.isDestination,
                        )
                        .map(([locId, role]) => {
                          const loc = graph.Locations[locId];
                          if (!loc) return null;
                          return (
                            <TransitLocationCard
                              key={loc.id}
                              location={loc}
                              variant="departure"
                              sourceCode={loc.iata}
                              destinationCode={role.destCode}
                              sourceLabel="Source"
                              destinationLabel={role.destTimeLabel}
                              footerBadgeText="DEPARTURE"
                              isActive={activeCardId === loc.id}
                              onClick={() => setActiveCardId(loc.id)}
                            />
                          );
                        })}
                    </div>
                  </div>

                  {/* Category B: Arrivals */}
                  <div className="border-t border-dashed border-border-color pt-5 first:border-t-0 first:pt-0">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-text-primary">
                        Destination Arrivals
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-start gap-5">
                      {Object.entries(transitRoles)
                        .filter(
                          ([_, role]) => role.isDestination && !role.isSource,
                        )
                        .map(([locId, role]) => {
                          const loc = graph.Locations[locId];
                          if (!loc) return null;
                          return (
                            <TransitLocationCard
                              key={loc.id}
                              location={loc}
                              variant="arrival"
                              sourceCode={role.sourceCode}
                              destinationCode={loc.iata}
                              sourceLabel={role.sourceTimeLabel}
                              destinationLabel={loc.name}
                              footerBadgeText="ARRIVAL"
                              isActive={activeCardId === loc.id}
                              onClick={() => setActiveCardId(loc.id)}
                            />
                          );
                        })}
                    </div>
                  </div>

                  {/* Category C: Layovers */}
                  <div className="border-t border-dashed border-border-color pt-5 first:border-t-0 first:pt-0">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-text-primary">
                        Layover Connections
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-start gap-5">
                      {Object.entries(transitRoles)
                        .filter(
                          ([_, role]) => role.isSource && role.isDestination,
                        )
                        .map(([locId, role]) => {
                          const loc = graph.Locations[locId];
                          if (!loc) return null;
                          return (
                            <TransitLocationCard
                              key={loc.id}
                              location={loc}
                              variant="layover"
                              sourceCode={role.sourceCode}
                              destinationCode={role.destCode}
                              sourceLabel={role.sourceTimeLabel}
                              destinationLabel={role.destTimeLabel}
                              layoverDurationLabel={role.layoverDuration}
                              footerBadgeText={
                                role.transitFee !== undefined
                                  ? `Transit Fee $${role.transitFee}`
                                  : "Transit Hub"
                              }
                              isActive={activeCardId === loc.id}
                              onClick={() => setActiveCardId(loc.id)}
                            />
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* (4b) TRANSIT CONNECTIONS */}
          <section className="rounded-xl border border-border-color bg-bg-dark/25 p-6 shadow-glass backdrop-blur">
            <div className="mb-6 flex items-center justify-between border-b border-border-color pb-3">
              <div>
                <h2 className="relative m-0 flex items-center gap-2 text-xl font-bold before:inline-block before:h-4 before:w-1.5 before:rounded-sm before:bg-transit-color before:shadow-glow-transit before:content-empty">
                  4b. Transit Connections
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Route connections linking stop cities. Override traveler counts here to split cohorts.
                </p>
              </div>
              <span className="rounded border border-border-color bg-bg-dark/50 px-1.5 py-0.5 text-xxs font-bold tracking-wider text-text-secondary uppercase">
                Connection Edge
              </span>
            </div>

            <div className="flex flex-wrap items-start gap-5">
              {Object.keys(graph.Transits).length === 0 ? (
                <div className="text-sm text-text-muted italic">
                  No transit connection routes defined.
                </div>
              ) : (
                Object.values(graph.Transits).map((transit) => (
                  <TransitCard
                    key={transit.id}
                    transit={transit}
                    isActive={activeCardId === transit.id || activeEdgeId === transit.id}
                    onClick={() => {
                      setActiveCardId(transit.id);
                      selectEdge(transit.id);
                    }}
                  />
                ))
              )}
            </div>
          </section>

          {/* (5) AI SUGGESTIONS */}
          <section className="rounded-xl border border-border-color bg-bg-dark/25 p-6 shadow-glass backdrop-blur">
            <div className="mb-6 flex items-center justify-between border-b border-border-color pb-3">
              <div>
                <h2 className="relative m-0 flex items-center gap-2 text-xl font-bold before:inline-block before:h-4 before:w-1.5 before:rounded-sm before:bg-suggest-color before:shadow-glow-suggest before:content-empty">
                  5. AI Suggestions
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Proposals generated by AI models awaiting inclusion in the
                  itinerary.
                </p>
              </div>
              <span className="rounded border border-border-color bg-bg-dark/50 px-1.5 py-0.5 text-xxs font-bold tracking-wider text-text-secondary uppercase">
                Map Marker
              </span>
            </div>

            <div className="flex flex-col gap-7">
              <div className="border-t border-dashed border-border-color pt-5 first:border-t-0 first:pt-0">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-text-primary">
                    Location Recommendations
                  </h3>
                </div>
                <div className="flex flex-wrap items-start gap-5">
                  {locationSuggestions.length === 0 ? (
                    <div className="text-sm text-text-muted italic">
                      No location suggestions.
                    </div>
                  ) : (
                    locationSuggestions.map((s) => (
                      <SuggestionCard
                        key={s.id}
                        suggestion={s}
                        isAdded={!!addedSuggestions[s.id]}
                        onToggleAdd={() => toggleSuggestion(s.id)}
                        isActive={activeCardId === s.id}
                        onClick={() => setActiveCardId(s.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-dashed border-border-color pt-5 first:border-t-0 first:pt-0">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-text-primary">
                    Transit Recommendations
                  </h3>
                </div>
                <div className="flex flex-wrap items-start gap-5">
                  {transitSuggestions.length === 0 ? (
                    <div className="text-sm text-text-muted italic">
                      No transit suggestions.
                    </div>
                  ) : (
                    transitSuggestions.map((s) => (
                      <SuggestionCard
                        key={s.id}
                        suggestion={s}
                        isAdded={!!addedSuggestions[s.id]}
                        onToggleAdd={() => toggleSuggestion(s.id)}
                        isActive={activeCardId === s.id}
                        onClick={() => setActiveCardId(s.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* (6) TRANSIT ROUTE GLOBE PREVIEWS */}
          <section className="rounded-xl border border-border-color bg-bg-dark/25 p-6 shadow-glass backdrop-blur">
            <div className="mb-6 flex items-center justify-between border-b border-border-color pb-3">
              <div>
                <h2 className="relative m-0 flex items-center gap-2 text-xl font-bold before:inline-block before:h-4 before:w-1.5 before:rounded-sm before:bg-transit-color before:shadow-glow-transit before:content-empty">
                  6. Transit Route Globe Previews
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Visualizations of great-circle arcs, land roadway paths, and
                  sea direct connections on a MapLibre globe.
                </p>
              </div>
              <span className="rounded border border-border-color bg-bg-dark/50 px-1.5 py-0.5 text-xxs font-bold tracking-wider text-text-secondary uppercase">
                Map Globe
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="rounded-xl border border-border-color bg-bg-dark/30 p-2">
                <AirArcPreview />
              </div>
              <div className="rounded-xl border border-border-color bg-bg-dark/30 p-2">
                <LandRoutePreview />
              </div>
              <div className="rounded-xl border border-border-color bg-bg-dark/30 p-2">
                <SeaDirectPreview />
              </div>
            </div>
          </section>
        </div>

        {/* --- RIGHT PANEL: SCREEN-ANCHORED SIDEBAR DASHBOARDS (max-width: 220px) --- */}
        <div className="sticky top-8 flex flex-col gap-6 lg:w-card-widget lg:flex-shrink-0">
          {/* Budget Widget */}
          {graph.budget ? (
            <BudgetDashboard data={graph.budget} onUpdate={updateBudget} />
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-border-color bg-bg-card p-5 text-xs text-text-muted italic shadow-glass backdrop-blur">
              Budget metrics not set in the model.
            </div>
          )}

          {/* Target Dates Widget */}
          {graph.targetDateRange ? (
            <TargetDateRangeDashboard
              data={graph.targetDateRange}
              onUpdate={updateTargetDateRange}
            />
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-border-color bg-bg-card p-5 text-xs text-text-muted italic shadow-glass backdrop-blur">
              Target calendar bounds not configured.
            </div>
          )}

          {/* Hub Details Widget */}
          {activeHub ? (
            <CityHubDashboard cityHub={activeHub} />
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-border-color bg-bg-card p-5 text-xs text-text-muted italic shadow-glass backdrop-blur">
              No city hub selected. Select a hub marker to view itinerary
              details.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
