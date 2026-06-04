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
    default:
      type = "string";
  }

  const result: StandardJsonSchema = { type };
  if (description) result.description = description;
  if (properties) result.properties = properties;
  if (required.length > 0) result.required = required;
  if (enumValues.length > 0) result.enum = enumValues;

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

export const AddTripCitySchema = z.object({
  cityId: z.string(),
  cityName: z.string(),
  country: z.string(),
  region: z.string().optional().describe("The region or state name"),
});

export const AddTransitPointSchema = z.object({
  locationId: z.string(),
  name: z.string().describe("Name of the transit point, e.g. JFK Airport"),
  cityName: z.string(),
  country: z.string(),
  cityId: z
    .string()
    .optional()
    .describe("City in which transit point is located. Optional"),
  arrivalOrDeparture: z
    .enum(["ARRIVAL", "DEPARTURE", "BOTH"])
    .optional()
    .describe("If cityId is specified, this field is required."),
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
  cityId: z
    .string()
    .describe("The id of the parent CityHub. CityHub must be of type HUB."),
});

export const ConnectTransitPointsSchema = z.object({
  fromLocationId: z
    .string()
    .describe("The LocationId of the origin transit point location"),
  toLocationId: z
    .string()
    .describe("The LocationId of the destination transit point location"),
  transportMode: z.enum(["FLIGHT", "TRAIN", "BUS", "CAR", "WALK", "OTHER"]),
  departureDate: z.string().describe("ISO date"),
  departureTime: z.string().optional().describe("ISO time"),
  arrivalDate: z.string().describe("ISO date"),
  arrivalTime: z.string().optional().describe("ISO time"),
});

/**
 * Standard declarations for Gemini Function Tools compiled dynamically from Zod schemas
 */
export const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "addOriginCity",
        description:
          "Adds an origin (CityHub) to the Trip from which transit to other Cities can occur. It must contain a travelerCount.",
        parametersJsonSchema: zodToStandardJsonSchema(AddOriginCitySchema),
      },
      {
        name: "addTripCity",
        description:
          "Adds a city (CityHub) stop to the Trip. This is you will help plan an itinerary for this stop",
        parametersJsonSchema: zodToStandardJsonSchema(AddTripCitySchema),
      },
      {
        name: "addTransitPoint",
        description: "Defines a transit point used to connect two cities.",
        parametersJsonSchema: zodToStandardJsonSchema(AddTransitPointSchema),
      },
      {
        name: "addItineraryItem",
        description: "Defines an itinerary item for a specific city hub.",
        parametersJsonSchema: zodToStandardJsonSchema(AddItineraryItemSchema),
      },
      {
        name: "connectTransitPoints",
        description:
          "Defines a transit connection between two cities using their defined transit points.",
        parametersJsonSchema: zodToStandardJsonSchema(
          ConnectTransitPointsSchema,
        ),
      },
    ],
  },
];

export interface ToolArguments {
  cityId?: string;
  cityName?: string;
  country?: string;
  region?: string;
  travelerCount?: number;
  locationId?: string;
  name?: string;
  arrivalOrDeparture?: "ARRIVAL" | "DEPARTURE" | "BOTH";
  itemId?: string;
  category?: "LODGING" | "MEAL" | "ACTIVITY";
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  cost?: number;
  fromLocationId?: string;
  toLocationId?: string;
  transportMode?: "FLIGHT" | "TRAIN" | "BUS" | "CAR" | "WALK" | "OTHER";
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
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
    case "addOriginCity": {
      const hubId = args.cityId
        ? CityHubIdSchema.parse(args.cityId)
        : generateCityHubId(args.cityName!);
      const query = args.region
        ? `${args.cityName!}, ${args.region}, ${args.country!}`
        : `${args.cityName!}, ${args.country!}`;
      const geo = await getGeocodingService().geocode(query, language);
      updatedGraph.CityHubs[hubId] = {
        id: hubId,
        cityName: args.cityName!,
        region: geo?.region || args.region || undefined,
        country: geo?.country || args.country!,
        coordinates: geo ? { lat: geo.lat, lng: geo.lng } : { lat: 0, lng: 0 },
        type: "ORIGIN",
        itinerary: [],
        travelerCount: args.travelerCount || 1,
      };
      break;
    }

    case "addTripCity": {
      const hubId = args.cityId
        ? CityHubIdSchema.parse(args.cityId)
        : generateCityHubId(args.cityName!);
      const query = args.region
        ? `${args.cityName!}, ${args.region}, ${args.country!}`
        : `${args.cityName!}, ${args.country!}`;
      const geo = await getGeocodingService().geocode(query, language);
      updatedGraph.CityHubs[hubId] = {
        id: hubId,
        cityName: args.cityName!,
        region: geo?.region || args.region || undefined,
        country: geo?.country || args.country!,
        coordinates: geo ? { lat: geo.lat, lng: geo.lng } : { lat: 0, lng: 0 },
        type: "HUB",
        itinerary: [],
        travelerCount: 1,
      };
      break;
    }

