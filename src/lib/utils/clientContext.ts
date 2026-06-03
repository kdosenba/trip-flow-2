import countryToCurrency from "country-to-currency";
import { ClientContext } from "../../types/schema";
import { fetchWhereAmI } from "../adapters/travelpayouts";

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

  const location = await fetchWhereAmI(language);
  const currency = getCurrencyForCountry(location.country_code);
  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  return {
    location,
    language,
    currency,
    timezone,
  };
};
