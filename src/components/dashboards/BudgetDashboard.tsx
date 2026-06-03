import React, { useState } from "react";
import { Budget, BudgetSchema } from "../../types/schema";
import { DollarSign, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

interface BudgetDashboardProps {
  data: Budget;
  onUpdate: (data: Budget) => void;
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  data,
  onUpdate,
}) => {
  // Local form states
  const [minBudget, setMinBudget] = useState(data.budget.min ?? 1000);
  const [maxBudget, setMaxBudget] = useState(data.budget.max ?? 5000);
  const [lowEstimate, setLowEstimate] = useState(data.estimate.low ?? 1500);
  const [highEstimate, setHighEstimate] = useState(data.estimate.high ?? 4000);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate and submit changes to parent
  const handleApplyChanges = (
    minVal: number,
    maxVal: number,
    lowVal: number,
    highVal: number
  ) => {
    setValidationError(null);

    const payload = {
      budget: {
        min: Number(minVal),
        max: Number(maxVal),
      },
      estimate: {
        low: Number(lowVal),
        high: Number(highVal),
      },
    };

    // Parse with BudgetSchema
    try {
      const parsed = BudgetSchema.parse(payload);
      onUpdate(parsed);
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setValidationError(err.errors[0].message);
      } else {
        setValidationError(err.message);
      }
    }
  };

  // Budget status evaluation logic
  let budgetStatus: "safe" | "warning" | "danger" = "safe";
  let statusText = "Under Budget";
  let statusIcon = <CheckCircle size={14} style={{ color: "var(--budget-safe-color)" }} />;
  let meterPercentage = 0;

  if (maxBudget > 0) {
    if (highEstimate <= maxBudget) {
      budgetStatus = "safe";
      statusText = "Under Budget (Safe)";
      statusIcon = <CheckCircle size={14} style={{ color: "var(--budget-safe-color)" }} />;
      meterPercentage = (highEstimate / maxBudget) * 100;
    } else if (lowEstimate < maxBudget && highEstimate > maxBudget) {
      budgetStatus = "warning";
      statusText = "Nearing Limit (Warning)";
      statusIcon = <AlertTriangle size={14} style={{ color: "var(--budget-warn-color)" }} />;
      meterPercentage = 95;
    } else {
      budgetStatus = "danger";
      statusText = "Over Budget (Critical)";
      statusIcon = <ShieldAlert size={14} style={{ color: "var(--budget-danger-color)" }} />;
      meterPercentage = 100;
    }
  }

  // Cap percentage at 100
  meterPercentage = Math.min(100, Math.max(0, meterPercentage));

  // Determine meter styling based on status
  const getMeterColor = () => {
    switch (budgetStatus) {
      case "safe": return "var(--budget-safe-color)";
      case "warning": return "var(--budget-warn-color)";
      case "danger": return "var(--budget-danger-color)";
    }
  };

  const getMeterGlow = () => {
    switch (budgetStatus) {
      case "safe": return "var(--budget-safe-glow)";
      case "warning": return "var(--budget-warn-glow)";
      case "danger": return "var(--budget-danger-glow)";
    }
  };

  return (
    <div className={`dashboard-widget budget-dashboard status-${budgetStatus}`}>
      <div className="widget-header">
        <div className="widget-title-group">
          <DollarSign className="widget-icon" size={18} style={{ color: "var(--suggest-color)" }} />
          <h3 className="widget-title">Budget Optimizer</h3>
        </div>
        <span className="widget-badge badge-budget">Sidebar Widget</span>
      </div>

      <p className="widget-desc">Monitor trip estimations against financial caps in real-time.</p>

      {/* Constraints inputs */}
      <div className="input-row">
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">Min Budget Target</label>
          <input 
            type="number" 
            className="widget-input"
            value={minBudget} 
            min="0"
            onChange={(e) => {
              const val = Number(e.target.value);
              setMinBudget(val);
              handleApplyChanges(val, maxBudget, lowEstimate, highEstimate);
            }}
          />
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">Max Budget Cap</label>
          <input 
            type="number" 
            className="widget-input"
            value={maxBudget} 
            min="0"
            onChange={(e) => {
              const val = Number(e.target.value);
              setMaxBudget(val);
              handleApplyChanges(minBudget, val, lowEstimate, highEstimate);
            }}
          />
        </div>
      </div>

      {/* Estimates inputs */}
      <div className="widget-divider" style={{ margin: "1rem 0" }} />
      <h4 className="widget-section-title">Cost Estimate Projections</h4>

      <div className="input-row">
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">Low Estimate</label>
          <input 
            type="number" 
            className="widget-input"
            value={lowEstimate} 
            min="0"
            onChange={(e) => {
              const val = Number(e.target.value);
              setLowEstimate(val);
              handleApplyChanges(minBudget, maxBudget, val, highEstimate);
            }}
          />
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">High Estimate</label>
          <input 
            type="number" 
            className="widget-input"
            value={highEstimate} 
            min="0"
            onChange={(e) => {
              const val = Number(e.target.value);
              setHighEstimate(val);
              handleApplyChanges(minBudget, maxBudget, lowEstimate, val);
            }}
          />
        </div>
      </div>

      {/* Health Meter Visualization */}
      <div className="budget-meter-container" style={{ marginTop: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.3rem" }}>
          <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {statusIcon} {statusText}
          </span>
          <span style={{ fontWeight: "bold" }}>
            ${highEstimate} / ${maxBudget}
          </span>
        </div>
        
        {/* Visual Progress Bar */}
        <div className="progress-bar-bg" style={{ 
          height: "8px", 
          background: "rgba(255,255,255,0.05)", 
          borderRadius: "4px", 
          overflow: "hidden", 
          position: "relative",
          border: "1px solid rgba(255,255,255,0.03)"
        }}>
          <div className="progress-bar-fill" style={{
            height: "100%",
            width: `${meterPercentage}%`,
            backgroundColor: getMeterColor(),
            boxShadow: `0 0 10px ${getMeterGlow()}`,
            transition: "var(--transition-smooth)"
          }} />
        </div>

        {/* Estimate Range brackets indicator */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          fontSize: "0.7rem", 
          color: "var(--text-muted)", 
          marginTop: "0.25rem" 
        }}>
          <span>Min target: ${minBudget}</span>
          <span>Max cap: ${maxBudget}</span>
        </div>
      </div>

      {/* Real-time Validation Error Banner */}
      {validationError ? (
        <div className="widget-error" style={{ marginTop: "1rem" }}>
          <AlertTriangle size={14} className="error-icon" />
          <span>{validationError}</span>
        </div>
      ) : (
        <div className="widget-success" style={{ marginTop: "1rem" }}>
          <span className="success-dot" />
          <span>Validated (Zod OK)</span>
        </div>
      )}
    </div>
  );
};
