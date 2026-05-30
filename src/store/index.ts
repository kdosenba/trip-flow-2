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

interface TripFlowState {
  graph: TripFlowGraph;
  activeCityId: CityHubId | null;
  activeEdgeId: TransitId | null;
  activeSuggestionId: SuggestionId | null;
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
}

export type TripFlowStore = TripFlowState & TripFlowActions;

const initialGraph: TripFlowGraph = {
  Locations: {},
  CityHubs: {},
  Transits: {},
  suggestions: {},
};

export const useTripFlowStore = create<TripFlowStore>()(
  immer((set) => ({
    graph: initialGraph,
    activeCityId: null,
    activeEdgeId: null,
    activeSuggestionId: null,

    setGraph: (graph) => {
      set((state) => {
        state.graph = graph;
      });
    },

    addLocation: (location) => {
      set((state) => {
        state.graph.Locations[location.id] = location;
      });
    },

    addCityHub: (hub) => {
      set((state) => {
        state.graph.CityHubs[hub.id] = hub;
      });
    },

    addTransit: (transit) => {
      set((state) => {
        state.graph.Transits[transit.id] = transit;
      });
    },

    addSuggestion: (suggestion) => {
      set((state) => {
        state.graph.suggestions[suggestion.id] = suggestion;
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
  }))
);
