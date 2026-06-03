import {
  CityHubId,
  CityHubIdSchema,
  LocationId,
  LocationIdSchema,
  TransitId,
  TransitIdSchema,
  SuggestionId,
  SuggestionIdSchema,
} from "../../types/schema";

const shortId = () => Math.random().toString(36).substring(2, 6);

export const generateCityHubId = (cityName: string): CityHubId => {
  const slug = cityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return CityHubIdSchema.parse(
    slug ? `hub_${slug}_${shortId()}` : `hub_${shortId()}`,
  );
};

export const generateLocationId = (name?: string): LocationId => {
  return LocationIdSchema.parse(`loc_${shortId()}`);
};

export const generateTransitId = (
  fromCityId: string,
  toCityId: string,
): TransitId => {
  const from = fromCityId.replace(/^hub_/, "");
  const to = toCityId.replace(/^hub_/, "");
  return TransitIdSchema.parse(`${from}_to_${to}`);
};

export const generateSuggestionId = (title: string): SuggestionId => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return SuggestionIdSchema.parse(
    slug ? `suggest_${slug}_${shortId()}` : `suggest_${shortId()}`,
  );
};
