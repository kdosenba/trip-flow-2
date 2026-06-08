import { z } from "zod";
import {
  TripFlowGraph,
  CityHubIdSchema,
  LocationIdSchema,
} from "../../types/schema";
import {
  generateCityHubId,
  generateLocationId,
  generateTransitId,
} from "../utils/id";
import { getGeocodingService } from "../services/geocoding";
import { recalculateEstimatesAndActuals } from "../utils/graph";

/**
 * Custom Zod-to-Standard JSON Schema Compiler
 * (Zero external dependency weight, natively supports Zod v4 and lowercase standard JSON Schema types)
 * https://ai.google.dev/api/caching#FunctionDeclaration
 */
export interface StandardJsonSchema {
  type: string;
  description?: string;
  properties?: Record<string, StandardJsonSchema>;
  required?: string[];
  enum?: string[];
  items?: StandardJsonSchema;
}

export const zodToStandardJsonSchema = (
  schema: z.ZodTypeAny,
): StandardJsonSchema => {
  const def = schema._def as unknown as Record<string, unknown>;
  const description =
    schema.description || (def.description as string | undefined);

  let type = "";
  let properties: Record<string, StandardJsonSchema> | undefined = undefined;
  const required: string[] = [];
  let enumValues: string[] = [];
  let items: StandardJsonSchema | undefined = undefined;

  let currentSchema: z.ZodTypeAny = schema;

  // Handle Optional wrappers
  if (def.typeName === "ZodOptional" || def.type === "optional") {
    if (currentSchema instanceof z.ZodOptional) {
      currentSchema = currentSchema.unwrap() as z.ZodTypeAny;
    } else if (
      "unwrap" in currentSchema &&
      typeof (currentSchema as { unwrap: unknown }).unwrap === "function"
    ) {
      currentSchema = (
        currentSchema as { unwrap: () => z.ZodTypeAny }
      ).unwrap() as z.ZodTypeAny;
    }
  }

  const currentDef = currentSchema._def as unknown as Record<string, unknown>;
  const typeName =
    (currentDef.typeName as string) || (currentDef.type as string);

  switch (typeName) {
    case "ZodString":
    case "string":
      type = "string";
      break;
    case "ZodNumber":
    case "number":
      type = "number";
      break;
    case "ZodBoolean":
    case "boolean":
      type = "boolean";
      break;
    case "ZodEnum":
    case "enum":
      type = "string";
      if (currentSchema instanceof z.ZodEnum) {
        enumValues = currentSchema.options as string[];
      } else if ("options" in currentSchema) {
        enumValues = (currentSchema as { options: string[] }).options;
      } else if (Array.isArray(currentDef.values)) {
        enumValues = currentDef.values as string[];
      }
      break;
    case "ZodNativeEnum":
    case "nativeEnum":
      type = "string";
      if (
        "enum" in currentSchema &&
        typeof (currentSchema as { enum: unknown }).enum === "object" &&
        (currentSchema as { enum: unknown }).enum !== null
      ) {
        enumValues = Object.keys(
          (currentSchema as { enum: Record<string, unknown> }).enum,
        );
      }
      break;
    case "ZodObject":
    case "object":
      type = "object";
      if (currentSchema instanceof z.ZodObject) {
        const shape = currentSchema.shape as z.ZodRawShape;
        properties = {};
        for (const key of Object.keys(shape)) {
          const propSchema = shape[key];
          if (propSchema) {
            const propSchemaAny = propSchema as z.ZodTypeAny;
            properties[key] = zodToStandardJsonSchema(propSchemaAny);
            const propDef = propSchemaAny._def as unknown as Record<
              string,
              unknown
            >;
            const propTypeName =
              (propDef.typeName as string) || (propDef.type as string);
            if (propTypeName !== "ZodOptional" && propTypeName !== "optional") {
              required.push(key);
            }
          }
        }
      }
      break;
    case "ZodArray":
    case "array":
      type = "array";
      if (currentSchema instanceof z.ZodArray) {
        items = zodToStandardJsonSchema(currentSchema.element as z.ZodTypeAny);
      } else if ("element" in currentSchema) {
        items = zodToStandardJsonSchema(
          (currentSchema as { element: z.ZodTypeAny }).element,
        );
      } else if (currentDef.innerType) {
        items = zodToStandardJsonSchema(currentDef.innerType as z.ZodTypeAny);
      }
      break;
    default:
      type = "string";
  }

  const result: StandardJsonSchema = { type };
  if (description) result.description = description;
  if (properties) result.properties = properties;
  if (required.length > 0) result.required = required;
  if (enumValues.length > 0) result.enum = enumValues;
  if (items) result.items = items;

  return result;
};

