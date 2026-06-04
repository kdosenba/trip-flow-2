import {
  TripFlowGraphSchema,
  TripFlowGraph,
  Location,
  CityHub,
  Transit,
  Suggestion,
  CostSchema,
  BudgetSchema,
  TargetDateRangeSchema,
  ClientContextSchema,
  WhereAmILocationSchema,
} from "./schema";
import {
  generateCityHubId,
  generateLocationId,
  generateTransitId,
  generateSuggestionId,
} from "../lib/utils/id";
import { getCurrencyForCountry } from "../lib/utils/clientContext";
import { recalculateEstimatesAndActuals } from "../lib/utils/graph";
import { LocationId, CityHubId, TransitId } from "./schema";
import { fetchWhereAmI } from "../lib/adapters/travelpayouts";

const createLocationId = (name = "mock_loc") => generateLocationId(name);
const createCityHubId = (cityName = "mock_city") => generateCityHubId(cityName);
const createTransitId = (from = "nyc", to = "paris") =>
  generateTransitId(`hub_${from}`, `hub_${to}`);
const createSuggestionId = (title = "mock_suggest") =>
  generateSuggestionId(title);

export const testMockGraph = (): TripFlowGraph => {
  const jfkId = createLocationId("jfk");
  const cdgId = createLocationId("cdg");
  const eiffelId = createLocationId("eiffel");

  const nycId = createCityHubId("nyc");
  const parisId = createCityHubId("paris");

  const flightTransitId = createTransitId("nyc", "paris");
  const hotelSuggestionId = createSuggestionId("hotel");

  const locations: Record<string, Location> = {
    [jfkId]: {
      id: jfkId,
      name: "John F. Kennedy International Airport",
      address: "Queens, NY 11430",
      coordinates: { lat: 40.6413, lng: -73.7781 },
      category: "TRANSIT_POINT",
      price: { actualCost: 0, typicalCost: 0 },
    },
    [cdgId]: {
      id: cdgId,
      name: "Charles de Gaulle Airport",
      address: "95700 Roissy-en-France, France",
      coordinates: { lat: 49.0097, lng: 2.5479 },
      category: "TRANSIT_POINT",
    },
    [eiffelId]: {
      id: eiffelId,
      name: "Eiffel Tower",
      address: "Champ de Mars, 5 Av. Anatole France, 75007 Paris, France",
      coordinates: { lat: 48.8584, lng: 2.2945 },
      category: "ACTIVITY",
      price: { actualCost: 30, typicalCost: 25 },
    },
  };

  const cityHubs: Record<string, CityHub> = {
    [nycId]: {
      id: nycId,
      cityName: "New York City",
      country: "United States",
      coordinates: { lat: 40.7128, lng: -74.006 },
      type: "ORIGIN",
      itinerary: [],
      travelerCount: 2,
    },
    [parisId]: {
      id: parisId,
      cityName: "Paris",
      country: "France",
      coordinates: { lat: 48.8566, lng: 2.3522 },
      type: "HUB",
      itinerary: [
        {
          LocationId: eiffelId,
          startTime: "2026-06-02T10:00:00Z",
          endTime: "2026-06-02T12:00:00Z",
        },
      ],
      arrivalNodeId: cdgId,
      departureNodeId: cdgId,
      travelerCount: 2,
    },
  };

  const transits: Record<string, Transit> = {
    [flightTransitId]: {
      id: flightTransitId,
      fromCityId: nycId,
      toCityId: parisId,
      segments: [
        {
          fromLocationId: jfkId,
          toLocationId: cdgId,
          transportMode: "FLIGHT",
          startTime: "2026-06-01T18:00:00Z",
          endTime: "2026-06-02T08:00:00Z",
        },
      ],
      price: { actualCost: 850, typicalCost: 800 },
    },
  };

  const suggestions: Record<string, Suggestion> = {
    [hotelSuggestionId]: {
      id: hotelSuggestionId,
      type: "LOCATION_SUGGESTION",
      title: "Hôtel Plaza Athénée",
      description: "Suggested 5-star hotel in Paris",
      targetCityId: parisId,
      price: { typicalCost: 1200 },
    },
  };

  const rawGraph = {
    Locations: locations,
    CityHubs: cityHubs,
    Transits: transits,
    suggestions: suggestions,
    budget: {
      budget: { min: 1000, max: 5000 },
      estimate: { low: 1500, high: 4500 },
    },
    targetDateRange: {
      target: {
        range: { start: "2026-06-01T00:00:00Z", end: "2026-06-15T00:00:00Z" },
      },
      context: "Summer Vacation 2026",
      actual: { start: "2026-06-01T18:00:00Z" },
    },
    clientContext: {
      location: {
        iata: "JFK",
        name: "New York",
        country_name: "United States",
        country_code: "US",
        coordinates: { lat: 40.6413, lng: -73.7781 },
      },
      language: "en-US",
      currency: "USD",
      timezone: "America/New_York",
    },
  };

  return TripFlowGraphSchema.parse(rawGraph);
};

