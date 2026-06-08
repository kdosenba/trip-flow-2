import { TripFlowGraph } from "../../types/schema";

/**
 * BFS algorithm to propagate traveler counts from origins to destination city hubs.
 */
export const propagateTravelerCounts = (graph: TripFlowGraph): void => {
  if (!graph.CityHubs) return;

  const hubs = graph.CityHubs;
  const transits = graph.Transits || {};

  // Build graph adjacency list
  const outgoingTransits: Record<string, typeof transits[string][]> = {};
  const incomingTransits: Record<string, typeof transits[string][]> = {};

  // Initialize adjacency records for all hubs
  Object.keys(hubs).forEach((id) => {
    outgoingTransits[id] = [];
    incomingTransits[id] = [];
    // Reset resolved traveler counts safely
    const hub = hubs[id];
    if (hub) {
      hub.resolvedTravelerCount = undefined;
    }
  });

  // Populate incoming and outgoing structures
  Object.values(transits).forEach((transit) => {
    const fromHub = hubs[transit.fromCityId];
    const toHub = hubs[transit.toCityId];
    if (fromHub && toHub) {
      outgoingTransits[transit.fromCityId]?.push(transit);
      incomingTransits[transit.toCityId]?.push(transit);
    }
  });

  // Track transit traveler counts carried along each transit edge
  const transitTravelers: Record<string, number> = {};

  // Queue for BFS
  const queue: string[] = [];
  const visited = new Set<string>();
  const incomingProcessedCount: Record<string, number> = {};

  // Initialize incoming processed count for all hubs
  Object.keys(hubs).forEach((id) => {
    incomingProcessedCount[id] = 0;
  });

  // Root hubs are origins or hubs with 0 incoming transits
  Object.entries(hubs).forEach(([id, hub]) => {
    const incoming = incomingTransits[id];
    if (hub.type === "ORIGIN" || !incoming || incoming.length === 0) {
      queue.push(id);
    }
  });

  // Helper to resolve count for a single hub
  const resolveHubCount = (hubId: string): number => {
    const hub = hubs[hubId];
    if (!hub) return 1;
    // Rule: Override hubs (ORIGIN or custom override travelerCount is defined and not 1) use their own override count
    if (hub.type === "ORIGIN" || (hub.travelerCount !== undefined && hub.travelerCount !== 1)) {
      return hub.travelerCount ?? 1;
    }
    // Default hubs receive the sum of traveler counts from incoming transits
    const incoming = incomingTransits[hubId] || [];
    if (incoming.length === 0) {
      return 1; // Fallback to default of 1 if no incoming transits
    }
    let sum = 0;
    incoming.forEach((transit) => {
      sum += transitTravelers[transit.id] || 0;
    });
    return sum > 0 ? sum : 1; // Ensure traveler count is at least 1
  };

  while (queue.length > 0 || visited.size < Object.keys(hubs).length) {
    // If queue is empty but we still have unvisited hubs (due to cycles or disconnected components),
    // pick an unvisited hub to break the deadlock.
    if (queue.length === 0) {
      const unvisited = Object.keys(hubs).filter((id) => !visited.has(id));
      if (unvisited.length === 0) break;
      // Prioritize an unvisited hub that has some incoming processed edges, or just pick the first
      let bestChoice = unvisited[0] || "";
      let maxProcessed = -1;
      unvisited.forEach((id) => {
        const count = incomingProcessedCount[id] || 0;
        if (count > maxProcessed) {
          maxProcessed = count;
          bestChoice = id;
        }
      });
      if (!bestChoice) break;
      queue.push(bestChoice);
    }

    const hubId = queue.shift()!;
    if (visited.has(hubId)) continue;
    visited.add(hubId);

    const hub = hubs[hubId];
    if (hub) {
      const T = resolveHubCount(hubId);
      if (hub.type === "ORIGIN") {
        hub.resolvedTravelerCount = undefined;
      } else if (hub.travelerCount !== undefined && hub.travelerCount !== 1) {
        hub.resolvedTravelerCount = undefined;
      } else {
        hub.resolvedTravelerCount = T;
        hub.travelerCount = undefined;
      }

      // Distribute travelers to outgoing transits
      const outgoings = outgoingTransits[hubId] || [];
      if (outgoings.length > 0) {
        const overrides: typeof outgoings = [];
        const defaults: typeof outgoings = [];

        outgoings.forEach((transit) => {
          const destHub = hubs[transit.toCityId];
          if (destHub) {
            if (destHub.type === "ORIGIN" || (destHub.travelerCount !== undefined && destHub.travelerCount !== 1)) {
              overrides.push(transit);
            } else {
              defaults.push(transit);
            }
          }
        });

        // Sum of override destinations
        let sumOverrides = 0;
        overrides.forEach((transit) => {
          const destHub = hubs[transit.toCityId];
          if (destHub) {
            sumOverrides += destHub.travelerCount ?? 1;
          }
        });

        // Remainder
        const remainder = Math.max(0, T - sumOverrides);

        // Distribute to overrides
        overrides.forEach((transit) => {
          const destHub = hubs[transit.toCityId];
          if (destHub) {
            transitTravelers[transit.id] = destHub.travelerCount ?? 1;
          }
        });

        // Distribute equally to defaults
        if (defaults.length > 0) {
          const share = remainder / defaults.length;
          defaults.forEach((transit) => {
            transitTravelers[transit.id] = share;
          });
        }

        // Propagate dependencies and push to queue if ready
        outgoings.forEach((transit) => {
          const destId = transit.toCityId;
          incomingProcessedCount[destId] = (incomingProcessedCount[destId] || 0) + 1;
          const incomingCount = incomingTransits[destId]?.length || 0;
          // If all incoming transits to destId are processed, and it has not been visited yet, push to queue
          if (
            incomingProcessedCount[destId] === incomingCount &&
            !visited.has(destId)
          ) {
            queue.push(destId);
          }
        });
      }
    }
  }
};

