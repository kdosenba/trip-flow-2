# 🗺️ Trip Flow Project Backlog & Roadmap

Welcome to the project backlog! Use this document to keep track of feature ideas, coordinate development, and visualize the architectural components for the **Trip Flow** application.

---

## 🏗️ Architectural Components

### 🧱 1. Model / Schema Development

_Focuses on expanding our core domain data models, validation constraints, and strict typing._

- [x] **[TF-1]** Define central types and Zod schema validation in [`schema.ts`](file:///Users/seraj/trip-flow-2/src/types/schema.ts)
- [x] **[TF-2]** Create comprehensive testing suite for schemas in [`schema.test.ts`](file:///Users/seraj/trip-flow-2/src/types/schema.test.ts)
- [x] **[TF-3]** Add **Price** fields to nodes, transits, and suggestions schemas
- [x] **[TF-4]** Add comprehensive **Budget** constraint types at the Trip/Graph level
- [x] **[TF-5]** Implement **Target Date Range** validation (start/end constraints, overlap detection, scheduling bounds)
- [ ] **[TF-6]** Add branded type constraints for location IDs to prevent cross-contamination
- [x] **[TF-26]** Initialize the trip graph with the origin based on the client context
- [x] **[TF-28]** Refactor the UUID generation to use much shorter IDs, otherwise we risk the LLM making errors when referencing an ID. use IDs that have logic to them so that the LLM can follow along
- [x] **[TF-29]** Implement self-contained Geocoding Service (Nominatim-backed) with tiered fallback retries, multi-language context extraction, and IATA code parsing for transit nodes.

---

### 🧠 2. LLM / Gemini Integration

_Focuses on enabling Gemini models to dynamically interact with, generate, and validate our Trip Flow model._

- [x] **[TF-7]** Design JSON schemas / Function Calling declarations for Gemini to inspect and manipulate the trip graph
- [x] **[TF-8]** Implement robust system prompt instructions detailing graph syntax and constraints for Gemini
- [ ] **[TF-9]** Build parser/middleware to validate Gemini generated JSON outputs against the `TripFlowGraphSchema`
- [ ] **[TF-10]** Enable stateful agent chat flow where the user can issue natural language commands to update the trip flow
- [ ] **[TF-30]** Implement the sanitization process to save tokens when sending to Gemini

---

### 🌐 3. User Interface (Globe & Canvas)

_Focuses on creating a stunning, responsive, and tactile web experience to visualize and interact with the trip flow._

#### 🌍 Globe & Styling

- [ ] **[TF-11]** Set up interactive 3D/2D globe canvas with beautiful custom terrain mapping and sleek styling
- [ ] **[TF-12]** Build rich styling controls (smooth camera transitions, zoom levels, curated visual overlays)

#### 🔀 Nodes & Edges

- [ ] **[TF-13]** Implement visual rendering of location **nodes** placed on the globe/canvas
- [ ] **[TF-14]** Implement visual rendering of transit **edges** representing connections between nodes (with smooth arc animation paths)
- [x] **[TF-27]** For Origins add a button so that you can increase the traveller count

#### ⚠️ Constraints Visualization

- [ ] **[TF-15]** Add visual indicators for **budget constraints** (e.g., color-coded cost indicators, warnings when exceeding limits)
- [ ] **[TF-16]** Add visual indicators for **schedule constraints** (e.g., chronological timelines, date conflicts, overlapping transits)

#### 🖱️ Overall Interactions

- [ ] **[TF-17]** Build drag-and-drop node editing/reordering mechanics
- [ ] **[TF-18]** Implement premium micro-animations (hover transitions, active states, loading indicators)
- [ ] **[TF-25]** Add feature when adding an event so that the user can select the date to add it too, or can ask gemini to organize it. Maybe that is a check box to allow gemini to organize a couple items together.
- [x] **[TF-31]** Review and audit `OriginCityCard` styling, dynamic timezone, and inline traveler adjustments
- [x] **[TF-32]** Review and audit `CityHubCard` date range timezone formatting
- [ ] **[TF-33]** Review and audit `ItineraryEventCard` timeline item event formatting
- [ ] **[TF-34]** Review and audit `TransitLocationCard` layover and standard flow timezone display
- [ ] **[TF-35]** Review and audit `SuggestionCard` segment time formatting
- [ ] **[TF-36]** Review and audit `CityHubDashboard` dynamic timeline items calculation
- [ ] **[TF-37]** Review and audit `TargetDateRangeDashboard` bounds timezone formatting
- [ ] **[TF-38]** Review and audit `AirArcPreview` 3D globe visualization
- [ ] **[TF-39]** Review and audit `LandRoutePreview` 3D globe visualization
- [ ] **[TF-40]** Review and audit `SeaDirectPreview` 3D globe visualization

---

### 🔌 4. Affiliate Integrations

_Focuses on integrating external ticketing, booking, and search APIs to serve as grounding information for Gemini._

- [ ] **[TF-19]** Set up adapter for travel/booking APIs (e.g., Tiqets API client helper)
- [ ] **[TF-20]** Build standard normalization layer to map affiliate API data schemas to our internal Suggestion schema
- [ ] **[TF-21]** Implement caching mechanism for grounding search results to optimize API latency
- [ ] **[TF-22]** Design pipeline to feed structured API results to Gemini as context grounding for recommendations

---

## 💡 Inbox / Future Ideas

_Jot down raw thoughts, user feedback, and future feature expansions here before triaging them into the sections above._

- [ ] **[TF-23]** Enable multi-user collaborative editing of the same trip flow in real time
- [ ] **[TF-24]** Add offline support for viewing and editing saved trip flows
- [x] **[TF-41]** Define the clear function so that we can correctly clear the data from the store. Some data should not be cleared, like the context or the budget and target date range object, just some of their values.
- [ ] **[TF-42]** Automatic calculation of budget estimate and trip actual dates. We should not allow those to be manually set or cleared. They should just recalculate as the trip is changed.
- [ ] **[TF-43]** Modify the budget breakdown to show breakdown by meal, lodging, transportation, activities.
- [ ] **[TF-44]** Support cities with an arrival date but no departure date in the UX (e.g. dynamic day calculation and customized date ranges).
