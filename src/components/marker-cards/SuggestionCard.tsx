import React from "react";
import { Suggestion } from "../../types/schema";
import { AddressIcon, CalendarIcon, PlaneIcon } from "./icons";
import { STYLE_TOKENS } from "../../lib/style-guide";

interface SuggestionCardProps {
  suggestion: Suggestion;
  isAdded: boolean;
  onToggleAdd: () => void;
  isActive?: boolean;
  onClick?: () => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  isAdded,
  onToggleAdd,
  isActive = false,
  onClick,
}) => {
  const isLocation = suggestion.type === "LOCATION_SUGGESTION";
  
  // Format segment dates nicely
  const getSegmentTimeLabel = () => {
    if (!suggestion.suggestedSegments || !suggestion.suggestedSegments[0]) return "";
    const segment = suggestion.suggestedSegments[0];
    try {
      const start = new Date(segment.startTime);
      const end = new Date(segment.endTime);
      
      const dateStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const startStr = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      const endStr = end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      
      return `${dateStr}, ${startStr} - ${endStr}`;
    } catch {
      return "June 9, 22:30 - June 10, 11:45";
    }
  };

  return (
    <div 
      className={`tf-card suggest-card ${isActive ? "active" : ""}`}
      style={{ 
        "--accent-color": STYLE_TOKENS.colors.suggest,
        "--accent-glow": STYLE_TOKENS.glows.suggest,
        "--accent-border-hover": "rgba(234, 179, 8, 0.4)"
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-name">{suggestion.title}</h3>
          <span className="card-subtitle">
            {isLocation ? "Activity Recommendation" : "Transit Recommendation"}
          </span>
        </div>
        <span className="badge" style={{ color: "var(--suggest-color)", borderColor: "var(--suggest-color)" }}>
          AI Suggested
        </span>
      </div>

      <div className="card-details">
        <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
          {suggestion.description}
        </p>
        
        {isLocation ? (
          suggestion.suggestedLocation && (
            <div className="detail-row">
              <AddressIcon />
              <span style={{ fontSize: "0.8rem" }}>{suggestion.suggestedLocation.address}</span>
            </div>
          )
        ) : (
          suggestion.suggestedSegments && suggestion.suggestedSegments[0] && (
            <>
              <div className="detail-row">
                <PlaneIcon />
                <span>
                  {suggestion.suggestedSegments[0].transportMode} segment
                </span>
              </div>
              <div className="detail-row">
                <CalendarIcon />
                <span>{getSegmentTimeLabel()}</span>
              </div>
            </>
          )
        )}
      </div>

      <div className="card-footer">
        <div className="price-display">
          <span className="price-label">{isLocation ? "Price" : "Price Estimate"}</span>
          <span className="price-value" style={{ color: "var(--suggest-color)" }}>
            {suggestion.price?.actualCost !== undefined ? `$${suggestion.price.actualCost} USD` : "TBD"}
          </span>
        </div>
        <button 
          className="suggest-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleAdd();
          }}
        >
          {isAdded ? "Added ✓" : "+ Add to Trip"}
        </button>
      </div>
    </div>
  );
};
