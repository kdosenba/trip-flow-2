import React from "react";
import { CityHub } from "../../types/schema";
import { CoordinatesIcon } from "./icons";
import { STYLE_TOKENS } from "../../lib/style-guide";

interface CityHubCardProps {
  cityHub: CityHub;
  timelineItems?: Array<{ label: string; subLabel: string }>;
  isActive?: boolean;
  onClick?: () => void;
}

export const CityHubCard: React.FC<CityHubCardProps> = ({
  cityHub,
  timelineItems = [],
  isActive = false,
  onClick,
}) => {
  return (
    <div 
      className={`tf-card ${isActive ? "active" : ""}`}
      style={{ 
        "--accent-color": STYLE_TOKENS.colors.hub,
        "--accent-glow": STYLE_TOKENS.glows.hub,
        "--accent-border-hover": "rgba(168, 85, 247, 0.4)"
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-name">{cityHub.cityName}</h3>
          <span className="card-subtitle">
            {cityHub.region ? `${cityHub.region}, ` : ""}{cityHub.country}
          </span>
        </div>
        <span className="badge badge-hub">City Hub</span>
      </div>

      <div className="card-details">
        <div className="detail-row">
          <CoordinatesIcon />
          <span>
            {cityHub.coordinates.lat.toFixed(4)}° N, {cityHub.coordinates.lng.toFixed(4)}° E
          </span>
        </div>
        
        {timelineItems.length > 0 && (
          <>
            <div className="detail-row" style={{ marginTop: "0.25rem" }}>
              <strong>Itinerary Schedule</strong>
            </div>
            <div className="hub-itinerary-timeline">
              {timelineItems.map((item, idx) => (
                <div key={idx} className="timeline-item">
                  <span className="timeline-dot" />
                  <span>{item.label}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    {item.subLabel}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card-footer">
        <div className="price-display">
          <span className="price-label">Activity Count</span>
          <span className="price-value">{cityHub.itinerary.length} Events</span>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "4px 8px", borderRadius: "4px" }}>
          Arrival via {cityHub.arrivalNodeId ? "CDG" : "None"}
        </span>
      </div>
    </div>
  );
};
