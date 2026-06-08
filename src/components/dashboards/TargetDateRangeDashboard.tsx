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
import { getHubStayNights, getHubStayDays } from "../../lib/utils/graph";

interface TargetDateRangeDashboardProps {
  data: TargetDateRange;
  onUpdate: (data: TargetDateRange) => void;
}

export const TargetDateRangeDashboard: React.FC<
  TargetDateRangeDashboardProps
> = ({ data, onUpdate }) => {
  const graph = useTripFlowStore((state) => state.graph);
  const timezone = graph?.clientContext.timezone;
  const isPlanning = useTripFlowStore((state) => state.isPlanning);

  // Local edit states
  const [isEditing, setIsEditing] = useState(false);

  // Auto-close edit mode when planning starts
  React.useEffect(() => {
    if (isPlanning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (!data.actual?.start || !data.actual?.end || !graph) return null;
    try {
      // Find start and end timezone
      const originHub = Object.values(graph.CityHubs).find((h) => h.type === "ORIGIN");
      const startTimezone = originHub?.timezone || graph.clientContext.timezone || "UTC";

      let latestSegment: any = null;
      let latestTime = -Infinity;
      Object.values(graph.Transits || {}).forEach((trans) => {
        trans.segments?.forEach((seg) => {
          const e = new Date(seg.endTime).getTime();
          if (!isNaN(e) && e > latestTime) {
            latestTime = e;
            latestSegment = seg;
          }
        });
      });

      let endTimezone = startTimezone;
      if (latestSegment) {
        const destLocationId = latestSegment.toLocationId;
        const destHub = Object.values(graph.CityHubs).find(
          (hub) => hub.arrivalNodeId === destLocationId || hub.departureNodeId === destLocationId
        );
        if (destHub?.timezone) {
          endTimezone = destHub.timezone;
        }
      }

      const startLocal = DateTimeFormatter.getLocalTime(data.actual.start, startTimezone);
      const endLocal = DateTimeFormatter.getLocalTime(data.actual.end, endTimezone);

      const startMidnight = Date.UTC(startLocal.getUTCFullYear(), startLocal.getUTCMonth(), startLocal.getUTCDate());
      const endMidnight = Date.UTC(endLocal.getUTCFullYear(), endLocal.getUTCMonth(), endLocal.getUTCDate());

      return Math.max(1, Math.round((endMidnight - startMidnight) / (1000 * 60 * 60 * 24)) + 1);
    } catch {
      const s = new Date(data.actual.start).getTime();
      const e = new Date(data.actual.end).getTime();
      const diffTime = Math.abs(e - s);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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

  // Helper calculations for TF-45
  const timeline = (() => {
    if (!graph) return { travel: 0, hubs: [] as Array<{ name: string; days: number; color: string }>, total: 0, totalHubDays: 0, plannedDays: 0, unplannedDays: 0 };

    // 1. Calculate travel time in hours
    let travelMs = 0;
    Object.values(graph.Transits || {}).forEach((trans) => {
      trans.segments?.forEach((seg) => {
        const start = new Date(seg.startTime).getTime();
        const end = new Date(seg.endTime).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          travelMs += (end - start);
        }
      });
    });
    const travelHours = travelMs / (1000 * 60 * 60);
    const travelDays = travelHours / 24;

    // 2. Calculate hub stay times in days (calendar days)
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
    const hubs = Object.values(graph.CityHubs || {})
      .filter((h) => h.type === "HUB")
      .map((h, index) => {
        const days = getHubStayDays(graph, h.id);
        return {
          name: h.cityName,
          days,
          color: colors[index % colors.length] || "#94a3b8",
        };
      });

    const totalHubDays = hubs.reduce((sum, h) => sum + h.days, 0);
    const total = travelDays + totalHubDays;

    // 3. Calculate planned vs unplanned time in hubs in hours
    let plannedMs = 0;
    Object.values(graph.CityHubs || {}).forEach((hub) => {
      if (hub.type !== "HUB") return;
      hub.itinerary.forEach((item) => {
        const loc = graph.Locations[item.LocationId];
        if (!loc) return;
        if (loc.category !== "ACTIVITY" && loc.category !== "MEAL") return;

        if (item.startTime && item.endTime) {
          const s = new Date(item.startTime).getTime();
          const e = new Date(item.endTime).getTime();
          if (!isNaN(s) && !isNaN(e) && e > s) {
            plannedMs += (e - s);
          }
        } else if (item.startTime) {
          plannedMs += 2 * 60 * 60 * 1000; // default 2 hours
        }
      });
    });

    const plannedHours = plannedMs / (1000 * 60 * 60);
    const netHubHours = totalHubDays * 16; // 16 hours awake per hub day (excludes 8 hours sleep)
    const cappedPlannedHours = Math.min(netHubHours, plannedHours);
    const unplannedHours = Math.max(0, netHubHours - cappedPlannedHours);

    return {
      travel: travelDays,
      hubs,
      total,
      totalHubDays,
      plannedDays: cappedPlannedHours / 24,
      unplannedDays: unplannedHours / 24,
    };
  })();

  const formatDaysOrHours = (days: number) => {
    if (days === 0) return "0h";
    if (days >= 1) return `${Math.round(days * 10) / 10}d`;
    const hours = Math.round(days * 24);
    return `${hours}h`;
  };

  return (
    <div
      className="relative w-full max-w-card-widget rounded-3xl border border-border-color bg-bg-card/70 p-5 backdrop-blur-xl transition-all duration-300"
      style={{ boxShadow: "6px 6px 0px var(--color-bg-dark)" }}
    >

      {/* TARGET ROW */}
      <div className="relative flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-dark/50">
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
                  className={`flex-1 cursor-pointer rounded-sm border-none bg-transparent px-1 py-0.5 text-xxs font-semibold transition-all duration-300 disabled:cursor-not-allowed ${isRange
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
                  className={`flex-1 cursor-pointer rounded-sm border-none bg-transparent px-1 py-0.5 text-xxs font-semibold transition-all duration-300 disabled:cursor-not-allowed ${!isRange
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
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-dark/50">
          <Calendar size={16} className="text-text-primary" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-super-small font-bold tracking-wider text-text-muted">
              ACTUAL
            </span>
            {actualDays !== null && (() => {
              const { value, unit } = DateTimeFormatter.formatDuration(actualDays);
              return (
                <span className="rounded bg-bg-dark/50 px-1.5 py-0.5 text-super-small font-extrabold text-text-primary">
                  {value} {unit}
                </span>
              );
            })()}
          </div>
          <div className="mt-0.5 text-xs-dense font-bold text-text-primary">
            {getActualDisplay()}
          </div>
        </div>
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
          <div className="mt-3 flex flex-col gap-4 rounded-2xl bg-bg-dark/40 p-4 border border-border-color/30 text-xxs text-text-secondary">
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
              <>
                {data.context && (
                  <div className="leading-normal mb-1">
                    <strong>Context:</strong> {data.context}
                  </div>
                )}



                {/* Planned vs Unplanned Time (VAS) */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-super-small font-bold tracking-wider text-text-muted uppercase">
                    <span>Planned vs Free Time*</span>
                  </div>
                  <div className="mt-1 flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-bold text-text-secondary leading-tight">
                      <div className="text-left">
                        Planned<br />Time
                      </div>
                      <div className="text-right">
                        Free<br />Exploration
                      </div>
                    </div>
                    {/* Visual Analogue Scale Bar */}
                    <div className="h-3 w-full rounded-full bg-bg-dark/65 overflow-hidden flex">
                      {(() => {
                        const awakeDays = timeline.plannedDays + timeline.unplannedDays;
                        if (awakeDays > 0) {
                          const plannedPct = (timeline.plannedDays / awakeDays) * 100;
                          const unplannedPct = (timeline.unplannedDays / awakeDays) * 100;
                          return (
                            <>
                              {plannedPct > 0 && (
                                <div
                                  className="h-full bg-indigo-500 transition-all duration-500 border-r border-bg-dark"
                                  style={{ width: `${plannedPct}%`, backgroundColor: "#6366f1" }}
                                />
                              )}
                              {unplannedPct > 0 && (
                                <div
                                  className="h-full transition-all duration-500"
                                  style={{ width: `${unplannedPct}%`, backgroundColor: "#10b981" }}
                                />
                              )}
                            </>
                          );
                        }
                        return <div className="h-full w-full bg-bg-dark/65" />;
                      })()}
                    </div>
                    {/* Value Labels */}
                    <div className="flex items-center justify-between text-xxs font-semibold">
                      {(() => {
                        const awakeDays = timeline.plannedDays + timeline.unplannedDays;
                        const plannedPct = awakeDays > 0 ? Math.round((timeline.plannedDays / awakeDays) * 100) : 0;
                        const unplannedPct = awakeDays > 0 ? Math.round((timeline.unplannedDays / awakeDays) * 100) : 0;
                        return (
                          <>
                            <span className="text-indigo-400">
                              {formatDaysOrHours(timeline.plannedDays)} ({plannedPct}%)
                            </span>
                            <span className="text-emerald-400">
                              {formatDaysOrHours(timeline.unplannedDays)} ({unplannedPct}%)
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    {/* Footnote explanation */}
                    <div className="text-[9px] text-text-muted italic mt-1 leading-normal">
                      *Excludes sleeping (8h/day) and travel times.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
