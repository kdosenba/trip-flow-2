import React from "react";
import { BedDoubleIcon, HomeIcon, UserIcon, TicketIcon, UtensilsIcon } from "./icons";
import { Cost } from "../../types/schema";

interface EventPriceSectionProps {
  category: "LODGING" | "ACTIVITY" | "MEAL" | "TRANSIT_POINT";
  price: Cost | undefined;
  travelerCount: number;
  currency?: string | undefined;
  nights?: number | undefined;
}

const getCurrencySymbol = (currencyCode: string): string => {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
    });
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find((part) => part.type === "currency");
    return symbolPart ? symbolPart.value : "$";
  } catch {
    return "$";
  }
};

export const EventPriceSection: React.FC<EventPriceSectionProps> = ({
  category,
  price,
  travelerCount,
  currency = "USD",
  nights,
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
  const symbol = getCurrencySymbol(currency);

  // Render per-unit section
  const renderUnitRate = () => {
    const showSavings = typical !== undefined && actual !== undefined && typical > actual;

    return (
      <div className="flex items-baseline gap-1 mt-0.5 leading-none">
        {showSavings && typical !== undefined && (
          <span className="text-xxs font-semibold text-text-muted line-through">
            {symbol}{typical.toLocaleString()}
          </span>
        )}
        <span className="text-sm font-bold text-text-primary">
          {expectedRate > 0 ? `${symbol}${expectedRate.toLocaleString()}` : "Free"}
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
      const lodgingNights = nights || 1;
      const totalLodgingCost = price.total !== undefined ? price.total : (expectedRate * roomsNeeded * lodgingNights);

      return (
        <div className="mt-auto flex items-start justify-between gap-2 border-t border-dashed border-border-color/60 pt-2.5">
          {/* Rate Section */}
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-text-muted uppercase">
              {resolvedUnit === "ROOM" ? (
                <BedDoubleIcon size={10} className="text-hub-color" />
              ) : (
                <HomeIcon size={10} className="text-hub-color" />
              )}
              {resolvedUnit === "ROOM" ? "Room Rate" : "Flat Rate"}
            </span>
            {renderUnitRate()}
            <span className="text-[10px] leading-none text-text-secondary">
              per {resolvedUnit.toLowerCase()} / night
            </span>
          </div>

          {/* Group Total Section */}
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">
              Total
            </span>
            <span className="text-sm font-extrabold text-hub-color leading-none mt-0.5">
              {totalLodgingCost > 0 ? `${symbol}${totalLodgingCost.toLocaleString()}` : "Free"}
            </span>
            <span className="text-[10px] leading-none text-text-secondary">
              {formattedTravelers} traveler{travelerCount > 1 ? "s" : ""}
            </span>
            {resolvedUnit === "ROOM" && (
              <span className="text-[10px] leading-none text-text-secondary">
                {roomsNeeded} room{roomsNeeded > 1 ? "s" : ""}
              </span>
            )}
            <span className="text-[10px] leading-none text-text-secondary">
              {lodgingNights} night{lodgingNights > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      );
    }

    case "ACTIVITY": {
      const resolvedUnit = unit || "PERSON";
      const totalActivityCost = price.total !== undefined ? price.total : (expectedRate * (resolvedUnit === "PERSON" ? travelerCount : 1));

      return (
        <div className="mt-auto flex items-start justify-between gap-2 border-t border-dashed border-border-color/60 pt-2.5">
          {/* Rate Section */}
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-text-muted uppercase">
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
            <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">
              Total
            </span>
            <span className="text-sm font-extrabold text-budget-safe leading-none mt-0.5">
              {totalActivityCost > 0 ? `${symbol}${totalActivityCost.toLocaleString()}` : "Free"}
            </span>
            <span className="text-[10px] leading-none text-text-secondary">
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
        <div className="mt-auto flex items-start justify-between gap-2 border-t border-dashed border-border-color/60 pt-2.5">
          {/* Rate / Tier Section */}
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-text-muted uppercase">
              <UtensilsIcon size={10} className="text-budget-warn" />
              Meal Tier
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 leading-none text-sm font-extrabold tracking-wider text-budget-warn">
              {dollarSigns}
            </div>
            {expectedRate > 0 && (
              <span className="text-[10px] leading-none text-text-secondary">
                ~{symbol}{expectedRate}/p
              </span>
            )}
          </div>

          {/* Group Total Section */}
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">
              Total (est.)
            </span>
            <span className="text-sm font-extrabold text-budget-warn leading-none mt-0.5">
              {lowEst > 0 ? `${symbol}${lowEst.toLocaleString()}-${symbol}${highEst.toLocaleString()}` : "TBD"}
            </span>
            <span className="text-[10px] leading-none text-text-secondary">
              {formattedTravelers} traveler{travelerCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="mt-auto flex items-start justify-between border-t border-dashed border-border-color/60 pt-2.5 text-[10px] text-text-muted">
          <span>Cost</span>
          <span className="font-bold">{expectedRate > 0 ? `${symbol}${expectedRate}` : "Free"}</span>
        </div>
      );
  }
};
