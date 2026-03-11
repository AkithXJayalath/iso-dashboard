export interface ICalendarEvent {
  rowIndex: number;
  month: string;
  action: string;
  plannedDate: Date | null;
  actualDate: Date | null;
  status: string;
  evidence: string;
}

export function toMidnight(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function parseExcelDate(val: unknown): Date | null {
  if (val == null || val === "") return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return new Date(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate());
  }

  if (typeof val === "number" && val > 0) {
    const tmp = new Date(Date.UTC(1899, 11, 30) + val * 86400000);
    return new Date(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate());
  }

  if (typeof val === "string" && val.trim() !== "") {
    const s = val.trim();
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    const isIso = /^\d{4}-\d{2}-\d{2}/.test(s);
    return isIso
      ? new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return null;
}
function daysBetween(target: Date): number {
  const now = toMidnight(new Date());
  const t = toMidnight(target);
  return Math.round((now.getTime() - t.getTime()) / 86400000);
}

export interface IEventStatus {
  isOverdue: boolean;
  daysOffset: number;
}

export function getEventStatus(event: ICalendarEvent): IEventStatus {
  if (!event.plannedDate || event.actualDate != null) {
    return { isOverdue: false, daysOffset: 0 };
  }
  const offset = daysBetween(event.plannedDate);
  return { isOverdue: offset > 0, daysOffset: offset };
}

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

/** Formats a Date as "DD MMM YYYY" for display  */
export function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
