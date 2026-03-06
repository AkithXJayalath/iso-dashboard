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
   * DISPLAY NAME (Title) of the date column, exactly as shown in SharePoint column settings.
   * The hook resolves this to the SP internal name automatically at runtime.
   * Examples: "Created", "Reported at", "Requested Date"
   */
  dateField: string;
  /**
   * DISPLAY NAME (Title) of the status column, exactly as shown in SharePoint column settings.
   * The hook resolves this to the SP internal name automatically at runtime.
   * Examples: "Status", "Reviewed By IS Officer", "Current Status"
   */
  statusField: string;
  /** All possible choice values for statusField */
  statuses: string[];
  /** Subset of statuses considered "done" – excluded from overdue checks */
  completedStatuses: string[];
  /** Default age (days) after which an open item is flagged overdue */
  defaultThresholdDays: number;
  /**
   * DISPLAY NAME of a text column to use as the item label in the overdue table.
   * Leave undefined to fall back to "Item #<Id>".
   * Examples: "Incident ID", "Request ID"
   */
  titleField?: string;
}

export const REGISTRIES: IRegistryConfig[] = [
  {
    id: "risk",
    label: "Risk Identification",
    sharepointListName: "Risk Identification",
    dateField: "Created",
    statusField: "Current Status",
    statuses: ["In Progress", "Completed", "Delayed", "Accepted", "Scheduled"],
    completedStatuses: ["Completed"],
    titleField: "Risk Code",
    defaultThresholdDays: 7,
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
  },
];