    case "addTransitPoint": {
      const locId = args.locationId
        ? LocationIdSchema.parse(args.locationId)
        : generateLocationId(args.name!);
      const query = args.region
        ? `${args.name!}, ${args.cityName!}, ${args.region}, ${args.country!}`
        : `${args.name!}, ${args.cityName!}, ${args.country!}`;
      const geo = await getGeocodingService().geocode(query, language);
      const resolvedAddress =
        geo?.address || `${args.name!}, ${args.cityName!}, ${args.country!}`;

      updatedGraph.Locations[locId] = {
        id: locId,
        name: geo?.name || args.name!,
        address: resolvedAddress,
        coordinates: geo ? { lat: geo.lat, lng: geo.lng } : { lat: 0, lng: 0 },
        category: "TRANSIT_POINT",
        iata: geo?.iata,
      };

      // 1. If explicit cityId is passed, link it directly
      if (args.cityId) {
        const cityId = CityHubIdSchema.parse(args.cityId);
        const targetHub = updatedGraph.CityHubs[cityId];
        if (targetHub) {
          if (
            args.arrivalOrDeparture === "ARRIVAL" ||
            args.arrivalOrDeparture === "BOTH"
          ) {
            targetHub.arrivalNodeId = locId;
          }
          if (
            args.arrivalOrDeparture === "DEPARTURE" ||
            args.arrivalOrDeparture === "BOTH"
          ) {
            targetHub.departureNodeId = locId;
          }
        }
      } else {
        // 2. Fallback: Automatically link this transit point to the corresponding CityHub if found
        const targetHub = Object.values(updatedGraph.CityHubs).find(
          (hub) => hub.cityName.toLowerCase() === args.cityName!.toLowerCase(),
        );
        if (targetHub) {
          if (!targetHub.arrivalNodeId) targetHub.arrivalNodeId = locId;
          if (!targetHub.departureNodeId) targetHub.departureNodeId = locId;
        }
      }
      break;
    }

    case "addItineraryItem": {
      const cityId = CityHubIdSchema.parse(args.cityId!);
      const targetHub = updatedGraph.CityHubs[cityId];
      if (!targetHub) {
        throw new Error(
          `Activity creation failed: Target stop UUID "${args.cityId!}" does not exist.`,
        );
      }

      const locId = args.itemId
        ? LocationIdSchema.parse(args.itemId)
        : generateLocationId(args.name!);
      const query = `${args.name!}, ${targetHub.cityName}, ${targetHub.country}`;
      const geo = await getGeocodingService().geocode(query, language);
      const resolvedAddress =
        geo?.address || `${args.name!}, ${targetHub.cityName}`;

      updatedGraph.Locations[locId] = {
        id: locId,
        name: geo?.name || args.name!,
        address: resolvedAddress,
        coordinates: geo ? { lat: geo.lat, lng: geo.lng } : { lat: 0, lng: 0 },
        category: args.category!,
        price:
          args.cost !== undefined
            ? {
                actualCost: args.cost,
                typicalCost: args.cost,
              }
            : undefined,
        iata: geo?.iata,
      };

      const startTime =
        args.startDate! +
        (args.startTime ? `T${args.startTime}` : "T00:00:00Z");
      const endTime = args.endDate
        ? args.endDate + (args.endTime ? `T${args.endTime}` : "T00:00:00Z")
        : undefined;

      targetHub.itinerary.push({
        LocationId: locId,
        startTime,
        endTime,
      });
      break;
    }

    case "connectTransitPoints": {
      const fromLocationId = LocationIdSchema.parse(args.fromLocationId!);
      const toLocationId = LocationIdSchema.parse(args.toLocationId!);

      // Dynamically locate the respective CityHubIds based on arrival/departure transit nodes
      let fromCityId = Object.values(updatedGraph.CityHubs).find(
        (hub) =>
          hub.departureNodeId === fromLocationId ||
          hub.arrivalNodeId === fromLocationId,
      )?.id;

      let toCityId = Object.values(updatedGraph.CityHubs).find(
        (hub) =>
          hub.arrivalNodeId === toLocationId ||
          hub.departureNodeId === toLocationId,
      )?.id;

      // Fallback: search by name matching address if not explicitly linked
      if (!fromCityId) {
        const fromLoc = updatedGraph.Locations[fromLocationId];
        if (fromLoc) {
          fromCityId = Object.values(updatedGraph.CityHubs).find((hub) =>
            fromLoc.address.toLowerCase().includes(hub.cityName.toLowerCase()),
          )?.id;
        }
      }
      if (!toCityId) {
        const toLoc = updatedGraph.Locations[toLocationId];
        if (toLoc) {
          toCityId = Object.values(updatedGraph.CityHubs).find((hub) =>
            toLoc.address.toLowerCase().includes(hub.cityName.toLowerCase()),
          )?.id;
        }
      }

      if (!fromCityId || !toCityId) {
        throw new Error(
          `Transit connection failed: Could not resolve CityHub nodes for location IDs from: "${fromLocationId}", to: "${toLocationId}".`,
        );
      }

      const transitId = generateTransitId(fromCityId, toCityId);
      let transportMode: "FLIGHT" | "TRAIN" | "BUS" | "CAR" | "BOAT" = "CAR";
      if (
        args.transportMode === "FLIGHT" ||
        args.transportMode === "TRAIN" ||
        args.transportMode === "BUS" ||
        args.transportMode === "CAR"
      ) {
        transportMode = args.transportMode;
      }
      const startTime =
        args.departureDate! +
        (args.departureTime ? `T${args.departureTime}` : "T00:00:00Z");
      const endTime =
        args.arrivalDate! +
        (args.arrivalTime ? `T${args.arrivalTime}` : "T00:00:00Z");

      updatedGraph.Transits[transitId] = {
        id: transitId,
        fromCityId,
        toCityId,
        segments: [
          {
            fromLocationId,
            toLocationId,
            transportMode,
            startTime,
            endTime,
          },
        ],
      };
      break;
    }

    default:
      throw new Error(`Unknown function tool invocation: "${name}"`);
  }

  recalculateEstimatesAndActuals(updatedGraph);
  return updatedGraph;
};
