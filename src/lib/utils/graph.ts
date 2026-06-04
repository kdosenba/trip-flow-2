import { TripFlowGraph } from "../../types/schema";

/**
 * Automatically recalculates the budget estimate and actual trip dates based on active locations and transits.
 * Does not allow manual override. Overwrites existing estimates and actual bounds.
 */
export const recalculateEstimatesAndActuals = (graph: TripFlowGraph): void => {
  // --- 1. Recalculate Budget Estimate ---
  let lowSum = 0;
  let highSum = 0;

  // Sum active locations
  if (graph.Locations) {
    Object.values(graph.Locations).forEach((loc) => {
      if (loc.price) {
        if (loc.price.actualCost !== undefined) {
          lowSum += loc.price.actualCost;
          highSum += loc.price.actualCost;
        } else if (loc.price.typicalCost !== undefined) {
          lowSum += loc.price.typicalCost * 0.9;
          highSum += loc.price.typicalCost * 1.1;
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
