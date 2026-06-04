import React, { useState, useEffect } from "react";
import { Budget, BudgetSchema } from "../../types/schema";
import {
  Wallet,
  TrendingUp,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { useTripFlowStore } from "../../store";

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
    { label: "Heathrow Layover Fee", cost: 35 },
  ],
}) => {
  const isPlanning = useTripFlowStore((state) => state.isPlanning);

  // Editing state toggles
  const [isEditing, setIsEditing] = useState(false);
  const [minInput, setMinInput] = useState(
    data.budget.min !== undefined ? data.budget.min.toString() : "",
  );
  const [maxInput, setMaxInput] = useState(
    data.budget.max !== undefined ? data.budget.max.toString() : "",
  );

  // Auto-close edit mode when planning starts
  useEffect(() => {
    if (isPlanning) {
      setIsEditing(false);
    }
  }, [isPlanning]);

  // Breakdown toggle state
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Format budget display
  const getBudgetDisplay = () => {
    const min = data.budget.min;
    const max = data.budget.max;
    if (min === undefined && max === undefined) return "Not Set";
    if (min !== undefined && max !== undefined)
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (max !== undefined) return `Max $${max.toLocaleString()}`;
    if (min !== undefined) return `Min $${min.toLocaleString()}`;
    return "Not Set";
  };

  // Format estimate display
  const getEstimateDisplay = () => {
    const low = data.estimate.low;
    const high = data.estimate.high;
    if (low === undefined && high === undefined) return "$0";
    if (low !== undefined && high !== undefined)
      return `$${low.toLocaleString()} - $${high.toLocaleString()}`;
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
    if (parsedMin !== undefined && parsedMax !== undefined && parsedMax <= parsedMin) {
      setValidationError("Max budget must be greater than min budget");
      return;
    }

    const payload = {
      budget: {
        min: parsedMin,
        max: parsedMax,
      },
      estimate: data.estimate, // Estimate remains unchanged
    };

    try {
      const parsed = BudgetSchema.parse(payload);
      onUpdate(parsed);
      setIsEditing(false);
    } catch (err) {
      const zError = err as {
        errors?: Array<{ message: string }>;
        message: string;
      };
      if (zError.errors && zError.errors.length > 0 && zError.errors[0]) {
        setValidationError(zError.errors[0].message);
      } else {
        setValidationError(zError.message);
      }
    }
  };

  return (
    <div className="relative w-full max-w-card-widget overflow-hidden rounded-xl border border-border-color bg-bg-card/70 p-4 shadow-glass backdrop-blur-xl transition-all duration-300">
      <div className="absolute top-0 left-0 h-indicator w-full bg-suggest-color shadow-glow-suggest" />

      {/* BUDGET ROW */}
      <div className="relative flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
          <Wallet size={16} className="text-text-primary" />
        </div>

        <div className="flex-1">
          <div className="text-super-small font-bold tracking-wider text-text-muted">
            BUDGET
          </div>

          {isEditing ? (
            <div
              className="mt-1 flex gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                disabled={isPlanning}
                className="box-border h-5 w-full rounded-sm border border-border-color bg-black/35 px-1.5 py-0.5 font-sans text-xs-dense text-text-primary outline-none focus:border-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Min"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
              />
              <input
                type="text"
                disabled={isPlanning}
                className="box-border h-5 w-full rounded-sm border border-border-color bg-black/35 px-1.5 py-0.5 font-sans text-xs-dense text-text-primary outline-none focus:border-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Max"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
              />
            </div>
          ) : (
            <div className="mt-0.5 text-xs-dense font-bold text-text-primary">
              {getBudgetDisplay()}
            </div>
          )}
        </div>

        {/* Edit/Save Trigger */}
        <button
          type="button"
          disabled={isPlanning}
          className="ml-auto flex cursor-pointer items-center justify-center border-none bg-transparent p-1 text-text-muted transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
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
            <Check size={14} className="text-budget-safe" />
          ) : (
            <Edit2
              size={12}
              className="cursor-pointer opacity-50 transition-all duration-300 hover:text-text-primary hover:opacity-100 disabled:cursor-not-allowed"
            />
          )}
        </button>
      </div>

      {/* Zod Validation Error Feedback (for budget inputs) */}
      {validationError && (
        <div className="mt-2 flex items-center rounded-sm border border-red-500/25 bg-red-500/10 px-2 py-1 text-xxs text-red-300">
          <AlertTriangle size={10} className="mr-1 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* DIVIDER */}
      <div className="my-4 border-t border-border-color" />

      {/* ESTIMATE ROW (Non-editable) */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
          <TrendingUp size={16} className="text-text-primary" />
        </div>

        <div>
          <div className="text-super-small font-bold tracking-wider text-text-muted">
            ESTIMATE
          </div>
          <div className="mt-0.5 text-xs-dense font-bold text-text-primary">
            {getEstimateDisplay()}
          </div>
        </div>
      </div>

      {/* VIEW BREAKDOWN PANEL */}
      <div className="mt-4 flex flex-col">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-1 border-none bg-transparent py-1 text-center text-xxs font-bold tracking-wider text-text-secondary uppercase transition-all duration-300 hover:text-text-primary"
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
          <div className="mt-3 flex flex-col gap-1.5 rounded-md bg-black/15 p-2 text-xxs text-text-secondary">
            {breakdownItems.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.label}</span>
                <span className="font-semibold text-text-primary">
                  ${item.cost}
                </span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-dashed border-border-color pt-1.5 font-bold text-text-primary">
              <span>Total Projected</span>
              <span>
                ${breakdownItems.reduce((acc, curr) => acc + curr.cost, 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
