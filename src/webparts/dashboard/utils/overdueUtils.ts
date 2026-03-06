// overdueUtils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Dual overdue detection logic:
//
//  Type A — Completion Overdue
//    Item is not in a completedStatus AND days since creation date >
//    userThreshold (or defaultThresholdDays).
//
//  Type B — Status Stalling Overdue
//    Item has been in its current non-completed status longer than the
//    per-status threshold defined in statusThresholds (falls back to
//    defaultThresholdDays if the status has no explicit entry).
//
//    Stall-start date resolution (priority, highest → lowest):
//      1. registry.statusDateFields[item.status]  — exact SP column mapped per
//         status (e.g. "DepartmentApprovedDate").  Requires the column to be
//         fetched and present in item.rawFields.
//      2. item.statusChangedDate                  — generic StatusChangedDate
//         column, if the list has one.
//      3. item.lastModified                       — SP Modified field (updates
//         on any edit, not only status changes — least precise proxy).
//      4. item.date                               — creation date (absolute
//         last resort when no other date is available).
// ─────────────────────────────────────────────────────────────────────────────

import { IRegistryConfig } from "../config/registryConfig";
import { IRegistryItem } from "../hooks/useRegistryData";

// ── Helpers ───────────────────────────────────────────────────────────────────
export function daysBetween(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  // Strip time component so all items created on the same calendar day
  // are treated identically regardless of the exact time-of-day.
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.floor(
    (todayMidnight.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function isCompleted(status: string, registry: IRegistryConfig): boolean {
  return registry.completedStatuses.indexOf(status) !== -1;
}

// ── Type A — Completion Overdue ───────────────────────────────────────────────
export function isCompletionOverdue(
  item: IRegistryItem,
  registry: IRegistryConfig,
  userThreshold: number,
): boolean {
  if (isCompleted(item.status, registry)) return false;
  return daysBetween(item.date) > userThreshold;
}

// ── Type B — Status Stalling Overdue ─────────────────────────────────────────
export interface IStallingOverdue {
  type: "STALLING";
  status: string;
  daysStalling: number;
  daysOver: number;
  threshold: number;
  /** Which field/fallback was actually used to measure stalling start. */
  resolvedDateField: string;
}

/**
 * Resolves the date from which stalling time is measured for the item's
 * current status, using the 4-level priority chain documented at the top
 * of this file.
 */
function resolveStallStartDate(
  item: IRegistryItem,
  _registry: IRegistryConfig,
): { dateStr: string; resolvedDateField: string } {
  // 1. statusDateFields mapped column — display names already resolved to
  //    internal names by the hook, so look directly in rawFields.
  const mappedFieldName = item.resolvedStatusDateFields[item.status];
  if (mappedFieldName) {
    const mappedDate = item.rawFields[mappedFieldName] as string | undefined;
    if (mappedDate) {
      return { dateStr: mappedDate, resolvedDateField: mappedFieldName };
    }
  }

  // 2. Generic StatusChangedDate column
  if (item.statusChangedDate) {
    return {
      dateStr: item.statusChangedDate,
      resolvedDateField: "StatusChangedDate",
    };
  }

  // 3. Modified field (proxy — updates on any edit)
  if (item.lastModified) {
    return { dateStr: item.lastModified, resolvedDateField: "Modified" };
  }

  // 4. Creation date (absolute fallback)
  return { dateStr: item.date, resolvedDateField: "date (creation fallback)" };
}

export function getStallingOverdue(
  item: IRegistryItem,
  registry: IRegistryConfig,
  userThreshold: number,
): IStallingOverdue | undefined {
  if (isCompleted(item.status, registry)) return undefined;

  // Per-status threshold → userThreshold
  const thresholds = registry.statusThresholds;
  const threshold =
    thresholds && thresholds[item.status] !== undefined
      ? thresholds[item.status]
      : userThreshold;

  const { dateStr: stallStart, resolvedDateField } = resolveStallStartDate(
    item,
    registry,
  );
  const daysStalling = daysBetween(stallStart);

  if (daysStalling > threshold) {
    return {
      type: "STALLING",
      status: item.status,
      daysStalling,
      daysOver: daysStalling - threshold,
      threshold,
      resolvedDateField,
    };
  }
  return undefined;
}

// ── Combined result ───────────────────────────────────────────────────────────
export interface IItemOverdueInfo {
  completionOverdue: boolean;
  completionDaysOver: number;
  stallingOverdue: IStallingOverdue | undefined;
  isFlagged: boolean;
}

export function getItemOverdueInfo(
  item: IRegistryItem,
  registry: IRegistryConfig,
  userThreshold: number,
): IItemOverdueInfo {
  const completionOverdue = isCompletionOverdue(item, registry, userThreshold);
  const completionDaysOver = completionOverdue
    ? daysBetween(item.date) - userThreshold
    : 0;
  const stallingOverdue = getStallingOverdue(item, registry, userThreshold);

  return {
    completionOverdue,
    completionDaysOver,
    stallingOverdue,
    isFlagged: completionOverdue || stallingOverdue !== undefined,
  };
}

// ── Overview summary — used by OverdueSummaryCard ────────────────────────────
export interface IOverdueSummary {
  completionOverdueCount: number;
  stallingByStatus: Array<{ status: string; count: number; threshold: number }>;
  totalFlagged: number;
}

export function buildOverdueSummary(
  items: IRegistryItem[],
  registry: IRegistryConfig,
  userThreshold: number,
): IOverdueSummary {
  let completionOverdueCount = 0;
  const stallingMap: Record<string, { count: number; threshold: number }> = {};

  items.forEach((item) => {
    const info = getItemOverdueInfo(item, registry, userThreshold);
    if (info.completionOverdue) completionOverdueCount++;
    if (info.stallingOverdue) {
      const s = info.stallingOverdue.status;
      if (!stallingMap[s]) {
        stallingMap[s] = {
          count: 0,
          threshold: info.stallingOverdue.threshold,
        };
      }
      stallingMap[s].count++;
    }
  });

  const stallingByStatus = Object.keys(stallingMap).map((status) => ({
    status,
    count: stallingMap[status].count,
    threshold: stallingMap[status].threshold,
  }));

  const stallingTotal = stallingByStatus.reduce((n, s) => n + s.count, 0);

  return {
    completionOverdueCount,
    stallingByStatus,
    totalFlagged: completionOverdueCount + stallingTotal,
  };
}
