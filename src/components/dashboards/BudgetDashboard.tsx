import React, { useState } from "react";
import { Budget, BudgetSchema } from "../../types/schema";
import { Wallet, TrendingUp, Edit2, Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface BudgetDashboardProps {
  data: Budget;
  onUpdate: (data: Budget) => void;
  // Breakdown elements mapping to current mock values
  breakdownItems?: Array<{ label: string; cost: number }>;
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  data,
  onUpdate,
  breakdownItems = [
    { label: "Hotel Ritz Paris", cost: 950 },
    { label: "Louvre Museum Tour", cost: 45 },
    { label: "Le Jules Verne Dinner", cost: 215 },
    { label: "Delta Flight JFK-CDG", cost: 680 },
    { label: "Heathrow Layover Fee", cost: 35 }
  ]
}) => {
  // Editing state toggles
  const [isEditing, setIsEditing] = useState(false);
  const [minInput, setMinInput] = useState(data.budget.min !== undefined ? data.budget.min.toString() : "");
  const [maxInput, setMaxInput] = useState(data.budget.max !== undefined ? data.budget.max.toString() : "");
  
  // Breakdown toggle state
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Format budget display
  const getBudgetDisplay = () => {
    const min = data.budget.min;
    const max = data.budget.max;
    if (min === undefined && max === undefined) return "Not Set";
    if (min !== undefined && max !== undefined) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (max !== undefined) return `Max $${max.toLocaleString()}`;
    if (min !== undefined) return `Min $${min.toLocaleString()}`;
    return "Not Set";
  };

  // Format estimate display
  const getEstimateDisplay = () => {
    const low = data.estimate.low;
    const high = data.estimate.high;
    if (low === undefined && high === undefined) return "$0";
    if (low !== undefined && high !== undefined) return `$${low.toLocaleString()} - $${high.toLocaleString()}`;
    if (low !== undefined) return `$${low.toLocaleString()}+`;
    return "$0";
  };

  // Save edit changes and validate
  const handleSave = () => {
    setValidationError(null);
    const parsedMin = minInput.trim() === "" ? undefined : Number(minInput);
    const parsedMax = maxInput.trim() === "" ? undefined : Number(maxInput);

    if (parsedMin !== undefined && isNaN(parsedMin)) {
      setValidationError("Min must be a number");
      return;
    }
    if (parsedMax !== undefined && isNaN(parsedMax)) {
      setValidationError("Max must be a number");
      return;
    }

    const payload = {
      budget: {
        min: parsedMin,
        max: parsedMax,
      },
      estimate: data.estimate // Estimate remains unchanged
    };

    try {
      const parsed = BudgetSchema.parse(payload);
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

  return (
    <div className="dashboard-widget budget-dashboard" style={{ maxWidth: "220px", padding: "1.25rem" }}>
      
      {/* BUDGET ROW */}
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
          <Wallet size={16} style={{ color: "var(--text-primary)" }} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
            BUDGET
          </div>
          
          {isEditing ? (
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }} onClick={(e) => e.stopPropagation()}>
              <input 
                type="text" 
                className="widget-input" 
                style={{ padding: "2px 4px", fontSize: "0.75rem", height: "20px" }}
                placeholder="Min"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
              />
              <input 
                type="text" 
                className="widget-input" 
                style={{ padding: "2px 4px", fontSize: "0.75rem", height: "20px" }}
                placeholder="Max"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
              />
            </div>
          ) : (
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
              {getBudgetDisplay()}
            </div>
          )}
        </div>

        {/* Edit/Save Trigger */}
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

      {/* Zod Validation Error Feedback (for budget inputs) */}
      {validationError && (
        <div className="widget-error" style={{ fontSize: "0.7rem", padding: "4px 8px", marginTop: "0.5rem" }}>
          <AlertTriangle size={10} style={{ marginRight: "4px" }} />
          <span>{validationError}</span>
        </div>
      )}

      {/* DIVIDER */}
      <div className="widget-divider" style={{ margin: "1rem 0" }} />

      {/* ESTIMATE ROW (Non-editable) */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
          <TrendingUp size={16} style={{ color: "var(--text-primary)" }} />
        </div>
        
        <div>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
            ESTIMATE
          </div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
            {getEstimateDisplay()}
          </div>
        </div>
      </div>

      {/* VIEW BREAKDOWN PANEL */}
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
              View Breakdown <ChevronDown size={12} />
            </>
          )}
        </button>

        {showBreakdown && (
          <div style={{ 
            marginTop: "0.75rem", 
            background: "rgba(0, 0, 0, 0.15)", 
            padding: "0.5rem", 
            borderRadius: "6px",
            fontSize: "0.7rem",
            color: "var(--text-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem"
          }}>
            {breakdownItems.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.label}</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>${item.cost}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "0.4rem", marginTop: "0.2rem", display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--text-primary)" }}>
              <span>Total Projected</span>
              <span>${breakdownItems.reduce((acc, curr) => acc + curr.cost, 0)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
