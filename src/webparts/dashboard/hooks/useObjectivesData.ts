import * as React from "react";
import * as XLSX from "xlsx";
import { IExcelObjectivesSource } from "../config/excelSourcesConfig";
import {
  IDomain,
  parseObjectivesSheet,
  applyScoreRollup,
} from "../utils/objectivesParser";

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

export interface IUseObjectivesDataResult {
  data: IDomain[] | undefined;
  years: string[];
  loading: boolean;
  error: string | undefined;
}


export function useObjectivesData(
  siteUrl: string,
  source: IExcelObjectivesSource,
  selectedYear: string,
): IUseObjectivesDataResult {
  const [data, setData] = React.useState<IDomain[] | undefined>(undefined);
  const [years, setYears] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>(undefined);

  // Persist across renders without triggering re-render
  const workbookRef = React.useRef<XLSX.WorkBook | null>(null);
  const parsedCache = React.useRef<Record<string, IDomain[]>>({});
  const currentFileId = React.useRef<string>("");

  React.useEffect(() => {
    if (!siteUrl || !source.fileUniqueId) return;

    // If source changes, clear all caches
    if (currentFileId.current !== source.fileUniqueId) {
      workbookRef.current = null;
      parsedCache.current = {};
      currentFileId.current = source.fileUniqueId;
      setYears([]);
      setData(undefined);
    }
    if (workbookRef.current) {
      const wb = workbookRef.current;
      const detected = wb.SheetNames.filter((n) =>
        source.yearSheetPattern.test(n),
      ).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
      setYears(detected);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(undefined);

    downloadFile(siteUrl, source.fileUniqueId)
      .then((buffer) => {
        if (cancelled) return;
        workbookRef.current = XLSX.read(new Uint8Array(buffer), {
          type: "array",
          cellDates: false,
          cellText: false,
        });
        const wb = workbookRef.current;
        const detected = wb.SheetNames.filter((n) =>
          source.yearSheetPattern.test(n),
        ).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
        setYears(detected);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message ?? "Failed to load objectives file.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteUrl, source.fileUniqueId]);

  // Runs whenever selectedYear or years changes (years change signals workbook loaded).
  React.useEffect(() => {
    if (!selectedYear || !workbookRef.current) return;

    // Serve from cache if already parsed
    if (parsedCache.current[selectedYear]) {
      setData(parsedCache.current[selectedYear]);
      setLoading(false);
      return;
    }

    const wb = workbookRef.current;
    const ws = wb.Sheets[selectedYear];
    if (!ws) {
      setError(`Year sheet "${selectedYear}" not found in the workbook.`);
      setLoading(false);
      return;
    }

    try {
      const parsed = parseObjectivesSheet(ws, source.columns);
      const withRollup = applyScoreRollup(parsed, source.scoreThresholds);
      parsedCache.current[selectedYear] = withRollup;
      setData(withRollup);
      setError(undefined);
    } catch (err) {
      setError((err as Error).message ?? "Failed to parse year data.");
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, years]);

  return { data, years, loading, error };
}