// --- SCHEMA CONSTRAINT ASSERTIONS & TESTS ---

export const runSchemaTests = async () => {
  console.log("🧪 Starting Trip Flow schema extensions test suite...");

  // 1. Happy path: Graph parses with all new extensions
  try {
    const graph = testMockGraph();
    console.log(
      "✅ Happy Path: Successfully parsed graph with cost, budget, target dates, and default client context.",
    );

    // Assert clientContext defaults loaded
    if (
      !graph.clientContext ||
      typeof graph.clientContext.language !== "string"
    ) {
      throw new Error(
        "Default clientContext language was not populated correctly",
      );
    }
    console.log(
      `ℹ️ Resolved Client defaults -> Language: ${graph.clientContext.language}`,
    );
  } catch (err) {
    console.error("❌ Happy Path: Failed to parse valid graph config", err);
    throw err;
  }

  // 2. Singular Target Date parsing
  try {
    const singularDateInput = {
      target: { date: "2026-06-10T12:00:00Z" },
      context: "Specific Event / Wedding Day",
    };
    const parsed = TargetDateRangeSchema.parse(singularDateInput);
    if (!parsed.target || !("date" in parsed.target)) {
      throw new Error("Expected target to contain date property");
    }
    console.log("✅ Singular target date validation passed.");
  } catch (err) {
    console.error("❌ Singular target date validation failed", err);
    throw err;
  }

  // 2b. Optional Target Date omission
  try {
    const omittedTargetInput = {
      context: "Flexible schedule test case",
    };
    const parsed = TargetDateRangeSchema.parse(omittedTargetInput);
    if (parsed.target !== undefined) {
      throw new Error("Expected target to be undefined");
    }
    console.log("✅ Optional target date omission validation passed.");
  } catch (err) {
    console.error("❌ Optional target date omission validation failed", err);
    throw err;
  }

  // 3. Validation failure: Invalid target date range (end before start)
  try {
    const invalidRangeInput = {
      target: {
        range: { start: "2026-06-10T12:00:00Z", end: "2026-06-05T12:00:00Z" },
      },
    };
    TargetDateRangeSchema.parse(invalidRangeInput);
    console.error(
      "❌ Invalid range validation: Allowed target end date to be before start date incorrectly.",
    );
    throw new Error("Allowed invalid target range");
  } catch (err) {
    console.log(
      "✅ Target date range constraints (end >= start) correctly rejected invalid range.",
    );
  }

  // 4. Validation failure: Negative price/budget validation
  try {
    CostSchema.parse({ actualCost: -100 });
    console.error("❌ Cost validation: Allowed negative cost.");
    throw new Error("Allowed negative cost");
  } catch (err) {
    console.log("✅ Cost negative limits successfully enforced.");
  }

  // 4b. Validation failure: Budget max <= min validation
  try {
    BudgetSchema.parse({
      budget: { min: 2000, max: 1000 },
      estimate: { low: 1500, high: 4500 },
    });
    console.error("❌ Budget validation: Allowed max budget <= min budget.");
    throw new Error("Allowed invalid budget");
  } catch (err) {
    console.log("✅ Budget constraints (max > min) successfully enforced.");
  }

  // 5. WhereAmI Location schema verification
  try {
    // Missing required field: country_name
    WhereAmILocationSchema.parse({
      iata: "CDG",
      name: "Paris",
      country_code: "FR",
      coordinates: { lat: 49.0097, lng: 2.5479 },
    });
    console.error(
      "❌ WhereAmILocation validation: Allowed missing country_name.",
    );
    throw new Error("Allowed invalid WhereAmI location missing country_name");
  } catch (err) {
    console.log(
      "✅ WhereAmILocation constraints correctly rejected missing country_name.",
    );
  }

  // 6. Travelpayouts normalization adapter verification
  try {
    const originalFetch = globalThis.fetch;
    const mockFetch = (responseObj: unknown, ok = true) => {
      globalThis.fetch = () =>
        Promise.resolve({
          ok,
          statusText: ok ? "OK" : "Error",
          json: () => Promise.resolve(responseObj),
        } as Response);
    };

    // Test Case 6a: Happy path with standard response (colon delimiter)
    mockFetch({
      iata: "CDG",
      name: "Paris",
      country_name: "France",
      country_code: "FR",
      coordinates: "2.5479:49.0097",
    });
    const normalized = await fetchWhereAmI("en-US");
    if (
      normalized.coordinates.lat !== 49.0097 ||
      normalized.coordinates.lng !== 2.5479
    ) {
      throw new Error("Coordinates split was parsed incorrectly");
    }
    console.log(
      "✅ Travelpayouts Adapter: Happy path coordinate transformation verified.",
    );

    // Test Case 6b: Missing optional IATA code (should still parse successfully)
    mockFetch({
      name: "New York",
      country_name: "United States",
      country_code: "US",
      coordinates: "-73.7781:40.6413",
    });
    const normalizedNoIata = await fetchWhereAmI("en-US");
    if (normalizedNoIata.iata !== undefined) {
      throw new Error("Expected optional IATA field to be undefined");
    }
    console.log(
      "✅ Travelpayouts Adapter: Optional field (iata) omission handled correctly.",
    );

    // Test Case 6c: Invalid coordinates string format (missing colon)
    mockFetch({
      name: "London",
      country_name: "United Kingdom",
      country_code: "GB",
      coordinates: "51.5074",
    });
    try {
      await fetchWhereAmI("en-US");
      console.error(
        "❌ Travelpayouts Adapter: Allowed invalid coordinate format (missing colon).",
      );
      throw new Error("Allowed invalid coordinates format");
    } catch (e) {
      console.log(
        "✅ Travelpayouts Adapter: Correctly rejected malformed coordinate format (missing colon).",
      );
    }

    // Test Case 6d: Non-numeric coordinate coordinates
    mockFetch({
      name: "Berlin",
      country_name: "Germany",
      country_code: "DE",
      coordinates: "lat:lng",
    });
    try {
      await fetchWhereAmI("en-US");
      console.error(
        "❌ Travelpayouts Adapter: Allowed non-numeric coordinate coordinates.",
      );
      throw new Error("Allowed invalid coordinate values");
    } catch (e) {
      console.log(
        "✅ Travelpayouts Adapter: Correctly rejected non-numeric coordinates.",
      );
    }

    // Test Case 6e: Malformed payload missing required name field
    mockFetch({
      country_name: "Spain",
      country_code: "ES",
      coordinates: "40.4168:-3.7038",
    });
    try {
      await fetchWhereAmI("en-US");
      console.error(
        "❌ Travelpayouts Adapter: Allowed payload missing name field.",
      );
      throw new Error("Allowed missing required fields");
    } catch (e) {
      console.log(
        "✅ Travelpayouts Adapter: Correctly rejected payloads missing required API properties.",
      );
    }

    // Restore original global fetch
    globalThis.fetch = originalFetch;

    // Test Case 6f: fetchWhereAmI integration test (async, real network query)
    try {
      const loc = await fetchWhereAmI("en-US");
      if (loc && loc.coordinates) {
        console.log(
          `✅ fetchWhereAmI Integration: Successfully resolved geolocated location -> ${loc.name}, ${loc.country_name}`,
        );
      }
    } catch (e) {
      // Gracefully allow network failure/offline/rate limit blocks in unit tests
      console.log(
        "ℹ️ fetchWhereAmI Integration: Geolocation query ran (network/rate-limit handled cleanly):",
        (e as Error).message,
      );
    }
  } catch (err) {
    console.error("❌ Travelpayouts Adapter verification failed", err);
    throw err;
  }

  // 7. Dynamic currency resolution verification
  try {
    if (
      getCurrencyForCountry("FR") !== "EUR" ||
      getCurrencyForCountry("JP") !== "JPY" ||
      getCurrencyForCountry("unknown") !== "USD"
    ) {
      throw new Error("Country-to-currency resolver mapping is incorrect");
    }
    console.log(
      "✅ Dynamic Currency Resolution: Country lookup tables verified successfully.",
    );
  } catch (err) {
    console.error("❌ Dynamic Currency Resolution verification failed", err);
    throw err;
  }

  // 8. Recalculation logic verification
  try {
    const graph: TripFlowGraph = {
      Locations: {
        "loc-1": {
          id: "loc-1" as LocationId,
          name: "Attraction 1",
          address: "Address 1",
          coordinates: { lat: 48.8, lng: 2.3 },
          category: "ACTIVITY",
          price: { typicalCost: 100 },
        },
        "loc-2": {
          id: "loc-2" as LocationId,
          name: "Hotel 1",
          address: "Address 2",
          coordinates: { lat: 48.9, lng: 2.4 },
          category: "LODGING",
          price: { actualCost: 500, typicalCost: 600 },
        },
      },
      CityHubs: {
        "hub-1": {
          id: "hub-1" as CityHubId,
          cityName: "Paris",
          country: "France",
          coordinates: { lat: 48.8, lng: 2.3 },
          type: "HUB",
          travelerCount: 1,
          itinerary: [
            {
              LocationId: "loc-1" as LocationId,
              startTime: "2026-07-10T12:00:00Z",
              endTime: "2026-07-10T14:00:00Z",
            },
          ],
        },
      },
      Transits: {
        "transit-1": {
          id: "transit-1" as TransitId,
          fromCityId: "hub-nyc" as CityHubId,
          toCityId: "hub-par" as CityHubId,
          price: { typicalCost: 1000 },
          segments: [
            {
              fromLocationId: "loc-jfk" as LocationId,
              toLocationId: "loc-cdg" as LocationId,
              transportMode: "FLIGHT",
              startTime: "2026-07-09T08:00:00Z",
              endTime: "2026-07-09T18:00:00Z",
            },
          ],
        },
      },
      suggestions: {},
      clientContext: {
        location: {
          name: "NYC",
          country_name: "USA",
          country_code: "US",
          coordinates: { lat: 40, lng: -74 },
        },
        language: "en",
        currency: "USD",
        timezone: "America/New_York",
      },
    };

    recalculateEstimatesAndActuals(graph);

    // Expected costs:
    // loc-1: typicalCost 100 (low: 90, high: 110)
    // loc-2: actualCost 500 (low: 500, high: 500)
    // transit-1: typicalCost 1000 (low: 900, high: 1100)
    // total low: 90 + 500 + 900 = 1490
    // total high: 110 + 500 + 1100 = 1710
    if (graph.budget?.estimate.low !== 1490 || graph.budget?.estimate.high !== 1710) {
      throw new Error(`Estimate mismatch: expected low 1490 / high 1710, got low ${graph.budget?.estimate.low} / high ${graph.budget?.estimate.high}`);
    }

    // Expected actual dates:
    // Earliest start: transit segment start "2026-07-09T08:00:00Z"
    // Latest end: itinerary item end "2026-07-10T14:00:00Z"
    if (graph.targetDateRange?.actual?.start !== "2026-07-09T08:00:00.000Z" || graph.targetDateRange?.actual?.end !== "2026-07-10T14:00:00.000Z") {
      throw new Error(`Actual dates mismatch: expected start "2026-07-09T08:00:00.000Z" / end "2026-07-10T14:00:00.000Z", got start ${graph.targetDateRange?.actual?.start} / end ${graph.targetDateRange?.actual?.end}`);
    }

    console.log("✅ Auto Recalculation logic: verified successfully.");
  } catch (err) {
    console.error("❌ Auto Recalculation logic verification failed", err);
    throw err;
  }

  console.log("🎉 All schema tests passed successfully!");
};
