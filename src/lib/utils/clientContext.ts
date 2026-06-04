import countryToCurrency from "country-to-currency";
import { ClientContext, WhereAmILocation } from "../../types/schema";
import { fetchWhereAmI } from "../adapters/travelpayouts";

const FALLBACK_LOCATION: WhereAmILocation = {
  iata: "JFK",
  name: "New York",
  country_name: "United States",
  country_code: "US",
  coordinates: { lat: 40.7128, lng: -74.006 },
};

/**
 * Resolves the national currency code for a given ISO country code (e.g. "FR" -> "EUR").
 */
export const getCurrencyForCountry = (countryCode: string): string => {
  return (
    (countryToCurrency as Record<string, string>)[countryCode.toUpperCase()] ||
    "USD"
  );
};

/**
 * Dynamically resolves browser-safe language, triggers geolocation fetch,
 * and maps the country currency, returning a fully constructed ClientContext.
 * This places context initialization strictly on the critical path of initialization.
 */
export const initializeClientContext = async (): Promise<ClientContext> => {
  let language = "en-US";
  if (typeof navigator !== "undefined") {
    language = navigator.language;
  }

  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  let location = FALLBACK_LOCATION;

  try {
    const fetchPromise = fetchWhereAmI(language);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout resolving location")), 3000)
    );

    location = await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    console.warn(
      `Failed to initialize client geolocation context, using default fallback:`,
      err,
    );
  }

  const currency = getCurrencyForCountry(location.country_code);

  return {
    location,
    language,
    currency,
    timezone,
  };
};

