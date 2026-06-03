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
  const displaySourceLabel = sourceLabel !== undefined
    ? sourceLabel
    : (startTime
        ? `${DateTimeFormatter.format(startTime, timezone, { hour: "2-digit", minute: "2-digit", hour12: false })} Dep`
        : "Source");

  const displayDestLabel = destinationLabel !== undefined
    ? destinationLabel
    : (endTime
        ? `${DateTimeFormatter.format(endTime, timezone, { hour: "2-digit", minute: "2-digit", hour12: false })} Arr`
        : "Dest.");

  return (
    <div 
      className={`tf-card transit-ticket ${isActive ? "active" : ""}`}
      style={{ "--accent-glow": STYLE_TOKENS.glows.transit } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="ticket-notch-left" />
      <div className="ticket-notch-right" />
      
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-name" style={{ fontSize: "1.1rem" }}>{location.name}</h3>
          <span className="card-subtitle">{location.address}</span>
        </div>
        <span className="badge badge-transit-point">
          {variant === "departure" ? "DEPARTURE" : variant === "arrival" ? "ARRIVAL" : "LAYOVER HUB"}
        </span>
      </div>

      {variant === "layover" ? (
        /* LAYOVER DISPLAY */
        <div className="transit-flow-display">
          <div>
            <div className="transit-node-code" style={{ fontSize: "1.2rem" }}>{sourceCode}</div>
            <div className="transit-node-time">{displaySourceLabel}</div>
          </div>
          <div className="transit-line-path">
            <div style={{ fontSize: "0.75rem", color: "var(--transit-color)", fontWeight: "bold", marginBottom: "2px" }}>
              {layoverDurationLabel}
            </div>
            <div className="transit-line" />
            <PlaneIcon />
          </div>
          <div>
            <div className="transit-node-code" style={{ fontSize: "1.2rem" }}>{location.iata || "CONN"}</div>
            <div className="transit-node-time" style={{ color: "#fca5a5" }}>Connection</div>
          </div>
          <div className="transit-line-path">
            <div className="transit-line" />
            <PlaneIcon />
          </div>
          <div>
            <div className="transit-node-code" style={{ fontSize: "1.2rem" }}>{destinationCode}</div>
            <div className="transit-node-time">{displayDestLabel}</div>
          </div>
        </div>
      ) : (
        /* STANDARD FLOW DISPLAY */
        <div className="transit-flow-display">
          <div>
            <div className="transit-node-code" style={{ color: variant === "departure" ? "var(--text-primary)" : "var(--text-muted)" }}>
              {variant === "departure" ? (location.iata || "SRC") : sourceCode}
            </div>
            <div className="transit-node-time" style={{ color: variant === "departure" ? "var(--transit-color)" : "var(--text-muted)" }}>
              {displaySourceLabel}
            </div>
          </div>
          <div className="transit-line-path">
            <div className="transit-line" />
            <PlaneIcon />
          </div>
          <div>
            <div className="transit-node-code" style={{ color: variant === "arrival" ? "var(--text-primary)" : "var(--text-muted)" }}>
              {variant === "arrival" ? (location.iata || "DST") : destinationCode}
            </div>
            <div className="transit-node-time" style={{ color: variant === "arrival" ? "var(--transit-color)" : "var(--text-muted)" }}>
              {displayDestLabel}
            </div>
          </div>
        </div>
      )}

      <div className="ticket-divider" />

      <div className="card-footer" style={{ border: "none", padding: "0" }}>
        <div className="detail-row">
          <CoordinatesIcon />
          <span style={{ fontSize: "0.8rem" }}>
            {location.coordinates.lat.toFixed(4)}° N, {location.coordinates.lng.toFixed(4)}° {location.coordinates.lng >= 0 ? "E" : "W"}
          </span>
        </div>
        
        {footerBadgeText && (
          <span style={{ 
            fontSize: "0.75rem", 
            background: variant === "layover" ? "rgba(248, 113, 113, 0.1)" : "rgba(59, 130, 246, 0.1)", 
            color: variant === "layover" ? "#f87171" : "var(--transit-color)", 
            padding: "2px 6px", 
            borderRadius: "4px", 
            fontWeight: "bold" 
          }}>
            {footerBadgeText}
          </span>
        )}
      </div>
    </div>
  );
};
