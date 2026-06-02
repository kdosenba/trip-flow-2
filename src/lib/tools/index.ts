import { z } from "zod";
import {
  TripFlowGraph,
  CityHubIdSchema,
  LocationIdSchema
} from "../../types/schema";
import {
  generateCityHubId,
  generateLocationId,
  generateTransitId
} from "../utils/id";

/**
 * Custom Zod-to-Standard JSON Schema Compiler
 * (Zero external dependency weight, natively supports Zod v4 and lowercase standard JSON Schema types)
 * https://ai.google.dev/api/caching#FunctionDeclaration
 */
export const zodToStandardJsonSchema = (schema: z.ZodTypeAny): any => {
  const def = schema._def as any;
  const description = schema.description || def.description;

  let type = "";
  let properties: any = undefined;
  let required: string[] = [];
  let enumValues: string[] = [];

  let currentSchema = schema;
  let isOptional = false;

  // Handle Optional wrappers
  if (def.type === "optional") {
    isOptional = true;
    currentSchema = (schema as any).unwrap();
  }

  const currentDef = currentSchema._def as any;

  switch (currentDef.type) {
    case "string":
      type = "string";
      break;
    case "number":
      type = "number";
      break;
    case "boolean":
      type = "boolean";
      break;
    case "enum":
      type = "string";
      enumValues = (currentSchema as any).options || Object.keys(currentDef.entries || {});
      break;
    case "object":
      type = "object";
      const shape = (currentSchema as z.ZodObject<any>).shape;
      properties = {};
      for (const key of Object.keys(shape)) {
        const propSchema = shape[key];
        properties[key] = zodToStandardJsonSchema(propSchema);
        const propDef = propSchema._def as any;
        // If it is not optional, it is required in the object scope
        if (propDef.type !== "optional") {
          required.push(key);
        }
      }
      break;
    default:
      type = "string";
  }

  const result: any = { type };
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
  travelerCount: z.number().optional().describe("Number of travelers departing from this origin"),
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
  cityId: z.string().describe("The unique UUID of the parent CityHub destination"),
});

export const ConnectTransitPointsSchema = z.object({
  fromLocationId: z.string().describe("The LocationId UUID of the origin transit point location"),
  toLocationId: z.string().describe("The LocationId UUID of the destination transit point location"),
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
        description: "Adds the initial starting origin stop (CityHub) destination to the itinerary. Requires traveler count.",
        parametersJsonSchema: zodToStandardJsonSchema(AddOriginCitySchema),
      },
      {
        name: "addTripCity",
        description: "Adds a standard intermediate travel stop (CityHub) destination to the itinerary without any itinerary items.",
        parametersJsonSchema: zodToStandardJsonSchema(AddTripCitySchema),
      },
      {
        name: "addTransitPoint",
        description: "Defines a transit point location node (such as an airport or train station) without coordinates to support start, end, or intermediate locations.",
        parametersJsonSchema: zodToStandardJsonSchema(AddTransitPointSchema),
      },
      {
        name: "addItineraryItem",
        description: "Defines an itinerary item and its associated location details (without coordinates) for a specific city hub.",
        parametersJsonSchema: zodToStandardJsonSchema(AddItineraryItemSchema),
      },
      {
        name: "connectTransitPoints",
        description: "Defines a transit connection (Transit edge) between two existing city hubs by referencing previously created transit point location IDs.",
        parametersJsonSchema: zodToStandardJsonSchema(ConnectTransitPointsSchema),
      }
    ]
  }
];

/**
 * Executes a specific tool mutation on the Graph state
 */
