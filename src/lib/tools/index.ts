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
  cityId: z.string().optional().describe("City in which transit point is located. Optional"),
  arrivalOrDeparture: z.enum(["ARRIVAL", "DEPARTURE", "BOTH"]).optional().describe("If cityId is specified, this field is required."),
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
  cityId: z.string().describe("The id of the parent CityHub. CityHub must be of type HUB."),
});

export const ConnectTransitPointsSchema = z.object({
  fromLocationId: z.string().describe("The LocationId of the origin transit point location"),
  toLocationId: z.string().describe("The LocationId of the destination transit point location"),
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
        description: "Adds an origin (CityHub) to the Trip from which transit to other Cities can occur. It must contain a travelerCount.",
        parametersJsonSchema: zodToStandardJsonSchema(AddOriginCitySchema),
      },
      {
        name: "addTripCity",
        description: "Adds a city (CityHub) stop to the Trip. This is you will help plan an itinerary for this stop",
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
        description: "Defines a transit connection between two cities using their defined transit points.",
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
        category: "TRANSIT_POINT"
      };

      // Automatically link this transit point to the corresponding CityHub if found
      const targetHub = Object.values(updatedGraph.CityHubs).find(
        (hub) => hub.cityName.toLowerCase() === args.cityName.toLowerCase()
      );
      if (targetHub) {
        if (!targetHub.arrivalNodeId) targetHub.arrivalNodeId = locId;
        if (!targetHub.departureNodeId) targetHub.departureNodeId = locId;
      }
      break;
    }

    case "addItineraryItem": {
      const cityId = CityHubIdSchema.parse(args.cityId);
      const targetHub = updatedGraph.CityHubs[cityId];
      if (!targetHub) {
        throw new Error(`Activity creation failed: Target stop UUID "${args.cityId}" does not exist.`);
      }

      const locId = args.itemId ? LocationIdSchema.parse(args.itemId) : generateLocationId(args.name);
      updatedGraph.Locations[locId] = {
        id: locId,
        name: args.name,
        address: args.address, // Resolve later
        coordinates: { lat: 0, lng: 0 }, // Resolved later
        category: args.category,
        price: args.cost !== undefined ? {
          actualCost: args.cost,
          typicalCost: args.cost
        } : undefined
      };

      const startTime = args.startDate + (args.startTime ? `T${args.startTime}` : 'T00:00:00Z');
      const endTime = args.endDate ? args.endDate + (args.endTime ? `T${args.endTime}` : 'T00:00:00Z') : undefined;

      targetHub.itinerary.push({
        LocationId: locId,
        startTime,
        endTime
      });
      break;
    }

    case "connectTransitPoints": {
      const fromLocationId = LocationIdSchema.parse(args.fromLocationId);
      const toLocationId = LocationIdSchema.parse(args.toLocationId);

      // Dynamically locate the respective CityHubIds based on arrival/departure transit nodes
      let fromCityId = Object.values(updatedGraph.CityHubs).find(
        (hub) => hub.departureNodeId === fromLocationId || hub.arrivalNodeId === fromLocationId
      )?.id;

      let toCityId = Object.values(updatedGraph.CityHubs).find(
        (hub) => hub.arrivalNodeId === toLocationId || hub.departureNodeId === toLocationId
      )?.id;

      // Fallback: search by name matching address if not explicitly linked
      if (!fromCityId) {
        const fromLoc = updatedGraph.Locations[fromLocationId];
        if (fromLoc) {
          fromCityId = Object.values(updatedGraph.CityHubs).find((hub) =>
            fromLoc.address.toLowerCase().includes(hub.cityName.toLowerCase())
          )?.id;
        }
      }
      if (!toCityId) {
        const toLoc = updatedGraph.Locations[toLocationId];
        if (toLoc) {
          toCityId = Object.values(updatedGraph.CityHubs).find((hub) =>
            toLoc.address.toLowerCase().includes(hub.cityName.toLowerCase())
          )?.id;
        }
      }

      if (!fromCityId || !toCityId) {
        throw new Error(
          `Transit connection failed: Could not resolve CityHub nodes for location IDs from: "${fromLocationId}", to: "${toLocationId}".`
        );
      }

      const transitId = generateTransitId(fromCityId, toCityId);
      const transportMode = args.transportMode;
      const startTime = args.departureDate + (args.departureTime ? `T${args.departureTime}` : 'T00:00:00Z');
      const endTime = args.arrivalDate + (args.arrivalTime ? `T${args.arrivalTime}` : 'T00:00:00Z');

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
            endTime
          }
        ],
      };
      break;
    }

    default:
      throw new Error(`Unknown function tool invocation: "${name}"`);
  }

  return updatedGraph;
};