/**
 * Helper to calculate the stay duration in nights for a city hub.
 */
export const getHubStayNights = (graph: TripFlowGraph, hubId: string): number => {
  const hubs = graph.CityHubs;
  if (!hubs) return 1;
  const cityHub = hubs[hubId];
  if (!cityHub) return 1;

  // Find arrival transit segment ending at this hub
  const arrivalTransit = graph.Transits 
    ? Object.values(graph.Transits).find((t) => t.toCityId === hubId)
    : undefined;
  const arrivalTimeStr = arrivalTransit?.segments[arrivalTransit.segments.length - 1]?.endTime;
  const arrivalTime = arrivalTimeStr ? new Date(arrivalTimeStr).getTime() : undefined;

  // Find departure transit segment starting from this hub
  const departureTransit = graph.Transits 
    ? Object.values(graph.Transits).find((t) => t.fromCityId === hubId)
    : undefined;
  const departureTimeStr = departureTransit?.segments[0]?.startTime;
  const departureTime = departureTimeStr ? new Date(departureTimeStr).getTime() : undefined;

  // Itinerary items bounds
  let minItineraryStart = Infinity;
  let maxItineraryEnd = -Infinity;

  if (cityHub.itinerary && cityHub.itinerary.length > 0) {
    cityHub.itinerary.forEach((item) => {
      const s = new Date(item.startTime).getTime();
      if (!isNaN(s)) {
        minItineraryStart = Math.min(minItineraryStart, s);
        if (item.endTime) {
          const e = new Date(item.endTime).getTime();
          if (!isNaN(e)) maxItineraryEnd = Math.max(maxItineraryEnd, e);
        } else {
          maxItineraryEnd = Math.max(maxItineraryEnd, s);
        }
      }
    });
  }

  // Determine bounds
  const start = arrivalTime !== undefined ? arrivalTime : (minItineraryStart !== Infinity ? minItineraryStart : undefined);
  const end = departureTime !== undefined ? departureTime : (maxItineraryEnd !== -Infinity ? maxItineraryEnd : undefined);

  if (start !== undefined && end !== undefined && end > start) {
    const diffTime = end - start;
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  }

  return 1; // Default fallback to 1 night
};

/**
 * Automatically recalculates the budget estimate and actual trip dates based on active locations and transits.
 * Does not allow manual override. Overwrites existing estimates and actual bounds.
 */
