import React from "react";
import { Location } from "../../types/schema";
import { AddressIcon, CalendarIcon } from "./icons";
import { STYLE_TOKENS } from "../../lib/style-guide";

interface ItineraryEventCardProps {
  eventLocation: Location;
  timeLabel: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const ItineraryEventCard: React.FC<ItineraryEventCardProps> = ({
  eventLocation,
  timeLabel,
  isActive = false,
  onClick,
}) => {
  // Determine dynamic styles and labels based on category
  let accentColor: string = STYLE_TOKENS.colors.event;
  let accentGlow: string = STYLE_TOKENS.glows.event;
  let accentBorderHover: string = STYLE_TOKENS.colors.borderHover;
  let badgeClass = "";
  let badgeLabel = eventLocation.category.toString();
  let priceLabel = "Price";
  let showSaving = false;

  switch (eventLocation.category) {
    case "LODGING":
      accentColor = STYLE_TOKENS.colors.hub;
      accentGlow = "rgba(168, 85, 247, 0.1)";
      accentBorderHover = "rgba(168, 85, 247, 0.3)";
      badgeClass = "badge-lodging";
      badgeLabel = "Lodging";
      priceLabel = "Price / Night";
      break;
    case "ACTIVITY":
      accentColor = STYLE_TOKENS.colors.budgetSafe;
      accentGlow = STYLE_TOKENS.glows.budgetSafe;
      accentBorderHover = "rgba(16, 185, 129, 0.3)";
      badgeClass = "badge-activity";
      badgeLabel = "Activity";
      priceLabel = "Cost";
      // Render a little dynamic saving tag if actual cost is less than typical
      if (eventLocation.price?.typicalCost && eventLocation.price?.actualCost) {
        showSaving = eventLocation.price.typicalCost > eventLocation.price.actualCost;
      }
      break;
    case "MEAL":
      accentColor = STYLE_TOKENS.colors.budgetWarn;
      accentGlow = STYLE_TOKENS.glows.budgetWarn;
      accentBorderHover = "rgba(249, 115, 22, 0.3)";
      badgeClass = "badge-meal";
      badgeLabel = "Meal";
      priceLabel = "Est. Cost / Person";
      break;
  }

  const savingsAmount = showSaving 
    ? (eventLocation.price!.typicalCost! - eventLocation.price!.actualCost!) 
    : 0;

  return (
    <div 
      className={`tf-card ${isActive ? "active" : ""}`}
      style={{ 
        "--accent-color": accentColor,
        "--accent-glow": accentGlow,
        "--accent-border-hover": accentBorderHover
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-name">{eventLocation.name}</h3>
          <span className="card-subtitle">{eventLocation.category} Booking</span>
        </div>
        <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
      </div>

      <div className="card-details">
        <div className="detail-row">
          <AddressIcon />
          <span style={{ fontSize: "0.8rem" }}>{eventLocation.address}</span>
        </div>
        <div className="detail-row">
          <CalendarIcon />
          <span>{timeLabel}</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="price-display">
          <span className="price-label">{priceLabel}</span>
          <span className="price-value">
            {eventLocation.price?.actualCost !== undefined 
              ? `$${eventLocation.price.actualCost} USD`
              : "Free"}
          </span>
        </div>
        
        {showSaving ? (
          <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "bold" }}>
            Saved ${savingsAmount}!
          </span>
        ) : (
          eventLocation.price?.typicalCost !== undefined && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Typical: ${eventLocation.price.typicalCost}
            </span>
          )
        )}
      </div>
    </div>
  );
};
