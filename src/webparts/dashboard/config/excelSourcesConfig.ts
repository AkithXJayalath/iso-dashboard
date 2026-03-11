
export interface IFindingsColumns {
  /** Row number / finding ID — omit or leave undefined if absent in this sheet */
  number?: number;
  /** Full finding text (Requirement + Observation + Evidence) */
  finding?: number;
  /** ISO 27001:2022 clause reference */
  clause?: number;
  /** Category: Observation / Minor Non Conformity / Major Non Conformity */
  category?: number;
  processArea?: number;
  auditee?: number;
  auditor?: number;
  causeAnalysis?: number;
  immediateAction?: number;
  correctiveAction?: number;
  /** Planned implementation date */
  plannedDate?: number;
  /** Status column — used for filtering */
  status?: number;
  followUpComments?: number;
}

export interface IExcelFindingsSource {
  /** Unique identifier — used as React key and hook dependency */
  id: string;
  /** Display label shown as the section heading */
  label: string;
  /**
   * SharePoint file unique ID (GUID).
   * Obtain from:  /_api/web/GetFileByServerRelativePath(decodedurl='...')/UniqueId
   */
  fileUniqueId: string;
  /** Exact sheet name as it appears in the workbook */
  sheetName: string;
  type: "findings";
  /** Only rows whose status column equals this value are shown */
  filterStatus: string;
  /** Number of header rows to skip (almost always 1) */
  headerRows: number;
  columns: IFindingsColumns;
}

// ── Sources ────────────────────────────────────────────────────────────────

export const EXCEL_FINDINGS_SOURCES: IExcelFindingsSource[] = [
  // ── Internal Audit Findings ─────────────────────────────────────────────
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