// --- TOOL PARAMETER ZOD SCHEMAS ---

export const AddOriginCitySchema = z.object({
  cityId: z.string(),
  cityName: z.string(),
  country: z.string(),
  region: z.string().optional().describe("The region or state name"),
  travelerCount: z
    .number()
    .optional()
    .describe("Number of travelers departing from this origin"),
});

export const AddOriginCitiesSchema = z.object({
  cities: z.array(AddOriginCitySchema).describe("List of origin cities to add"),
});

export const AddTripCitySchema = z.object({
  cityId: z.string(),
  cityName: z.string(),
  country: z.string(),
  region: z.string().optional().describe("The region or state name"),
});

export const AddTripCitiesSchema = z.object({
  cities: z.array(AddTripCitySchema).describe("List of city stops to add"),
});

export const AddItineraryItemSchema = z.object({
  itemId: z.string(),
  name: z.string().describe("Name of the attraction, hotel, or activity"),
  category: z.enum(["LODGING", "MEAL", "ACTIVITY"]),
  startDate: z.string().describe("ISO date"),
  startTime: z.string().optional().describe("ISO time"),
  endDate: z.string().optional().describe("ISO date"),
  endTime: z.string().optional().describe("ISO time"),
  cost: z.number().optional().describe("Cost of the item"),
  unit: z
    .enum(["ROOM", "HOUSE", "PERSON", "ACTIVITY"])
    .optional()
    .describe("Unit type for lodging/activities"),
  mealTier: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .optional()
    .describe("Meal price tier"),
  cityId: z
    .string()
    .describe("The id of the parent CityHub. CityHub must be of type HUB."),
});

export const AddItineraryItemsSchema = z.object({
  items: z
    .array(AddItineraryItemSchema)
    .describe(
      "List of itinerary items (attractions, activities, lodging, meals) to add",
    ),
});

export const AddTransitConnectionSchema = z.object({
  fromCityId: z.string().describe("The source CityHub stop ID"),
  toCityId: z.string().describe("The destination CityHub stop ID"),
  travelerCount: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Override traveler count for this connection. If not specified, all travelers propagate by default."),
  locations: z
    .array(
      z.object({
        locationId: z.string().describe("Logical ID for this transit point"),
        name: z
          .string()
          .describe("Name of the transit point, e.g. JFK Airport"),
        cityName: z.string(),
        country: z.string(),
      }),
    )
    .optional()
    .describe(
      "Define new transit locations to create. Omit if reusing existing ones.",
    ),
  segments: z
    .array(
      z.object({
        fromLocationId: z
          .string()
          .describe("Departure location ID for this segment"),
        toLocationId: z
          .string()
          .describe("Arrival location ID for this segment"),
        transportMode: z.enum(["FLIGHT", "TRAIN", "BUS", "CAR", "BOAT"]),
        departureDate: z.string().describe("ISO date"),
        departureTime: z.string().optional().describe("ISO time"),
        arrivalDate: z.string().describe("ISO date"),
        arrivalTime: z.string().optional().describe("ISO time"),
      }),
    )
    .describe(
      "Segments connecting the departure city to the arrival city. The departure of the first segment is marked as the source city's departureNodeId. The arrival of the last segment is marked as the target city's arrivalNodeId.",
    ),
});

export const AddTransitConnectionsSchema = z.object({
  connections: z
    .array(AddTransitConnectionSchema)
    .describe("List of transit connections to add"),
});

/**
 * Standard declarations for Gemini Function Tools compiled dynamically from Zod schemas
 */
