"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import "./page.css";

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
  ItineraryItem
} from "../../types/schema";

// Import Zustand Store
import { useTripFlowStore } from "../../store";

// Import modular card components
import { OriginCityCard } from "../../components/marker-cards/OriginCityCard";
import { CityHubCard } from "../../components/marker-cards/CityHubCard";
import { ItineraryEventCard } from "../../components/marker-cards/ItineraryEventCard";
import { TransitLocationCard } from "../../components/marker-cards/TransitLocationCard";
import { SuggestionCard } from "../../components/marker-cards/SuggestionCard";

// Import modular dashboard components
import { BudgetDashboard } from "../../components/dashboards/BudgetDashboard";
import { TargetDateRangeDashboard } from "../../components/dashboards/TargetDateRangeDashboard";
import { CityHubDashboard } from "../../components/dashboards/CityHubDashboard";

// Import Lucide icons for empty states
import { Database, PlusCircle, Trash2, ArrowRight } from "lucide-react";

export default function ComponentStylingPage() {
  // --- ZUSTAND STORE CONNECTIONS ---
  const graph = useTripFlowStore((state) => state.graph);
  const activeCityId = useTripFlowStore((state) => state.activeCityId);
  
  const setGraph = useTripFlowStore((state) => state.setGraph);
  const selectCity = useTripFlowStore((state) => state.selectCity);
  const updateBudget = useTripFlowStore((state) => state.updateBudget);
  const updateTargetDateRange = useTripFlowStore((state) => state.updateTargetDateRange);
  const updateTravelerCount = useTripFlowStore((state) => state.updateTravelerCount);
  const deleteCityHub = useTripFlowStore((state) => state.deleteCityHub);
  const initializeClientContext = useTripFlowStore((state) => state.initializeClientContext);

  // Active highlighted card ID (for visual selection effect in playground)
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Suggestion added triggers
  const [addedSuggestions, setAddedSuggestions] = useState<Record<string, boolean>>({});
  const toggleSuggestion = (id: string) => {
    setAddedSuggestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Initialize client context on mount if graph is empty
  useEffect(() => {
    if (!graph) {
      initializeClientContext();
    }
  }, [graph, initializeClientContext]);

  // --- MOCK DATA LOADER HANDLER ---
  const handleLoadMockData = () => {
    // 1. Define complete mock components conforming to types
    const mockOriginCity: CityHub = {
      id: "hub-nyc" as any,
      cityName: "New York",
      region: "NY",
      country: "United States",
      coordinates: { lat: 40.7128, lng: -74.0060 },
      type: "ORIGIN",
      itinerary: [],
      travelerCount: 2,
    };

    const mockCityHub: CityHub = {
      id: "hub-par" as any,
      cityName: "Paris",
      region: "Île-de-France",
      country: "France",
      coordinates: { lat: 48.8566, lng: 2.3522 },
      type: "HUB",
      itinerary: [
        {
          LocationId: "loc-hotel-ritz" as any,
          startTime: "2026-07-10T15:00:00Z",
          endTime: "2026-07-15T11:00:00Z"
        },
        {
          LocationId: "loc-louvre" as any,
          startTime: "2026-07-11T10:00:00Z",
          endTime: "2026-07-11T13:00:00Z"
        },
        {
          LocationId: "loc-jules-verne" as any,
          startTime: "2026-07-12T19:30:00Z",
          endTime: "2026-07-12T22:30:00Z"
        }
      ],
      arrivalNodeId: "loc-cdg-arr" as any,
      departureNodeId: "loc-cdg-dep" as any,
      travelerCount: 2
    };

    const mockHotelRitz: Location = {
      id: "loc-hotel-ritz" as any,
      name: "Hotel Ritz Paris",
      address: "15 Place Vendôme, 75001 Paris, France",
      coordinates: { lat: 48.8681, lng: 2.3294 },
      category: "LODGING",
      price: {
        actualCost: 950,
        typicalCost: 1100
      }
    };

    const mockLouvre: Location = {
      id: "loc-louvre" as any,
      name: "Louvre Museum Private Tour",
      address: "Rue de Rivoli, 75001 Paris, France",
      coordinates: { lat: 48.8606, lng: 2.3376 },
      category: "ACTIVITY",
      price: {
        actualCost: 45,
        typicalCost: 50
      }
    };

    const mockJulesVerne: Location = {
      id: "loc-jules-verne" as any,
      name: "Le Jules Verne (Eiffel Tower)",
      address: "Avenue Gustave Eiffel, 75007 Paris, France",
      coordinates: { lat: 48.8584, lng: 2.2945 },
      category: "MEAL",
      price: {
        actualCost: 215,
        typicalCost: 250
      }
    };

    const mockTransitJFK: Location = {
      id: "loc-jfk-dep" as any,
      name: "JFK International Airport - Terminal 4",
      address: "Queens, NY 11430, United States",
      coordinates: { lat: 40.6413, lng: -73.7781 },
      category: "TRANSIT_POINT",
      iata: "JFK",
      price: { typicalCost: 0 }
    };

    const mockTransitCDG: Location = {
      id: "loc-cdg-arr" as any,
      name: "Paris Charles de Gaulle Airport - Terminal 2E",
      address: "95700 Roissy-en-France, France",
      coordinates: { lat: 49.0097, lng: 2.5479 },
      category: "TRANSIT_POINT",
      iata: "CDG",
      price: { typicalCost: 0 }
    };

    const mockTransitLHR: Location = {
      id: "loc-lhr-layover" as any,
      name: "London Heathrow Airport - Terminal 5",
      address: "Hounslow TW6 2GA, United Kingdom",
      coordinates: { lat: 51.4700, lng: -0.4543 },
      category: "TRANSIT_POINT",
      iata: "LHR",
      price: { typicalCost: 35 }
    };

    const mockTransitEdge: Transit = {
      id: "edge-nyc-par" as any,
      fromCityId: "hub-nyc" as any,
      toCityId: "hub-par" as any,
      segments: [
        {
          fromLocationId: "loc-jfk-dep" as any,
          toLocationId: "loc-lhr-layover" as any,
          transportMode: "FLIGHT",
          startTime: "2026-07-09T22:30:00Z",
          endTime: "2026-07-10T06:10:00Z",
        },
        {
          fromLocationId: "loc-lhr-layover" as any,
          toLocationId: "loc-cdg-arr" as any,
          transportMode: "FLIGHT",
          startTime: "2026-07-10T08:30:00Z",
          endTime: "2026-07-10T10:50:00Z",
        }
      ],
      price: {
        actualCost: 650,
        typicalCost: 800
      }
    };

    const mockEventSuggestion: Suggestion = {
      id: "sug-seine-cruise" as any,
      type: "LOCATION_SUGGESTION",
      title: "Seine River Dinner Cruise",
      description: "A 2-hour gourmet dinner cruise past Paris' iconic landmarks, featuring a live band and classic French cuisine.",
      targetCityId: "hub-par" as any,
      suggestedLocation: {
        id: "loc-seine-cruise" as any,
        name: "Bateaux Parisiens Seine Cruise",
        address: "Port de la Bourdonnais, 75007 Paris, France",
        coordinates: { lat: 48.8598, lng: 2.2928 },
        category: "ACTIVITY",
        price: {
          actualCost: 110,
          typicalCost: 130
        }
      },
      price: {
        actualCost: 110,
        typicalCost: 130
      }
    };

    const mockFlightSuggestion: Suggestion = {
      id: "sug-nyc-par-flight" as any,
      type: "TRANSIT_SUGGESTION",
      title: "Delta Air Lines Flight 264",
      description: "Direct overnight flight from JFK to CDG with complimentary meals and cabin entertainment upgrades.",
      targetEdgeId: "edge-nyc-par" as any,
      suggestedSegments: [
        {
          fromLocationId: "loc-jfk-dep" as any,
          toLocationId: "loc-cdg-arr" as any,
          transportMode: "FLIGHT",
          startTime: "2026-07-09T22:30:00Z",
          endTime: "2026-07-10T11:45:00Z"
        }
      ],
      price: {
        actualCost: 680,
        typicalCost: 820
      }
    };

    const clientContext = graph?.clientContext || {
      location: {
        name: "New York",
        country_name: "United States",
        country_code: "US",
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      language: "en",
      currency: "USD"
    };

    const payload: TripFlowGraph = {
      Locations: {
        "loc-hotel-ritz": mockHotelRitz,
        "loc-louvre": mockLouvre,
        "loc-jules-verne": mockJulesVerne,
        "loc-jfk-dep": mockTransitJFK,
        "loc-cdg-arr": mockTransitCDG,
        "loc-lhr-layover": mockTransitLHR
      },
      CityHubs: {
        "hub-nyc": mockOriginCity,
        "hub-par": mockCityHub
      },
      Transits: {
        "edge-nyc-par": mockTransitEdge
      },
      suggestions: {
        "sug-seine-cruise": mockEventSuggestion,
        "sug-nyc-par-flight": mockFlightSuggestion
      },
      budget: {
        budget: { min: 1200, max: 5000 },
        estimate: { low: 1800, high: 4200 }
      },
      targetDateRange: {
        target: {
          range: {
            start: "2026-07-10",
            end: "2026-07-18"
          }
        },
        context: "Summer holiday season in France. High hotel rates, warm weather.",
        actual: {
          start: "2026-07-10",
          end: "2026-07-13"
        }
      },
      clientContext
    };

    // 2. Validate payload before pushing to store
    try {
      const validated = TripFlowGraphSchema.parse(payload);
      setGraph(validated);
      selectCity("hub-par" as any); // default highlight
      setActiveCardId("hub-par");
    } catch (err) {
      console.error("Failed to parse mock data schema:", err);
    }
  };

  // Clear Zustand store graph data
  const handleClearData = () => {
    if (graph) {
      setGraph({
        Locations: {},
        CityHubs: {},
        Transits: {},
        suggestions: {},
        clientContext: graph.clientContext
      });
      selectCity(null);
      setActiveCardId(null);
    }
  };

  // Ensure graph is loaded
  if (!graph) {
    return (
      <main className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", background: "rgba(18,19,29,0.5)", border: "1px solid var(--border-color)", padding: "2.5rem", borderRadius: "16px" }}>
          <Database size={40} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>No Active Model Graph</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "300px", margin: "0 auto 1.5rem auto" }}>
            Initialize context or load mock data to preview styling configurations.
          </p>
          <button className="suggest-action-btn" style={{ fontSize: "0.9rem", padding: "8px 16px" }} onClick={handleLoadMockData}>
            Load Mock Data
          </button>
        </div>
      </main>
    );
  }

  // --- MODEL TOPOLOGY CALCULATIONS ---
  const hubs = Object.values(graph.CityHubs);
  const originCityHubs = hubs.filter(h => h.type === "ORIGIN");
  const destinationCityHubs = hubs.filter(h => h.type === "HUB");

  // Collect Planned Itinerary Items from the hubs
  const plannedEvents: Array<{ item: ItineraryItem; location: Location; hubId: string }> = [];
  hubs.forEach(hub => {
    hub.itinerary.forEach(item => {
      const loc = graph.Locations[item.LocationId];
      if (loc) {
        plannedEvents.push({ item, location: loc, hubId: hub.id });
      }
    });
  });

  // Calculate Transit Location Roles dynamically from Segments
  const transitRoles: Record<string, {
    isSource: boolean;
    isDestination: boolean;
    sourceCode: string;
    destCode: string;
    sourceTimeLabel: string;
    destTimeLabel: string;
    layoverDuration?: string | undefined;
    transitFee?: number | undefined;
  }> = {};

  // Find all locations with category TRANSIT_POINT
  Object.values(graph.Locations).forEach(loc => {
    if (loc.category === "TRANSIT_POINT") {
      transitRoles[loc.id] = {
        isSource: false,
        isDestination: false,
        sourceCode: "NYC",
        destCode: "PAR",
        sourceTimeLabel: "Source",
        destTimeLabel: "Dest.",
        transitFee: loc.price?.typicalCost
      };
    }
  });

  // Analyze segment topology in Transits
  Object.values(graph.Transits).forEach(transit => {
    const segments = transit.segments;
    segments.forEach((seg, idx) => {
      const fromLoc = transitRoles[seg.fromLocationId];
      if (fromLoc) {
        fromLoc.isSource = true;
        // set destination code based on next leg or end node
        const nextSeg = segments[idx + 1];
        if (nextSeg) {
          fromLoc.destCode = graph.Locations[nextSeg.fromLocationId]?.iata || "CONN";
        } else {
          fromLoc.destCode = graph.Locations[seg.toLocationId]?.iata || "DST";
        }
        try {
          const startD = new Date(seg.startTime);
          fromLoc.sourceTimeLabel = startD.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) + " Dep";
        } catch {}
      }

      const toLoc = transitRoles[seg.toLocationId];
      if (toLoc) {
        toLoc.isDestination = true;
        try {
          const endD = new Date(seg.endTime);
          toLoc.destTimeLabel = endD.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) + " Arr";
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
          
          role.sourceCode = graph.Locations[currentSegment.fromLocationId]?.iata || "SRC";
          role.destCode = graph.Locations[nextSegment.toLocationId]?.iata || "DST";
          
          try {
            const arrTime = new Date(currentSegment.endTime);
            const depTime = new Date(nextSegment.startTime);
            
            role.sourceTimeLabel = arrTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) + " Arr";
            role.destTimeLabel = depTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) + " Dep";
            
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
  const activeHub = graph.CityHubs[activeCityId || ""] 
    || hubs.find(h => h.type === "HUB") 
    || hubs[0];

  const activeHubTimelineItems = activeHub 
    ? activeHub.itinerary.map(item => {
        const loc = graph.Locations[item.LocationId];
        const label = loc ? loc.name : "Unknown Event";
        const start = new Date(item.startTime);
        const dateStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const timeStr = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
        
        return {
          label,
          subLabel: `${dateStr} ${timeStr}`,
          cost: loc?.price?.actualCost
        };
      })
    : [];

  // Suggestions lists
  const suggestions = Object.values(graph.suggestions);
  const locationSuggestions = suggestions.filter(s => s.type === "LOCATION_SUGGESTION");
  const transitSuggestions = suggestions.filter(s => s.type === "TRANSIT_SUGGESTION");

  // Validate Zod errors to show banner
  let schemaValidationError: string | null = null;
  try {
    TripFlowGraphSchema.parse(graph);
  } catch (err: any) {
    schemaValidationError = err.message;
  }

  return (
    <main className="page-container">
      {/* Back Link & Reset Control */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1400px", margin: "0 auto 1.5rem auto" }}>
        <Link href="/globe" className="back-link" style={{ marginBottom: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Globe View
        </Link>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            type="button" 
            className="suggest-action-btn"
            style={{ fontSize: "0.8rem", padding: "4px 10px" }}
            onClick={handleLoadMockData}
          >
            Load Mock Data
          </button>
          {hubs.length > 0 && (
            <button 
              type="button" 
              className="suggest-action-btn"
              style={{ fontSize: "0.8rem", padding: "4px 10px", borderColor: "rgba(239, 68, 68, 0.3)", color: "#fca5a5", background: "rgba(239, 68, 68, 0.1)" }}
              onClick={handleClearData}
            >
              Clear Model
            </button>
          )}
        </div>
      </div>

      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">Trip Flow Component Design Arena</h1>
        <p className="page-subtitle">
          Styling playground rendering map-anchored markers and screen-anchored dashboards directly from the Zustand store.
        </p>
      </header>

      {/* Zod Schema Validation Banner */}
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {schemaValidationError ? (
          <div className="validation-banner validation-error">
            <span style={{ fontSize: "1.5rem" }}>⚠️</span>
            <div>
              <strong>Schema Validation Failure:</strong> The active Zustand store contains data violating model constraints:
              <pre style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>{schemaValidationError}</pre>
            </div>
          </div>
        ) : (
          <div className="validation-banner validation-success">
            <span style={{ fontSize: "1.5rem" }}>✓</span>
            <div>
              <strong>Model Integrity Verified:</strong> Active components are rendering model state verified by the Zod domain schemas.
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Sandbox Layout */}
      <div className="sandbox-layout">
        
        {/* --- LEFT PANEL: MODEL-DRIVEN MARKER CARDS (max-width: 200px) --- */}
        <div className="main-panels">
          
          {/* (1) ORIGIN CITIES */}
          <section className="segment" style={{ "--accent-color": "var(--origin-color)" } as React.CSSProperties}>
            <div className="segment-header">
              <div>
                <h2 className="segment-title">1. Origin Cities</h2>
                <p className="segment-desc">On-globe markers representing traveler startup bases.</p>
              </div>
              <span className="widget-badge">Map Marker</span>
            </div>
            
            <div className="cards-row">
              {originCityHubs.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                  No origin city hubs found in the active model.
                </div>
              ) : (
                originCityHubs.map(hub => (
                  <OriginCityCard
                    key={hub.id}
                    originCity={hub}
                    travelerCount={hub.travelerCount}
                    onTravelerCountChange={(count) => updateTravelerCount(hub.id, count)}
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
          <section className="segment" style={{ "--accent-color": "var(--hub-color)" } as React.CSSProperties}>
            <div className="segment-header">
              <div>
                <h2 className="segment-title">2. Destination City Hubs</h2>
                <p className="segment-desc">Pill-shaped map markers showing days durations & schedules.</p>
              </div>
              <span className="widget-badge">Map Marker</span>
            </div>
            
            <div className="cards-row">
              {destinationCityHubs.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                  No destination city hubs found in the active model.
                </div>
              ) : (
                destinationCityHubs.map(hub => (
                  <CityHubCard
                    key={hub.id}
                    cityHub={hub}
                    isActive={activeCardId === hub.id || activeCityId === hub.id}
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
          <section className="segment" style={{ "--accent-color": "var(--event-color)" } as React.CSSProperties}>
            <div className="segment-header">
              <div>
                <h2 className="segment-title">3. Itinerary Event Locations</h2>
                <p className="segment-desc">Sights, activities, lodgings, and meals planned inside destination city bounds.</p>
              </div>
              <span className="widget-badge">Map Marker</span>
            </div>
            
            <div className="cards-row">
              {plannedEvents.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                  No itinerary events scheduled. Add items to a city hub itinerary to preview them here.
                </div>
              ) : (
                plannedEvents.map(({ item, location, hubId }) => {
                  const start = new Date(item.startTime);
                  const formatOption = { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false } as const;
                  const timeLabel = item.endTime 
                    ? `${start.toLocaleDateString("en-US", formatOption)} - ${new Date(item.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`
                    : start.toLocaleDateString("en-US", formatOption);

                  return (
                    <ItineraryEventCard
                      key={`${hubId}-${location.id}`}
                      eventLocation={location}
                      timeLabel={timeLabel}
                      isActive={activeCardId === location.id}
                      onClick={() => setActiveCardId(location.id)}
                    />
                  );
                })
              )}
            </div>
          </section>

          {/* (4) TRANSIT LOCATIONS */}
          <section className="segment" style={{ "--accent-color": "var(--transit-color)" } as React.CSSProperties}>
            <div className="segment-header">
              <div>
                <h2 className="segment-title">4. Transit Terminals</h2>
                <p className="segment-desc">Station terminals classified dynamically based on active segment connections.</p>
              </div>
              <span className="widget-badge">Map Marker</span>
            </div>

            <div className="subsegments-grid">
              {Object.keys(transitRoles).length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", padding: "10px 0" }}>
                  No transit point locations defined.
                </div>
              ) : (
                <>
                  {/* Category A: Departures */}
                  <div className="subsegment">
                    <div className="subsegment-header">
                      <h3 className="subsegment-title">Source Departures</h3>
                    </div>
                    <div className="cards-row">
                      {Object.entries(transitRoles)
                        .filter(([_, role]) => role.isSource && !role.isDestination)
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
                  <div className="subsegment">
                    <div className="subsegment-header">
                      <h3 className="subsegment-title">Destination Arrivals</h3>
                    </div>
                    <div className="cards-row">
                      {Object.entries(transitRoles)
                        .filter(([_, role]) => role.isDestination && !role.isSource)
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
                  <div className="subsegment">
                    <div className="subsegment-header">
                      <h3 className="subsegment-title">Layover Connections</h3>
                    </div>
                    <div className="cards-row">
                      {Object.entries(transitRoles)
                        .filter(([_, role]) => role.isSource && role.isDestination)
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
                              footerBadgeText={role.transitFee !== undefined ? `Transit Fee $${role.transitFee}` : "Transit Hub"}
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

          {/* (5) AI SUGGESTIONS */}
          <section className="segment" style={{ "--accent-color": "var(--suggest-color)" } as React.CSSProperties}>
            <div className="segment-header">
              <div>
                <h2 className="segment-title">5. AI Suggestions</h2>
                <p className="segment-desc">Proposals generated by AI models awaiting inclusion in the itinerary.</p>
              </div>
              <span className="widget-badge">Map Marker</span>
            </div>

            <div className="subsegments-grid">
              <div className="subsegment">
                <div className="subsegment-header">
                  <h3 className="subsegment-title">Location Recommendations</h3>
                </div>
                <div className="cards-row">
                  {locationSuggestions.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                      No location suggestions.
                    </div>
                  ) : (
                    locationSuggestions.map(s => (
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

              <div className="subsegment">
                <div className="subsegment-header">
                  <h3 className="subsegment-title">Transit Recommendations</h3>
                </div>
                <div className="cards-row">
                  {transitSuggestions.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                      No transit suggestions.
                    </div>
                  ) : (
                    transitSuggestions.map(s => (
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

        </div>

        {/* --- RIGHT PANEL: SCREEN-ANCHORED SIDEBAR DASHBOARDS (max-width: 220px) --- */}
        <div className="sidebar-panels">
          
          {/* Budget Widget */}
          {graph.budget ? (
            <BudgetDashboard
              data={graph.budget}
              onUpdate={updateBudget}
            />
          ) : (
            <div className="dashboard-widget" style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
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
            <div className="dashboard-widget" style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              Target calendar bounds not configured.
            </div>
          )}

          {/* Hub Details Widget */}
          {activeHub ? (
            <CityHubDashboard
              cityHub={activeHub}
              timelineItems={activeHubTimelineItems}
              onTravelerCountChange={(count) => updateTravelerCount(activeHub.id, count)}
            />
          ) : (
            <div className="dashboard-widget" style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              No city hub selected. Select a hub marker to view itinerary details.
            </div>
          )}
          
        </div>

      </div>
    </main>
  );
}
