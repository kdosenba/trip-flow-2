import React from "react";
import { CityHub } from "../../types/schema";
import { CoordinatesIcon, UsersIcon } from "./icons";
import { STYLE_TOKENS } from "../../lib/style-guide";

interface OriginCityCardProps {
  originCity: CityHub;
  travelerCount: number;
  onTravelerCountChange: (count: number) => void;
  isActive?: boolean | undefined;
  onClick?: (() => void) | undefined;
}

export const OriginCityCard: React.FC<OriginCityCardProps> = ({
  originCity,
  travelerCount,
  onTravelerCountChange,
  isActive = false,
  onClick,
}) => {
  return (
    <div 
      className={`tf-card ${isActive ? "active" : ""}`}
      style={{ 
        "--accent-color": STYLE_TOKENS.colors.origin,
        "--accent-glow": STYLE_TOKENS.glows.origin,
        "--accent-border-hover": "rgba(139, 92, 246, 0.4)"
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-name">{originCity.cityName}</h3>
          <span className="card-subtitle">
            {originCity.region ? `${originCity.region}, ` : ""}{originCity.country}
          </span>
        </div>
        <span className="badge badge-origin">Origin</span>
      </div>

      <div className="card-details">
        <div className="detail-row">
          <CoordinatesIcon />
          <span>
            {originCity.coordinates.lat.toFixed(4)}° N, {originCity.coordinates.lng.toFixed(4)}° W
          </span>
        </div>
        <div className="detail-row">
          <UsersIcon />
          <span>{travelerCount} traveler{travelerCount > 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="card-footer">
        <span className="price-label">Traveler Count</span>
        <div className="traveler-control" onClick={(e) => e.stopPropagation()}>
          <button 
            className="traveler-btn" 
            onClick={() => onTravelerCountChange(Math.max(1, travelerCount - 1))}
            title="Decrease Travelers"
          >
            -
          </button>
          <span className="traveler-count">{travelerCount}</span>
          <button 
            className="traveler-btn" 
            onClick={() => onTravelerCountChange(travelerCount + 1)}
            title="Increase Travelers"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
