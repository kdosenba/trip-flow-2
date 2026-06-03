import React from "react";
import { Location } from "../../types/schema";
import { CoordinatesIcon, PlaneIcon } from "./icons";
import { STYLE_TOKENS } from "../../lib/style-guide";
import { DateTimeFormatter } from "../../lib/utils/date";

interface TransitLocationCardProps {
  location: Location;
  variant: "departure" | "arrival" | "layover";

  // Custom display properties for the ticket
  sourceCode?: string | undefined;
  destinationCode?: string | undefined;
  sourceLabel?: string | undefined;
  destinationLabel?: string | undefined;

  // Dynamic timezone parameters
  startTime?: string | undefined;
  endTime?: string | undefined;
  timezone?: string | undefined;

  // Layover specific labels
  layoverDurationLabel?: string | undefined;

  // Footer tags
  footerBadgeText?: string | undefined;

  isActive?: boolean | undefined;
  onClick?: (() => void) | undefined;
}

export const TransitLocationCard: React.FC<TransitLocationCardProps> = ({
  location,
  variant,
  sourceCode = "NYC",
  destinationCode = "PAR",
  sourceLabel,
  destinationLabel,
  startTime,
  endTime,
  timezone,
  layoverDurationLabel = "2h 20m layover",
  footerBadgeText,
  isActive = false,
  onClick,
}) => {
  // Compute labels dynamically using timezone and formatter if not explicitly supplied
  const displaySourceLabel =
    sourceLabel !== undefined
      ? sourceLabel
      : startTime
        ? `${DateTimeFormatter.format(startTime, timezone, { hour: "2-digit", minute: "2-digit", hour12: false })} Dep`
        : "Source";

  const displayDestLabel =
    destinationLabel !== undefined
      ? destinationLabel
      : endTime
        ? `${DateTimeFormatter.format(endTime, timezone, { hour: "2-digit", minute: "2-digit", hour12: false })} Arr`
        : "Dest.";

  return (
    <div
      className={`relative box-border flex w-full max-w-card-max cursor-pointer flex-col justify-between rounded-lg border bg-bg-card p-4 shadow-glass transition-all duration-300 hover:-translate-y-0.5 ${
        isActive
          ? "border-transit-color shadow-glow-transit"
          : "border-border-color hover:border-border-hover"
      }`}
      onClick={onClick}
    >
      <div className="absolute top-1/2 -left-2 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-r border-border-color bg-bg-darker shadow-inset-notch" />
      <div className="absolute top-1/2 -right-2 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-l border-border-color bg-bg-darker shadow-inset-notch" />

      <div className="mb-3 flex items-start justify-between gap-1">
        <div className="flex flex-col overflow-hidden">
          <h3 className="m-0 truncate text-sm-dense font-bold text-text-primary">
            {location.name}
          </h3>
          <span className="mt-0.5 truncate text-xs-dense text-text-secondary">
            {location.address}
          </span>
        </div>
        <span className="shrink-0 rounded-xs border border-transit-color/25 bg-transit-color/10 px-1.5 py-0.5 text-super-small font-bold tracking-wider text-transit-color uppercase">
          {variant === "departure"
            ? "DEPARTURE"
            : variant === "arrival"
              ? "ARRIVAL"
              : "LAYOVER HUB"}
        </span>
      </div>

      {variant === "layover" ? (
        /* LAYOVER DISPLAY */
        <div className="my-3 flex items-center justify-between text-center">
          <div>
            <div className="text-lg font-extrabold tracking-wide text-text-primary">
              {sourceCode}
            </div>
            <div className="text-xs-dense font-semibold text-transit-color">
              {displaySourceLabel}
            </div>
          </div>
          <div className="relative flex flex-1 flex-col items-center overflow-hidden px-2">
            <div className="mb-0.5 text-xxs font-bold text-transit-color">
              {layoverDurationLabel}
            </div>
            <div className="h-0.5 w-full bg-transit-color/40" />
            <PlaneIcon />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-wide text-text-primary">
              {location.iata || "CONN"}
            </div>
            <div className="text-xs-dense font-semibold text-red-300">
              Connection
            </div>
          </div>
          <div className="relative flex flex-1 flex-col items-center overflow-hidden px-2">
            <div className="h-0.5 w-full bg-transit-color/40" />
            <PlaneIcon />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-wide text-text-primary">
              {destinationCode}
            </div>
            <div className="text-xs-dense font-semibold text-transit-color">
              {displayDestLabel}
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD FLOW DISPLAY */
        <div className="my-3 flex items-center justify-between text-center">
          <div>
            <div
              className={`text-lg font-extrabold tracking-wide ${variant === "departure" ? "text-text-primary" : "text-text-muted"}`}
            >
              {variant === "departure" ? location.iata || "SRC" : sourceCode}
            </div>
            <div
              className={`text-xs-dense font-semibold ${variant === "departure" ? "text-transit-color" : "text-text-muted"}`}
            >
              {displaySourceLabel}
            </div>
          </div>
          <div className="relative flex flex-1 flex-col items-center overflow-hidden px-2">
            <div className="h-0.5 w-full bg-transit-color/40" />
            <PlaneIcon />
          </div>
          <div>
            <div
              className={`text-lg font-extrabold tracking-wide ${variant === "arrival" ? "text-text-primary" : "text-text-muted"}`}
            >
              {variant === "arrival" ? location.iata || "DST" : destinationCode}
            </div>
            <div
              className={`text-xs-dense font-semibold ${variant === "arrival" ? "text-transit-color" : "text-text-muted"}`}
            >
              {displayDestLabel}
            </div>
          </div>
        </div>
      )}

      <div className="my-3 border-t border-dashed border-border-color" />

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs-dense text-text-secondary">
          <CoordinatesIcon />
          <span>
            {location.coordinates.lat.toFixed(4)}° N,{" "}
            {location.coordinates.lng.toFixed(4)}°{" "}
            {location.coordinates.lng >= 0 ? "E" : "W"}
          </span>
        </div>

        {footerBadgeText && (
          <span
            className={`rounded px-1.5 py-0.5 text-xs-dense font-bold ${variant === "layover" ? "bg-red-500/10 text-red-400" : "bg-transit-color/10 text-transit-color"}`}
          >
            {footerBadgeText}
          </span>
        )}
      </div>
    </div>
  );
};
