// eventsConfig.ts
// ─────────────────────────────────────────────────────────────────────────────
// Configuration for the Upcoming ISMS Events section.
//
// fileUniqueId — the GUID from the SharePoint file URL:
//   ?sourcedoc=%7B4D264DBE-A2CC-4EF4-8CA2-F16CAE687A55%7D
//                   └─── decode %7B/%7D → { / } → the GUID is the value inside
//
// The file is read/written via the SharePoint REST API using same-origin
// credentials — no Microsoft Graph permissions required.
// ─────────────────────────────────────────────────────────────────────────────

export interface IEventsConfig {
  /**
   * UniqueId (GUID) of the Excel file in SharePoint.
   * Found in the file's sharing URL as the `sourcedoc` query parameter
   * (URL-decode %7B → { and %7D → } then take the GUID inside the braces).
   */
  fileUniqueId: string;
  /** Name of the worksheet tab to read. */
  sheetName: string;
  /** 0-based column indices for each data field. */
  columns: {
    month: number;
    action: number;
    plannedDate: number;
    actualDate: number;
    status: number;
    evidence: number;
  };
  /** Value in the Status column that means "not yet done". */
  plannedStatus: string;
  /** Value in the Status column that means "needs a planned date set". */
  toBePlannedStatus: string;
  /** Value written back to the Status column on completion. */
  executedStatus: string;
  /** How many days ahead of today to include as "upcoming". Items beyond
   *  this window are hidden unless they are already overdue. */
  upcomingWindowDays: number;
  /** Header rows at the top of the sheet to skip (0-based count). */
  headerRows: number;
}

export const EVENTS_CONFIG: IEventsConfig = {
  // Decoded from: sourcedoc=%7B4D264DBE-A2CC-4EF4-8CA2-F16CAE687A55%7D
  fileUniqueId: "4D264DBE-A2CC-4EF4-8CA2-F16CAE687A55",

  // ── TODO: set this to the exact tab name in Xeptagon-ISMS-PL-001.xlsx ─────
  sheetName: "Calendar 2026",
  // ──────────────────────────────────────────────────────────────────────────

  // Column indices (0-based). Adjust if your sheet layout differs.
  columns: {
    month: 0, // Column A: Month label (sparse — forward-filled)
    action: 1, // Column B: Action / Activity description
    plannedDate: 2, // Column C: Planned completion date
    actualDate: 3, // Column D: Actual completion date (blank until done)
    status: 4, // Column E: Status (Planned / Executed / etc.)
    evidence: 5, // Column F: Evidence notes
  },

  plannedStatus: "Planned",
  toBePlannedStatus: "To be Planned",
  executedStatus: "Executed",

  // Show events due within the next 30 days (plus all overdue)
  upcomingWindowDays: 30,

  // Number of header rows at the top of the sheet to skip
  headerRows: 1,
};
