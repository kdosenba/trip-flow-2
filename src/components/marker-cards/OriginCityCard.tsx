import React from "react";
import { CityHub } from "../../types/schema";
import { UsersIcon, UserIcon, HomeIcon } from "./icons";
import { STYLE_TOKENS } from "../../lib/style-guide";
import { useTripFlowStore } from "../../store";
import { DateTimeFormatter } from "../../lib/utils/date";

interface OriginCityCardProps {
  originCity: CityHub;
  isActive?: boolean | undefined;
  onClick?: (() => void) | undefined;
}

export const OriginCityCard: React.FC<OriginCityCardProps> = ({
  originCity,
  isActive = false,
  onClick,
}) => {
  const graph = useTripFlowStore((state) => state.graph);
  const updateTravelerCount = useTripFlowStore(
    (state) => state.updateTravelerCount,
  );

  if (!graph) return null;

  const travelerCount = originCity.travelerCount;

  // Find departure transit edge (outgoing from origin hub)
  const departingTransit = Object.values(graph.Transits).find(
    (t) => t.fromCityId === originCity.id,
  );
  const firstSegment = departingTransit?.segments[0];
  const departureTime = firstSegment?.startTime;
  const departureLoc = firstSegment
    ? graph.Locations[firstSegment.fromLocationId]
    : undefined;
  const departureIata = departureLoc?.iata ? `${departureLoc.iata} ` : "";

  // Find return transit edge (returning to origin hub)
  const returningTransit = Object.values(graph.Transits).find(
    (t) => t.toCityId === originCity.id,
  );
  const returningSegments = returningTransit?.segments;
  const lastSegment =
    returningSegments && returningSegments.length > 0
      ? returningSegments[returningSegments.length - 1]
      : undefined;
  const returnTime = lastSegment?.endTime;
  const returnLoc = lastSegment
    ? graph.Locations[lastSegment.toLocationId]
    : undefined;
  const returnIata = returnLoc?.iata ? `${returnLoc.iata} ` : "";

  return (
    <div
      className={`relative inline-flex w-fit max-w-card-max cursor-pointer flex-col justify-start gap-1 rounded-lg border bg-bg-card p-1.5 shadow-glass transition-all duration-300 ${
        isActive
          ? "border-origin-color shadow-glow-origin"
          : "border-border-color hover:-translate-y-0.5 hover:border-border-hover"
      }`}
      onClick={onClick}
    >
      {/* Title section with Home icon & City Name */}
      <div className="mb-0 flex items-center gap-1 border-b-0 pb-0">
        <div className="flex shrink-0 items-center justify-center text-origin-color">
          <HomeIcon />
        </div>
        <div className="min-w-0 grow">
          <h3
            className="m-0 text-sm-dense font-bold text-text-primary normal-case"
            style={{ whiteSpace: "normal" }}
          >
            {originCity.cityName}
          </h3>
        </div>
      </div>

      {/* Details pane (Inline traveler controls & Dates) */}
      <div className="m-0 flex flex-col gap-1 text-xs-dense text-text-secondary">
        {/* Travelers Inline Row */}
        <div className="flex items-center gap-1.5">
          {travelerCount > 1 ? <UsersIcon /> : <UserIcon />}
          <span className="text-xs-dense text-text-secondary">
            traveler{travelerCount > 1 ? "s" : ""}
          </span>
          <div
            className="inline-flex items-center gap-1 rounded bg-black/30 p-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="flex h-4 w-4 cursor-pointer items-center justify-center rounded border border-border-color bg-black/20 text-xxs text-text-primary transition-all hover:border-border-hover hover:bg-black/40 active:scale-95"
              onClick={() =>
                updateTravelerCount(
                  originCity.id,
                  Math.max(1, travelerCount - 1),
                )
              }
              title="Decrease Travelers"
            >
              -
            </button>
            <span className="min-w-2.5 text-center text-xs-dense text-text-primary">
              {travelerCount}
            </span>
            <button
              className="flex h-4 w-4 cursor-pointer items-center justify-center rounded border border-border-color bg-black/20 text-xxs text-text-primary transition-all hover:border-border-hover hover:bg-black/40 active:scale-95"
              onClick={() =>
                updateTravelerCount(originCity.id, travelerCount + 1)
              }
              title="Increase Travelers"
            >
              +
            </button>
          </div>
        </div>

        {/* Departure Details (Only if specified) */}
        {departureTime && (
          <div className="flex items-center gap-1">
            <span className="min-w-12 font-bold text-origin-color">
              Depart:
            </span>
            <span className="text-text-primary">
              {departureIata}
              {DateTimeFormatter.format(departureTime, originCity.timezone)}
            </span>
          </div>
        )}

        {/* Return/Arrival Details (Only if specified) */}
        {returnTime && (
          <div className="flex items-center gap-1">
            <span className="min-w-12 font-bold text-origin-color">
              Return:
            </span>
            <span className="text-text-primary">
              {returnIata}
              {DateTimeFormatter.format(returnTime, originCity.timezone)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
