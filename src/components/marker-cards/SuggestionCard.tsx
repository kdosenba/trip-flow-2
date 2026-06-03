import React from "react";
import { Suggestion } from "../../types/schema";
import { AddressIcon, CalendarIcon, PlaneIcon } from "./icons";
import { useTripFlowStore } from "../../store";
import { DateTimeFormatter } from "../../lib/utils/date";

interface SuggestionCardProps {
  suggestion: Suggestion;
  isAdded: boolean;
  onToggleAdd: () => void;
  isActive?: boolean;
  onClick?: () => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  isAdded,
  onToggleAdd,
  isActive = false,
  onClick,
}) => {
  const isLocation = suggestion.type === "LOCATION_SUGGESTION";

  const graph = useTripFlowStore((state) => state.graph);
  const targetCity =
    suggestion.targetCityId && graph
      ? graph.CityHubs[suggestion.targetCityId]
      : undefined;
  const timezone = targetCity?.timezone;

  // Format segment dates nicely
  const getSegmentTimeLabel = () => {
    if (!suggestion.suggestedSegments || !suggestion.suggestedSegments[0])
      return "";
    const segment = suggestion.suggestedSegments[0];
    try {
      const dateStr = DateTimeFormatter.format(segment.startTime, timezone, {
        month: "short",
        day: "numeric",
      });
      const startStr = DateTimeFormatter.format(segment.startTime, timezone, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const endStr = DateTimeFormatter.format(segment.endTime, timezone, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      return `${dateStr}, ${startStr} - ${endStr}`;
    } catch {
      return "";
    }
  };

  return (
    <div
      className={`relative box-border flex w-full max-w-card-max cursor-pointer flex-col justify-between rounded-lg border-1.5 border-dashed bg-suggest-gradient p-4 shadow-glass transition-all duration-300 hover:-translate-y-0.5 ${
        isActive
          ? "border-suggest-color shadow-glow-suggest"
          : "border-suggest-color/40 hover:border-suggest-color"
      }`}
      onClick={onClick}
    >
      <div className="mb-3 flex items-start justify-between gap-1">
        <div className="flex flex-col overflow-hidden">
          <h3 className="m-0 truncate text-sm-dense font-bold text-text-primary">
            {suggestion.title}
          </h3>
          <span className="mt-0.5 truncate text-xs-dense text-text-secondary">
            {isLocation ? "Activity Recommendation" : "Transit Recommendation"}
          </span>
        </div>
        <span className="shrink-0 rounded-xs border border-suggest-color/25 bg-suggest-color/10 px-1.5 py-0.5 text-super-small font-bold tracking-wider text-suggest-color uppercase">
          AI Suggested
        </span>
      </div>

      <div className="mb-3 flex flex-col gap-1.5 text-xs-dense text-text-secondary">
        <p className="m-0 mb-3 text-sm-dense leading-normal text-text-secondary">
          {suggestion.description}
        </p>

        {isLocation
          ? suggestion.suggestedLocation && (
              <div className="flex items-center gap-1.5">
                <AddressIcon />
                <span className="text-xs-dense text-text-secondary">
                  {suggestion.suggestedLocation.address}
                </span>
              </div>
            )
          : suggestion.suggestedSegments &&
            suggestion.suggestedSegments[0] && (
              <>
                <div className="flex items-center gap-1.5">
                  <PlaneIcon />
                  <span>
                    {suggestion.suggestedSegments[0].transportMode} segment
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarIcon />
                  <span>{getSegmentTimeLabel()}</span>
                </div>
              </>
            )}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xxs font-bold tracking-wider text-text-muted uppercase">
            {isLocation ? "Price" : "Price Estimate"}
          </span>
          <span className="mt-0.5 text-sm-dense font-bold text-suggest-color">
            {suggestion.price?.actualCost !== undefined
              ? `$${suggestion.price.actualCost} USD`
              : "TBD"}
          </span>
        </div>
        <button
          className="cursor-pointer rounded border border-suggest-color/25 bg-suggest-color/10 px-2 py-1 text-xs-dense font-semibold text-suggest-color transition-all duration-300 hover:border-transparent hover:bg-suggest-color hover:text-black active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onToggleAdd();
          }}
        >
          {isAdded ? "Added ✓" : "+ Add to Trip"}
        </button>
      </div>
    </div>
  );
};
