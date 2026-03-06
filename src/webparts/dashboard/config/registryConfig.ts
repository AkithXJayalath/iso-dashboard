// registryConfig.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central registry definition file.
// To add a new list:  push one object into REGISTRIES – nothing else changes.
// ─────────────────────────────────────────────────────────────────────────────

export interface IRegistryConfig {
  /** Unique identifier used as React key and cache key */
  id: string;
  /** Human-readable label shown in the dropdown */
  label: string;
  /** Exact title of the SharePoint list (as shown in List Settings → List Information) */
  sharepointListName: string;
  /**
   * DISPLAY NAME (Title) of the date column (creation / submission date).
   * The hook resolves this to the SP internal name automatically at runtime.
   */
  dateField: string;
  /**
   * DISPLAY NAME (Title) of the status column.
   * The hook resolves this to the SP internal name automatically at runtime.
   */
  statusField: string;
  /** All possible choice values for statusField */
  statuses: string[];
  /** Subset of statuses considered "done" – excluded from all overdue checks */
  completedStatuses: string[];
  /**
   * Default threshold (days) — used for Type A completion overdue, and as
   * the fallback for Type B stalling overdue when a status has no entry in
   * statusThresholds.
   */
  defaultThresholdDays: number;
  /**
   * Per-status stalling threshold (days) for Type B overdue detection.
   * Key = status display value; Value = max days allowed in that status.
   * Omit a status to fall back to defaultThresholdDays.
   * Completed statuses are never evaluated — omit them here.
   */
  statusThresholds?: Record<string, number>;
  /**
   * DISPLAY NAME of a text column to use as the item label in the overdue table.
   * Leave undefined to fall back to "#<Id>".
   */
  titleField?: string;
  /**
   * Maps each non-completed status (display name) to the DISPLAY NAME (Title)
   * of the SharePoint column that records when the item entered that status.
   * The hook resolves these display names to SP internal names automatically
   * at runtime — exactly like dateField, statusField, and titleField.
   *
   * Priority chain in overdueUtils:
   *   1. statusDateFields[item.status]  — exact mapped SP column (most accurate)
   *   2. item.statusChangedDate         — generic StatusChangedDate column
   *   3. item.lastModified              — Modified field (proxy)
   *   4. item.date                      — creation date (absolute fallback)
   *
   * Completed statuses should be omitted — they are never evaluated.
   * For a status with no known dedicated column, omit it and let the
   * fallback chain handle it automatically.
   */
  statusDateFields?: Record<string, string>;
}

export const REGISTRIES: IRegistryConfig[] = [
  {
    id: "risk",
    label: "Risk Identification",
    sharepointListName: "Risk Identification",
    dateField: "Created",
    statusField: "Current Status",
    statuses: ["In Progress", "Completed", "Delayed", "Accepted", "Scheduled"],
    completedStatuses: ["Completed", "Accepted"],
    titleField: "Risk Code",
    defaultThresholdDays: 7,
    statusThresholds: {
      "In Progress": 7,
      Delayed: 7,
      Scheduled: 7,
    },
    statusDateFields: {
      "In Progress": "Created",
      "Delayed": "Last Date Reviewed",
      "Scheduled": "Estimated End Date",
    },
  },
  {
    id: "incidents",
    label: "Incidents",
    sharepointListName: "Incidents",
    dateField: "Reported at",
    statusField: "Reviewed By IS Officer",
    statuses: ["Yes", "No"],
    completedStatuses: ["Yes"],
    defaultThresholdDays: 7,
    titleField: "Incident ID",
    statusThresholds: {
      No: 7,
    },
    statusDateFields: {
      "No": "Reported at",
    },
  },
  {
    id: "access-review",
    label: "Access Review",
    sharepointListName: "Access Review",
    dateField: "Requested at",
    statusField: "Status",
    statuses: [
      "Pending Approval",
      "Pending Implementation",
      "Approval Rejected",
      "Implementation Rejected",
      "Access Granted",
    ],
    completedStatuses: [
      "Approval Rejected",
      "Implementation Rejected",
      "Access Granted",
    ],
    defaultThresholdDays: 7,
    titleField: "Request ID",
    statusThresholds: {
      "Pending Approval": 7,
      "Pending Implementation": 7,
    },
    statusDateFields: {
      "Pending Approval": "Requested at",
      "Pending Implementation": "Approved/Rejected Date",
    },
  },
  {
    id: "change-request",
    label: "Change Request",
    sharepointListName: "Change Request",
    dateField: "Requested Date",
    statusField: "Status",
    statuses: [
      "Request Submitted",
      "Department Approved",
      "Department Rejected",
      "ISO Approved",
      "ISO Rejected",
      "Implementation Done",
    ],
    completedStatuses: [
      "Department Rejected",
      "ISO Rejected",
      "Implementation Done",
    ],
    defaultThresholdDays: 7,
    titleField: "Request ID",
    statusThresholds: {
      "Request Submitted": 7,
      "Department Approved": 7,
      "ISO Approved": 7,
    },
    statusDateFields: {
      "Request Submitted": "Requested Date",
      "Department Approved":"Department Approved/Rejected Date",
      "ISO Approved": "ISO Approved/Rejected Date",
    },
  },
];
