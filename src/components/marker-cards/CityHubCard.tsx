import React from "react";
import { CityHub } from "../../types/schema";
import { Trash2 } from "lucide-react";
import { DateTimeFormatter } from "../../lib/utils/date";

interface CityHubCardProps {
  cityHub: CityHub;
  isActive?: boolean | undefined;
  onClick?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
}

export const CityHubCard: React.FC<CityHubCardProps> = ({
  cityHub,
  isActive = false,
  onClick,
  onDelete,
}) => {
  // Calculate date range and days count dynamically from itinerary
  const getItineraryRangeAndDuration = () => {
    if (!cityHub.itinerary || cityHub.itinerary.length === 0) {
      return { rangeLabel: "FLEXIBLE", days: 1 };
    }
    
    try {
      let minStart = Infinity;
      let maxEnd = -Infinity;
      
      cityHub.itinerary.forEach((item) => {
        const s = new Date(item.startTime).getTime();
        minStart = Math.min(minStart, s);
        if (item.endTime) {
          const e = new Date(item.endTime).getTime();
          maxEnd = Math.max(maxEnd, e);
        } else {
          maxEnd = Math.max(maxEnd, s);
        }
      });
      
      const rangeLabel = DateTimeFormatter.formatRange(
        new Date(minStart).toISOString(),
        new Date(maxEnd).toISOString(),
        cityHub.timezone
      );
      
      const diffTime = Math.abs(maxEnd - minStart);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      return { rangeLabel, days };
    } catch {
      return { rangeLabel: "JUN 10 - JUN 15", days: 6 };
    }
  };

  const { rangeLabel, days } = getItineraryRangeAndDuration();

  return (
    <div 
      className={`hub-pill-card ${isActive ? "active" : ""}`}
      style={{ maxWidth: "200px" }}
      onClick={onClick}
    >
      {/* Left duration badge */}
      <div className="hub-pill-badge">
        <span className="hub-pill-badge-num">{days}</span>
        <span className="hub-pill-badge-lbl">{days > 1 ? "DAYS" : "DAY"}</span>
      </div>

      {/* Middle city & schedule info */}
      <div className="hub-pill-info">
        <h4 className="hub-pill-name">{cityHub.cityName}</h4>
        <span className="hub-pill-dates">{rangeLabel}</span>
      </div>

      {/* Right delete/trash icon */}
      {onDelete && (
        <button 
          className="hub-pill-delete"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Remove Hub"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};
