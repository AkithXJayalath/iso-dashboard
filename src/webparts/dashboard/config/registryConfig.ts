export interface IRegistryConfig {
  id: string;
  label: string;
  sharepointListName: string;
  dateField: string;
  statusField: string;
  statuses: string[];
  completedStatuses: string[];
  defaultThresholdDays: number;
  statusThresholds?: Record<string, number>;
  titleField?: string;
  statusDateFields?: Record<string, string>;
}

export const REGISTRIES: IRegistryConfig[] = [
  {
    id: "risk",
    label: "Risk Identification",
    sharepointListName: "Risk Identification",
    dateField: "Created",
    statusField: "Current Status",
    statuses: ["In Progress", "Completed", "Delayed", "Accepted", "Scheduled"],
    completedStatuses: ["Completed", "Accepted"],
    titleField: "Risk Code",
    defaultThresholdDays: 30,
    statusThresholds: {
      "In Progress": 7,
      Delayed: 7,
      Scheduled: 7,
    },
    statusDateFields: {
      // use created at etc for the default status and Status Change Date for others
      "In Progress": "Created",
      Delayed: "Status Change Date",
      Scheduled: "Status Change Date",
    },
  },
  {
    id: "incidents",
    label: "Incidents",
    sharepointListName: "Incidents",
    dateField: "Reported at",
    statusField: "Current Status",
    statuses: [
      "Incident Reported",
      "Responder Assigned",
      "Pending ISO Review",
      "Revisit Needed",
      "Incident Closed",
    ],
    completedStatuses: ["Incident Closed"],
    defaultThresholdDays: 30,
    titleField: "Incident ID",
    statusThresholds: {
      "Incident Reported": 7,
      "Responder Assigned": 7,
      "Pending ISO Review": 7,
      "Revisit Needed": 7,
    },
    statusDateFields: {
      "Incident Reported": "Reported at",
      "Responder Assigned": "Status Change Date",
      "Pending ISO Review": "Status Change Date",
      "Revisit Needed": "Status Change Date",
    },
  },
  {
    id: "access-review",
    label: "Access Request",
    sharepointListName: "Access Request",
    dateField: "Requested at",
    statusField: "Status",
    statuses: [
      "Pending Approval",
      "Pending Implementation",
      "Approval Rejected",
      "Implementation Rejected",
      "Implementation Completed",
    ],
    completedStatuses: [
      "Approval Rejected",
      "Implementation Rejected",
      "Implementation Completed",
    ],
    defaultThresholdDays: 30,
    titleField: "Request ID",
    statusThresholds: {
      "Pending Approval": 7,
      "Pending Implementation": 7,
    },
    statusDateFields: {
      "Pending Approval": "Requested at",
      "Pending Implementation": "Status Changed Date",
    },
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
    defaultThresholdDays: 30,
    titleField: "Request ID",
    statusThresholds: {
      "Request Submitted": 7,
      "Department Approved": 7,
      "ISO Approved": 7,
    },
    statusDateFields: {
      "Request Submitted": "Requested Date",
      "Department Approved": "Status Changed Date",
      "ISO Approved": "Status Changed Date",
    },
  },
];
