import { z } from "zod";

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
      enumValues =
        (currentSchema as any).options || Object.keys(currentDef.entries || {});
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

export const AddCityHubSchema = z.object({
  cityName: z.string().describe("The name of the destination city, e.g. Paris"),
  country: z.string().describe("The country name, e.g. France"),
  region: z.string().optional().describe("The region or state name (optional)"),
  type: z
    .enum(["ORIGIN", "HUB"])
    .describe("Whether this stop is the trip origin or a standard hub"),
  travelerCount: z
    .number()
    .optional()
    .describe("The number of travelers (optional, default 1)"),
});

console.log(JSON.stringify(zodToStandardJsonSchema(AddCityHubSchema), null, 2));
