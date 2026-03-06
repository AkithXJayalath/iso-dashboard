// useEventsData.ts
// ─────────────────────────────────────────────────────────────────────────────
// React hook that:
//   1. Fetches the ISMS calendar Excel file from SharePoint via REST API.
//   2. Parses it with SheetJS, forward-filling the sparse Month column.
//   3. Exposes `markAsCompleted` which writes back actualDate + evidence
//      by re-downloading the latest file, patching the row, and re-uploading.
//
// Uses same-origin SharePoint REST (/_api/web/GetFileById) — no Graph
// permissions or admin consent required.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react";
import * as XLSX from "xlsx";
import { EVENTS_CONFIG } from "../config/eventsConfig";
import { ICalendarEvent, parseExcelDate } from "../utils/eventUtils";

export interface IUseEventsDataResult {
  /** Filtered upcoming + overdue events (ready to display). */
  events: ICalendarEvent[];
  /** All non-completed events from the sheet (unfiltered). */
  allEvents: ICalendarEvent[];
  loading: boolean;
  error: string | null;
  /**
   * Writes completion data back to the Excel file.
   * @param event       The event being completed.
   * @param actualDate  The actual completion date chosen by the user.
   * @param evidence    Optional evidence / notes string.
   */
  markAsCompleted: (
    event: ICalendarEvent,
    actualDate: Date,
    evidence: string,
  ) => Promise<void>;
  /**
   * Writes a planned date back to the Excel file for a "To be Planned" event.
   * Updates the plannedDate column and sets status to "Planned".
   * @param event       The event being planned.
   * @param plannedDate The planned date chosen by the user.
   */
  markAsPlanned: (event: ICalendarEvent, plannedDate: Date) => Promise<void>;
  /** Re-fetches the file from SharePoint. */
  refresh: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Downloads the Excel file as an ArrayBuffer via SharePoint REST API.
 * Uses same-origin credentials — no Graph permissions required.
 */
async function downloadFile(siteUrl: string): Promise<ArrayBuffer> {
  const url = `${siteUrl}/_api/web/GetFileById('${EVENTS_CONFIG.fileUniqueId}')/$value`;
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/octet-stream" },
  });
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status} ${res.statusText}`);
  }
  return res.arrayBuffer();
}

/**
 * Fetches the SharePoint form digest (CSRF token) needed for write operations.
 */
async function getFormDigest(siteUrl: string): Promise<string> {
  const res = await fetch(`${siteUrl}/_api/contextinfo`, {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json;odata=nometadata" },
  });
  if (!res.ok) {
    throw new Error(`Failed to get form digest: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { FormDigestValue: string };
  return data.FormDigestValue;
}

/**
 * Parses the ArrayBuffer into a list of ICalendarEvent objects.
 * Handles the sparse Month column via forward-fill.
 */
function parseWorkbook(buffer: ArrayBuffer): ICalendarEvent[] {
  const cfg = EVENTS_CONFIG;
  const workbook = XLSX.read(new Uint8Array(buffer), {
    type: "array",
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  const sheet = workbook.Sheets[cfg.sheetName];
  if (!sheet) {
    throw new Error(
      `Sheet "${cfg.sheetName}" not found. Available: ${workbook.SheetNames.join(", ")}`,
    );
  }

  // sheet_to_json with header:1 gives raw row arrays (no header key mapping)
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false, // return formatted strings for date cells (we parse ourselves)
  });

  // Re-read with raw:true to get actual Date / number values for date cells
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  const events: ICalendarEvent[] = [];
  let lastMonth = "";

  for (let i = cfg.headerRows; i < rawRows.length; i++) {
    const raw = rawRows[i] ?? [];
    const fmt = rows[i] ?? [];

    // Skip entirely blank rows
    const action = String(raw[cfg.columns.action] ?? "").trim();
    if (!action) continue;

    // Forward-fill month
    const monthCell = String(
      fmt[cfg.columns.month] ?? raw[cfg.columns.month] ?? "",
    ).trim();
    if (monthCell) lastMonth = monthCell;

    events.push({
      rowIndex: i,
      month: lastMonth,
      action,
      plannedDate: parseExcelDate(raw[cfg.columns.plannedDate]),
      actualDate: parseExcelDate(raw[cfg.columns.actualDate]),
      status: String(raw[cfg.columns.status] ?? "").trim(),
      evidence: String(raw[cfg.columns.evidence] ?? "").trim(),
    });
  }

  return events;
}

