import React from "react";
import { BedDoubleIcon, HomeIcon, UserIcon, TicketIcon } from "./icons";
import { Cost } from "../../types/schema";

interface EventPriceSectionProps {
  category: "LODGING" | "ACTIVITY" | "MEAL" | "TRANSIT_POINT";
  price: Cost | undefined;
  travelerCount: number;
  currency?: string;
}

export const EventPriceSection: React.FC<EventPriceSectionProps> = ({
  category,
  price,
  travelerCount,
  currency = "USD",
}) => {
  if (!price) {
    return (
      <div className="flex items-center justify-between text-xs-dense text-text-muted">
        <span>Price</span>
        <span className="font-bold">TBD</span>
      </div>
    );
  }

  const actual = price.actualCost;
  const typical = price.typicalCost;
  const unit = price.unit;
  const mealTier = price.mealTier;

  // Expected single-unit rate (fallback to typical if actual is missing)
  const expectedRate = actual !== undefined ? actual : (typical !== undefined ? typical : 0);

  // Render per-unit section
  const renderUnitRate = () => {
    const showSavings = typical !== undefined && actual !== undefined && typical > actual;

    return (
      <div className="flex items-center gap-1.5">
        {showSavings && typical !== undefined && (
          <span className="text-xxs font-semibold text-text-muted line-through">
            {typical.toLocaleString()}
          </span>
        )}
        <span className="text-sm font-bold text-text-primary">
          {expectedRate > 0 ? `${expectedRate.toLocaleString()}` : "Free"}
        </span>
        <span className="text-xxs font-bold text-text-muted">
          {currency}
        </span>
      </div>
    );
  };

  const formattedTravelers = Number.isInteger(travelerCount)
    ? travelerCount.toString()
    : travelerCount.toFixed(1);

  switch (category) {
    case "LODGING": {
      const resolvedUnit = unit || "ROOM";
      const roomsNeeded = resolvedUnit === "ROOM" ? Math.ceil(travelerCount / 2) : 1;
      const totalLodgingCost = expectedRate * roomsNeeded;

      return (
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-dashed border-border-color/60 pt-2.5">
          {/* Rate Section */}
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-xxs font-bold tracking-wider text-text-muted uppercase">
              {resolvedUnit === "ROOM" ? (
                <BedDoubleIcon size={10} className="text-hub-color" />
              ) : (
                <HomeIcon size={10} className="text-hub-color" />
              )}
              {resolvedUnit === "ROOM" ? "Room Rate" : "Flat Rate"}
            </span>
            {renderUnitRate()}
            <span className="text-super-small leading-none text-text-secondary">
              per {resolvedUnit.toLowerCase()} / night
            </span>
          </div>

          {/* Group Total Section */}
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-xxs font-bold tracking-wider text-text-muted uppercase">
              Total
            </span>
            <span className="text-sm font-extrabold text-hub-color">
              {totalLodgingCost > 0 ? `$${totalLodgingCost.toLocaleString()}` : "Free"}
            </span>
            <span className="text-super-small leading-none text-text-secondary">
              {resolvedUnit === "ROOM" 
                ? `${formattedTravelers} traveler${travelerCount > 1 ? "s" : ""} (${roomsNeeded} room${roomsNeeded > 1 ? "s" : ""})` 
                : `${formattedTravelers} traveler${travelerCount > 1 ? "s" : ""}`}
            </span>
          </div>
        </div>
      );
    }

    case "ACTIVITY": {
      const resolvedUnit = unit || "PERSON";
      const totalActivityCost = price.total !== undefined ? price.total : (expectedRate * (resolvedUnit === "PERSON" ? travelerCount : 1));

      return (
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-dashed border-border-color/60 pt-2.5">
          {/* Rate Section */}
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-xxs font-bold tracking-wider text-text-muted uppercase">
              {resolvedUnit === "PERSON" ? (
                <UserIcon size={10} className="text-budget-safe" />
              ) : (
                <TicketIcon size={10} className="text-budget-safe" />
              )}
              {resolvedUnit === "PERSON" ? "Per Person" : "Per Activity"}
            </span>
            {renderUnitRate()}
          </div>

          {/* Group Total Section */}
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-xxs font-bold tracking-wider text-text-muted uppercase">
              Total
            </span>
            <span className="text-sm font-extrabold text-budget-safe">
              {totalActivityCost > 0 ? `$${totalActivityCost.toLocaleString()}` : "Free"}
            </span>
            <span className="text-super-small leading-none text-text-secondary">
              {resolvedUnit === "PERSON" 
                ? `${formattedTravelers} traveler${travelerCount > 1 ? "s" : ""}` 
                : "group total"}
            </span>
          </div>
        </div>
      );
    }

    case "MEAL": {
      // Determine cost tier by mealTier parameter, fallback to expected rate ranges
      let resolvedTier = mealTier;
      if (!resolvedTier) {
        if (expectedRate <= 15) resolvedTier = "LOW";
        else if (expectedRate <= 50) resolvedTier = "MEDIUM";
        else resolvedTier = "HIGH";
      }

      const dollarSigns = resolvedTier === "LOW" ? "$" : (resolvedTier === "MEDIUM" ? "$$" : "$$$");
      
      const lowEst = price.totalLow !== undefined ? price.totalLow : Math.round(expectedRate * 0.9 * travelerCount);
      const highEst = price.totalHigh !== undefined ? price.totalHigh : Math.round(expectedRate * 1.1 * travelerCount);

      return (
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-dashed border-border-color/60 pt-2.5">
          {/* Rate / Tier Section */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xxs font-bold tracking-wider text-text-muted uppercase">
              Meal Cost Tier
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-extrabold tracking-wider text-budget-warn">
                {dollarSigns}
              </span>
              {expectedRate > 0 && (
                <span className="text-xxs text-text-muted">
                  (est. ${expectedRate}/person)
                </span>
              )}
            </div>
          </div>

          {/* Group Total Section */}
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-xxs font-bold tracking-wider text-text-muted uppercase">
              Total (est.)
            </span>
            <span className="text-sm font-extrabold text-budget-warn">
              {lowEst > 0 ? `$${lowEst.toLocaleString()} - $${highEst.toLocaleString()}` : "TBD"}
            </span>
            <span className="text-super-small leading-none text-text-secondary">
              for {formattedTravelers} traveler{travelerCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-border-color/60 pt-2.5 text-xs-dense text-text-muted">
          <span>Cost</span>
          <span className="font-bold">{expectedRate > 0 ? `$${expectedRate} ${currency}` : "Free"}</span>
        </div>
      );
  }
};