export const executeTool = async (
  name: string,
  args: any,
  graph: TripFlowGraph
): Promise<TripFlowGraph> => {
  // Deep clone to prevent side effects during dispatching loops
  const updatedGraph = JSON.parse(JSON.stringify(graph)) as TripFlowGraph;

  switch (name) {
    case "addOriginCity": {
      const hubId = args.cityId ? CityHubIdSchema.parse(args.cityId) : generateCityHubId(args.cityName);
      updatedGraph.CityHubs[hubId] = {
        id: hubId,
        cityName: args.cityName,
        region: args.region,
        country: args.country,
        coordinates: { lat: 0, lng: 0 }, // Resolved later
        type: "ORIGIN",
        itinerary: [],
        travelerCount: args.travelerCount
      };
      break;
    }

    case "addTripCity": {
      const hubId = args.cityId ? CityHubIdSchema.parse(args.cityId) : generateCityHubId(args.cityName);
      updatedGraph.CityHubs[hubId] = {
        id: hubId,
        cityName: args.cityName,
        region: args.region,
        country: args.country,
        coordinates: { lat: 0, lng: 0 }, // Resolved later
        type: "HUB",
        itinerary: [],
        travelerCount: 1
      };
      break;
    }

    case "addTransitPoint": {
      const locId = args.locationId ? LocationIdSchema.parse(args.locationId) : generateLocationId(args.name);
      updatedGraph.Locations[locId] = {
        id: locId,
        name: args.name,
        address: args.address,
        coordinates: { lat: 0, lng: 0 }, // Resolved later
        category: "TRANSIT_POINT",
        price: args.actualCost !== undefined || args.typicalCost !== undefined ? {
          actualCost: args.actualCost ?? args.typicalCost ?? 0,
          typicalCost: args.typicalCost ?? args.actualCost ?? 0
        } : undefined
      };
      break;
    }

    case "addItineraryItem": {
      const cityId = CityHubIdSchema.parse(args.cityId);
      const targetHub = updatedGraph.CityHubs[cityId];
      if (!targetHub) {
        throw new Error(`Activity creation failed: Target stop UUID "${args.cityId}" does not exist.`);
      }

      const locId = args.itemId ? LocationIdSchema.parse(args.itemId) : generateLocationId(args.title || args.name || "activity");
      updatedGraph.Locations[locId] = {
        id: locId,
        name: args.title,
        address: args.address,
        coordinates: { lat: 0, lng: 0 }, // Resolved later
        category: args.category,
        price: args.actualCost !== undefined || args.typicalCost !== undefined ? {
          actualCost: args.actualCost ?? args.typicalCost ?? 0,
          typicalCost: args.typicalCost ?? args.actualCost ?? 0
        } : undefined
      };

      targetHub.itinerary.push({
        LocationId: locId,
        startTime: args.startTime,
        endTime: args.endTime
      });
      break;
    }

    case "connectTransitPoints": {
      const fromCityId = CityHubIdSchema.parse(args.fromCityId);
      const toCityId = CityHubIdSchema.parse(args.toCityId);
      const fromLocationId = LocationIdSchema.parse(args.fromLocationId);
      const toLocationId = LocationIdSchema.parse(args.toLocationId);

      const fromHub = updatedGraph.CityHubs[fromCityId];
      const toHub = updatedGraph.CityHubs[toCityId];
      if (!fromHub || !toHub) {
        throw new Error(`Transit connection failed: Referenced CityHub stops must be valid active nodes.`);
      }

      const transitId = generateTransitId(fromCityId, toCityId);
      updatedGraph.Transits[transitId] = {
        id: transitId,
        fromCityId,
        toCityId,
        segments: [
          {
            fromLocationId,
            toLocationId,
            pathType: args.pathType || "ARC",
            transportType: args.transportType,
            startTime: args.startTime,
            endTime: args.endTime
          }
        ],
        price: args.actualCost !== undefined || args.typicalCost !== undefined ? {
          actualCost: args.actualCost ?? args.typicalCost ?? 0,
          typicalCost: args.typicalCost ?? args.actualCost ?? 0
        } : undefined
      };
      break;
    }

    default:
      throw new Error(`Unknown function tool invocation: "${name}"`);
  }

  return updatedGraph;
};
