import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import {
  TripFlowGraph,
  Location,
  CityHub,
  CityHubId,
  Transit,
  TransitId,
  Suggestion,
  SuggestionId,
  Budget,
  TargetDateRange,
} from "../types/schema";
import { initializeClientContext } from "../lib/utils/clientContext";
import { generateCityHubId } from "../lib/utils/id";

interface TripFlowState {
  graph: TripFlowGraph | null;
  activeCityId: CityHubId | null;
  activeEdgeId: TransitId | null;
  activeSuggestionId: SuggestionId | null;
  isLoadingContext: boolean;
  contextError: string | null;
}

interface TripFlowActions {
  setGraph: (graph: TripFlowGraph) => void;
  addLocation: (location: Location) => void;
  addCityHub: (hub: CityHub) => void;
  addTransit: (transit: Transit) => void;
  addSuggestion: (suggestion: Suggestion) => void;
  selectCity: (id: CityHubId | null) => void;
  selectEdge: (id: TransitId | null) => void;
  selectSuggestion: (id: SuggestionId | null) => void;
  initializeClientContext: () => Promise<void>;
  updateBudget: (budget: Budget) => void;
  updateTargetDateRange: (range: TargetDateRange) => void;
  updateTravelerCount: (id: CityHubId, count: number) => void;
  deleteCityHub: (id: CityHubId) => void;
  clearGraph: () => void;
}

export type TripFlowStore = TripFlowState & TripFlowActions;

export const useTripFlowStore = create<TripFlowStore>()(
  persist(
    immer((set) => ({
      graph: null,
      activeCityId: null,
      activeEdgeId: null,
      activeSuggestionId: null,
      isLoadingContext: true,
      contextError: null,

      setGraph: (graph) => {
        set((state) => {
          state.graph = graph;
        });
      },

      addLocation: (location) => {
        set((state) => {
          if (state.graph) {
            state.graph.Locations[location.id] = location;
          }
        });
      },

      addCityHub: (hub) => {
        set((state) => {
          if (state.graph) {
            state.graph.CityHubs[hub.id] = hub;
          }
        });
      },

      addTransit: (transit) => {
        set((state) => {
          if (state.graph) {
            state.graph.Transits[transit.id] = transit;
          }
        });
      },

      addSuggestion: (suggestion) => {
        set((state) => {
          if (state.graph) {
            state.graph.suggestions[suggestion.id] = suggestion;
          }
        });
      },

      selectCity: (id) => {
        set((state) => {
          state.activeCityId = id;
        });
      },

      selectEdge: (id) => {
        set((state) => {
          state.activeEdgeId = id;
        });
      },

      selectSuggestion: (id) => {
        set((state) => {
          state.activeSuggestionId = id;
        });
      },

      updateBudget: (budget) => {
        set((state) => {
          if (state.graph) {
            state.graph.budget = budget;
          }
        });
      },

      updateTargetDateRange: (range) => {
        set((state) => {
          if (state.graph) {
            state.graph.targetDateRange = range;
          }
        });
      },

      updateTravelerCount: (id, count) => {
        set((state) => {
          if (state.graph && state.graph.CityHubs[id]) {
            state.graph.CityHubs[id].travelerCount = count;
          }
        });
      },

      deleteCityHub: (id) => {
        set((state) => {
          if (state.graph) {
            delete state.graph.CityHubs[id];
          }
        });
      },

      initializeClientContext: async () => {
        set((state) => {
          state.isLoadingContext = true;
          state.contextError = null;
        });

        try {
          const clientContext = await initializeClientContext();
          const originHubId = generateCityHubId(clientContext.location.name);
          const originHub: CityHub = {
            id: originHubId,
            cityName: clientContext.location.name,
            country: clientContext.location.country_name,
            coordinates: clientContext.location.coordinates,
            type: "ORIGIN",
            itinerary: [],
            travelerCount: 1,
            timezone: clientContext.timezone,
          };

          set((state) => {
            state.graph = {
              Locations: {},
              CityHubs: {
                [originHubId]: originHub,
              },
              Transits: {},
              suggestions: {},
              clientContext,
            };
            state.isLoadingContext = false;
          });
        } catch (err) {
          set((state) => {
            state.contextError = (err as Error).message;
            state.isLoadingContext = false;
          });
        }
      },

      clearGraph: () => {
        set((state) => {
          if (state.graph) {
            state.graph.Locations = {};
            state.graph.Transits = {};
            state.graph.suggestions = {};

            // Retain origin hubs, clear itinerary and reset travelerCount to 1
            const originHubs: Record<string, CityHub> = {};
            Object.entries(state.graph.CityHubs).forEach(([id, hub]) => {
              if (hub.type === "ORIGIN") {
                originHubs[id] = {
                  ...hub,
                  itinerary: [],
                  travelerCount: 1,
                };
              }
            });
            state.graph.CityHubs = originHubs;

            // Reset budget min/max and estimate values but keep the structure
            if (state.graph.budget) {
              state.graph.budget.budget = {
                min: undefined,
                max: undefined,
              };
              state.graph.budget.estimate = {
                low: undefined,
                high: undefined,
              };
            }

            // Reset target date range context and actual bounds but keep the structure
            if (state.graph.targetDateRange) {
              state.graph.targetDateRange.target = undefined;
              state.graph.targetDateRange.context = undefined;
              state.graph.targetDateRange.actual = undefined;
            }

            // Reset active selections
            state.activeCityId = null;
            state.activeEdgeId = null;
            state.activeSuggestionId = null;
          }
        });
      },
    })),
    {
      name: "trip-flow-store",
    },
  ),
);