export const recalculateEstimatesAndActuals = (graph: TripFlowGraph): void => {
  // --- Propagate traveler counts first ---
  propagateTravelerCounts(graph);

  // --- 1. Recalculate Location & Suggestion Totals based on traveler counts ---
  if (graph.Locations && graph.CityHubs) {
    Object.values(graph.Locations).forEach((loc) => {
      if (!loc.price) return;

      // Find the hub where this location is listed in the itinerary
      const parentHub = Object.values(graph.CityHubs).find((hub) =>
        hub.itinerary?.some((item) => item.LocationId === loc.id)
      );
      const travelerCount = parentHub ? (parentHub.resolvedTravelerCount || parentHub.travelerCount) : 1;

      if (loc.category === "LODGING") {
        const unit = loc.price.unit || "ROOM";
        const factor = unit === "ROOM" ? Math.ceil(travelerCount / 2) : 1;

        // Find parent itinerary item to calculate nights
        const itineraryItem = parentHub?.itinerary?.find((item) => item.LocationId === loc.id);
        let nights = 1;
        if (itineraryItem && itineraryItem.endTime) {
          const start = new Date(itineraryItem.startTime).getTime();
          const end = new Date(itineraryItem.endTime).getTime();
          if (!isNaN(start) && !isNaN(end) && end > start) {
            nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
          }
        } else if (parentHub) {
          nights = getHubStayNights(graph, parentHub.id);
        }

        const costMultiplier = factor * nights;

        if (loc.price.actualCost !== undefined) {
          loc.price.total = loc.price.actualCost * costMultiplier;
          loc.price.totalLow = loc.price.actualCost * costMultiplier;
          loc.price.totalHigh = loc.price.actualCost * costMultiplier;
        } else if (loc.price.typicalCost !== undefined) {
          loc.price.total = loc.price.typicalCost * costMultiplier;
          loc.price.totalLow = Math.round(loc.price.typicalCost * 0.9 * costMultiplier);
          loc.price.totalHigh = Math.round(loc.price.typicalCost * 1.1 * costMultiplier);
        }
      } else if (loc.category === "ACTIVITY") {
        const unit = loc.price.unit || "PERSON";
        const factor = unit === "PERSON" ? travelerCount : 1;

        if (loc.price.actualCost !== undefined) {
          loc.price.total = loc.price.actualCost * factor;
          loc.price.totalLow = loc.price.actualCost * factor;
          loc.price.totalHigh = loc.price.actualCost * factor;
        } else if (loc.price.typicalCost !== undefined) {
          loc.price.total = loc.price.typicalCost * factor;
          loc.price.totalLow = Math.round(loc.price.typicalCost * 0.9 * factor);
          loc.price.totalHigh = Math.round(loc.price.typicalCost * 1.1 * factor);
        }
      } else if (loc.category === "MEAL") {
        const expectedCost = loc.price.actualCost !== undefined ? loc.price.actualCost : (loc.price.typicalCost || 0);
        loc.price.total = expectedCost * travelerCount;
        loc.price.totalLow = Math.round(expectedCost * 0.9 * travelerCount);
        loc.price.totalHigh = Math.round(expectedCost * 1.1 * travelerCount);
      } else {
        const expectedCost = loc.price.actualCost !== undefined ? loc.price.actualCost : (loc.price.typicalCost || 0);
        loc.price.total = expectedCost;
        if (loc.price.actualCost !== undefined) {
          loc.price.totalLow = loc.price.actualCost;
          loc.price.totalHigh = loc.price.actualCost;
        } else if (loc.price.typicalCost !== undefined) {
          loc.price.totalLow = Math.round(loc.price.typicalCost * 0.9);
          loc.price.totalHigh = Math.round(loc.price.typicalCost * 1.1);
        }
      }
    });
  }

  if (graph.suggestions && graph.CityHubs) {
    Object.values(graph.suggestions).forEach((sug) => {
      const targetHub = sug.targetCityId ? graph.CityHubs[sug.targetCityId] : undefined;
      const travelerCount = targetHub ? (targetHub.resolvedTravelerCount || targetHub.travelerCount) : 1;

      const loc = sug.suggestedLocation;
      if (loc && loc.price) {
        if (loc.category === "LODGING") {
          const unit = loc.price.unit || "ROOM";
          const factor = unit === "ROOM" ? Math.ceil(travelerCount / 2) : 1;
          const nights = targetHub ? getHubStayNights(graph, targetHub.id) : 1;
          const costMultiplier = factor * nights;

          if (loc.price.actualCost !== undefined) {
            loc.price.total = loc.price.actualCost * costMultiplier;
            loc.price.totalLow = loc.price.actualCost * costMultiplier;
            loc.price.totalHigh = loc.price.actualCost * costMultiplier;
          } else if (loc.price.typicalCost !== undefined) {
            loc.price.total = loc.price.typicalCost * costMultiplier;
            loc.price.totalLow = Math.round(loc.price.typicalCost * 0.9 * costMultiplier);
            loc.price.totalHigh = Math.round(loc.price.typicalCost * 1.1 * costMultiplier);
          }
        } else if (loc.category === "ACTIVITY") {
          const unit = loc.price.unit || "PERSON";
          const factor = unit === "PERSON" ? travelerCount : 1;

          if (loc.price.actualCost !== undefined) {
            loc.price.total = loc.price.actualCost * factor;
            loc.price.totalLow = loc.price.actualCost * factor;
            loc.price.totalHigh = loc.price.actualCost * factor;
          } else if (loc.price.typicalCost !== undefined) {
            loc.price.total = loc.price.typicalCost * factor;
            loc.price.totalLow = Math.round(loc.price.typicalCost * 0.9 * factor);
            loc.price.totalHigh = Math.round(loc.price.typicalCost * 1.1 * factor);
          }
        } else if (loc.category === "MEAL") {
          const expectedCost = loc.price.actualCost !== undefined ? loc.price.actualCost : (loc.price.typicalCost || 0);
          loc.price.total = expectedCost * travelerCount;
          loc.price.totalLow = Math.round(expectedCost * 0.9 * travelerCount);
          loc.price.totalHigh = Math.round(expectedCost * 1.1 * travelerCount);
        } else {
          const expectedCost = loc.price.actualCost !== undefined ? loc.price.actualCost : (loc.price.typicalCost || 0);
          loc.price.total = expectedCost;
          if (loc.price.actualCost !== undefined) {
            loc.price.totalLow = loc.price.actualCost;
            loc.price.totalHigh = loc.price.actualCost;
          } else if (loc.price.typicalCost !== undefined) {
            loc.price.totalLow = Math.round(loc.price.typicalCost * 0.9);
            loc.price.totalHigh = Math.round(loc.price.typicalCost * 1.1);
          }
        }
      }

      if (sug.price) {
        const category = sug.type === "LOCATION_SUGGESTION" ? sug.suggestedLocation?.category || "ACTIVITY" : "TRANSIT";
        if (category === "LODGING") {
          const unit = sug.price.unit || "ROOM";
          const factor = unit === "ROOM" ? Math.ceil(travelerCount / 2) : 1;
          const nights = targetHub ? getHubStayNights(graph, targetHub.id) : 1;
          const costMultiplier = factor * nights;

          if (sug.price.actualCost !== undefined) {
            sug.price.total = sug.price.actualCost * costMultiplier;
            sug.price.totalLow = sug.price.actualCost * costMultiplier;
            sug.price.totalHigh = sug.price.actualCost * costMultiplier;
          } else if (sug.price.typicalCost !== undefined) {
            sug.price.total = sug.price.typicalCost * costMultiplier;
            sug.price.totalLow = Math.round(sug.price.typicalCost * 0.9 * costMultiplier);
            sug.price.totalHigh = Math.round(sug.price.typicalCost * 1.1 * costMultiplier);
          }
        } else if (category === "ACTIVITY") {
          const unit = sug.price.unit || "PERSON";
          const factor = unit === "PERSON" ? travelerCount : 1;

          if (sug.price.actualCost !== undefined) {
            sug.price.total = sug.price.actualCost * factor;
            sug.price.totalLow = sug.price.actualCost * factor;
            sug.price.totalHigh = sug.price.actualCost * factor;
          } else if (sug.price.typicalCost !== undefined) {
            sug.price.total = sug.price.typicalCost * factor;
            sug.price.totalLow = Math.round(sug.price.typicalCost * 0.9 * factor);
            sug.price.totalHigh = Math.round(sug.price.typicalCost * 1.1 * factor);
          }
        } else if (category === "MEAL") {
          const expectedCost = sug.price.actualCost !== undefined ? sug.price.actualCost : (sug.price.typicalCost || 0);
          sug.price.total = expectedCost * travelerCount;
          sug.price.totalLow = Math.round(expectedCost * 0.9 * travelerCount);
          sug.price.totalHigh = Math.round(expectedCost * 1.1 * travelerCount);
        } else {
          const expectedCost = sug.price.actualCost !== undefined ? sug.price.actualCost : (sug.price.typicalCost || 0);
          sug.price.total = expectedCost;
          if (sug.price.actualCost !== undefined) {
            sug.price.totalLow = sug.price.actualCost;
            sug.price.totalHigh = sug.price.actualCost;
          } else if (sug.price.typicalCost !== undefined) {
            sug.price.totalLow = Math.round(sug.price.typicalCost * 0.9);
            sug.price.totalHigh = Math.round(sug.price.typicalCost * 1.1);
          }
        }
      }
    });
  }

  // --- 2. Sum up overall trip budget estimate ---
  let lowSum = 0;
  let highSum = 0;

  if (graph.Locations) {
    Object.values(graph.Locations).forEach((loc) => {
      if (loc.price) {
        if (loc.price.totalLow !== undefined) {
          lowSum += loc.price.totalLow;
        }
        if (loc.price.totalHigh !== undefined) {
          highSum += loc.price.totalHigh;
        }
      }
    });
  }

  // Sum transits
  if (graph.Transits) {
    Object.values(graph.Transits).forEach((trans) => {
      if (trans.price) {
        if (trans.price.actualCost !== undefined) {
          lowSum += trans.price.actualCost;
          highSum += trans.price.actualCost;
        } else if (trans.price.typicalCost !== undefined) {
          lowSum += trans.price.typicalCost * 0.9;
          highSum += trans.price.typicalCost * 1.1;
        }
      }
    });
  }

  // Update budget estimate
  if (!graph.budget) {
    graph.budget = {
      budget: { min: undefined, max: undefined },
      estimate: { low: 0, high: 0 },
    };
  }
  graph.budget.estimate = {
    low: Math.round(lowSum),
    high: Math.round(highSum),
  };

  // --- 2. Recalculate Actual Start and End Dates ---
  let earliestTime = Infinity;
  let latestTime = -Infinity;

  // Scan transits
  if (graph.Transits) {
    Object.values(graph.Transits).forEach((trans) => {
      if (trans.segments) {
        trans.segments.forEach((seg) => {
          const s = new Date(seg.startTime).getTime();
          const e = new Date(seg.endTime).getTime();
          if (!isNaN(s)) earliestTime = Math.min(earliestTime, s);
          if (!isNaN(e)) latestTime = Math.max(latestTime, e);
        });
      }
    });
  }

  // Scan itinerary items in all hubs
  if (graph.CityHubs) {
    Object.values(graph.CityHubs).forEach((hub) => {
      if (hub.itinerary) {
        hub.itinerary.forEach((item) => {
          const s = new Date(item.startTime).getTime();
          if (!isNaN(s)) {
            earliestTime = Math.min(earliestTime, s);
            latestTime = Math.max(latestTime, s);
          }
          if (item.endTime) {
            const e = new Date(item.endTime).getTime();
            if (!isNaN(e)) latestTime = Math.max(latestTime, e);
          }
        });
      }
    });
  }

  if (!graph.targetDateRange) {
    graph.targetDateRange = {
      target: undefined,
      context: undefined,
      actual: { start: undefined, end: undefined },
    };
  }

  if (earliestTime === Infinity || latestTime === -Infinity) {
    graph.targetDateRange.actual = {
      start: undefined,
      end: undefined,
    };
  } else {
    graph.targetDateRange.actual = {
      start: new Date(earliestTime).toISOString(),
      end: new Date(latestTime).toISOString(),
    };
  }
};