/**
 * Uploads a modified workbook back to SharePoint via REST API, replacing the file.
 */
async function uploadFile(
  siteUrl: string,
  workbook: XLSX.WorkBook,
): Promise<void> {
  const digest = await getFormDigest(siteUrl);
  const wbOut = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as Uint8Array;
  const url = `${siteUrl}/_api/web/GetFileById('${EVENTS_CONFIG.fileUniqueId}')/$value`;
  const res = await fetch(url, {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      "X-RequestDigest": digest,
      "Content-Type": "application/octet-stream",
    },
    body: new Blob([wbOut]),
  });
  if (!res.ok) {
    throw new Error(`Upload failed: HTTP ${res.status} ${res.statusText}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useEventsData(siteUrl: string): IUseEventsDataResult {
  const [allEvents, setAllEvents] = React.useState<ICalendarEvent[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = React.useState(0);

  React.useEffect(() => {
    if (!siteUrl) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    downloadFile(siteUrl)
      .then((buffer) => {
        if (cancelled) return;
        const parsed = parseWorkbook(buffer);
        setAllEvents(parsed);
        if (!cancelled) setLoading(false);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message ?? "Failed to load events.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [siteUrl, refreshCounter]);

  const markAsCompleted = React.useCallback(
    async (
      event: ICalendarEvent,
      actualDate: Date,
      evidence: string,
    ): Promise<void> => {
      const cfg = EVENTS_CONFIG;

      // Always re-download before writing to prevent overwriting concurrent edits
      const buffer = await downloadFile(siteUrl);
      const workbook = XLSX.read(new Uint8Array(buffer), {
        type: "array",
        cellDates: true,
      });

      const sheet = workbook.Sheets[cfg.sheetName];
      if (!sheet) throw new Error(`Sheet "${cfg.sheetName}" not found.`);

      // The target row in the sheet (1-based for SheetJS cell addresses)
      const sheetRow = event.rowIndex + 1;

      // Write actualDate into the actualDate column
      const actualColLetter = XLSX.utils.encode_col(cfg.columns.actualDate);
      const actualCellAddr = `${actualColLetter}${sheetRow}`;
      sheet[actualCellAddr] = {
        t: "d",
        v: actualDate,
        z: "DD/MM/YYYY",
      };

      // Write status
      const statusColLetter = XLSX.utils.encode_col(cfg.columns.status);
      const statusCellAddr = `${statusColLetter}${sheetRow}`;
      sheet[statusCellAddr] = { t: "s", v: cfg.executedStatus };

      // Write evidence (optional)
      const evidenceColLetter = XLSX.utils.encode_col(cfg.columns.evidence);
      const evidenceCellAddr = `${evidenceColLetter}${sheetRow}`;
      sheet[evidenceCellAddr] = { t: "s", v: evidence };

      await uploadFile(siteUrl, workbook);

      // Refresh local state
      setRefreshCounter((c) => c + 1);
    },
    [siteUrl],
  );

  const markAsPlanned = React.useCallback(
    async (event: ICalendarEvent, plannedDate: Date): Promise<void> => {
      const cfg = EVENTS_CONFIG;

      const buffer = await downloadFile(siteUrl);
      const workbook = XLSX.read(new Uint8Array(buffer), {
        type: "array",
        cellDates: true,
      });

      const sheet = workbook.Sheets[cfg.sheetName];
      if (!sheet) throw new Error(`Sheet "${cfg.sheetName}" not found.`);

      const sheetRow = event.rowIndex + 1;

      // Write planned date
      const plannedColLetter = XLSX.utils.encode_col(cfg.columns.plannedDate);
      sheet[`${plannedColLetter}${sheetRow}`] = {
        t: "d",
        v: plannedDate,
        z: "DD/MM/YYYY",
      };

      // Update status to "Planned"
      const statusColLetter = XLSX.utils.encode_col(cfg.columns.status);
      sheet[`${statusColLetter}${sheetRow}`] = { t: "s", v: cfg.plannedStatus };

      await uploadFile(siteUrl, workbook);
      setRefreshCounter((c) => c + 1);
    },
    [siteUrl],
  );

  const refresh = React.useCallback(() => {
    setRefreshCounter((c) => c + 1);
  }, []);

  // "events" = everything (the UpcomingEventsSection will apply its own filter)
  const events = allEvents;

  return {
    events,
    allEvents,
    loading,
    error,
    markAsCompleted,
    markAsPlanned,
    refresh,
  };
}
