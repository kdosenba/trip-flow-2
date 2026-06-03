import React, { useState } from "react";
import { TargetDateRange, TargetDateRangeSchema } from "../../types/schema";
import { Clock, Calendar, Edit2, Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface TargetDateRangeDashboardProps {
  data: TargetDateRange;
  onUpdate: (data: TargetDateRange) => void;
}

export const TargetDateRangeDashboard: React.FC<TargetDateRangeDashboardProps> = ({
  data,
  onUpdate,
}) => {
  // Local edit states
  const [isEditing, setIsEditing] = useState(false);
  
  // Resolve target date values
  const isRangeModeInitial = "range" in data.target;
  const targetStartInitial = isRangeModeInitial && "range" in data.target ? data.target.range.start : "2026-06-10";
  const targetEndInitial = isRangeModeInitial && "range" in data.target ? data.target.range.end : "2026-06-18";
  const targetDateInitial = !isRangeModeInitial && "date" in data.target ? data.target.date : "2026-06-10";

  const [startInput, setStartInput] = useState(targetStartInitial);
  const [endInput, setEndInput] = useState(targetEndInitial);
  const [dateInput, setDateInput] = useState(targetDateInitial);
  const [isRange, setIsRange] = useState(isRangeModeInitial);
  const [contextInput, setContextInput] = useState(data.context || "");

  // Breakdown toggle state
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Format target display
  const getTargetDisplay = () => {
    if ("range" in data.target) {
      try {
        const start = new Date(data.target.range.start);
        const end = new Date(data.target.range.end);
        const formatOption = { month: "short", day: "numeric" } as const;
        return `${start.toLocaleDateString("en-US", formatOption)} - ${end.toLocaleDateString("en-US", formatOption)}`;
      } catch {
        return `${data.target.range.start} - ${data.target.range.end}`;
      }
    }
    if ("date" in data.target) {
      try {
        const d = new Date(data.target.date);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } catch {
        return data.target.date;
      }
    }
    return "Flexible";
  };

  // Format actual display
  const getActualDisplay = () => {
    if (!data.actual?.start) return "Flexible";
    try {
      const start = new Date(data.actual.start);
      const end = data.actual.end ? new Date(data.actual.end) : null;
      const formatOption = { month: "short", day: "numeric" } as const;
      
      if (end) {
        return `${start.toLocaleDateString("en-US", formatOption)} - ${end.toLocaleDateString("en-US", formatOption)}`;
      }
      return start.toLocaleDateString("en-US", formatOption);
    } catch {
      return data.actual.start;
    }
  };

  // Calculate actual duration in days
  const getActualDays = () => {
    if (!data.actual?.start || !data.actual?.end) return null;
    try {
      const s = new Date(data.actual.start).getTime();
      const e = new Date(data.actual.end).getTime();
      const diffTime = Math.abs(e - s);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      return diffDays;
    } catch {
      return null;
    }
  };

  // Save changes and validate
  const handleSave = () => {
    setValidationError(null);

    const targetPayload = isRange
      ? { range: { start: startInput, end: endInput } }
      : { date: dateInput };

    const payload = {
      target: targetPayload,
      context: contextInput || undefined,
      actual: data.actual // Actual remains unchanged (calculated by backend/store)
    };

    try {
      const parsed = TargetDateRangeSchema.parse(payload);
      onUpdate(parsed);
      setIsEditing(false);
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setValidationError(err.errors[0].message);
      } else {
        setValidationError(err.message);
      }
    }
  };

  const actualDays = getActualDays();

  return (
    <div className="dashboard-widget date-dashboard" style={{ maxWidth: "220px", padding: "1.25rem" }}>
      
      {/* TARGET ROW */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", position: "relative" }}>
        <div className="icon-circle" style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          <Clock size={16} style={{ color: "var(--text-primary)" }} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
            TARGET
          </div>
          
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", gap: "4px" }}>
                <button 
                  type="button" 
                  className={`toggle-btn ${isRange ? "active" : ""}`}
                  style={{ padding: "2px 4px", fontSize: "0.6rem" }}
                  onClick={() => setIsRange(true)}
                >
                  Range
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${!isRange ? "active" : ""}`}
                  style={{ padding: "2px 4px", fontSize: "0.6rem" }}
                  onClick={() => setIsRange(false)}
                >
                  Date
                </button>
              </div>
              
              {isRange ? (
                <div style={{ display: "flex", gap: "2px" }}>
                  <input 
                    type="date" 
                    className="widget-input" 
                    style={{ padding: "2px", fontSize: "0.7rem", height: "18px" }}
                    value={startInput}
                    onChange={(e) => setStartInput(e.target.value)}
                  />
                  <input 
                    type="date" 
                    className="widget-input" 
                    style={{ padding: "2px", fontSize: "0.7rem", height: "18px" }}
                    value={endInput}
                    onChange={(e) => setEndInput(e.target.value)}
                  />
                </div>
              ) : (
                <input 
                  type="date" 
                  className="widget-input" 
                  style={{ padding: "2px", fontSize: "0.7rem", height: "18px" }}
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                />
              )}
            </div>
          ) : (
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
              {getTargetDisplay()}
            </div>
          )}
        </div>

        {/* Edit Button */}
        <button 
          type="button"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "auto",
            transition: "var(--transition-smooth)"
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? (
            <Check size={14} style={{ color: "var(--budget-safe-color)" }} />
          ) : (
            <Edit2 size={12} className="edit-pencil-icon" />
          )}
        </button>
      </div>

      {/* Validation Error Feedback */}
      {validationError && (
        <div className="widget-error" style={{ fontSize: "0.7rem", padding: "4px 8px", marginTop: "0.5rem" }}>
          <AlertTriangle size={10} style={{ marginRight: "4px" }} />
          <span>{validationError}</span>
        </div>
      )}

      {/* DIVIDER */}
      <div className="widget-divider" style={{ margin: "1rem 0" }} />

      {/* ACTUAL ROW */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", position: "relative" }}>
        <div className="icon-circle" style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          <Calendar size={16} style={{ color: "var(--text-primary)" }} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
            ACTUAL
          </div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
            {getActualDisplay()}
          </div>
        </div>

        {/* Days count tag */}
        {actualDays !== null && (
          <span style={{
            fontSize: "0.65rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            background: "rgba(255,255,255,0.08)",
            padding: "2px 6px",
            borderRadius: "4px",
            marginLeft: "auto"
          }}>
            {actualDays} DAYS
          </span>
        )}
      </div>

      {/* EXPANDABLE BREAKDOWN SECTION */}
      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column" }}>
        <button
          type="button"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            fontSize: "0.7rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.25rem",
            padding: "4px 0",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            width: "100%",
            textAlign: "center"
          }}
          onClick={() => setShowBreakdown(!showBreakdown)}
        >
          {showBreakdown ? (
            <>
              Hide Breakdown <ChevronUp size={12} />
            </>
          ) : (
            <>
              View Details <ChevronDown size={12} />
            </>
          )}
        </button>

        {showBreakdown && (
          <div style={{ 
            marginTop: "0.75rem", 
            background: "rgba(0, 0, 0, 0.15)", 
            padding: "0.6rem", 
            borderRadius: "6px",
            fontSize: "0.7rem",
            color: "var(--text-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span className="input-label" style={{ fontSize: "0.6rem" }}>Edit travel context notes</span>
                <textarea 
                  className="widget-textarea"
                  style={{ minHeight: "45px", padding: "4px", fontSize: "0.7rem" }}
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  placeholder="Notes..."
                />
              </div>
            ) : (
              data.context && (
                <div style={{ lineHeight: "1.4" }}>
                  <strong>Context:</strong> {data.context}
                </div>
              )
            )}
            
            <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "0.4rem" }}>
              <strong>Date validation:</strong> actual schedule starts on {data.actual?.start || "TBD"} and ends on {data.actual?.end || "TBD"}.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
