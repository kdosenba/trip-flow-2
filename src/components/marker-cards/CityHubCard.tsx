import React from "react";
import { CityHub } from "../../types/schema";
import { Trash2 } from "lucide-react";
import { DateTimeFormatter } from "../../lib/utils/date";

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
  // Calculate date range and days count dynamically from itinerary
  const getItineraryRangeAndDuration = () => {
    if (!cityHub.itinerary || cityHub.itinerary.length === 0) {
      return { rangeLabel: "FLEXIBLE", days: 1 };
    }

    try {
      let minStart = Infinity;
      let maxEnd = -Infinity;

      cityHub.itinerary.forEach((item) => {
        const s = new Date(item.startTime).getTime();
        minStart = Math.min(minStart, s);
        if (item.endTime) {
          const e = new Date(item.endTime).getTime();
          maxEnd = Math.max(maxEnd, e);
        } else {
          maxEnd = Math.max(maxEnd, s);
        }
      });

      const rangeLabel = DateTimeFormatter.formatRange(
        new Date(minStart).toISOString(),
        new Date(maxEnd).toISOString(),
        cityHub.timezone,
      );

      const diffTime = Math.abs(maxEnd - minStart);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      return { rangeLabel, days };
    } catch {
      return { rangeLabel: "JUN 10 - JUN 15", days: 6 };
    }
  };

  const { rangeLabel, days } = getItineraryRangeAndDuration();

  return (
    <div
      className={`relative box-border flex w-card-max cursor-pointer items-center rounded-full border-1.5 bg-bg-hub-pill p-1 pr-2.5 shadow-glass transition-all duration-300 after:absolute after:-bottom-1.5 after:left-1/2 after:block after:w-0 after:-translate-x-1/2 after:border-x-6 after:border-t-6 after:border-b-0 after:border-x-transparent after:transition-all after:duration-300 after:content-empty hover:-translate-y-0.5 ${
        isActive
          ? "border-hub-color shadow-glow-hub after:border-t-hub-color"
          : "border-transparent after:border-t-bg-hub-pill"
      }`}
      onClick={onClick}
    >
      {/* Left duration badge */}
      <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-full bg-white leading-none shadow-hub-badge">
        <span className="text-lg font-extrabold text-hub-pill-num">{days}</span>
        <span className="text-super-small font-extrabold text-hub-pill-lbl">
          {days > 1 ? "DAYS" : "DAY"}
        </span>
      </div>

      {/* Middle city & schedule info */}
      <div className="ml-2 flex grow flex-col overflow-hidden">
        <h4 className="m-0 truncate text-sm-dense font-bold text-white">
          {cityHub.cityName}
        </h4>
        <span className="mt-0.5 text-xxs font-bold text-hub-pill-muted">
          {rangeLabel}
        </span>
      </div>

      {/* Right delete/trash icon */}
      {onDelete && (
        <button
          className="ml-1 flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-1 text-hub-pill-muted transition-all duration-300 hover:bg-white/10 hover:text-red-300"
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
