import {
  executeTool,
  AddOriginCitySchema,
  AddTripCitySchema,
  AddTransitPointSchema,
  AddItineraryItemSchema,
  ConnectTransitPointsSchema
} from './index';
import { testMockGraph } from '../../types/schema.test';
import { TripFlowGraph } from '../../types/schema';

export const runToolTests = async () => {
  console.log('🧪 Starting executeTool unit tests...');

  let graph = testMockGraph();

  // 1. Test addOriginCity
  try {
    const originArgs = {
      cityId: 'hub_nyc_test',
      cityName: 'New York',
      country: 'United States',
      region: 'NY',
      travelerCount: 3
    };
    // Validate arguments against schema to ensure compatibility
    AddOriginCitySchema.parse(originArgs);

    graph = await executeTool('addOriginCity', originArgs, graph);
    const addedHub = graph.CityHubs['hub_nyc_test'];
    if (!addedHub) throw new Error('addOriginCity failed: Node not added to graph');
    if (addedHub.cityName !== 'New York' || addedHub.type !== 'ORIGIN' || addedHub.travelerCount !== 3) {
      throw new Error('addOriginCity failed: Properties mismatch');
    }
    console.log('✅ Test addOriginCity passed.');
  } catch (err) {
    console.error('❌ Test addOriginCity failed:', err);
    throw err;
  }

  // 2. Test addTripCity
  try {
    const tripCityArgs = {
      cityId: 'hub_marrakech_test',
      cityName: 'Marrakech',
      country: 'Morocco',
      region: 'Marrakech-Safi'
    };
    // Validate arguments against schema to ensure compatibility
    AddTripCitySchema.parse(tripCityArgs);

    graph = await executeTool('addTripCity', tripCityArgs, graph);
    const addedHub = graph.CityHubs['hub_marrakech_test'];
    if (!addedHub) throw new Error('addTripCity failed: Node not added to graph');
    if (addedHub.cityName !== 'Marrakech' || addedHub.type !== 'HUB') {
      throw new Error('addTripCity failed: Properties mismatch');
    }
    console.log('✅ Test addTripCity passed.');
  } catch (err) {
    console.error('❌ Test addTripCity failed:', err);
    throw err;
  }

  // 3. Test addTransitPoint (Departure - JFK)
  try {
    const jfkPointArgs = {
      locationId: 'loc_jfk_test',
      name: 'JFK Airport',
      cityName: 'New York',
      country: 'United States'
    };
    // Validate arguments against schema to ensure compatibility
    AddTransitPointSchema.parse(jfkPointArgs);

    graph = await executeTool('addTransitPoint', jfkPointArgs, graph);
    const addedLoc = graph.Locations['loc_jfk_test'];
    if (!addedLoc) throw new Error('addTransitPoint (JFK) failed: Location not added to graph');
    console.log('✅ Test addTransitPoint (JFK) passed.');
  } catch (err) {
    console.error('❌ Test addTransitPoint (JFK) failed:', err);
    throw err;
  }

  // 4. Test addTransitPoint (Arrival - RAK)
  try {
    const rakPointArgs = {
      locationId: 'loc_rak_test',
      name: 'Menara Airport',
      cityName: 'Marrakech',
      country: 'Morocco'
    };
    // Validate arguments against schema to ensure compatibility
    AddTransitPointSchema.parse(rakPointArgs);

    graph = await executeTool('addTransitPoint', rakPointArgs, graph);
    const addedLoc = graph.Locations['loc_rak_test'];
    if (!addedLoc) throw new Error('addTransitPoint (RAK) failed: Location not added to graph');
    console.log('✅ Test addTransitPoint (RAK) passed.');
  } catch (err) {
    console.error('❌ Test addTransitPoint (RAK) failed:', err);
    throw err;
  }

  // 5. Test addItineraryItem
  try {
    const itineraryArgs = {
      itemId: 'loc_jemaa_test',
      name: 'Jemaa el-Fnaa',
      category: 'ACTIVITY' as const,
      startDate: '2026-06-03',
      startTime: '18:00:00Z',
      endDate: '2026-06-03',
      endTime: '21:00:00Z',
      cost: 10,
      cityId: 'hub_marrakech_test'
    };
    // Validate arguments against schema to ensure compatibility
    AddItineraryItemSchema.parse(itineraryArgs);

    graph = await executeTool('addItineraryItem', itineraryArgs, graph);
    const addedLoc = graph.Locations['loc_jemaa_test'];
    if (!addedLoc) throw new Error('addItineraryItem failed: Location not added to graph');
    const destinationHub = graph.CityHubs['hub_marrakech_test'];
    const itineraryEntry = destinationHub?.itinerary.find(i => i.LocationId === 'loc_jemaa_test');
    if (!itineraryEntry || itineraryEntry.startTime !== '2026-06-03T18:00:00Z') {
      throw new Error('addItineraryItem failed: Itinerary entry mismatch');
    }
    console.log('✅ Test addItineraryItem passed.');
  } catch (err) {
    console.error('❌ Test addItineraryItem failed:', err);
    throw err;
  }

  // 6. Test connectTransitPoints
  try {
    const connectArgs = {
      fromLocationId: 'loc_jfk_test',
      toLocationId: 'loc_rak_test',
      transportMode: 'FLIGHT' as const,
      departureDate: '2026-06-02',
      departureTime: '18:00:00Z',
      arrivalDate: '2026-06-03',
      arrivalTime: '08:00:00Z'
    };
    // Validate arguments against schema to ensure compatibility
    ConnectTransitPointsSchema.parse(connectArgs);

    graph = await executeTool('connectTransitPoints', connectArgs, graph);
    const transitId = 'nyc_test_to_marrakech_test';
    const addedTransit = graph.Transits[transitId];
    if (!addedTransit) throw new Error('connectTransitPoints failed: Transit connection not found in graph');
    const firstSegment = addedTransit.segments?.[0];
    if (!firstSegment || addedTransit.fromCityId !== 'hub_nyc_test' || firstSegment.transportMode !== 'FLIGHT') {
      throw new Error('connectTransitPoints failed: Properties mismatch');
    }
    console.log('✅ Test connectTransitPoints passed.');
  } catch (err) {
    console.error('❌ Test connectTransitPoints failed:', err);
    throw err;
  }

  console.log('🎉 All executeTool unit tests passed successfully!');
};
