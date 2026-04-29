import {
  IObjectivesColumns,
  IScoreThresholds,
  OBJECTIVES_COLUMNS,
  DEFAULT_SCORE_THRESHOLDS,
} from "./objectivesConfig";

export interface IExcelObjectivesSource {
  id: string;
  label: string;
  fileUniqueId: string;
  type: "objectives";
  yearSheetPattern: RegExp;
  ignoredSheets: string[];
  columns: IObjectivesColumns;
  scoreThresholds: IScoreThresholds;
}

export const EXCEL_OBJECTIVES_SOURCES: IExcelObjectivesSource[] = [
  {
    id: "isms-objectives",
    label: "ISMS Objectives - Information Security Metrics",
    fileUniqueId: "1443C5A7-7969-4502-AB0E-F3B211E5C373",
    type: "objectives",
    yearSheetPattern: /^\d{4}$/,
    ignoredSheets: ["Cover", "Legend", "Process", "Objectives", "Calculations"],
    columns: OBJECTIVES_COLUMNS,
    scoreThresholds: DEFAULT_SCORE_THRESHOLDS,
  },
];

export interface IFindingsColumns {
  number?: number;
  finding?: number;
  clause?: number;
  category?: number;
  processArea?: number;
  auditee?: number;
  auditor?: number;
  causeAnalysis?: number;
  immediateAction?: number;
  correctiveAction?: number;
  plannedDate?: number;
  status?: number;
  followUpComments?: number;
}

export interface IExcelFindingsSource {
  id: string;

  label: string;
  fileUniqueId: string;
  sheetName: string;
  type: "findings";
  filterStatus: string;
  headerRows: number;
  columns: IFindingsColumns;
}

//  Sources

export const EXCEL_FINDINGS_SOURCES: IExcelFindingsSource[] = [
  //  Internal Audit Findings
  {
    id: "internal-audit-findings",
    label: "2026 Internal Audit Findings",
    fileUniqueId: "25F67B5D-442A-4A23-A36D-0BF47C261615",
    sheetName: "2026 Internal Audit Findings",
    type: "findings",
    filterStatus: "In Progress",
    headerRows: 1,
    columns: {
      number: 0,
      finding: 1,
      clause: 2,
      category: 3,
      processArea: 4,
      auditee: 5,
      auditor: 6,
      causeAnalysis: 7,
      immediateAction: 8,
      correctiveAction: 9,
      plannedDate: 10,
      status: 11,
      followUpComments: 12,
    },
  },

  {
    id: "external-audit-findings",
    label: "2026 External Audit Findings",
    fileUniqueId: "25F67B5D-442A-4A23-A36D-0BF47C261615",
    sheetName: "2026 External Audit Findings",
    type: "findings",
    filterStatus: "In Progress",
    headerRows: 1,
    columns: {
      number: 0,
      finding: 1,
      correctiveAction: 2,
      status: 3,
      followUpComments: 4,
      // Fields absent in this sheet are simply omitted — undefined is treated
      // as "not present" by useExcelSource and FindingsSection
    },
  },

  // ── To add a future sheet — add another entry here ───────────────────────
  // {
  //   id: "supplier-audit-findings",
  //   label: "2026 Supplier Audit Findings",
  //   fileUniqueId: "YOUR-FILE-UNIQUE-ID",
  //   sheetName: "Supplier Findings",
  //   type: "findings",
  //   filterStatus: "In Progress",
  //   headerRows: 1,
  //   columns: { ... },
  // },
];
