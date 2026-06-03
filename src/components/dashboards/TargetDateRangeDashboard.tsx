import React, { useState } from "react";
import { TargetDateRange, TargetDateRangeSchema } from "../../types/schema";
import { Calendar, Clock, AlertTriangle, FileText } from "lucide-react";

interface TargetDateRangeDashboardProps {
  data: TargetDateRange;
  onUpdate: (data: TargetDateRange) => void;
}

export const TargetDateRangeDashboard: React.FC<TargetDateRangeDashboardProps> = ({
  data,
  onUpdate,
}) => {
  // Local states to handle input forms
  const isRangeModeInitial = "range" in data.target;
  const [isRangeMode, setIsRangeMode] = useState(isRangeModeInitial);
  
  const targetDateInitial = !isRangeModeInitial && "date" in data.target ? data.target.date : "2026-06-10";
  const targetStartInitial = isRangeModeInitial && "range" in data.target ? data.target.range.start : "2026-06-10";
  const targetEndInitial = isRangeModeInitial && "range" in data.target ? data.target.range.end : "2026-06-15";
  
  const [targetDate, setTargetDate] = useState(targetDateInitial);
  const [targetStart, setTargetStart] = useState(targetStartInitial);
  const [targetEnd, setTargetEnd] = useState(targetEndInitial);
  
  const [context, setContext] = useState(data.context || "");
  const [actualStart, setActualStart] = useState(data.actual?.start || "");
  const [actualEnd, setActualEnd] = useState(data.actual?.end || "");

  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate and submit changes to parent
  const handleApplyChanges = (
    newRangeMode: boolean,
    tDate: string,
    tStart: string,
    tEnd: string,
    ctx: string,
    actStart: string,
    actEnd: string
  ) => {
    setValidationError(null);

    // Build the payload structure
    const updatedTarget = newRangeMode
      ? { range: { start: tStart, end: tEnd } }
      : { date: tDate };

    const payload: any = {
      target: updatedTarget,
      context: ctx || undefined,
    };

    if (actStart || actEnd) {
      payload.actual = {
        start: actStart || undefined,
        end: actEnd || undefined,
      };
    }

    // Validate using Zod TargetDateRangeSchema
    try {
      const parsed = TargetDateRangeSchema.parse(payload);
      onUpdate(parsed);
    } catch (err: any) {
      // Extract nice messages from Zod Error
      if (err.errors && err.errors.length > 0) {
        setValidationError(err.errors[0].message);
      } else {
        setValidationError(err.message);
      }
    }
  };

  return (
    <div className="dashboard-widget date-dashboard">
      <div className="widget-header">
        <div className="widget-title-group">
          <Calendar className="widget-icon" size={18} style={{ color: "var(--origin-color)" }} />
          <h3 className="widget-title">Target Date Controller</h3>
        </div>
        <span className="widget-badge badge-date">Sidebar Widget</span>
      </div>

      <p className="widget-desc">Configure travel schedules, seasonal boundaries, and layover offsets.</p>

      {/* Mode Selector */}
      <div className="input-group">
        <label className="input-label">Date Selection Mode</label>
        <div className="toggle-container">
          <button 
            type="button"
            className={`toggle-btn ${!isRangeMode ? "active" : ""}`}
            onClick={() => {
              setIsRangeMode(false);
              handleApplyChanges(false, targetDate, targetStart, targetEnd, context, actualStart, actualEnd);
            }}
          >
            Single Date
          </button>
          <button 
            type="button"
            className={`toggle-btn ${isRangeMode ? "active" : ""}`}
            onClick={() => {
              setIsRangeMode(true);
              handleApplyChanges(true, targetDate, targetStart, targetEnd, context, actualStart, actualEnd);
            }}
          >
            Date Range
          </button>
        </div>
      </div>

      {/* Target Date Inputs */}
      {isRangeMode ? (
        <div className="input-row">
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Target Start Date</label>
            <input 
              type="date" 
              className="widget-input"
              value={targetStart} 
              onChange={(e) => {
                setTargetStart(e.target.value);
                handleApplyChanges(isRangeMode, targetDate, e.target.value, targetEnd, context, actualStart, actualEnd);
              }}
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Target End Date</label>
            <input 
              type="date" 
              className="widget-input"
              value={targetEnd} 
              onChange={(e) => {
                setTargetEnd(e.target.value);
                handleApplyChanges(isRangeMode, targetDate, targetStart, e.target.value, context, actualStart, actualEnd);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="input-group">
          <label className="input-label">Target Departure Date</label>
          <input 
            type="date" 
            className="widget-input"
            value={targetDate} 
            onChange={(e) => {
              setTargetDate(e.target.value);
              handleApplyChanges(isRangeMode, e.target.value, targetStart, targetEnd, context, actualStart, actualEnd);
            }}
          />
        </div>
      )}

      {/* Actual Dates Compare */}
      <div className="widget-divider" />
      <h4 className="widget-section-title">
        <Clock size={14} style={{ color: "var(--transit-color)" }} /> Actual Itinerary Boundaries
      </h4>
      <p className="widget-sec-desc">Calculated automatically from planned lodging and transits.</p>

      <div className="input-row">
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">Actual Start</label>
          <input 
            type="date" 
            className="widget-input"
            value={actualStart} 
            placeholder="Not started"
            onChange={(e) => {
              setActualStart(e.target.value);
              handleApplyChanges(isRangeMode, targetDate, targetStart, targetEnd, context, e.target.value, actualEnd);
            }}
          />
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">Actual End</label>
          <input 
            type="date" 
            className="widget-input"
            value={actualEnd} 
            placeholder="Not finished"
            onChange={(e) => {
              setActualEnd(e.target.value);
              handleApplyChanges(isRangeMode, targetDate, targetStart, targetEnd, context, actualStart, e.target.value);
            }}
          />
        </div>
      </div>

      {/* Context / Notes */}
      <div className="input-group" style={{ marginTop: "1rem" }}>
        <label className="input-label">Seasonal Context / Travel Note</label>
        <div className="textarea-container">
          <FileText className="textarea-icon" size={14} />
          <textarea 
            className="widget-textarea" 
            value={context} 
            placeholder="e.g. Summer holiday season in Paris. Warm weather, high crowds."
            onChange={(e) => {
              setContext(e.target.value);
              handleApplyChanges(isRangeMode, targetDate, targetStart, targetEnd, e.target.value, actualStart, actualEnd);
            }}
          />
        </div>
      </div>

      {/* Real-time Zod Validation Feedback */}
      {validationError ? (
        <div className="widget-error">
          <AlertTriangle size={14} className="error-icon" />
          <span>{validationError}</span>
        </div>
      ) : (
        <div className="widget-success">
          <span className="success-dot" />
          <span>Validated (Zod OK)</span>
        </div>
      )}
    </div>
  );
};
