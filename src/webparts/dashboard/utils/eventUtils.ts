// eventUtils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Domain types and pure utility functions for the ISMS calendar events feature.
// ─────────────────────────────────────────────────────────────────────────────

/** Represents one row from the ISMS calendar Excel sheet. */
export interface ICalendarEvent {
  /** 0-based row index in the sheet (after skipping header rows).
   *  Used to locate the row when writing back completion data. */
  rowIndex: number;
  /** Month label, forward-filled from the sparse Month column. */
  month: string;
  /** Activity / action description. */
  action: string;
  /** Planned completion date, or null if blank / unparseable. */
  plannedDate: Date | null;
  /** Actual completion date, or null if not yet completed. */
  actualDate: Date | null;
  /** Status value from the sheet (e.g. "Planned", "Executed"). */
  status: string;
  /** Evidence text from the sheet. */
  evidence: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a new Date with hours/minutes/seconds/ms set to 0 in local time. */
export function toMidnight(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/**
 * Parses a cell value from SheetJS into a Date (or null).
 * SheetJS with `cellDates: true` returns Date objects for date cells;
 * but may also return numeric serial numbers or date strings.
 */
export function parseExcelDate(val: unknown): Date | null {
  if (val == null || val === "") return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "number" && val > 0) {
    // Excel serial date: days since 1899-12-31 (with 1900 leap-year bug)
    const msPerDay = 86400000;
    const excelEpoch = new Date(1899, 11, 31).getTime();
    const date = new Date(excelEpoch + val * msPerDay);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof val === "string" && val.trim() !== "") {
    const d = new Date(val.trim());
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Returns the calendar-day difference: positive if `target` is in the past,
 * negative if `target` is in the future.
 *   daysBetween(yesterday) → 1
 *   daysBetween(tomorrow)  → -1
 */
function daysBetween(target: Date): number {
  const now = toMidnight(new Date());
  const t = toMidnight(target);
  return Math.round((now.getTime() - t.getTime()) / 86400000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Overdue / urgency logic
// ─────────────────────────────────────────────────────────────────────────────

export interface IEventStatus {
  isOverdue: boolean;
  /** Positive = number of days past plannedDate; negative = days remaining. */
  daysOffset: number;
}

/**
 * Returns overdue / days-remaining info for a single event.
 * - Events with no plannedDate are treated as not overdue.
 * - Completed events (actualDate is set) are never flagged as overdue.
 */
export function getEventStatus(event: ICalendarEvent): IEventStatus {
  if (!event.plannedDate || event.actualDate != null) {
    return { isOverdue: false, daysOffset: 0 };
  }
  const offset = daysBetween(event.plannedDate);
  return { isOverdue: offset > 0, daysOffset: offset };
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filters events to show:
 *   - All overdue incomplete items (regardless of how far past).
 *   - Incomplete items whose plannedDate is within `windowDays` of today.
 *
 * Completed items (actualDate != null) are excluded.
 * Items with no plannedDate are also excluded.
 */
export function filterUpcoming(
  events: ICalendarEvent[],
  windowDays: number,
): ICalendarEvent[] {
  const cutoff = toMidnight(new Date());
  cutoff.setDate(cutoff.getDate() + windowDays);

  return events.filter((e) => {
    if (e.actualDate != null) return false; // already completed
    if (!e.plannedDate) return false; // no date to compare
    const pd = toMidnight(e.plannedDate);
    return pd <= cutoff; // overdue (pd < now) OR within window (pd <= cutoff)
  });
}

/** Returns only overdue incomplete events. */
export function filterOverdue(events: ICalendarEvent[]): ICalendarEvent[] {
  const now = toMidnight(new Date());
  return events.filter(
    (e) =>
      e.actualDate == null &&
      e.plannedDate != null &&
      toMidnight(e.plannedDate) < now,
  );
}

/** Sorts events: overdue first (most overdue at top), then by plannedDate asc. */
export function sortEvents(events: ICalendarEvent[]): ICalendarEvent[] {
  return [...events].sort((a, b) => {
    const aDate = a.plannedDate ? a.plannedDate.getTime() : Infinity;
    const bDate = b.plannedDate ? b.plannedDate.getTime() : Infinity;
    return aDate - bDate;
  });
}

/** Formats a Date as "DD MMM YYYY" for display (e.g. "15 Jan 2026"). */
export function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
