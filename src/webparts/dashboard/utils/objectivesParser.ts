// objectivesParser.ts
// Pure function: raw SheetJS worksheet → normalised domain tree.
//
// Row type detection:
//   domain   — col A has a value AND col B has a value
//   subdomain — col A is empty, col B has a value, col C is empty
//   metric   — col A is empty, col B is empty, col C has a value
//   empty    — everything else (skip)
//
// Score sourcing: uses actual computed values from Excel (raw:true in XLSX.read).
// applyScoreRollup() provides a client-side fallback if formula cells were not
// evaluated (contain strings rather than numbers).

import * as XLSX from "xlsx";
import {
  IObjectivesColumns,
  IScoreThresholds,
} from "../config/objectivesConfig";

// ── Normalised data types ─────────────────────────────────────────────────────

export interface IMetric {
  type: "metric";
  code: string;
  label: string;
  frequency: string;
  weighting: number;
  lowerThreshold: string;
  midThreshold: string;
  upperThreshold: string;
  metricValue: number | undefined;
  metricScore: number | undefined;
  comments: string;
}

export interface ISubDomain {
  type: "subdomain";
  /** Leading code extracted from the label, e.g. "1.A" */
  code: string;
  label: string;
  weighting: number;
  subDomainScore: number | undefined;
  metrics: IMetric[];
}

export interface IDomain {
  type: "domain";
  number: number;
  label: string;
  weighting: number;
  domainScore: number | undefined;
  subDomains: ISubDomain[];
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function toNum(val: unknown): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  if (typeof val === "boolean") return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

function toStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

type TRowType = "domain" | "subdomain" | "metric" | "empty";

function detectRowType(row: unknown[]): TRowType {
  const hasA = row[0] !== null && row[0] !== undefined && row[0] !== "";
  const hasB = row[1] !== null && row[1] !== undefined && row[1] !== "";
  const hasC = row[2] !== null && row[2] !== undefined && row[2] !== "";

  if (hasA && hasB) return "domain";
  if (!hasA && hasB && !hasC) return "subdomain";
  if (!hasA && !hasB && hasC) return "metric";
  return "empty";
}

/** Extracts a leading code like "1.A" or "1.A.1" from the start of a label. */
function extractCode(label: string): string {
  const m = /^(\d+\.[A-Z]+(?:\.\d+)?)/i.exec(label);
  return m ? m[1] : "";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Parses a single year worksheet into a normalised domain tree.
 * @param ws      SheetJS WorkSheet object (already selected by the caller).
 * @param columns Column index map from objectivesConfig.ts.
 */
export function parseObjectivesSheet(
  ws: XLSX.WorkSheet,
  columns: IObjectivesColumns,
): IDomain[] {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    raw: true, // keep actual computed numbers, not formatted strings
  });

  const domains: IDomain[] = [];
  let currentDomain: IDomain | null = null;
  let currentSubDomain: ISubDomain | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const rowType = detectRowType(row);

    if (rowType === "domain") {
      currentDomain = {
        type: "domain",
        number: toNum(row[columns.colA]) ?? 0,
        label: toStr(row[columns.colB]),
        weighting: toNum(row[columns.weighting]) ?? 1,
        domainScore: toNum(row[columns.domainScore]) ?? undefined,
        subDomains: [],
      };
      domains.push(currentDomain);
      currentSubDomain = null;
    } else if (rowType === "subdomain" && currentDomain) {
      const sdLabel = toStr(row[columns.colB]);
      currentSubDomain = {
        type: "subdomain",
        code: extractCode(sdLabel),
        label: sdLabel,
        weighting: toNum(row[columns.weighting]) ?? 1,
        subDomainScore: toNum(row[columns.subDomainScore]) ?? undefined,
        metrics: [],
      };
      currentDomain.subDomains.push(currentSubDomain);
    } else if (rowType === "metric" && currentSubDomain) {
      const mLabel = toStr(row[columns.colC]);
      currentSubDomain.metrics.push({
        type: "metric",
        code: extractCode(mLabel),
        label: mLabel,
        frequency: toStr(row[columns.frequency]),
        weighting: toNum(row[columns.weighting]) ?? 1,
        lowerThreshold: toStr(row[columns.lowerThreshold]),
        midThreshold: toStr(row[columns.midThreshold]),
        upperThreshold: toStr(row[columns.upperThreshold]),
        metricValue: toNum(row[columns.metricValue]) ?? undefined,
        metricScore: toNum(row[columns.metricScore]) ?? undefined,
        comments: toStr(row[columns.comments]),
      });
    }
    // rowType === "empty" → skip
  }

  return domains;
}

/**
 * Walks the domain tree and fills in missing scores via child-sum rollup.
 * This is the client-side fallback for when Excel formulas were not evaluated
 * (cells contain strings instead of numbers after a programmatic edit).
 *
 * Rule:
 *   subDomainScore = sum of metric.metricScore   (if subDomainScore is null)
 *   domainScore    = sum of subDomain.subDomainScore (if domainScore is null)
 *
 * @param domains   The tree returned by parseObjectivesSheet.
 * @param _thresholds Passed for interface symmetry; not used in rollup math.
 */
export function applyScoreRollup(
  domains: IDomain[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _thresholds: IScoreThresholds,
): IDomain[] {
  return domains.map((domain) => {
    const resolvedSubDomains = domain.subDomains.map((sd) => {
      const resolvedScore =
        typeof sd.subDomainScore === "number"
          ? sd.subDomainScore
          : sd.metrics.reduce((sum, m) => sum + (m.metricScore ?? 0), 0);
      return { ...sd, subDomainScore: resolvedScore as number | undefined };
    });

    const resolvedDomainScore =
      typeof domain.domainScore === "number"
        ? domain.domainScore
        : resolvedSubDomains.reduce(
            (sum, sd) => sum + (sd.subDomainScore ?? 0),
            0,
          );

    return {
      ...domain,
      domainScore: resolvedDomainScore,
      subDomains: resolvedSubDomains,
    };
  });
}
