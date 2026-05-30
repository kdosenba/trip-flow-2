import { z } from 'zod';

/**
 * Branded identifier helpers to guarantee zero cross-type contamination.
 */
export const LocationIdSchema = z.string().uuid().brand<'LocationId'>();
export type LocationId = z.infer<typeof LocationIdSchema>;

export const CityHubIdSchema = z.string().uuid().brand<'CityHubId'>();
export type CityHubId = z.infer<typeof CityHubIdSchema>;

export const TransitIdSchema = z.string().uuid().brand<'TransitId'>();
export type TransitId = z.infer<typeof TransitIdSchema>;

export const SuggestionIdSchema = z.string().uuid().brand<'SuggestionId'>();
export type SuggestionId = z.infer<typeof SuggestionIdSchema>;

// --- GEOSPATIAL & BASICS ---

export const CoordinatesSchema = z.object({
  lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

// --- LOCATION NODES ---

export const LocationCategorySchema = z.enum([
  'LODGING',
  'MEAL',
  'ACTIVITY',
  'TRANSIT_POINT',
]);
export type LocationCategory = z.infer<typeof LocationCategorySchema>;

export const LocationSchema = z.object({
  id: LocationIdSchema,
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  coordinates: CoordinatesSchema,
  category: LocationCategorySchema,
});
export type Location = z.infer<typeof LocationSchema>;

// --- ITINERARY ITEMS (TEMPORAL HUB DETAILS) ---

export const DateOrDateTimeSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Must be a valid Date or ISO 8601 Datetime string' }
);
export type DateOrDateTime = z.infer<typeof DateOrDateTimeSchema>;

export const ItineraryItemSchema = z.object({
  LocationId: LocationIdSchema,
  startTime: DateOrDateTimeSchema,
  endTime: DateOrDateTimeSchema.optional(),
}).refine((data) => {
  if (!data.endTime) return true;
  return Date.parse(data.endTime) >= Date.parse(data.startTime);
}, {
  message: 'End time must be on or after start time',
  path: ['endTime'],
});
export type ItineraryItem = z.infer<typeof ItineraryItemSchema>;

// --- CITY NODES ---

export const CityHubTypeSchema = z.enum(['ORIGIN', 'HUB']);
export type CityHubType = z.infer<typeof CityHubTypeSchema>;

export const CityHubSchema = z.object({
  id: CityHubIdSchema,
  cityName: z.string().min(1, 'City name is required'),
  region: z.string().optional(),
  country: z.string().min(1, 'Country name is required'),
  coordinates: CoordinatesSchema,
  type: CityHubTypeSchema,
  // Hub specific details (origin nodes may leave these empty/defaults)
  itinerary: z.array(ItineraryItemSchema).default([]),
  arrivalNodeId: LocationIdSchema.optional(),   // Layout entry point for transit
  departureNodeId: LocationIdSchema.optional(), // Layout exit point for transit
  travelerCount: z.number().int().positive().default(1),
});
export type CityHub = z.infer<typeof CityHubSchema>;

// --- TRANSIT EDGES & SEGMENTS ---

export const TransitSegmentPathTypeSchema = z.enum(['DIRECT', 'ROUTE', 'ARC']);
export type TransitSegmentPathType = z.infer<typeof TransitSegmentPathTypeSchema>;

export const TransportationTypeSchema = z.enum([
  'FLIGHT',
  'TRAIN',
  'BUS',
  'CAR',
  'BOAT',
  'OTHER',
]);
export type TransportationType = z.infer<typeof TransportationTypeSchema>;

export const TransitSegmentSchema = z.object({
  fromLocationId: LocationIdSchema,
  toLocationId: LocationIdSchema,
  pathType: TransitSegmentPathTypeSchema,
  transportType: TransportationTypeSchema,
  startTime: DateOrDateTimeSchema,
  endTime: DateOrDateTimeSchema,
}).refine((data) => Date.parse(data.endTime) >= Date.parse(data.startTime), {
  message: 'Segment end time must be on or after start time',
  path: ['endTime'],
});
export type TransitSegment = z.infer<typeof TransitSegmentSchema>;

export const TransitSchema = z.object({
  id: TransitIdSchema,
  fromCityId: CityHubIdSchema,
  toCityId: CityHubIdSchema,
  segments: z.array(TransitSegmentSchema).min(1, 'Transit edge must contain at least 1 segment'),
});
export type Transit = z.infer<typeof TransitSchema>;

// --- SUGGESTION SYSTEM ---

export const SuggestionTypeSchema = z.enum(['LOCATION_SUGGESTION', 'TRANSIT_SUGGESTION']);
export type SuggestionType = z.infer<typeof SuggestionTypeSchema>;

export const SuggestionSchema = z.object({
  id: SuggestionIdSchema,
  type: SuggestionTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  targetCityId: CityHubIdSchema.optional(),
  targetEdgeId: TransitIdSchema.optional(),
  suggestedLocation: LocationSchema.optional(),
  suggestedSegments: z.array(TransitSegmentSchema).optional(),
});
export type Suggestion = z.infer<typeof SuggestionSchema>;

// --- TRIPFLOW GRAPH CONTAINER ---

export const TripFlowGraphSchema = z.object({
  Locations: z.record(z.string(), LocationSchema),
  CityHubs: z.record(z.string(), CityHubSchema),
  Transits: z.record(z.string(), TransitSchema),
  suggestions: z.record(z.string(), SuggestionSchema),
});
export type TripFlowGraph = z.infer<typeof TripFlowGraphSchema>;
