import * as React from "react";
import * as XLSX from "xlsx";
import { unzipSync, zipSync, strToU8, strFromU8 } from "fflate";
import { EVENTS_CONFIG } from "../config/eventsConfig";
import { ICalendarEvent, parseExcelDate } from "../utils/eventUtils";

export interface IUseEventsDataResult {
  events: ICalendarEvent[];
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
    raw: false, // return formatted strings for date cells
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

// ── Write helpers (surgical XLSX cell patching) ──────────────────────────────
//
// Instead of replacing the entire XLSX file (which destroys Excel table
// styles, hyperlinks, and date formats), we:
//   1. Download the raw .xlsx (a ZIP of XML files)
//   2. Unzip it with fflate
//   3. Parse only the target sheet XML with DOMParser
//   4. Update just the specific <c> elements
//   5. Rezip — all other XML files (xl/tables/, xl/styles.xml,
//      worksheet _rels files, etc.) are kept byte-for-byte identical
//   6. Re-upload via the existing PUT endpoint with X-RequestDigest
//
// No Graph API permissions or admin approval required.

/** Fetches the SharePoint form digest (CSRF token) for write operations. */
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

/** Convert a 0-based column index to an Excel column letter (A, B, … Z, AA, …). */
function colIndexToLetter(index: number): string {
  let letter = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

/** Convert a JS Date to an Excel serial number (days since 1899-12-30). */
function dateToExcelSerial(date: Date): number {
  const utcMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const epochMs = Date.UTC(1899, 11, 30);
  return Math.round((utcMs - epochMs) / 86400000);
}

/** Convert an Excel column letter to a 0-based index ("A"→0, "D"→3). */
function colLetterToIndex(col: string): number {
  let result = 0;
  for (const ch of col.toUpperCase()) {
    result = result * 26 + (ch.charCodeAt(0) - 64);
  }
  return result - 1;
}

/** Extract the column letters from a cell address ("D6" → "D"). */
function getCellCol(address: string): string {
  return address.replace(/[0-9]/g, "");
}

/** Extract the row number string from a cell address ("D6" → "6"). */
function getCellRow(address: string): string {
  return address.replace(/[^0-9]/g, "");
}

interface ICellPatch {
  address: string; // e.g. "D6"
  value: string | number;
}

const SS_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

/**
 * Resolves the ZIP entry path for a named sheet
 * (e.g. "xl/worksheets/sheet2.xml") via workbook.xml + workbook.xml.rels.
 */
function resolveSheetPath(
  workbookXml: string,
  workbookRels: string,
  sheetName: string,
): string | undefined {
  // Locate name="<sheetName>" in workbook.xml, then walk back to the
  // opening <sheet tag to extract its r:id attribute.
  const nameAttr = `name="${sheetName}"`;
  const namePos = workbookXml.indexOf(nameAttr);
  if (namePos === -1) return undefined;
  const tagStart = workbookXml.lastIndexOf("<sheet", namePos);
  if (tagStart === -1) return undefined;
  const tagEnd = workbookXml.indexOf(">", tagStart);
  const sheetTag = workbookXml.slice(tagStart, tagEnd + 1);
  const rIdMatch = /r:id="([^"]+)"/i.exec(sheetTag);
  if (!rIdMatch) return undefined;
  const rId = rIdMatch[1];

  // Find the matching <Relationship Id="rId" .../> in workbook.xml.rels.
  const idAttr = `Id="${rId}"`;
  const idPos = workbookRels.indexOf(idAttr);
  if (idPos === -1) return undefined;
  const relStart = workbookRels.lastIndexOf("<Relationship", idPos);
  if (relStart === -1) return undefined;
  const relEnd = workbookRels.indexOf(">", relStart);
  const relTag = workbookRels.slice(relStart, relEnd + 1);
  const targetMatch = /Target="([^"]+)"/i.exec(relTag);
  if (!targetMatch) return undefined;
  const target = targetMatch[1];
  return target.startsWith("xl/") ? target : `xl/${target}`;
}

/**
 * Scans every row in the sheet and returns the first "s" (style) attribute
 * found on a cell in the given column letter. Used so that a newly created
 * date cell inherits the date number-format of sibling cells in that column.
 */
function findColumnStyle(doc: Document, colLetter: string): string | undefined {
  const upperCol = colLetter.toUpperCase();
  const allRows = doc.getElementsByTagName("row");
  for (let i = 0; i < allRows.length; i++) {
    const cells = allRows[i].getElementsByTagName("c");
    for (let j = 0; j < cells.length; j++) {
      const addr = cells[j].getAttribute("r") ?? "";
      if (getCellCol(addr).toUpperCase() === upperCol) {
        const s = cells[j].getAttribute("s");
        if (s) return s;
      }
    }
  }
  return undefined;
}

/**
 * Applies cell value patches to a sheet XML string using DOMParser.
 * Only cell value content is changed; style (s=) attributes and row/column
 * structure are preserved. New cells are inserted in column order.
 * When a brand-new numeric (date) cell is created and has no style, the style
 * is copied from another cell in the same column so the date format is kept.
 */
