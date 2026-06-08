import React, { useState } from "react";
import { Transit } from "../../types/schema";
import { useTripFlowStore } from "../../store";
import { Users, User, Edit2, RotateCcw, ArrowRight } from "lucide-react";

interface TransitCardProps {
  transit: Transit;
  isActive?: boolean;
  onClick?: () => void;
}

export const TransitCard: React.FC<TransitCardProps> = ({
  transit,
  isActive = false,
  onClick,
}) => {
  const graph = useTripFlowStore((state) => state.graph);
  const isPlanning = useTripFlowStore((state) => state.isPlanning);
  const updateTransitTravelerCount = useTripFlowStore(
    (state) => state.updateTransitTravelerCount,
  );

  const [isEditing, setIsEditing] = useState(false);

  if (!graph) return null;

  const fromCity = graph.CityHubs[transit.fromCityId];
  const toCity = graph.CityHubs[transit.toCityId];
  const fromName = fromCity ? fromCity.cityName : "Unknown City";
  const toName = toCity ? toCity.cityName : "Unknown City";

  // Check if count is overridden
  const isOverridden = transit.travelerCount !== undefined;
  const currentCount = isOverridden
    ? (transit.travelerCount ?? 1)
    : (transit.resolvedTravelerCount ?? 1);

  // Format count to 1 decimal place if not integer
  const formattedCount = Number.isInteger(currentCount)
    ? currentCount.toString()
    : currentCount.toFixed(1);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Default override to currentCount when pencil is clicked
    updateTransitTravelerCount(transit.id, Math.round(currentCount));
    setIsEditing(true);
  };

  const handleStopEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const handleClearOverride = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTransitTravelerCount(transit.id, undefined);
    setIsEditing(false);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const count = transit.travelerCount ?? 1;
    updateTransitTravelerCount(transit.id, count + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const count = transit.travelerCount ?? 1;
    updateTransitTravelerCount(transit.id, Math.max(1, count - 1));
  };

  return (
    <div
      className={`relative box-border flex w-full max-w-card-max cursor-pointer flex-col justify-between rounded-lg border bg-bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 ${
        isActive
          ? "border-transit-color"
          : "border-border-color hover:border-border-hover"
      }`}
      onClick={onClick}
    >
      {/* Decorative Ticket Notches */}
      <div className="absolute top-1/2 -left-2 z-10 size-3.5 -translate-y-1/2 rounded-full border-r border-border-color bg-bg-darker shadow-inset-notch" />
      <div className="absolute top-1/2 -right-2 z-10 size-3.5 -translate-y-1/2 rounded-full border-l border-border-color bg-bg-darker shadow-inset-notch" />

      {/* Header Route */}
      <div className="mb-3 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="truncate text-sm-dense font-bold text-text-primary">
            {fromName}
          </span>
          <ArrowRight size={12} className="shrink-0 text-transit-color" />
          <span className="truncate text-sm-dense font-bold text-text-primary">
            {toName}
          </span>
        </div>
        <span className="shrink-0 rounded-xs border border-transit-color/25 bg-transit-color/10 px-1.5 py-0.5 text-super-small font-bold tracking-wider text-transit-color uppercase">
          ROUTE CONNECTION
        </span>
      </div>

      <div className="my-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {currentCount > 1 ? (
            <Users size={14} className="text-text-secondary" />
          ) : (
            <User size={14} className="text-text-secondary" />
          )}
          <span className="text-xs-dense text-text-secondary">
            {formattedCount} traveler{currentCount !== 1 ? "s" : ""}
            {!isOverridden && <span className="ml-1 text-super-small text-text-muted">(Auto)</span>}
            {isOverridden && <span className="ml-1 text-super-small text-suggest-color font-semibold">(Custom)</span>}
          </span>
        </div>

        {/* Traveler Count Controls */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {isEditing || isOverridden ? (
            <div className="flex items-center gap-1.5">
              <div className="inline-flex items-center gap-1 rounded bg-bg-dark p-0.5">
                <button
                  disabled={isPlanning}
                  className="flex size-5 cursor-pointer items-center justify-center rounded border border-border-color bg-bg-darker text-xs-dense text-text-primary transition-all hover:border-border-hover hover:bg-bg-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleDecrement}
                  title="Decrease Travelers"
                >
                  -
                </button>
                <span className="min-w-3.5 text-center text-xs-dense font-bold text-text-primary">
                  {currentCount}
                </span>
                <button
                  disabled={isPlanning}
                  className="flex size-5 cursor-pointer items-center justify-center rounded border border-border-color bg-bg-darker text-xs-dense text-text-primary transition-all hover:border-border-hover hover:bg-bg-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleIncrement}
                  title="Increase Travelers"
                >
                  +
                </button>
              </div>

              {isOverridden && (
                <button
                  disabled={isPlanning}
                  className="flex size-5 cursor-pointer items-center justify-center rounded border border-border-color bg-bg-darker text-xs-dense text-text-muted hover:text-budget-danger hover:border-budget-danger/30 transition-all active:scale-95"
                  onClick={handleClearOverride}
                  title="Reset to Auto"
                >
                  <RotateCcw size={10} />
                </button>
              )}

              {isEditing && !isOverridden && (
                <button
                  className="flex size-5 cursor-pointer items-center justify-center rounded border border-border-color bg-bg-darker text-xs-dense text-suggest-color transition-all active:scale-95"
                  onClick={handleStopEdit}
                  title="Done Editing"
                >
                  ✓
                </button>
              )}
            </div>
          ) : (
            <button
              disabled={isPlanning}
              className="flex size-5 cursor-pointer items-center justify-center rounded border border-border-color bg-bg-darker text-text-muted hover:text-text-primary transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleStartEdit}
              title="Override Traveler Count"
            >
              <Edit2 size={10} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 border-t border-dashed border-border-color pt-2 flex items-center justify-between text-super-small text-text-muted">
        <span>Segments: {transit.segments.length}</span>
        {transit.price && (
          <span className="font-bold text-text-secondary">
            Price: ${transit.price.actualCost ?? transit.price.typicalCost ?? 0}
          </span>
        )}
      </div>
    </div>
  );
};
