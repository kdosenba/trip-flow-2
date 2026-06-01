import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  TripFlowGraph,
  Location,
  LocationId,
  CityHub,
  CityHubId,
  Transit,
  TransitId,
  Suggestion,
  SuggestionId
} from '../types/schema';
import { initializeClientContext } from '../lib/utils/clientContext';

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
}

export type TripFlowStore = TripFlowState & TripFlowActions;

export const useTripFlowStore = create<TripFlowStore>()(
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

    initializeClientContext: async () => {
      set((state) => {
        state.isLoadingContext = true;
        state.contextError = null;
      });

      try {
        const clientContext = await initializeClientContext();
        set((state) => {
          state.graph = {
            Locations: {},
            CityHubs: {},
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
  }))
);
