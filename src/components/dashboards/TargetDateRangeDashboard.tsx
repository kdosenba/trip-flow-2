import React, { useState } from "react";
import { TargetDateRange, TargetDateRangeSchema } from "../../types/schema";
import {
  Clock,
  Calendar,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { DateTimeFormatter } from "../../lib/utils/date";
import { useTripFlowStore } from "../../store";

interface TargetDateRangeDashboardProps {
  data: TargetDateRange;
  onUpdate: (data: TargetDateRange) => void;
}

export const TargetDateRangeDashboard: React.FC<
  TargetDateRangeDashboardProps
> = ({ data, onUpdate }) => {
  const timezone = useTripFlowStore(
    (state) => state.graph?.clientContext.timezone,
  );
  const isPlanning = useTripFlowStore((state) => state.isPlanning);

  // Local edit states
  const [isEditing, setIsEditing] = useState(false);

  // Auto-close edit mode when planning starts
  React.useEffect(() => {
    if (isPlanning) {
      setIsEditing(false);
    }
  }, [isPlanning]);

  // Resolve target date values
  const isRangeModeInitial = data.target ? "range" in data.target : false;
  const targetStartInitial =
    data.target && "range" in data.target
      ? data.target.range.start
      : "2026-06-10";
  const targetEndInitial =
    data.target && "range" in data.target
      ? data.target.range.end
      : "2026-06-18";
  const targetDateInitial =
    data.target && "date" in data.target
      ? data.target.date
      : "2026-06-10";

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
    if (!data.target) return "Flexible";
    if ("range" in data.target) {
      try {
        return DateTimeFormatter.formatRange(
          data.target.range.start,
          data.target.range.end,
          timezone,
          { month: "short", day: "numeric" },
        );
      } catch {
        return `${data.target.range.start} - ${data.target.range.end}`;
      }
    }
    if ("date" in data.target) {
      try {
        return DateTimeFormatter.format(data.target.date, timezone, {
          month: "short",
          day: "numeric",
        });
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
      const formatOption = { month: "short", day: "numeric" } as const;

      if (data.actual.end) {
        return DateTimeFormatter.formatRange(
          data.actual.start,
          data.actual.end,
          timezone,
          formatOption,
        );
      }
      return DateTimeFormatter.format(
        data.actual.start,
        timezone,
        formatOption,
      );
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
      actual: data.actual, // Actual remains unchanged (calculated by backend/store)
    };

    try {
      const parsed = TargetDateRangeSchema.parse(payload);
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

  const actualDays = getActualDays();

  return (
    <div className="relative w-full max-w-card-widget overflow-hidden rounded-xl border border-border-color bg-bg-card/70 p-5 shadow-glass backdrop-blur-xl transition-all duration-300">
      <div className="absolute top-0 left-0 h-indicator w-full bg-origin-color shadow-glow-origin" />

      {/* TARGET ROW */}
      <div className="relative flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-dark/50">
          <Clock size={16} className="text-text-primary" />
        </div>

        <div className="flex-1">
          <div className="text-super-small font-bold tracking-wider text-text-muted">
            TARGET
          </div>

          {isEditing ? (
            <div
              className="mt-1 flex flex-col gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-1 flex rounded-sm border border-border-color bg-bg-dark p-0.5">
                <button
                  type="button"
                  disabled={isPlanning}
                  className={`flex-1 cursor-pointer rounded-sm border-none bg-transparent px-1 py-0.5 text-xxs font-semibold transition-all duration-300 disabled:cursor-not-allowed ${
                    isRange
                      ? "bg-bg-card text-text-primary shadow-xs"
                      : "text-text-muted"
                  }`}
                  onClick={() => setIsRange(true)}
                >
                  Range
                </button>
                <button
                  type="button"
                  disabled={isPlanning}
                  className={`flex-1 cursor-pointer rounded-sm border-none bg-transparent px-1 py-0.5 text-xxs font-semibold transition-all duration-300 disabled:cursor-not-allowed ${
                    !isRange
                      ? "bg-bg-card text-text-primary shadow-xs"
                      : "text-text-muted"
                  }`}
                  onClick={() => setIsRange(false)}
                >
                  Date
                </button>
              </div>

              {isRange ? (
                <div className="flex gap-0.5">
                  <input
                    type="date"
                    disabled={isPlanning}
                    className="box-border h-4.5 w-full rounded-sm border border-border-color bg-bg-dark p-0.5 font-sans text-xxs text-text-primary outline-none focus:border-border-hover disabled:cursor-not-allowed disabled:opacity-50"
                    value={startInput}
                    onChange={(e) => setStartInput(e.target.value)}
                  />
                  <input
                    type="date"
                    disabled={isPlanning}
                    className="box-border h-4.5 w-full rounded-sm border border-border-color bg-bg-dark p-0.5 font-sans text-xxs text-text-primary outline-none focus:border-border-hover disabled:cursor-not-allowed disabled:opacity-50"
                    value={endInput}
                    onChange={(e) => setEndInput(e.target.value)}
                  />
                </div>
              ) : (
                <input
                  type="date"
                  disabled={isPlanning}
                  className="box-border h-4.5 w-full rounded-sm border border-border-color bg-bg-dark p-0.5 font-sans text-xxs text-text-primary outline-none focus:border-border-hover disabled:cursor-not-allowed disabled:opacity-50"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                />
              )}
            </div>
          ) : (
            <div className="mt-0.5 text-xs-dense font-bold text-text-primary">
              {getTargetDisplay()}
            </div>
          )}
        </div>

        {/* Edit Button */}
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

      {/* Validation Error Feedback */}
      {validationError && (
        <div className="mt-2 flex items-center rounded-sm border border-budget-danger/25 bg-budget-danger/15 px-2 py-1 text-xxs text-budget-danger">
          <AlertTriangle size={10} className="mr-1 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* DIVIDER */}
      <div className="my-4 border-t border-border-color" />

      {/* ACTUAL ROW */}
      <div className="relative flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-dark/50">
          <Calendar size={16} className="text-text-primary" />
        </div>

        <div className="flex-1">
          <div className="text-super-small font-bold tracking-wider text-text-muted">
            ACTUAL
          </div>
          <div className="mt-0.5 text-xs-dense font-bold text-text-primary">
            {getActualDisplay()}
          </div>
        </div>

        {/* Days count tag */}
        {actualDays !== null && (
          <span className="ml-auto shrink-0 rounded bg-bg-dark/50 px-1.5 py-0.5 text-super-small font-extrabold text-text-primary">
            {actualDays} DAYS
          </span>
        )}
      </div>

      {/* EXPANDABLE BREAKDOWN SECTION */}
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
              View Details <ChevronDown size={12} />
            </>
          )}
        </button>

        {showBreakdown && (
          <div className="mt-3 flex flex-col gap-2 rounded-md bg-bg-dark/50 p-2.5 text-xxs text-text-secondary">
            {isEditing ? (
              <div className="flex flex-col gap-1">
                <span className="text-super-small font-bold tracking-wider text-text-muted uppercase">
                  Edit travel context notes
                </span>
                <textarea
                  disabled={isPlanning}
                  className="box-border h-11 w-full resize-y rounded-sm border border-border-color bg-bg-dark p-1 font-sans text-xxs text-text-primary outline-none focus:border-border-hover disabled:cursor-not-allowed disabled:opacity-50"
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  placeholder="Notes..."
                />
              </div>
            ) : (
              data.context && (
                <div className="leading-normal">
                  <strong>Context:</strong> {data.context}
                </div>
              )
            )}

            <div className="border-t border-dashed border-border-color pt-2">
              <strong>Date validation:</strong> actual schedule starts on{" "}
              {data.actual?.start
                ? DateTimeFormatter.format(data.actual.start, timezone, {
                    month: "short",
                    day: "numeric",
                  })
                : "TBD"}{" "}
              and ends on{" "}
              {data.actual?.end
                ? DateTimeFormatter.format(data.actual.end, timezone, {
                    month: "short",
                    day: "numeric",
                  })
                : "TBD"}
              .
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
