export interface GeocodeResult {
  lat: number;
  lng: number;
  name: string;
  country?: string | undefined;
  region?: string | undefined;
  address?: string | undefined;
  iata?: string | undefined;
}

export interface GeocodingService {
  geocode: (query: string, language?: string) => Promise<GeocodeResult | null>;
}

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  region?: string;
  county?: string;
  postcode?: string;
  country?: string;
}

export const constructAddressFromNominatim = (
  address: NominatimAddress | null | undefined,
): string => {
  if (!address) return "";
  const parts: string[] = [];

  // 1. House number and road
  if (address.house_number && address.road) {
    parts.push(`${address.house_number} ${address.road}`);
  } else if (address.road) {
    parts.push(address.road);
  }

  // 2. Suburb / Neighbourhood
  if (address.suburb) {
    parts.push(address.suburb);
  } else if (address.neighbourhood) {
    parts.push(address.neighbourhood);
  }

  // 3. City / Town / Village
  const city =
    address.city || address.town || address.village || address.municipality;
  if (city) {
    parts.push(city);
  }

  // 4. State / Region
  const state = address.state || address.region || address.county;
  if (state) {
    parts.push(state);
  }

  // 5. Postcode
  if (address.postcode) {
    parts.push(address.postcode);
  }

  // 6. Country
  if (address.country) {
    parts.push(address.country);
  }

  return parts.join(", ");
};

export class NominatimGeocodingService implements GeocodingService {
  async geocode(
    query: string,
    language?: string,
  ): Promise<GeocodeResult | null> {
    const parts = query
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const queriesToTry: string[] = [query];

    if (parts.length >= 3) {
      const name = parts[0];
      const city = parts[1];
      const country = parts[parts.length - 1];
      const region = parts.length === 4 ? parts[2] : undefined;

      if (name && city && country) {
        // Try stripping city prefix if it exists in name (e.g. "Paris Charles de Gaulle Airport" -> "Charles de Gaulle Airport")
        let strippedName = name;
        if (name.toLowerCase().startsWith(city.toLowerCase())) {
          strippedName = name
            .substring(city.length)
            .replace(/^[,\-\s]+/, "")
            .trim();
        }

        // Tier 2: Try without city constraint (original name)
        const queryWithoutCity = region
          ? `${name}, ${region}, ${country}`
          : `${name}, ${country}`;
        queriesToTry.push(queryWithoutCity);

        // Tier 3: Try without city constraint (stripped name)
        if (strippedName !== name) {
          const queryStrippedWithoutCity = region
            ? `${strippedName}, ${region}, ${country}`
            : `${strippedName}, ${country}`;
          queriesToTry.push(queryStrippedWithoutCity);
        }

        // Tier 4: Try searching name only (original and stripped)
        queriesToTry.push(name);
        if (strippedName !== name) {
          queriesToTry.push(strippedName);
        }

        // Tier 5: Fallback to city center
        const queryCityCenter = region
          ? `${city}, ${region}, ${country}`
          : `${city}, ${country}`;
        queriesToTry.push(queryCityCenter);
      }
    } else if (parts.length === 2) {
      // e.g. "Paris, France" -> fallback to "Paris"
      const firstPart = parts[0];
      if (firstPart) {
        queriesToTry.push(firstPart);
      }
    }

    // De-duplicate fallback queries while maintaining order
    const uniqueQueries = queriesToTry.filter(
      (q, idx) => queriesToTry.indexOf(q) === idx,
    );
    const cityCenterQuery =
      parts.length >= 3 && uniqueQueries.length > 0
        ? (uniqueQueries[uniqueQueries.length - 1] as string)
        : undefined;

    for (let i = 0; i < uniqueQueries.length; i++) {
      const q = uniqueQueries[i];
      if (!q) continue;

      const isCityFallback = q === cityCenterQuery;

      try {
        if (i > 0) {
          // Polite delay before fallback requests
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1&extratags=1&namedetails=1`,
          {
            headers: {
              "User-Agent": "TripFlow-Planner/1.0",
            },
          },
        );
        if (!response.ok) continue;
        const data = await response.json();
        if (!data || data.length === 0) continue;

        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        if (isNaN(lat) || isNaN(lng)) continue;

        const addressObj = first.address || {};
        const country = addressObj.country;
        const region =
          addressObj.state || addressObj.region || addressObj.county;
        const address =
          constructAddressFromNominatim(addressObj) || first.display_name;

        // Resolve name based on language context
        const namedetails = first.namedetails || {};
        const split = language ? language.split("-") : [];
        const baseLang =
          split.length > 0 && split[0] ? split[0].toLowerCase() : "en";

        let resolvedName = "";
        if (isCityFallback) {
          resolvedName = parts[0] || query;
        } else {
          resolvedName =
            namedetails[`name:${baseLang}`] ||
            namedetails[`alt_name:${baseLang}`] ||
            namedetails["name"] ||
            first.name ||
            parts[0] ||
            query;
        }

        const iata =
          namedetails &&
          typeof namedetails.iata === "string" &&
          namedetails.iata.trim()
            ? namedetails.iata.trim().toUpperCase()
            : undefined;

        return {
          lat,
          lng,
          name: resolvedName,
          country,
          region,
          address,
          iata,
        };
      } catch (err) {
        console.error(`Nominatim Geocoding Error for query "${q}":`, err);
      }
    }

    return null;
  }
}

const activeService: GeocodingService = new NominatimGeocodingService();

export const getGeocodingService = () => activeService;
