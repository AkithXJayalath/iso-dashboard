export interface IEventsConfig {
 
  fileUniqueId: string;
  sheetName: string;
  columns: {
    month: number;
    action: number;
    plannedDate: number;
    actualDate: number;
    status: number;
    evidence: number;
  };
  plannedStatus: string;
  toBePlannedStatus: string;
  executedStatus: string;
  upcomingWindowDays: number;
  headerRows: number;
}

export const EVENTS_CONFIG: IEventsConfig = {

//  fileUniqueId: "96D0E8F8-B2BE-4A8E-89DB-07267E069F22", 
 fileUniqueId: "4D264DBE-A2CC-4EF4-8CA2-F16CAE687A55",

  sheetName: "Calendar 2026",

  // Column indices
  columns: {
    month: 0, 
    action: 1,
    plannedDate: 2, 
    actualDate: 3, 
    status: 4, 
    evidence: 5,
  },

  plannedStatus: "Planned",
  toBePlannedStatus: "To be Planned",
  executedStatus: "Executed",

  // Show events due within the next 30 days (plus all overdue)
  upcomingWindowDays: 30,

  // Number of header rows at the top of the sheet to skip
  headerRows: 1,
};
