import React from "react";
import { CityHub } from "../../types/schema";
import { MapPin, Users, Calendar, Compass, Navigation } from "lucide-react";
import { useTripFlowStore } from "../../store";
import { DateTimeFormatter } from "../../lib/utils/date";

interface CityHubDashboardProps {
  cityHub: CityHub;
}

export const CityHubDashboard: React.FC<CityHubDashboardProps> = ({
  cityHub,
}) => {
  const graph = useTripFlowStore((state) => state.graph);
  const isPlanning = useTripFlowStore((state) => state.isPlanning);
  const updateTravelerCount = useTripFlowStore(
    (state) => state.updateTravelerCount,
  );

  if (!graph) return null;

  // Calculate Itinerary details timeline items dynamically from graph
  const timelineItems = cityHub.itinerary.map((item) => {
    const loc = graph.Locations[item.LocationId];
    const label = loc ? loc.name : "Unknown Event";
    const formatted = DateTimeFormatter.format(
      item.startTime,
      cityHub.timezone,
    );

    return {
      label,
      subLabel: formatted,
      cost: loc?.price?.actualCost,
    };
  });

  return (
    <div className="relative w-full max-w-card-widget overflow-hidden rounded-xl border border-border-color bg-bg-card/70 p-5 shadow-glass backdrop-blur-xl transition-all duration-300">
      <div className="absolute top-0 left-0 h-indicator w-full bg-hub-color shadow-glow-hub" />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Navigation className="shrink-0 text-hub-color" size={18} />
          <h3 className="m-0 text-xs-dense font-extrabold tracking-wider text-text-primary uppercase">
            Hub Details
          </h3>
        </div>
        <span className="rounded-sm border border-hub-color/20 bg-hub-color/10 px-1.5 py-0.5 text-super-small font-bold tracking-wider text-hub-color uppercase">
          Sidebar Widget
        </span>
      </div>

      <p className="mt-0 mb-3.5 text-xs-dense leading-relaxed text-text-muted">
        Detailed itinerary view for destination city.
      </p>

      {/* City Hub Title */}
      <div className="mb-4">
        <h4 className="m-0 text-sm font-extrabold text-text-primary">
          {cityHub.cityName}
        </h4>
        <span className="text-xs-dense text-text-secondary">
          {cityHub.country}
        </span>
      </div>

      {/* Details list */}
      <div className="mb-3 flex flex-col gap-1 text-xs-dense text-text-secondary">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0 text-text-muted" />
          <span>
            {cityHub.coordinates.lat.toFixed(4)}°,{" "}
            {cityHub.coordinates.lng.toFixed(4)}°
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Users size={12} className="shrink-0 text-text-muted" />
          <span>
            {cityHub.travelerCount} Traveler
            {cityHub.travelerCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Traveler Count Incrementor */}
      <div className="mt-3 flex items-center justify-between border-t border-border-color pt-3">
        <span className="text-super-small font-bold tracking-wider text-text-muted uppercase">
          Traveler count
        </span>
        <div className="inline-flex items-center gap-1.5 rounded bg-bg-dark p-1">
          <button
            disabled={isPlanning}
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border border-border-color bg-bg-darker text-xs-dense text-text-primary transition-all hover:border-border-hover hover:bg-bg-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() =>
              updateTravelerCount(
                cityHub.id,
                Math.max(1, cityHub.travelerCount - 1),
              )
            }
          >
            -
          </button>
          <span className="min-w-3 text-center text-xs-dense font-bold text-text-primary">
            {cityHub.travelerCount}
          </span>
          <button
            disabled={isPlanning}
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border border-border-color bg-bg-darker text-xs-dense text-text-primary transition-all hover:border-border-hover hover:bg-bg-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() =>
              updateTravelerCount(cityHub.id, cityHub.travelerCount + 1)
            }
          >
            +
          </button>
        </div>
      </div>

      {/* Itinerary Details list */}
      {timelineItems.length > 0 && (
        <>
          <div className="my-4 border-t border-border-color" />
          <h4 className="mb-2 flex items-center gap-1 text-super-small font-extrabold tracking-wider text-text-muted uppercase">
            <Calendar size={12} className="text-event-color" />
            ITINERARY DETAILS
          </h4>
          <div className="relative mt-2 flex flex-col gap-2 border-l border-border-color pl-2.5">
            {timelineItems.map((item, idx) => (
              <div
                key={idx}
                className="relative flex items-start justify-between"
              >
                <span className="absolute top-1.5 -left-3 h-1.5 w-1.5 rounded-full border border-bg-dark bg-hub-color" />
                <div className="flex flex-col">
                  <span className="font-bold text-text-primary">
                    {item.label}
                  </span>
                  <span className="mt-0.5 text-super-small text-text-muted">
                    {item.subLabel}
                  </span>
                </div>
                {item.cost !== undefined && (
                  <span className="ml-auto text-xs-dense font-bold text-text-primary">
                    ${item.cost}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Connective nodes */}
      <div className="my-4 border-t border-border-color" />
      <div className="flex justify-between text-super-small font-semibold text-text-muted">
        <span className="flex items-center gap-1">
          <Compass size={10} /> Arrival:{" "}
          {cityHub.arrivalNodeId ? "CDG" : "None"}
        </span>
        <span className="flex items-center gap-1">
          <Compass size={10} /> Departure:{" "}
          {cityHub.departureNodeId ? "CDG" : "None"}
        </span>
      </div>
    </div>
  );
};
