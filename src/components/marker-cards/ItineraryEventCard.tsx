import React from "react";
import { Location } from "../../types/schema";
import { CalendarIcon, BedIcon, SparklesIcon, UtensilsIcon } from "./icons";
import { DateTimeFormatter } from "../../lib/utils/date";
import { useTripFlowStore } from "../../store";
import { EventPriceSection } from "./EventPriceSection";

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
  const graph = useTripFlowStore((state) => state.graph);

  const formattedTime = endTime
    ? `${DateTimeFormatter.format(startTime, timezone)} - ${DateTimeFormatter.format(endTime, timezone, { hour: "2-digit", minute: "2-digit", hour12: false })}`
    : DateTimeFormatter.format(startTime, timezone);

  // Find travelerCount from target/parent hub in store graph
  const travelerCount = React.useMemo(() => {
    if (!graph || !graph.CityHubs) return 1;
    const parentHub = Object.values(graph.CityHubs).find((hub) =>
      hub.itinerary?.some((item) => item.LocationId === eventLocation.id)
    );
    return parentHub ? (parentHub.resolvedTravelerCount || parentHub.travelerCount) : 1;
  }, [graph, eventLocation.id]);

  // Determine dynamic styling classes based on category
  let cardBorderClass = "border-border-color hover:border-border-hover";
  let activeClass = "";
  let badgeClass = "text-text-primary bg-white/5 border-border-color";
  let badgeLabel = eventLocation.category.toString();
  let categoryIcon = <SparklesIcon size={14} />;

  switch (eventLocation.category) {
    case "LODGING":
      cardBorderClass =
        "border-border-color hover:border-hub-color/30";
      activeClass = "border-hub-color";
      badgeClass = "text-hub-color bg-hub-color/10 border-hub-color/25";
      badgeLabel = "Lodging";
      categoryIcon = <BedIcon size={14} className="text-hub-color" />;
      break;
    case "ACTIVITY":
      cardBorderClass =
        "border-border-color hover:border-budget-safe/30";
      activeClass = "border-budget-safe";
      badgeClass = "text-budget-safe bg-budget-safe/10 border-budget-safe/25";
      badgeLabel = "Activity";
      categoryIcon = <SparklesIcon size={14} className="text-budget-safe" />;
      break;
    case "MEAL":
      cardBorderClass =
        "border-border-color hover:border-budget-warn/30";
      activeClass = "border-budget-warn";
      badgeClass = "text-budget-warn bg-budget-warn/10 border-budget-warn/25";
      badgeLabel = "Meal";
      categoryIcon = <UtensilsIcon size={14} className="text-budget-warn" />;
      break;
  }

  return (
    <div
      className={`relative box-border flex w-full max-w-card-max cursor-pointer flex-col justify-between rounded-lg border bg-bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 ${
        isActive ? activeClass : cardBorderClass
      }`}
      onClick={onClick}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          <div className="mt-0.5 shrink-0">
            {categoryIcon}
          </div>
          <h3 className="m-0 text-sm-dense leading-tight font-bold break-words text-text-primary" style={{ whiteSpace: "normal" }}>
            {eventLocation.name}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-xs border px-1.5 py-0.5 text-super-small font-bold tracking-wider uppercase ${badgeClass}`}
        >
          {badgeLabel}
        </span>
      </div>

      <div className="mb-3 flex flex-col gap-1.5 text-xs-dense text-text-secondary">
        <div className="flex items-center gap-1.5">
          <CalendarIcon />
          <span>{formattedTime}</span>
        </div>
      </div>

      <EventPriceSection
        category={eventLocation.category}
        price={eventLocation.price}
        travelerCount={travelerCount}
        currency={graph?.clientContext?.currency || "USD"}
      />
    </div>
  );
};
