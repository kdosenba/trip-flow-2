import React from "react";
import { Location } from "../../types/schema";
import { AddressIcon, CalendarIcon } from "./icons";
import { STYLE_TOKENS } from "../../lib/style-guide";
import { DateTimeFormatter } from "../../lib/utils/date";

interface ItineraryEventCardProps {
  eventLocation: Location;
  startTime: string;
  endTime?: string | undefined;
  timezone?: string | undefined;
  isActive?: boolean;
  onClick?: () => void;
}

export const ItineraryEventCard: React.FC<ItineraryEventCardProps> = ({
  eventLocation,
  startTime,
  endTime,
  timezone,
  isActive = false,
  onClick,
}) => {
  const formattedTime = endTime
    ? `${DateTimeFormatter.format(startTime, timezone)} - ${DateTimeFormatter.format(endTime, timezone, { hour: "2-digit", minute: "2-digit", hour12: false })}`
    : DateTimeFormatter.format(startTime, timezone);

  // Determine dynamic styling classes based on category
  let cardBorderClass = "border-border-color hover:border-border-hover";
  let activeClass = "";
  let badgeClass = "text-text-primary bg-white/5 border-border-color";
  let badgeLabel = eventLocation.category.toString();
  let priceLabel = "Price";
  let showSaving = false;

  switch (eventLocation.category) {
    case "LODGING":
      cardBorderClass =
        "border-border-color hover:border-hub-color/30 hover:shadow-glow-hub";
      activeClass = "border-hub-color shadow-glow-hub";
      badgeClass = "text-hub-color bg-hub-color/10 border-hub-color/25";
      badgeLabel = "Lodging";
      priceLabel = "Price / Night";
      break;
    case "ACTIVITY":
      cardBorderClass =
        "border-border-color hover:border-budget-safe/30 hover:shadow-glow-safe";
      activeClass = "border-budget-safe shadow-glow-safe";
      badgeClass = "text-budget-safe bg-budget-safe/10 border-budget-safe/25";
      badgeLabel = "Activity";
      priceLabel = "Cost";
      if (eventLocation.price?.typicalCost && eventLocation.price?.actualCost) {
        showSaving =
          eventLocation.price.typicalCost > eventLocation.price.actualCost;
      }
      break;
    case "MEAL":
      cardBorderClass =
        "border-border-color hover:border-budget-warn/30 hover:shadow-glow-warn";
      activeClass = "border-budget-warn shadow-glow-warn";
      badgeClass = "text-budget-warn bg-budget-warn/10 border-budget-warn/25";
      badgeLabel = "Meal";
      priceLabel = "Est. Cost / Person";
      break;
  }

  const savingsAmount = showSaving
    ? eventLocation.price!.typicalCost! - eventLocation.price!.actualCost!
    : 0;

  return (
    <div
      className={`relative box-border flex w-full max-w-card-max cursor-pointer flex-col justify-between rounded-lg border bg-bg-card p-4 shadow-glass transition-all duration-300 hover:-translate-y-0.5 ${
        isActive ? activeClass : cardBorderClass
      }`}
      onClick={onClick}
    >
      <div className="mb-3 flex items-start justify-between gap-1">
        <div className="flex flex-col overflow-hidden">
          <h3 className="m-0 truncate text-sm-dense font-bold text-text-primary">
            {eventLocation.name}
          </h3>
          <span className="mt-0.5 truncate text-xs-dense text-text-secondary">
            {eventLocation.category} Booking
          </span>
        </div>
        <span
          className={`shrink-0 rounded-xs border px-1.5 py-0.5 text-super-small font-bold tracking-wider uppercase ${badgeClass}`}
        >
          {badgeLabel}
        </span>
      </div>

      <div className="mb-3 flex flex-col gap-1.5 text-xs-dense text-text-secondary">
        <div className="flex items-center gap-1.5">
          <AddressIcon />
          <span className="text-xs-dense text-text-secondary">
            {eventLocation.address}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarIcon />
          <span>{formattedTime}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xxs font-bold tracking-wider text-text-muted uppercase">
            {priceLabel}
          </span>
          <span className="mt-0.5 text-sm-dense font-bold text-text-primary">
            {eventLocation.price?.actualCost !== undefined
              ? `$${eventLocation.price.actualCost} USD`
              : "Free"}
          </span>
        </div>

        {showSaving ? (
          <span className="text-xs-dense font-bold text-budget-safe">
            Saved ${savingsAmount}!
          </span>
        ) : (
          eventLocation.price?.typicalCost !== undefined && (
            <span className="text-xs-dense text-text-muted">
              Typical: ${eventLocation.price.typicalCost}
            </span>
          )
        )}
      </div>
    </div>
  );
};