export const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "addOriginCities",
        description:
          "Adds one or more origin cities (CityHubs) to the Trip from which transit can occur. Must contain a travelerCount.",
        parametersJsonSchema: zodToStandardJsonSchema(AddOriginCitiesSchema),
      },
      {
        name: "addTripCities",
        description: "Adds one or more city stops (CityHubs) to the Trip.",
        parametersJsonSchema: zodToStandardJsonSchema(AddTripCitiesSchema),
      },
      {
        name: "addItineraryItems",
        description:
          "Defines one or more itinerary items (activities, lodgings, meals) for specific city hubs.",
        parametersJsonSchema: zodToStandardJsonSchema(AddItineraryItemsSchema),
      },
      {
        name: "addTransitConnections",
        description:
          "Defines one or more transit connections between city stops, including defining any new transit point locations and segment details.",
        parametersJsonSchema: zodToStandardJsonSchema(
          AddTransitConnectionsSchema,
        ),
      },
    ],
  },
];

export interface ToolArguments {
  cities?: {
    cityId?: string;
    cityName: string;
    country: string;
    region?: string;
    travelerCount?: number;
  }[];
  items?: {
    itemId?: string;
    name: string;
    category: "LODGING" | "MEAL" | "ACTIVITY";
    startDate: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    cost?: number;
    unit?: "ROOM" | "HOUSE" | "PERSON" | "ACTIVITY";
    mealTier?: "LOW" | "MEDIUM" | "HIGH";
    cityId: string;
  }[];
  connections?: {
    fromCityId: string;
    toCityId: string;
    travelerCount?: number;
    locations?: {
      locationId: string;
      name: string;
      cityName: string;
      country: string;
    }[];
    segments: {
      fromLocationId: string;
      toLocationId: string;
      transportMode: "FLIGHT" | "TRAIN" | "BUS" | "CAR" | "BOAT";
      departureDate: string;
      departureTime?: string;
      arrivalDate: string;
      arrivalTime?: string;
    }[];
  }[];
}

/**
 * Executes a specific tool mutation on the Graph state
 */
