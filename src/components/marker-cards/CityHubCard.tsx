import React from "react";
import { CityHub } from "../../types/schema";
import { Trash2 } from "lucide-react";
import { DateTimeFormatter } from "../../lib/utils/date";
import { useTripFlowStore } from "../../store";

interface CityHubCardProps {
  cityHub: CityHub;
  isActive?: boolean | undefined;
  onClick?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
}

export const CityHubCard: React.FC<CityHubCardProps> = ({
  cityHub,
  onClick,
  onDelete,
}) => {
  const graph = useTripFlowStore((state) => state.graph);
  const isPlanning = useTripFlowStore((state) => state.isPlanning);

  // Calculate date range and days count dynamically from transits and itinerary
  const getItineraryRangeAndDuration = () => {
    // Find arrival transit segment ending at this hub
    const arrivalTransit = graph
      ? Object.values(graph.Transits).find((t) => t.toCityId === cityHub.id)
      : undefined;
    const arrivalTimeStr = arrivalTransit?.segments[arrivalTransit.segments.length - 1]?.endTime;
    const arrivalTime = arrivalTimeStr ? new Date(arrivalTimeStr).getTime() : undefined;

    // Find departure transit segment starting from this hub
    const departureTransit = graph
      ? Object.values(graph.Transits).find((t) => t.fromCityId === cityHub.id)
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

    // Determine final bounds
    const start = arrivalTime !== undefined ? arrivalTime : (minItineraryStart !== Infinity ? minItineraryStart : undefined);
    const end = departureTime !== undefined ? departureTime : (maxItineraryEnd !== -Infinity ? maxItineraryEnd : undefined);

    if (start === undefined && end === undefined) {
      return { rangeLabel: "TBD+", days: 1, isFlexible: true };
    }

    const hasFlexibleEnd = departureTime === undefined;

    // Format range label
    let rangeLabel = "";
    if (start !== undefined && end !== undefined) {
      try {
        rangeLabel = DateTimeFormatter.formatRange(
          new Date(start).toISOString(),
          new Date(end).toISOString(),
          cityHub.timezone
        );
        if (hasFlexibleEnd) {
          rangeLabel += "+";
        }
      } catch {
        rangeLabel = `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}${hasFlexibleEnd ? "+" : ""}`;
      }
    } else if (start !== undefined) {
      try {
        rangeLabel = `${DateTimeFormatter.format(new Date(start).toISOString(), cityHub.timezone, { month: "short", day: "numeric" })}+`;
      } catch {
        rangeLabel = `${new Date(start).toLocaleDateString()}+`;
      }
    } else if (end !== undefined) {
      try {
        rangeLabel = `? - ${DateTimeFormatter.format(new Date(end).toISOString(), cityHub.timezone, { month: "short", day: "numeric" })}`;
      } catch {
        rangeLabel = `? - ${new Date(end).toLocaleDateString()}`;
      }
    }

    // Calculate duration in days
    let days = 1;
    if (start !== undefined && end !== undefined) {
      const diffTime = Math.abs(end - start);
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    return { rangeLabel, days, isFlexible: hasFlexibleEnd };
  };

  const { rangeLabel, days, isFlexible } = getItineraryRangeAndDuration();

  const { value: displayValue, unit: displayUnit } = DateTimeFormatter.formatDuration(days);
  const finalDisplayValue = isFlexible ? `${displayValue}+` : displayValue;

  return (
    <div
      className="relative box-border flex w-fit max-w-card-max cursor-pointer items-center rounded-4xl border-1.5 border-transparent bg-text-primary py-1.5 pr-2.5 pl-3.5 transition-all duration-300 hover:-translate-y-0.5"
      onClick={onClick}
    >
      {/* Left duration badge */}
      <div className="flex h-9 w-fit min-w-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg bg-white px-2">
        <span className="text-lg leading-none font-extrabold text-text-primary">{finalDisplayValue}</span>
        <span className="text-super-small leading-none font-extrabold text-text-secondary">
          {displayUnit}
        </span>
      </div>

      {/* Middle city & schedule info */}
      <div className="ml-2 flex grow flex-col overflow-hidden">
        <h4 className="m-0 text-sm-dense font-bold break-words text-white" style={{ whiteSpace: "normal" }}>
          {cityHub.cityName}
        </h4>
        <span className="mt-0 text-xxs font-bold text-white/60">
          {rangeLabel}
        </span>
      </div>

      {/* Right delete/trash icon */}
      {onDelete && (
        <button
          disabled={isPlanning}
          className="ml-1 flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-1 text-white/50 transition-all duration-300 hover:bg-white/10 hover:text-budget-danger disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white/50"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Remove Hub"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};
