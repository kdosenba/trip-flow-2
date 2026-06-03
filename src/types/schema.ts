import { z } from 'zod';

/**
 * Branded identifier helpers to guarantee zero cross-type contamination.
 */
export const LocationIdSchema = z.string().min(1).brand<'LocationId'>();
export type LocationId = z.infer<typeof LocationIdSchema>;

export const CityHubIdSchema = z.string().min(1).brand<'CityHubId'>();
export type CityHubId = z.infer<typeof CityHubIdSchema>;

export const TransitIdSchema = z.string().min(1).brand<'TransitId'>();
export type TransitId = z.infer<typeof TransitIdSchema>;

export const SuggestionIdSchema = z.string().min(1).brand<'SuggestionId'>();
export type SuggestionId = z.infer<typeof SuggestionIdSchema>;

// --- GEOSPATIAL & BASICS ---

export const CoordinatesSchema = z.object({
  lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const DateOrDateTimeSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Must be a valid Date or ISO 8601 Datetime string' }
);
export type DateOrDateTime = z.infer<typeof DateOrDateTimeSchema>;

// --- NEW DATA OBJECTS: COST, BUDGET, TARGET DATE RANGE, CLIENT CONTEXT ---

export const CostSchema = z.object({
  actualCost: z.number().nonnegative('Cost cannot be negative').optional(),
  typicalCost: z.number().nonnegative('Cost cannot be negative').optional(),
});
export type Cost = z.infer<typeof CostSchema>;

export const BudgetDetailSchema = z.object({
  min: z.number().nonnegative('Budget cannot be negative').optional(),
  max: z.number().nonnegative('Budget cannot be negative').optional(),
});

export const EstimateDetailSchema = z.object({
  low: z.number().nonnegative('Estimate cannot be negative').optional(),
  high: z.number().nonnegative('Estimate cannot be negative').optional(),
});

export const BudgetSchema = z.object({
  budget: BudgetDetailSchema,
  estimate: EstimateDetailSchema,
});
export type Budget = z.infer<typeof BudgetSchema>;

export const DateOrDateRangeSchema = z.union([
  z.object({
    range: z.object({
      start: DateOrDateTimeSchema,
      end: DateOrDateTimeSchema,
    }).refine((data) => Date.parse(data.end) >= Date.parse(data.start), {
      message: 'Target range end time must be on or after start time',
      path: ['end'],
    }),
  }),
  z.object({
    date: DateOrDateTimeSchema,
  }),
]);

export const TargetDateRangeSchema = z.object({
  target: DateOrDateRangeSchema,
  context: z.string().optional(),
  actual: z.object({
    start: DateOrDateTimeSchema.optional(),
    end: DateOrDateTimeSchema.optional(),
  }).refine((data) => {
    if (data.start && data.end) {
      return Date.parse(data.end) >= Date.parse(data.start);
    }
    return true;
  }, {
    message: 'Actual end time must be on or after start time',
    path: ['end'],
  }).optional(),
});
export type TargetDateRange = z.infer<typeof TargetDateRangeSchema>;

// --- INTERNAL GEOLOCATION CONTRACT ---
export const WhereAmILocationSchema = z.object({
  iata: z.string().optional(),
  name: z.string(),
  country_name: z.string(),
  country_code: z.string(),
  coordinates: CoordinatesSchema,
});
export type WhereAmILocation = z.infer<typeof WhereAmILocationSchema>;

export const ClientContextSchema = z.object({
  location: WhereAmILocationSchema,
  language: z.string(),
  currency: z.string(),
  timezone: z.string(),
});
export type ClientContext = z.infer<typeof ClientContextSchema>;

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
  price: CostSchema.optional(),
  iata: z.string().optional(),
});
export type Location = z.infer<typeof LocationSchema>;

// --- ITINERARY ITEMS (TEMPORAL HUB DETAILS) ---

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
  timezone: z.string().optional(),
});
export type CityHub = z.infer<typeof CityHubSchema>;

// --- TRANSIT EDGES & SEGMENTS ---

export const TransportationModeSchema = z.enum([
  'FLIGHT',
  'TRAIN',
  'BUS',
  'CAR',
  'BOAT',
]);
export type TransportationMode = z.infer<typeof TransportationModeSchema>;

export const TransitSegmentSchema = z.object({
  fromLocationId: LocationIdSchema,
  toLocationId: LocationIdSchema,
  transportMode: TransportationModeSchema,
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
  price: CostSchema.optional(),
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
  price: CostSchema.optional(),
});
export type Suggestion = z.infer<typeof SuggestionSchema>;

// --- TRIPFLOW GRAPH CONTAINER ---

export const TripFlowGraphSchema = z.object({
  Locations: z.record(z.string(), LocationSchema),
  CityHubs: z.record(z.string(), CityHubSchema),
  Transits: z.record(z.string(), TransitSchema),
  suggestions: z.record(z.string(), SuggestionSchema),
  budget: BudgetSchema.optional(),
  targetDateRange: TargetDateRangeSchema.optional(),
  clientContext: ClientContextSchema,
});
export type TripFlowGraph = z.infer<typeof TripFlowGraphSchema>;
