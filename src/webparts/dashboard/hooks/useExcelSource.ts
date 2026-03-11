// useExcelSource.ts
// Generic read-only hook for fetching and parsing any Excel findings sheet
// from SharePoint.

import * as React from "react";
import * as XLSX from "xlsx";
import { IExcelFindingsSource } from "../config/excelSourcesConfig";

//  Normalised finding row returned to consumers

export interface IFindingItem {
  /** 1-based Excel row number (after header) */
  rowIndex: number;
  status: string | undefined;
  number: string | undefined;
  finding: string | undefined;
  clause: string | undefined;
  category: string | undefined;
  processArea: string | undefined;
  auditee: string | undefined;
  auditor: string | undefined;
  causeAnalysis: string | undefined;
  immediateAction: string | undefined;
  correctiveAction: string | undefined;
  plannedDate: string | undefined;
  followUpComments: string | undefined;
}

export interface IUseExcelSourceResult {
  rows: IFindingItem[];
  loading: boolean;
  error: string | undefined;
  refresh: () => void;
}

async function downloadFile(
  siteUrl: string,
  fileUniqueId: string,
): Promise<ArrayBuffer> {
  const url = `${siteUrl}/_api/web/GetFileById('${fileUniqueId}')/$value`;
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/octet-stream" },
  });
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status} ${res.statusText}`);
  }
  return res.arrayBuffer();
}


function getCell(
  row: unknown[],
  index: number | undefined,
): string | undefined {
  if (index === undefined) return undefined;
  const val = row[index];
  if (val === null || val === undefined || val === "") return undefined;
  return String(val).trim() || undefined;
}


function parseSheet(
  buffer: ArrayBuffer,
  source: IExcelFindingsSource,
): IFindingItem[] {
  const workbook = XLSX.read(new Uint8Array(buffer), {
    type: "array",
    cellDates: false,
    cellText: false,
  });

  const sheet = workbook.Sheets[source.sheetName];
  if (!sheet) {
    throw new Error(
      `Sheet "${source.sheetName}" not found. Available: ${workbook.SheetNames.join(", ")}`,
    );
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false, // formatted strings
  });

  const cols = source.columns;
  const results: IFindingItem[] = [];

  for (let i = source.headerRows; i < rows.length; i++) {
    const row = rows[i] ?? [];

    // Skip entirely blank rows
    if (!row.some((cell) => cell !== null && cell !== "")) continue;

    const status = getCell(row, cols.status);
    if (status !== source.filterStatus) continue;

    results.push({
      rowIndex: i + 1, // 1-based Excel row number
      status,
      number: getCell(row, cols.number),
      finding: getCell(row, cols.finding),
      clause: getCell(row, cols.clause),
      category: getCell(row, cols.category),
      processArea: getCell(row, cols.processArea),
      auditee: getCell(row, cols.auditee),
      auditor: getCell(row, cols.auditor),
      causeAnalysis: getCell(row, cols.causeAnalysis),
      immediateAction: getCell(row, cols.immediateAction),
      correctiveAction: getCell(row, cols.correctiveAction),
      plannedDate: getCell(row, cols.plannedDate),
      followUpComments: getCell(row, cols.followUpComments),
    });
  }

  return results;
}

//  Hook 

export function useExcelSource(
  siteUrl: string,
  source: IExcelFindingsSource,
): IUseExcelSourceResult {
  const [rows, setRows] = React.useState<IFindingItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [refreshCounter, setRefreshCounter] = React.useState(0);

  React.useEffect(() => {
    if (!siteUrl) return;

    let cancelled = false;
    setLoading(true);
    setError(undefined);

    downloadFile(siteUrl, source.fileUniqueId)
      .then((buffer) => {
        if (cancelled) return;
        const parsed = parseSheet(buffer, source);
        setRows(parsed);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message ?? "Failed to load data.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // source.id is stable per config entry — safe as dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteUrl, source.id, refreshCounter]);

  const refresh = React.useCallback(() => {
    setRefreshCounter((c) => c + 1);
  }, []);

  return { rows, loading, error, refresh };
}