function applyPatches(sheetXml: string, patches: ICellPatch[]): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(sheetXml, "application/xml");

  for (const { address, value } of patches) {
    const rowNum = getCellRow(address);

    let rowEl: Element | null = null;
    const allRows = doc.getElementsByTagName("row");
    for (let i = 0; i < allRows.length; i++) {
      if (allRows[i].getAttribute("r") === rowNum) {
        rowEl = allRows[i];
        break;
      }
    }
    if (!rowEl) continue;

    let cellEl: Element | null = null;
    let isNewCell = false;
    const cells = rowEl.getElementsByTagName("c");
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].getAttribute("r") === address) {
        cellEl = cells[i];
        break;
      }
    }
    if (!cellEl) {
      isNewCell = true;
      cellEl = doc.createElementNS(SS_NS, "c");
      cellEl.setAttribute("r", address);
      const targetIdx = colLetterToIndex(getCellCol(address));
      let insertBefore: Element | null = null;
      for (let i = 0; i < cells.length; i++) {
        if (
          colLetterToIndex(getCellCol(cells[i].getAttribute("r") ?? "")) >
          targetIdx
        ) {
          insertBefore = cells[i];
          break;
        }
      }
      rowEl.insertBefore(cellEl, insertBefore);
    }

    // Preserve existing style; for new numeric cells with no style, inherit
    // the style from another cell in the same column (carries date format).
    let styleAttr = cellEl.getAttribute("s");
    if (!styleAttr && isNewCell && typeof value === "number") {
      styleAttr = findColumnStyle(doc, getCellCol(address)) ?? null;
    }
    cellEl.removeAttribute("t");
    while (cellEl.firstChild) cellEl.removeChild(cellEl.firstChild);
    if (styleAttr) cellEl.setAttribute("s", styleAttr);

    if (typeof value === "number") {
      const v = doc.createElementNS(SS_NS, "v");
      v.textContent = String(value);
      cellEl.appendChild(v);
    } else {
      cellEl.setAttribute("t", "inlineStr");
      const is = doc.createElementNS(SS_NS, "is");
      const t = doc.createElementNS(SS_NS, "t");
      t.textContent = value;
      is.appendChild(t);
      cellEl.appendChild(is);
    }
  }

  return new XMLSerializer().serializeToString(doc);
}

/**
 * Downloads the XLSX, patches specific cells in-place, and re-uploads.
 * Only the sheet XML is modified; xl/tables/, xl/styles.xml, and all
 * relationship files are preserved byte-for-byte — so table formatting,
 * hyperlinks, and date number formats remain intact.
 */
async function patchAndUpload(
  siteUrl: string,
  buffer: ArrayBuffer,
  sheetName: string,
  patches: ICellPatch[],
): Promise<void> {
  const entries = unzipSync(new Uint8Array(buffer));

  const workbookXml = strFromU8(entries["xl/workbook.xml"]);
  const workbookRels = strFromU8(entries["xl/_rels/workbook.xml.rels"]);
  const sheetPath = resolveSheetPath(workbookXml, workbookRels, sheetName);
  if (!sheetPath || !entries[sheetPath]) {
    throw new Error(`Sheet "${sheetName}" not found inside the workbook.`);
  }

  const updatedXml = applyPatches(strFromU8(entries[sheetPath]), patches);
  const zipped = zipSync({ ...entries, [sheetPath]: strToU8(updatedXml) });

  const digest = await getFormDigest(siteUrl);
  const url = `${siteUrl}/_api/web/GetFileById('${EVENTS_CONFIG.fileUniqueId}')/$value`;
  const res = await fetch(url, {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      "X-RequestDigest": digest,
      "Content-Type": "application/octet-stream",
    },
    body: new Blob([zipped]),
  });
  if (!res.ok) {
    throw new Error(`Upload failed: HTTP ${res.status} ${res.statusText}`);
  }
}

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
      const excelRow = event.rowIndex + 1;
      const buffer = await downloadFile(siteUrl);
      await patchAndUpload(siteUrl, buffer, cfg.sheetName, [
        {
          address: `${colIndexToLetter(cfg.columns.actualDate)}${excelRow}`,
          value: dateToExcelSerial(actualDate),
        },
        {
          address: `${colIndexToLetter(cfg.columns.status)}${excelRow}`,
          value: cfg.executedStatus,
        },
        {
          address: `${colIndexToLetter(cfg.columns.evidence)}${excelRow}`,
          value: evidence,
        },
      ]);
      setRefreshCounter((c) => c + 1);
    },
    [siteUrl],
  );

  const markAsPlanned = React.useCallback(
    async (event: ICalendarEvent, plannedDate: Date): Promise<void> => {
      const cfg = EVENTS_CONFIG;
      const excelRow = event.rowIndex + 1;
      const buffer = await downloadFile(siteUrl);
      await patchAndUpload(siteUrl, buffer, cfg.sheetName, [
        {
          address: `${colIndexToLetter(cfg.columns.plannedDate)}${excelRow}`,
          value: dateToExcelSerial(plannedDate),
        },
        {
          address: `${colIndexToLetter(cfg.columns.status)}${excelRow}`,
          value: cfg.plannedStatus,
        },
      ]);
      setRefreshCounter((c) => c + 1);
    },
    [siteUrl],
  );

  const refresh = React.useCallback(() => {
    setRefreshCounter((c) => c + 1);
  }, []);

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
