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
  isActive = false,
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
      return { rangeLabel: "FLEXIBLE", days: 1, isFlexible: true };
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
          rangeLabel += " (FLEXIBLE)";
        }
      } catch {
        rangeLabel = `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
      }
    } else if (start !== undefined) {
      try {
        rangeLabel = `${DateTimeFormatter.format(new Date(start).toISOString(), cityHub.timezone, { month: "short", day: "numeric" })} - ?`;
      } catch {
        rangeLabel = `${new Date(start).toLocaleDateString()} - ?`;
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

  const getDurationDisplay = (numDays: number) => {
    if (numDays >= 28) {
      const val = (Math.ceil((numDays / 30) * 10) / 10).toFixed(1);
      return {
        value: val,
        unit: parseFloat(val) === 1.0 ? "MONTH" : "MONTHS",
      };
    }
    if (numDays > 6) {
      const val = (Math.ceil((numDays / 7) * 10) / 10).toFixed(1);
      return {
        value: val,
        unit: parseFloat(val) === 1.0 ? "WEEK" : "WEEKS",
      };
    }
    return {
      value: String(numDays),
      unit: numDays === 1 ? "DAY" : "DAYS",
    };
  };

  const { value: displayValue, unit: displayUnit } = getDurationDisplay(days);
  const finalDisplayValue = isFlexible ? `${displayValue}+` : displayValue;

  return (
    <div
      className={`relative box-border flex w-fit max-w-card-max cursor-pointer items-center rounded-lg border-1.5 bg-bg-card p-1.5 shadow-glass transition-all duration-300 hover:-translate-y-0.5 ${
        isActive
          ? "border-hub-color shadow-glow-hub"
          : "border-transparent"
      }`}
      onClick={onClick}
    >
      {/* Left duration badge */}
      <div className="flex h-9 min-w-9 w-fit shrink-0 flex-col items-center justify-center gap-0.5 rounded-md bg-white px-1 shadow-hub-badge">
        <span className="text-lg font-extrabold leading-none text-text-primary">{finalDisplayValue}</span>
        <span className="text-super-small font-extrabold leading-none text-text-secondary">
          {displayUnit}
        </span>
      </div>

      {/* Middle city & schedule info */}
      <div className="ml-2 flex grow flex-col overflow-hidden">
        <h4 className="m-0 break-words text-sm-dense font-bold text-text-primary" style={{ whiteSpace: "normal" }}>
          {cityHub.cityName}
        </h4>
        <span className="mt-0.5 text-xxs font-bold text-text-muted">
          {rangeLabel}
        </span>
      </div>

      {/* Right delete/trash icon */}
      {onDelete && (
        <button
          disabled={isPlanning}
          className="ml-1 flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-1 text-text-muted transition-all duration-300 hover:bg-bg-dark hover:text-budget-danger disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-muted"
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
