"use client";

import React, { useState } from "react";
import Link from "next/link";
import "./page.css";

// Import schemas and types
import {
  CityHubSchema,
  LocationSchema,
  SuggestionSchema,
  BudgetSchema,
  TargetDateRangeSchema,
  CityHub,
  Location,
  Suggestion,
  Budget,
  TargetDateRange
} from "../../types/schema";

// Import modular card components
import { OriginCityCard } from "../../components/marker-cards/OriginCityCard";
import { CityHubCard } from "../../components/marker-cards/CityHubCard";
import { ItineraryEventCard } from "../../components/marker-cards/ItineraryEventCard";
import { TransitLocationCard } from "../../components/marker-cards/TransitLocationCard";
import { SuggestionCard } from "../../components/marker-cards/SuggestionCard";

// Import modular dashboard components
import { BudgetDashboard } from "../../components/dashboards/BudgetDashboard";
import { TargetDateRangeDashboard } from "../../components/dashboards/TargetDateRangeDashboard";

export default function ComponentStylingPage() {
  // --- STATE FOR CARD MARKERS ---
  // Interactive state for Origin Hub traveler count [TF-27]
  const [travelerCount, setTravelerCount] = useState(2);
  
  // Interactive state for suggestions
  const [addedSuggestions, setAddedSuggestions] = useState<Record<string, boolean>>({});

  // Interactive state for selected active node cards
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // --- STATE FOR DASHBOARDS ---
  const [budgetData, setBudgetData] = useState<Budget>({
    budget: { min: 1200, max: 5000 },
    estimate: { low: 1800, high: 4200 },
  });

  const [dateRangeData, setDateRangeData] = useState<TargetDateRange>({
    target: {
      range: {
        start: "2026-06-10",
        end: "2026-06-18",
      },
    },
    context: "Summer holiday season in France. High hotel rates, warm weather.",
    actual: {
      start: "2026-06-10",
      end: "2026-06-15",
    },
  });

  // --- MOCK MARKER DATA ---
  const mockOriginCity: CityHub = {
    id: "hub-nyc" as any,
    cityName: "New York",
    region: "NY",
    country: "United States",
    coordinates: { lat: 40.7128, lng: -74.0060 },
    type: "ORIGIN",
    itinerary: [],
    travelerCount: travelerCount,
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
        startTime: "2026-06-10T15:00:00Z",
        endTime: "2026-06-15T11:00:00Z"
      },
      {
        LocationId: "loc-louvre" as any,
        startTime: "2026-06-11T10:00:00Z",
        endTime: "2026-06-11T13:00:00Z"
      },
      {
        LocationId: "loc-jules-verne" as any,
        startTime: "2026-06-12T19:30:00Z",
        endTime: "2026-06-12T22:30:00Z"
      }
    ],
    arrivalNodeId: "loc-cdg-arr" as any,
    departureNodeId: "loc-cdg-dep" as any,
    travelerCount: 2
  };

  // Itinerary events (Locations)
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

  // Transit locations (Location category = 'TRANSIT_POINT')
  const mockTransitJFK: Location = {
    id: "loc-jfk-dep" as any,
    name: "JFK International Airport - Terminal 4",
    address: "Queens, NY 11430, United States",
    coordinates: { lat: 40.6413, lng: -73.7781 },
    category: "TRANSIT_POINT",
    iata: "JFK",
    price: {
      typicalCost: 0
    }
  };

  const mockTransitCDG: Location = {
    id: "loc-cdg-arr" as any,
    name: "Paris Charles de Gaulle Airport - Terminal 2E",
    address: "95700 Roissy-en-France, France",
    coordinates: { lat: 49.0097, lng: 2.5479 },
    category: "TRANSIT_POINT",
    iata: "CDG",
    price: {
      typicalCost: 0
    }
  };

  const mockTransitLHR: Location = {
    id: "loc-lhr-layover" as any,
    name: "London Heathrow Airport - Terminal 5",
    address: "Hounslow TW6 2GA, United Kingdom",
    coordinates: { lat: 51.4700, lng: -0.4543 },
    category: "TRANSIT_POINT",
    iata: "LHR",
    price: {
      typicalCost: 35
    }
  };

  // Suggestions
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
        startTime: "2026-06-09T22:30:00Z",
        endTime: "2026-06-10T11:45:00Z"
      }
    ],
    price: {
      actualCost: 680,
      typicalCost: 820
    }
  };

  // Run Zod schema parsing validations on state changes
  let schemaValidationError: string | null = null;
  try {
    CityHubSchema.parse(mockOriginCity);
    CityHubSchema.parse(mockCityHub);
    LocationSchema.parse(mockHotelRitz);
    LocationSchema.parse(mockLouvre);
    LocationSchema.parse(mockJulesVerne);
    LocationSchema.parse(mockTransitJFK);
    LocationSchema.parse(mockTransitCDG);
    LocationSchema.parse(mockTransitLHR);
    SuggestionSchema.parse(mockEventSuggestion);
    SuggestionSchema.parse(mockFlightSuggestion);
    
    // Validate live dashboards state
    BudgetSchema.parse(budgetData);
    TargetDateRangeSchema.parse(dateRangeData);
  } catch (err: any) {
    schemaValidationError = err.message;
    console.error("Zod Schema Validation Error:", err);
  }

  // Interactive suggestion adding toggle
  const toggleSuggestion = (id: string) => {
    setAddedSuggestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Timeline list for City Hub Card
  const timelineItems = [
    { label: "Hotel Ritz Paris", subLabel: "June 10 - 15" },
    { label: "Louvre Private Tour", subLabel: "June 11 10:00" },
    { label: "Le Jules Verne Dinner", subLabel: "June 12 19:30" }
  ];

  return (
    <main className="page-container">
      {/* Back Link */}
      <Link href="/globe" className="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Globe View
      </Link>

      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">Trip Flow Component Design Arena</h1>
        <p className="page-subtitle">
          Sleek UI sandbox prototyping both on-globe Marker Cards and on-screen Sidebar Dashboards.
        </p>
      </header>

      {/* Zod Schema Validation Banner */}
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {schemaValidationError ? (
          <div className="validation-banner validation-error">
            <span style={{ fontSize: "1.5rem" }}>⚠️</span>
            <div>
              <strong>Schema Validation Failure:</strong> One or more components contain mock data that violates Zod validation. Details:
              <pre style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>{schemaValidationError}</pre>
            </div>
          </div>
        ) : (
          <div className="validation-banner validation-success">
            <span style={{ fontSize: "1.5rem" }}>✓</span>
            <div>
              <strong>Design Schema Constraints Verified:</strong> All active components (Marker Cards & Dashboards) are running on mock state strictly validated by the domain compiler schemas.
            </div>
          </div>
        )}
      </div>

      {/* Responsive Two-Column Sandbox Layout */}
      <div className="sandbox-layout">
        
        {/* --- LEFT PANEL: GEOLOCATED MARKER CARDS (Point-Anchored UI) --- */}
        <div className="main-panels">
          
          {/* (1) ORIGIN CITY */}
          <section className="segment" style={{ "--accent-color": "var(--origin-color)" } as React.CSSProperties}>
            <div className="segment-header">
              <div>
                <h2 className="segment-title">1. Origin City Node</h2>
                <p className="segment-desc">Visual marker anchored to the traveler's origin coordinates.</p>
              </div>
              <span className="widget-badge">Map Marker</span>
            </div>
            <div className="cards-row">
              <OriginCityCard
                originCity={mockOriginCity}
                travelerCount={travelerCount}
                onTravelerCountChange={setTravelerCount}
                isActive={activeCardId === mockOriginCity.id}
                onClick={() => setActiveCardId(mockOriginCity.id)}
              />
            </div>
          </section>

          {/* (2) CITY HUB */}
          <section className="segment" style={{ "--accent-color": "var(--hub-color)" } as React.CSSProperties}>
            <div className="segment-header">
              <div>
                <h2 className="segment-title">2. City Hub Node</h2>
                <p className="segment-desc">Anchored to destination cities. Summarizes internal itinerary milestones.</p>
              </div>
              <span className="widget-badge">Map Marker</span>
            </div>
            <div className="cards-row">
              <CityHubCard
                cityHub={mockCityHub}
                timelineItems={timelineItems}
                isActive={activeCardId === mockCityHub.id}
                onClick={() => setActiveCardId(mockCityHub.id)}
              />
            </div>
          </section>

          {/* (3) ITINERARY EVENT */}
          <section className="segment" style={{ "--accent-color": "var(--event-color)" } as React.CSSProperties}>
            <div className="segment-header">
              <div>
                <h2 className="segment-title">3. Itinerary Event Nodes</h2>
                <p className="segment-desc">Anchored to specific lodgings, meals, and sights inside city bounds.</p>
              </div>
              <span className="widget-badge">Map Marker</span>
            </div>
            <div className="cards-row">
              <ItineraryEventCard
                eventLocation={mockHotelRitz}
                timeLabel="Check-in: June 10, 15:00"
                isActive={activeCardId === mockHotelRitz.id}
                onClick={() => setActiveCardId(mockHotelRitz.id)}
              />
              <ItineraryEventCard
                eventLocation={mockLouvre}
                timeLabel="June 11, 10:00 - 13:00"
                isActive={activeCardId === mockLouvre.id}
                onClick={() => setActiveCardId(mockLouvre.id)}
              />
              <ItineraryEventCard
                eventLocation={mockJulesVerne}
                timeLabel="June 12, 19:30"
                isActive={activeCardId === mockJulesVerne.id}
                onClick={() => setActiveCardId(mockJulesVerne.id)}
              />
            </div>
          </section>

          {/* (4) TRANSIT LOCATION */}
          <section className="segment" style={{ "--accent-color": "var(--transit-color)" } as React.CSSProperties}>
            <div className="segment-header">
              <div>
                <h2 className="segment-title">4. Transit Locations</h2>
                <p className="segment-desc">Boarding tickets anchored to transit points (airports/train terminals).</p>
              </div>
              <span className="widget-badge">Map Marker</span>
            </div>

            <div className="subsegments-grid">
              <div className="subsegment">
                <div className="subsegment-header">
                  <h3 className="subsegment-title">Variant A: Source Location</h3>
                  <p className="subsegment-desc">Exclusive departure terminal for outgoing transits.</p>
                </div>
                <div className="cards-row">
                  <TransitLocationCard
                    location={mockTransitJFK}
                    variant="departure"
                    sourceCode={mockTransitJFK.iata}
                    destinationCode="PAR"
                    sourceLabel="Source"
                    destinationLabel="Dest."
                    footerBadgeText="T4 GATEway"
                    isActive={activeCardId === mockTransitJFK.id}
                    onClick={() => setActiveCardId(mockTransitJFK.id)}
                  />
                </div>
              </div>

              <div className="subsegment">
                <div className="subsegment-header">
                  <h3 className="subsegment-title">Variant B: Destination Location</h3>
                  <p className="subsegment-desc">Exclusive arrival terminal for incoming transits.</p>
                </div>
                <div className="cards-row">
                  <TransitLocationCard
                    location={mockTransitCDG}
                    variant="arrival"
                    sourceCode="NYC"
                    destinationCode={mockTransitCDG.iata}
                    sourceLabel="Source"
                    destinationLabel="CDG Terminal"
                    footerBadgeText="Baggage 2E"
                    isActive={activeCardId === mockTransitCDG.id}
                    onClick={() => setActiveCardId(mockTransitCDG.id)}
                  />
                </div>
              </div>

              <div className="subsegment">
                <div className="subsegment-header">
                  <h3 className="subsegment-title">Variant C: Layover / Connection</h3>
                  <p className="subsegment-desc">Arrival of previous leg and departure of next leg.</p>
                </div>
                <div className="cards-row">
                  <TransitLocationCard
                    location={mockTransitLHR}
                    variant="layover"
                    sourceCode="JFK"
                    destinationCode="CDG"
                    sourceLabel="06:10 Arr"
                    destinationLabel="08:30 Dep"
                    layoverDurationLabel="2h 20m layover"
                    footerBadgeText={`Transit Fee $${mockTransitLHR.price?.typicalCost}`}
                    isActive={activeCardId === mockTransitLHR.id}
                    onClick={() => setActiveCardId(mockTransitLHR.id)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* (5) SUGGESTIONS */}
          <section className="segment" style={{ "--accent-color": "var(--suggest-color)" } as React.CSSProperties}>
            <div className="segment-header">
              <div>
                <h2 className="segment-title">5. AI Suggestions</h2>
                <p className="segment-desc">Recommendation overlays generated by AI helper models.</p>
              </div>
              <span className="widget-badge">Map Marker</span>
            </div>

            <div className="subsegments-grid">
              <div className="subsegment">
                <div className="subsegment-header">
                  <h3 className="subsegment-title">Variant A: Location Suggestion</h3>
                </div>
                <div className="cards-row">
                  <SuggestionCard
                    suggestion={mockEventSuggestion}
                    isAdded={!!addedSuggestions["seine-cruise"]}
                    onToggleAdd={() => toggleSuggestion("seine-cruise")}
                    isActive={activeCardId === mockEventSuggestion.id}
                    onClick={() => setActiveCardId(mockEventSuggestion.id)}
                  />
                </div>
              </div>

              <div className="subsegment">
                <div className="subsegment-header">
                  <h3 className="subsegment-title">Variant B: Transit Suggestion</h3>
                </div>
                <div className="cards-row">
                  <SuggestionCard
                    suggestion={mockFlightSuggestion}
                    isAdded={!!addedSuggestions["jfk-cdg-flight"]}
                    onToggleAdd={() => toggleSuggestion("jfk-cdg-flight")}
                    isActive={activeCardId === mockFlightSuggestion.id}
                    onClick={() => setActiveCardId(mockFlightSuggestion.id)}
                  />
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* --- RIGHT PANEL: SCREEN-ANCHORED SIDEBAR DASHBOARDS (Global Overlays) --- */}
        <div className="sidebar-panels">
          
          {/* Budget Dashboard Widget */}
          <BudgetDashboard
            data={budgetData}
            onUpdate={setBudgetData}
          />

          {/* Target Date Range Dashboard Widget */}
          <TargetDateRangeDashboard
            data={dateRangeData}
            onUpdate={setDateRangeData}
          />
          
        </div>

      </div>
    </main>
  );
}
