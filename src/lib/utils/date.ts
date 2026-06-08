import { useTripFlowStore } from "../../store";

/**
 * Utility class for formatting dates and times with timezone sensitivity.
 */
export class DateTimeFormatter {
  /**
   * Retrieves the current locale language from the store, defaulting to 'en-US'.
   */
  private static getLocale(overrideLocale?: string | undefined): string {
    if (overrideLocale) return overrideLocale;
    try {
      const state = useTripFlowStore.getState();
      return state.graph?.clientContext.language || "en-US";
    } catch {
      return "en-US";
    }
  }

  /**
   * Formats an ISO date/time string using the provided timezone.
   * If timezone is not provided, defaults to UTC.
   */
  static format(
    isoString: string,
    timezone?: string | undefined,
    options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
    overrideLocale?: string | undefined,
  ): string {
    const locale = DateTimeFormatter.getLocale(overrideLocale);
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return isoString;
      }
      return new Intl.DateTimeFormat(locale, {
        ...options,
        timeZone: timezone || "UTC",
      }).format(date);
    } catch (err) {
      console.warn(
        `DateTimeFormatter failed for value "${isoString}" with timezone "${timezone}" and locale "${locale}":`,
        err,
      );
      // Fallback to UTC if timezone is invalid
      try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat("en-US", {
          ...options,
          timeZone: "UTC",
        }).format(date);
      } catch {
        return isoString;
      }
    }
  }

  /**
   * Helper to format a date range (start to end) nicely.
   */
  static formatRange(
    startIso: string,
    endIso: string,
    timezone?: string | undefined,
    options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    },
    overrideLocale?: string | undefined,
  ): string {
    const startStr = DateTimeFormatter.format(
      startIso,
      timezone,
      options,
      overrideLocale,
    );
    const endStr = DateTimeFormatter.format(
      endIso,
      timezone,
      options,
      overrideLocale,
    );
    return `${startStr.toUpperCase()} - ${endStr.toUpperCase()}`;
  }

  /**
   * Formats a duration in days into a user-friendly value and unit.
   * - <= 7 days: formatted as DAYS (e.g., "1 DAY", "7 DAYS")
   * - 8 to 28 days: formatted as WEEKS (e.g., "1.1 WEEKS", "4 WEEKS")
   * - >= 29 days: formatted as MONTHS (e.g., "1 MONTH", "1.5 MONTHS")
   */
  static formatDuration(numDays: number): { value: string; unit: string } {
    if (numDays <= 7) {
      return {
        value: String(numDays),
        unit: numDays === 1 ? "DAY" : "DAYS",
      };
    }
    if (numDays <= 28) {
      const rawVal = Math.round((numDays / 7) * 10) / 10;
      return {
        value: String(rawVal),
        unit: rawVal === 1 ? "WEEK" : "WEEKS",
      };
    }
    const rawVal = Math.round((numDays / 30) * 10) / 10;
    return {
      value: String(rawVal),
      unit: rawVal === 1 ? "MONTH" : "MONTHS",
    };
  }

  /**
   * Adjusts a date string/timestamp to local Date components in the target timezone,
   * represented as a Date object in UTC.
   */
  static getLocalTime(isoString: string, timezone: string): Date {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return date;

    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone || "UTC",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      });

      const parts = formatter.formatToParts(date);
      const partValues: Record<string, string> = {};
      parts.forEach((p) => {
        partValues[p.type] = p.value;
      });

      const year = parseInt(partValues["year"] || "1970", 10);
      const month = parseInt(partValues["month"] || "1", 10) - 1;
      const day = parseInt(partValues["day"] || "1", 10);
      const hour = parseInt(partValues["hour"] || "0", 10);
      const minute = parseInt(partValues["minute"] || "0", 10);
      const second = parseInt(partValues["second"] || "0", 10);

      return new Date(Date.UTC(year, month, day, hour, minute, second));
    } catch (err) {
      console.warn(`getLocalTime failed for ${isoString} in timezone ${timezone}:`, err);
      return date;
    }
  }
}