export const executeTool = async (
  name: string,
  args: ToolArguments,
  graph: TripFlowGraph,
 ): Promise<TripFlowGraph> => {
  // Deep clone to prevent side effects during dispatching loops
  const updatedGraph = JSON.parse(JSON.stringify(graph)) as TripFlowGraph;
  const language = graph.clientContext?.language;

  switch (name) {
    case "addOriginCities": {
      const cities = args.cities || [];
      for (const city of cities) {
        const hubId = city.cityId
          ? CityHubIdSchema.parse(city.cityId)
          : generateCityHubId(city.cityName);
        const query = city.region
          ? `${city.cityName}, ${city.region}, ${city.country}`
          : `${city.cityName}, ${city.country}`;
        const geo = await getGeocodingService().geocode(query, language);
        updatedGraph.CityHubs[hubId] = {
          id: hubId,
          cityName: city.cityName,
          region: geo?.region || city.region || undefined,
          country: geo?.country || city.country,
          coordinates: geo ? { lat: geo.lat, lng: geo.lng } : { lat: 0, lng: 0 },
          type: "ORIGIN",
          itinerary: [],
          travelerCount: city.travelerCount || 1,
        };
      }
      break;
    }

    case "addTripCities": {
      const cities = args.cities || [];
      for (const city of cities) {
        const hubId = city.cityId
          ? CityHubIdSchema.parse(city.cityId)
          : generateCityHubId(city.cityName);
        const query = city.region
          ? `${city.cityName}, ${city.region}, ${city.country}`
          : `${city.cityName}, ${city.country}`;
        const geo = await getGeocodingService().geocode(query, language);
        updatedGraph.CityHubs[hubId] = {
          id: hubId,
          cityName: city.cityName,
          region: geo?.region || city.region || undefined,
          country: geo?.country || city.country,
          coordinates: geo ? { lat: geo.lat, lng: geo.lng } : { lat: 0, lng: 0 },
          type: "HUB",
          itinerary: [],
        };
      }
      break;
    }

    case "addItineraryItems": {
      const items = args.items || [];
      for (const item of items) {
        const cityId = CityHubIdSchema.parse(item.cityId);
        const targetHub = updatedGraph.CityHubs[cityId];
        if (!targetHub) {
          throw new Error(
            `Activity creation failed: Target stop UUID "${item.cityId}" does not exist.`,
          );
        }

        const locId = item.itemId
          ? LocationIdSchema.parse(item.itemId)
          : generateLocationId(item.name);
        const query = `${item.name}, ${targetHub.cityName}, ${targetHub.country}`;
        const geo = await getGeocodingService().geocode(query, language);
        const resolvedAddress =
          geo?.address || `${item.name}, ${targetHub.cityName}`;

        updatedGraph.Locations[locId] = {
          id: locId,
          name: geo?.name || item.name,
          address: resolvedAddress,
          coordinates: geo ? { lat: geo.lat, lng: geo.lng } : { lat: 0, lng: 0 },
          category: item.category,
          price:
            item.cost !== undefined || item.unit !== undefined || item.mealTier !== undefined
              ? {
                  actualCost: item.cost,
                  typicalCost: undefined,
                  unit: item.unit,
                  mealTier: item.mealTier,
                }
              : undefined,
          iata: geo?.iata,
        };

        const startTime =
          item.startDate +
          (item.startTime ? `T${item.startTime}` : "T00:00:00Z");
        const endTime = item.endDate
          ? item.endDate + (item.endTime ? `T${item.endTime}` : "T00:00:00Z")
          : undefined;

        targetHub.itinerary.push({
          LocationId: locId,
          startTime,
          endTime,
        });
      }
      break;
    }

    case "addTransitConnections": {
      const connections = args.connections || [];
      for (const conn of connections) {
        const fromCityId = CityHubIdSchema.parse(conn.fromCityId);
        const toCityId = CityHubIdSchema.parse(conn.toCityId);

        // 1. Declare/Create new locations if provided
        if (conn.locations && conn.locations.length > 0) {
          for (const loc of conn.locations) {
            const locId = LocationIdSchema.parse(loc.locationId);
            const query = `${loc.name}, ${loc.cityName}, ${loc.country}`;
            const geo = await getGeocodingService().geocode(query, language);
            const resolvedAddress =
              geo?.address || `${loc.name}, ${loc.cityName}, ${loc.country}`;

            updatedGraph.Locations[locId] = {
              id: locId,
              name: geo?.name || loc.name,
              address: resolvedAddress,
              coordinates: geo ? { lat: geo.lat, lng: geo.lng } : { lat: 0, lng: 0 },
              category: "TRANSIT_POINT",
              iata: geo?.iata,
            };
          }
        }

        // 2. Build segments
        const transitId = generateTransitId(fromCityId, toCityId);
        const segments = conn.segments.map((seg) => {
          const fromLocationId = LocationIdSchema.parse(seg.fromLocationId);
          const toLocationId = LocationIdSchema.parse(seg.toLocationId);

          let transportMode: "FLIGHT" | "TRAIN" | "BUS" | "CAR" | "BOAT" = "CAR";
          if (
            seg.transportMode === "FLIGHT" ||
            seg.transportMode === "TRAIN" ||
            seg.transportMode === "BUS" ||
            seg.transportMode === "CAR"
          ) {
            transportMode = seg.transportMode;
          }

          const startTime =
            seg.departureDate +
            (seg.departureTime ? `T${seg.departureTime}` : "T00:00:00Z");
          const endTime =
            seg.arrivalDate +
            (seg.arrivalTime ? `T${seg.arrivalTime}` : "T00:00:00Z");

          return {
            fromLocationId,
            toLocationId,
            transportMode,
            startTime,
            endTime,
          };
        });

        // 3. Update parent CityHub exit/entry points
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];

        const fromCityHub = updatedGraph.CityHubs[fromCityId];
        if (fromCityHub && firstSegment) {
          fromCityHub.departureNodeId = firstSegment.fromLocationId;
        }

        const toCityHub = updatedGraph.CityHubs[toCityId];
        if (toCityHub && lastSegment) {
          toCityHub.arrivalNodeId = lastSegment.toLocationId;
        }

        // 4. Update the Transits dictionary
        updatedGraph.Transits[transitId] = {
          id: transitId,
          fromCityId,
          toCityId,
          segments,
          travelerCount: conn.travelerCount,
        };
      }
      break;
    }

    default:
      throw new Error(`Unknown function tool invocation: "${name}"`);
  }

  recalculateEstimatesAndActuals(updatedGraph);
  return updatedGraph;
};
