import {
  TripFlowGraphSchema,
  LocationIdSchema,
  CityHubIdSchema,
  TransitIdSchema,
  SuggestionIdSchema,
  TripFlowGraph,
  Location,
  CityHub,
  Transit,
  Suggestion
} from './schema';

const createLocationId = () => LocationIdSchema.parse(crypto.randomUUID());
const createCityHubId = () => CityHubIdSchema.parse(crypto.randomUUID());
const createTransitId = () => TransitIdSchema.parse(crypto.randomUUID());
const createSuggestionId = () => SuggestionIdSchema.parse(crypto.randomUUID());

export const testMockGraph = (): TripFlowGraph => {
  const jfkId = createLocationId();
  const cdgId = createLocationId();
  const eiffelId = createLocationId();

  const nycId = createCityHubId();
  const parisId = createCityHubId();

  const flightTransitId = createTransitId();
  const hotelSuggestionId = createSuggestionId();

  const locations: Record<string, Location> = {
    [jfkId]: {
      id: jfkId,
      name: 'John F. Kennedy International Airport',
      address: 'Queens, NY 11430',
      coordinates: { lat: 40.6413, lng: -73.7781 },
      category: 'TRANSIT_POINT',
    },
    [cdgId]: {
      id: cdgId,
      name: 'Charles de Gaulle Airport',
      address: '95700 Roissy-en-France, France',
      coordinates: { lat: 49.0097, lng: 2.5479 },
      category: 'TRANSIT_POINT',
    },
    [eiffelId]: {
      id: eiffelId,
      name: 'Eiffel Tower',
      address: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris, France',
      coordinates: { lat: 48.8584, lng: 2.2945 },
      category: 'ACTIVITY',
    },
  };

  const cityHubs: Record<string, CityHub> = {
    [nycId]: {
      id: nycId,
      cityName: 'New York City',
      country: 'United States',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      type: 'ORIGIN',
      itinerary: [],
      travelerCount: 2,
    },
    [parisId]: {
      id: parisId,
      cityName: 'Paris',
      country: 'France',
      coordinates: { lat: 48.8566, lng: 2.3522 },
      type: 'HUB',
      itinerary: [
        {
          LocationId: eiffelId,
          startTime: '2026-06-02T10:00:00Z',
          endTime: '2026-06-02T12:00:00Z',
        },
      ],
      arrivalNodeId: cdgId,
      departureNodeId: cdgId,
      travelerCount: 2,
    },
  };

  const transits: Record<string, Transit> = {
    [flightTransitId]: {
      id: flightTransitId,
      fromCityId: nycId,
      toCityId: parisId,
      segments: [
        {
          fromLocationId: jfkId,
          toLocationId: cdgId,
          pathType: 'ARC',
          transportType: 'FLIGHT',
          startTime: '2026-06-01T18:00:00Z',
          endTime: '2026-06-02T08:00:00Z',
        },
      ],
    },
  };

  const suggestions: Record<string, Suggestion> = {
    [hotelSuggestionId]: {
      id: hotelSuggestionId,
      type: 'LOCATION_SUGGESTION',
      title: 'Hôtel Plaza Athénée',
      description: 'Suggested 5-star hotel in Paris',
      targetCityId: parisId,
    },
  };

  const rawGraph = {
    Locations: locations,
    CityHubs: cityHubs,
    Transits: transits,
    suggestions: suggestions,
  };

  return TripFlowGraphSchema.parse(rawGraph);
};
