import { WhereAmILocation, WhereAmILocationSchema } from '../../types/schema';

/**
 * Fetches geolocation information from the Travelpayouts "whereami" endpoint,
 * passing the user's localized language code (e.g. "en" or "fr"), and normalizes the response.
 * 
 * @link https://support.travelpayouts.com/hc/en-us/articles/205895898-How-to-determine-the-user-s-location-by-IP-address 
 */
export const fetchWhereAmI = async (language: string): Promise<WhereAmILocation> => {
  const langCode = language.split('-')[0] || 'en';
  const url = `https://www.travelpayouts.com/whereami?locale=${langCode}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch geolocation from Travelpayouts: ${response.statusText}`);
  }

  const rawData = (await response.json()) as any;

  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Invalid response from Travelpayouts: Expected an object');
  }

  const coordinatesStr = rawData.coordinates;
  if (typeof coordinatesStr !== 'string') {
    throw new Error('Invalid response from Travelpayouts: Missing coordinates string');
  }

  // Parse coordinate string (supports colon ":" delimiters)
  const parts = coordinatesStr.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid coordinate format: expected "lat:lng" but got "${coordinatesStr}"`);
  }

  const partLat = parts[0];
  const partLng = parts[1];
  if (!partLat || !partLng) {
    throw new Error(`Invalid coordinates layout: "${coordinatesStr}"`);
  }

  const lng = parseFloat(partLat.trim());
  const lat = parseFloat(partLng.trim());

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error(`Invalid coordinate values in: "${coordinatesStr}"`);
  }

  // Construct and validate internal schema representation
  return WhereAmILocationSchema.parse({
    iata: rawData.iata,
    name: rawData.name,
    country_name: rawData.country_name,
    country_code: rawData.country_code,
    coordinates: { lat, lng },
  });
};
