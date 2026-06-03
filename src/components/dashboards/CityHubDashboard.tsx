import React from "react";
import { CityHub } from "../../types/schema";
import { MapPin, Users, Calendar, Compass, Navigation } from "lucide-react";

interface CityHubDashboardProps {
  cityHub: CityHub;
  timelineItems?: Array<{ label: string; subLabel: string; cost?: number }>;
  onTravelerCountChange: (count: number) => void;
}

export const CityHubDashboard: React.FC<CityHubDashboardProps> = ({
  cityHub,
  timelineItems = [],
  onTravelerCountChange,
}) => {
  return (
    <div className="dashboard-widget hub-dashboard" style={{ maxWidth: "220px" }}>
      <div className="widget-header">
        <div className="widget-title-group">
          <Navigation className="widget-icon" size={18} style={{ color: "var(--hub-color)" }} />
          <h3 className="widget-title">Hub Details</h3>
        </div>
        <span className="widget-badge badge-hub">Sidebar Widget</span>
      </div>

      <p className="widget-desc">Detailed itinerary view for destination city.</p>

      {/* City Hub Title */}
      <div style={{ marginBottom: "1rem" }}>
        <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{cityHub.cityName}</h4>
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{cityHub.country}</span>
      </div>

      {/* Details list */}
      <div className="card-details" style={{ fontSize: "0.8rem", gap: "0.4rem" }}>
        <div className="detail-row" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <MapPin size={12} style={{ color: "var(--text-muted)" }} />
          <span>{cityHub.coordinates.lat.toFixed(4)}°, {cityHub.coordinates.lng.toFixed(4)}°</span>
        </div>
        
        <div className="detail-row" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Users size={12} style={{ color: "var(--text-muted)" }} />
          <span>{cityHub.travelerCount} Traveler{cityHub.travelerCount > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Traveler Count Incrementor */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem" }}>
        <span className="input-label" style={{ fontSize: "0.65rem" }}>Traveler count</span>
        <div className="traveler-control" style={{ padding: "2px 6px" }}>
          <button 
            className="traveler-btn" 
            style={{ width: "20px", height: "20px", fontSize: "0.8rem" }}
            onClick={() => onTravelerCountChange(Math.max(1, cityHub.travelerCount - 1))}
          >
            -
          </button>
          <span className="traveler-count" style={{ fontSize: "0.8rem", minWidth: "12px" }}>
            {cityHub.travelerCount}
          </span>
          <button 
            className="traveler-btn" 
            style={{ width: "20px", height: "20px", fontSize: "0.8rem" }}
            onClick={() => onTravelerCountChange(cityHub.travelerCount + 1)}
          >
            +
          </button>
        </div>
      </div>

      {/* Itinerary Details list */}
      {timelineItems.length > 0 && (
        <>
          <div className="widget-divider" style={{ margin: "1rem 0" }} />
          <h4 className="widget-section-title" style={{ fontSize: "0.8rem", margin: "0 0 0.5rem 0" }}>
            <Calendar size={12} style={{ color: "var(--event-color)", marginRight: "4px" }} /> 
            ITINERARY DETAILS
          </h4>
          <div className="hub-itinerary-timeline" style={{ fontSize: "0.75rem", paddingLeft: "0.5rem" }}>
            {timelineItems.map((item, idx) => (
              <div key={idx} className="timeline-item" style={{ marginBottom: "0.5rem" }}>
                <span className="timeline-dot" style={{ left: "-12px", width: "6px", height: "6px", top: "5px" }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{item.subLabel}</span>
                </div>
                {item.cost !== undefined && (
                  <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--text-primary)" }}>
                    ${item.cost}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Connective nodes */}
      <div className="widget-divider" style={{ margin: "1rem 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <Compass size={10} /> Arrival: {cityHub.arrivalNodeId ? "CDG" : "None"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <Compass size={10} /> Departure: {cityHub.departureNodeId ? "CDG" : "None"}
        </span>
      </div>
    </div>
  );
};
