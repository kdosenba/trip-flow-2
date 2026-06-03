import React from "react";
import { CityHub } from "../../types/schema";
import { UsersIcon, UserIcon, HomeIcon } from "./icons";
import { STYLE_TOKENS } from "../../lib/style-guide";
import { useTripFlowStore } from "../../store";
import { DateTimeFormatter } from "../../lib/utils/date";

interface OriginCityCardProps {
  originCity: CityHub;
  isActive?: boolean | undefined;
  onClick?: (() => void) | undefined;
}

export const OriginCityCard: React.FC<OriginCityCardProps> = ({
  originCity,
  isActive = false,
  onClick,
}) => {
  const graph = useTripFlowStore((state) => state.graph);
  const updateTravelerCount = useTripFlowStore((state) => state.updateTravelerCount);

  if (!graph) return null;

  const travelerCount = originCity.travelerCount;

  // Find departure transit edge (outgoing from origin hub)
  const departingTransit = Object.values(graph.Transits).find(
    (t) => t.fromCityId === originCity.id
  );
  const firstSegment = departingTransit?.segments[0];
  const departureTime = firstSegment?.startTime;
  const departureLoc = firstSegment ? graph.Locations[firstSegment.fromLocationId] : undefined;
  const departureIata = departureLoc?.iata ? `${departureLoc.iata} ` : "";

  // Find return transit edge (returning to origin hub)
  const returningTransit = Object.values(graph.Transits).find(
    (t) => t.toCityId === originCity.id
  );
  const returningSegments = returningTransit?.segments;
  const lastSegment = returningSegments && returningSegments.length > 0
    ? returningSegments[returningSegments.length - 1]
    : undefined;
  const returnTime = lastSegment?.endTime;
  const returnLoc = lastSegment ? graph.Locations[lastSegment.toLocationId] : undefined;
  const returnIata = returnLoc?.iata ? `${returnLoc.iata} ` : "";

  return (
    <div
      className={`tf-card ${isActive ? "active" : ""}`}
      style={{
        "--accent-color": STYLE_TOKENS.colors.origin,
        "--accent-glow": STYLE_TOKENS.glows.origin,
        "--accent-border-hover": "rgba(139, 92, 246, 0.4)",
        minHeight: "unset", // Let it resize dynamically based on content density
        width: "fit-content",
        maxWidth: "200px",
        padding: "0.4rem 0.6rem",
        gap: "0.2rem",
        display: "inline-flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      } as React.CSSProperties}
      onClick={onClick}
    >
      {/* Title section with Home icon & City Name */}
      <div className="card-header" style={{ marginBottom: 0, display: "flex", gap: "0.35rem", alignItems: "center", borderBottom: "none", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--origin-color)", flexShrink: 0 }}>
          <HomeIcon />
        </div>
        <div className="card-title-group" style={{ flexGrow: 1, minWidth: 0 }}>
          <h3 className="card-name" style={{ fontSize: "0.95rem", margin: 0, fontWeight: 700, whiteSpace: "normal" }}>{originCity.cityName}</h3>
        </div>
      </div>

      {/* Details pane (Inline traveler controls & Dates) */}
      <div className="card-details" style={{ margin: 0, gap: "0.2rem" }}>
        {/* Travelers Inline Row */}
        <div className="detail-row" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          {travelerCount > 1 ? <UsersIcon /> : <UserIcon />}
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>traveler{travelerCount > 1 ? "s" : ""}</span>
          <div className="traveler-control" onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "1px 4px", background: "rgba(0, 0, 0, 0.3)" }}>
            <button
              className="traveler-btn"
              style={{ width: "16px", height: "16px", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => updateTravelerCount(originCity.id, Math.max(1, travelerCount - 1))}
              title="Decrease Travelers"
            >
              -
            </button>
            <span className="traveler-count" style={{ fontSize: "0.75rem", minWidth: "10px", textAlign: "center" }}>{travelerCount}</span>
            <button
              className="traveler-btn"
              style={{ width: "16px", height: "16px", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => updateTravelerCount(originCity.id, travelerCount + 1)}
              title="Increase Travelers"
            >
              +
            </button>
          </div>
        </div>

        {/* Departure Details (Only if specified) */}
        {departureTime && (
          <div className="detail-row" style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }}>
            <span style={{ fontWeight: 700, color: "var(--origin-color)", minWidth: "48px" }}>Depart:</span>
            <span style={{ color: "var(--text-primary)" }}>
              {departureIata}{DateTimeFormatter.format(departureTime, originCity.timezone)}
            </span>
          </div>
        )}

        {/* Return/Arrival Details (Only if specified) */}
        {returnTime && (
          <div className="detail-row" style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }}>
            <span style={{ fontWeight: 700, color: "var(--origin-color)", minWidth: "48px" }}>Return:</span>
            <span style={{ color: "var(--text-primary)" }}>
              {returnIata}{DateTimeFormatter.format(returnTime, originCity.timezone)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
