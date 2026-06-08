import {
  executeTool,
  AddOriginCitiesSchema,
  AddTripCitiesSchema,
  AddItineraryItemsSchema,
  AddTransitConnectionsSchema,
} from "./index";
import { testMockGraph } from "../../types/schema.test";

export const runToolTests = async () => {
  console.log("🧪 Starting executeTool unit tests...");

  let graph = testMockGraph();

  // 1. Test addOriginCities
  try {
    const originArgs = {
      cities: [
        {
          cityId: "hub_nyc_test",
          cityName: "New York",
          country: "United States",
          region: "NY",
          travelerCount: 3,
        },
      ],
    };
    // Validate arguments against schema to ensure compatibility
    AddOriginCitiesSchema.parse(originArgs);

    graph = await executeTool("addOriginCities", originArgs, graph);
    const addedHub = graph.CityHubs["hub_nyc_test"];
    if (!addedHub)
      throw new Error("addOriginCities failed: Node not added to graph");
    if (
      addedHub.cityName !== "New York" ||
      addedHub.type !== "ORIGIN" ||
      addedHub.travelerCount !== 3
    ) {
      throw new Error("addOriginCities failed: Properties mismatch");
    }
    console.log("✅ Test addOriginCities passed.");
  } catch (err) {
    console.error("❌ Test addOriginCities failed:", err);
    throw err;
  }

  // 2. Test addTripCities
  try {
    const tripCityArgs = {
      cities: [
        {
          cityId: "hub_marrakech_test",
          cityName: "Marrakech",
          country: "Morocco",
          region: "Marrakech-Safi",
        },
      ],
    };
    // Validate arguments against schema to ensure compatibility
    AddTripCitiesSchema.parse(tripCityArgs);

    graph = await executeTool("addTripCities", tripCityArgs, graph);
    const addedHub = graph.CityHubs["hub_marrakech_test"];
    if (!addedHub)
      throw new Error("addTripCities failed: Node not added to graph");
    if (addedHub.cityName !== "Marrakech" || addedHub.type !== "HUB") {
      throw new Error("addTripCities failed: Properties mismatch");
    }
    console.log("✅ Test addTripCities passed.");
  } catch (err) {
    console.error("❌ Test addTripCities failed:", err);
    throw err;
  }

  // 3. Test addItineraryItems
  try {
    const itineraryArgs = {
      items: [
        {
          itemId: "loc_jemaa_test",
          name: "Jemaa el-Fnaa",
          category: "ACTIVITY" as const,
          startDate: "2026-06-03",
          startTime: "18:00:00Z",
          endDate: "2026-06-03",
          endTime: "21:00:00Z",
          cost: 10,
          cityId: "hub_marrakech_test",
        },
      ],
    };
    // Validate arguments against schema to ensure compatibility
    AddItineraryItemsSchema.parse(itineraryArgs);

    graph = await executeTool("addItineraryItems", itineraryArgs, graph);
    const addedLoc = graph.Locations["loc_jemaa_test"];
    if (!addedLoc)
      throw new Error("addItineraryItems failed: Location not added to graph");
    const destinationHub = graph.CityHubs["hub_marrakech_test"];
    const itineraryEntry = destinationHub?.itinerary.find(
      (i) => i.LocationId === "loc_jemaa_test",
    );
    if (
      !itineraryEntry ||
      itineraryEntry.startTime !== "2026-06-03T18:00:00Z"
    ) {
      throw new Error("addItineraryItems failed: Itinerary entry mismatch");
    }
    console.log("✅ Test addItineraryItems passed.");
  } catch (err) {
    console.error("❌ Test addItineraryItems failed:", err);
    throw err;
  }

  // 4. Test addTransitConnections
  try {
    const connectArgs = {
      connections: [
        {
          fromCityId: "hub_nyc_test",
          toCityId: "hub_marrakech_test",
          locations: [
            {
              locationId: "loc_jfk_test",
              name: "JFK Airport",
              cityName: "New York",
              country: "United States",
            },
            {
              locationId: "loc_rak_test",
              name: "Menara Airport",
              cityName: "Marrakech",
              country: "Morocco",
            },
          ],
          segments: [
            {
              fromLocationId: "loc_jfk_test",
              toLocationId: "loc_rak_test",
              transportMode: "FLIGHT" as const,
              departureDate: "2026-06-02",
              departureTime: "18:00:00Z",
              arrivalDate: "2026-06-03",
              arrivalTime: "08:00:00Z",
            },
          ],
        },
      ],
    };
    // Validate arguments against schema to ensure compatibility
    AddTransitConnectionsSchema.parse(connectArgs);

    graph = await executeTool("addTransitConnections", connectArgs, graph);
    const transitId = "nyc_test_to_marrakech_test";
    const addedTransit = graph.Transits[transitId];
    if (!addedTransit)
      throw new Error(
        "addTransitConnections failed: Transit connection not found in graph",
      );
    const firstSegment = addedTransit.segments?.[0];
    if (
      !firstSegment ||
      addedTransit.fromCityId !== "hub_nyc_test" ||
      firstSegment.transportMode !== "FLIGHT"
    ) {
      throw new Error("addTransitConnections failed: Properties mismatch");
    }
    console.log("✅ Test addTransitConnections passed.");
  } catch (err) {
    console.error("❌ Test addTransitConnections failed:", err);
    throw err;
  }

  console.log("🎉 All executeTool unit tests passed successfully!");
};
