# ISO Dashboard – Developer Guide

This is a **SharePoint Framework (SPFx) 1.20 web part** built with React, TypeScript, Ant Design, and Recharts. It renders an ISO 27001 management dashboard directly inside a SharePoint modern page by reading data from SharePoint lists and Excel workbooks stored in the site's document libraries.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [What Is Included](#2-what-is-included)
3. [Configuration Files – Where to Change Things](#3-configuration-files--where-to-change-things)
4. [How to Change Existing Things](#4-how-to-change-existing-things)
5. [How to Add New Things](#5-how-to-add-new-things)
6. [Prerequisites](#6-prerequisites)
7. [Running in the Browser (Local Development)](#7-running-in-the-browser-local-development)
8. [Building and Packaging for SharePoint](#8-building-and-packaging-for-sharepoint)
9. [Deploying to SharePoint](#9-deploying-to-sharepoint)
10. [Common Errors and Fixes](#10-common-errors-and-fixes)

---

## 1. Project Structure

```
src/webparts/dashboard/
├── DashboardWebPart.ts          # SPFx entry point – mounts the React app
├── AadTokenContext.ts           # AAD token context (not used directly)
├── components/                  # All React UI components
│   ├── ISODashboard.tsx         # Root dashboard component – routing & layout
│   ├── Dashboard.tsx            # Thin wrapper connecting SPFx props → ISODashboard
│   ├── OverviewPage.tsx         # Landing page – lists all registries
│   ├── RegistrySectionCard.tsx  # Summary card per registry (overview)
│   ├── RegistryDashboardView.tsx# Detail view for a single registry
│   ├── StatusPieChart.tsx       # Pie chart – status distribution
│   ├── TimelineChart.tsx        # Bar/line chart – submissions over time
│   ├── OverdueItemsPanel.tsx    # Table of overdue / stalling items
│   ├── OverdueSummaryCard.tsx   # Small overdue count card
│   ├── UpcomingEventsSection.tsx# ISMS calendar events from Excel
│   ├── EventCard.tsx            # Single event card (upcoming events)
│   ├── CompletionModal.tsx      # Modal to mark an event as completed/planned
│   ├── FindingsSection.tsx      # Audit findings from Excel
│   ├── ObjectivesSection.tsx    # ISMS objectives/metrics from Excel
│   ├── ObjectivesView.tsx       # Domain tree view for objectives
│   ├── DomainCard.tsx           # Single domain accordion card
│   ├── MetricRow.tsx            # Single metric row inside a domain
│   ├── OverallScoreSummary.tsx  # Overall score banner
│   ├── SubDomainPanel.tsx       # Sub-domain panel inside objectives
│   ├── AllRegistersSection.tsx  # Document library file listing
│   ├── RegistrySelector.tsx     # Dropdown to switch registries (detail view)
│   └── OverviewPage.tsx
│
├── config/                      # ⚙️  All data-source configuration
│   ├── eventsConfig.ts          # Excel file & sheet for ISMS calendar events
│   ├── excelSourcesConfig.ts    # Excel files for findings & objectives
│   ├── objectivesConfig.ts      # Column indices & score thresholds
│   ├── registryConfig.ts        # SharePoint list registries (Risk, Incidents …)
│   └── registersDocLibConfig.ts # SharePoint folder path for "All Registers"
│
├── hooks/                       # Data-fetching custom hooks
│   ├── useEventsData.ts         # Fetches & parses the events Excel file
│   ├── useExcelSource.ts        # Generic hook – fetches any findings Excel
│   ├── useObjectivesData.ts     # Fetches & parses the objectives workbook
│   ├── useRegistryData.ts       # Fetches items from a SharePoint list
│   └── useSharePointFolderFiles.ts # Lists files in a SP document library folder
│
└── utils/                       # Pure helper functions
    ├── eventUtils.ts            # Date parsing, filtering, sorting for events
    ├── objectivesParser.ts      # Parses Excel rows into objective domain trees
    ├── overdueUtils.ts          # Overdue / stalling detection logic
    └── scoreUtils.ts            # Score classification & formatting helpers
```

---

## 2. What Is Included

### 2.1 ISMS Calendar Events (`UpcomingEventsSection`)

Reads an Excel workbook from SharePoint by its **File Unique ID**. Shows:

- **Upcoming tab** – events due within the configured window (default 30 days) plus all overdue events.
- **Overdue tab** – events whose planned date has passed and are not yet executed.
- **By Month tab** – filter all active events by month name.
- **Mark as Completed** – writes the actual date and evidence back into the Excel file.
- **Mark as Planned** – writes a planned date into a "To be Planned" event.

### 2.2 Audit Findings (`FindingsSection`)

Reads one or more Excel workbooks by **File Unique ID** and sheet name. Shows findings with status **"In Progress"** (configurable) as expandable cards with category colour badges (Observation / Minor Non Conformity / Major Non Conformity).

Multiple finding sources (e.g. Internal Audit, External Audit) each render as their own section.

### 2.3 ISMS Objectives / Information Security Metrics (`ObjectivesSection`)

Reads an Excel workbook that has one sheet per year (e.g. `2024`, `2025`, `2026`). Displays:

- A year dropdown to switch between years.
- A domain tree where each domain contains sub-domains, each with individual metric rows.
- Colour-coded score indicators (Not Achieved / Acceptable / Achieved) driven by configurable thresholds.
- An overall score summary banner.

### 2.4 All Registers (`AllRegistersSection`)

Lists all files (and sub-folders) inside a configured SharePoint folder path. Each row shows the file name (as a clickable link), last-modified date, file size, and a colour-coded file-type badge (PDF, XLSX, DOCX …).

### 2.5 Registry Overview & Detail Views

Reads items from SharePoint **lists** (Risk Identification, Incidents, Access Request, etc.) and shows:

- **Overview page** – A summary card per registry showing total items, overdue count, and a small status breakdown.
- **Detail page** – Full charts:
  - **Status Pie Chart** – item count per status with colour coding.
  - **Timeline Chart** – items submitted per month.
  - **Overdue Items Panel** – table of items that are either past the completion threshold or stalling in a non-completed status past the per-status threshold.

---

## 3. Configuration Files – Where to Change Things

All configuration lives in `src/webparts/dashboard/config/`. You never need to touch the component or hook files just to point the dashboard at different data.

### 3.1 `eventsConfig.ts` – ISMS Calendar Events

```ts
export const EVENTS_CONFIG: IEventsConfig = {
  fileUniqueId: "4D264DBE-A2CC-4EF4-8CA2-F16CAE687A55", // ← SharePoint File Unique ID
  sheetName: "Calendar 2026", // ← Exact sheet tab name

  columns: {
    month: 0, // Column A (0-indexed)
    action: 1, // Column B
    plannedDate: 2, // Column C
    actualDate: 3, // Column D
    status: 4, // Column E
    evidence: 5, // Column F
  },

  plannedStatus: "Planned",
  toBePlannedStatus: "To be Planned",
  executedStatus: "Executed",

  upcomingWindowDays: 30, // How many days ahead to look for "upcoming" events
  headerRows: 1, // Rows to skip at the top of the sheet
};
```

**How to get a File Unique ID in SharePoint:**  
Open the file in SharePoint → click the `…` menu → **Details** → scroll down to find **Unique Id**.

### 3.2 `excelSourcesConfig.ts` – Findings & Objectives Sources

#### Objectives sources

```ts
export const EXCEL_OBJECTIVES_SOURCES: IExcelObjectivesSource[] = [
  {
    id: "isms-objectives",
    label: "ISMS Objectives - Information Security Metrics",
    fileUniqueId: "1443C5A7-7969-4502-AB0E-F3B211E5C373", // ← File Unique ID
    type: "objectives",
    yearSheetPattern: /^\d{4}$/, // Sheets matching this regex are year tabs
    ignoredSheets: ["Cover", "Legend", "Process", "Objectives", "Calculations"],
    columns: OBJECTIVES_COLUMNS, // Defined in objectivesConfig.ts
    scoreThresholds: DEFAULT_SCORE_THRESHOLDS,
  },
];
```

#### Findings sources

```ts
export const EXCEL_FINDINGS_SOURCES: IExcelFindingsSource[] = [
  {
    id: "internal-audit-findings",
    label: "2026 Internal Audit Findings",
    fileUniqueId: "25F67B5D-442A-4A23-A36D-0BF47C261615", // ← File Unique ID
    sheetName: "2026 Internal Audit Findings", // ← Exact sheet tab name
    type: "findings",
    filterStatus: "In Progress", // Only rows with this status are shown
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
  // ... more entries
];
```

### 3.3 `objectivesConfig.ts` – Column Indices & Score Thresholds

```ts
export const OBJECTIVES_COLUMNS = {
  colA: 0,
  colB: 1,
  colC: 2,
  frequency: 3,
  weighting: 4,
  lowerThreshold: 5,
  midThreshold: 6,
  upperThreshold: 7,
  metricValue: 8,
  metricScore: 9,
  subDomainScore: 10,
  domainScore: 11,
  comments: 12,
};

export const DEFAULT_SCORE_THRESHOLDS = {
  low: { max: 0.69, label: "Not Achieved", color: "#ff4d4f" },
  acceptable: { max: 0.89, label: "Acceptable", color: "#faad14" },
  achieved: { max: 1.0, label: "Achieved", color: "#52c41a" },
};
```

Change `max` values to adjust when a score is considered "Achieved" vs "Acceptable" vs "Not Achieved".  
Change `color` to update the indicator colours without touching any component.

### 3.4 `registryConfig.ts` – SharePoint List Registries

Each entry in `REGISTRIES` maps to one SharePoint list:

```ts
{
  id: "risk",                               // Internal identifier (must be unique)
  label: "Risk Identification",             // Display name in the UI
  sharepointListName: "Risk Identification",// Exact SharePoint list name
  dateField: "Created",                     // Display name of the date column
  statusField: "Current Status",            // Display name of the status column
  titleField: "Risk Code",                  // Display name of the title/ID column
  statuses: ["In Progress", "Completed", "Delayed", "Accepted", "Scheduled"],
  completedStatuses: ["Completed", "Accepted"], // These are green in the pie chart
  defaultThresholdDays: 30,                 // Days before an item is "overdue"
  statusThresholds: {                       // Per-status stalling thresholds (days)
    "In Progress": 7,
    "Delayed": 7,
  },
  statusDateFields: {                       // Which date column to use per status
    "In Progress": "Created",
    "Delayed": "Status Change Date",
  },
},
```

### 3.5 `registersDocLibConfig.ts` – All Registers Folder

```ts
export const REGISTERS_DOC_LIB_CONFIG = {
  id: "all-registers",
  label: "All Registers",
  folderSiteRelativePath:
    "ISO 27001/Finalized Documents/External Audit/3. Registers",
  // ↑ Path relative to the SharePoint site root. No leading slash.
};
```

---

## 4. How to Change Existing Things

### Change which Excel file the Events section reads

1. Get the new file's Unique ID from SharePoint.
2. Open `src/webparts/dashboard/config/eventsConfig.ts`.
3. Update `fileUniqueId`.
4. Update `sheetName` if the tab name changed.
5. Update the `columns` mapping if columns moved.

### Change which year tab the Objectives section defaults to

The section auto-selects the **most recent** tab that matches `yearSheetPattern` (`/^\d{4}$/`). Simply add a new year sheet to the Excel file — the dropdown will include it automatically on next load.

### Add or remove a status from a registry

Open `registryConfig.ts`, find the registry entry, and add/remove the status string from the `statuses` array. If the status should count as "done", also add it to `completedStatuses`.

### Change the overdue threshold for a registry

- **Global threshold** – change `defaultThresholdDays` in the registry entry.
- **Per-status threshold** – add or update an entry in `statusThresholds`.

### Change score colours / labels

Edit `DEFAULT_SCORE_THRESHOLDS` in `objectivesConfig.ts`. Every component reads from this one object.

### Change the upcoming events window

In `eventsConfig.ts`, change `upcomingWindowDays` (default `30`).

### Change the SharePoint site the local dev server opens

In `config/serve.json`, update the `initialPage` URL to point at your SharePoint workbench.

---

## 5. How to Add New Things

### Add a new Findings source (new audit sheet)

1. Open `src/webparts/dashboard/config/excelSourcesConfig.ts`.
2. Append a new entry to `EXCEL_FINDINGS_SOURCES`:

```ts
{
  id: "supplier-audit-findings",          // must be unique
  label: "2026 Supplier Audit Findings",  // shown as section heading
  fileUniqueId: "YOUR-FILE-UNIQUE-ID",
  sheetName: "Supplier Findings",
  type: "findings",
  filterStatus: "In Progress",
  headerRows: 1,
  columns: {
    number: 0,
    finding: 1,
    correctiveAction: 2,
    status: 3,
    // Omit any column that doesn't exist in this sheet
  },
},
```

`ISODashboard.tsx` automatically renders a `FindingsSection` for every entry in the array — no other code changes needed.

### Add a new Objectives source (second workbook)

Append to `EXCEL_OBJECTIVES_SOURCES` in `excelSourcesConfig.ts` with a new `fileUniqueId`. A second `ObjectivesSection` will appear automatically.

### Add a new SharePoint List Registry

1. Open `src/webparts/dashboard/config/registryConfig.ts`.
2. Append a new `IRegistryConfig` object to the `REGISTRIES` array following the same shape as the existing entries.
3. Ensure the `sharepointListName` matches the list's exact display name in SharePoint.
4. Both the **overview card** and the **detail view** will appear automatically.

### Add a new UI component / section

1. Create your `.tsx` file inside `src/webparts/dashboard/components/`.
2. Import and render it inside `ISODashboard.tsx` where you want it to appear (inside the `{view === "overview" && ...}` block for overview-only sections).

### Add a new custom hook

1. Create your `.ts` file inside `src/webparts/dashboard/hooks/`.
2. Use the SharePoint REST API via `fetch` with `credentials: "same-origin"` — no extra auth is needed within the same SharePoint site.

---

## 6. Prerequisites

| Tool           | Version                            |
| -------------- | ---------------------------------- |
| Node.js        | 18.x (exactly `>=18.17.1 <19.0.0`) |
| npm            | bundled with Node 18               |
| Gulp CLI       | `npm install -g gulp-cli`          |
| SPFx toolchain | installed via `npm install`        |

### Node version setup

The project **requires Node 18**. Node 19+ (including Node 20, 22) will cause SPFx build errors.

**Step 1 – Check your current Node version**

```powershell
node -v
```

If the output is `v18.x.x` you are good — skip to Step 4.

**Step 2 – Install nvm-windows (if not already installed)**

Download and run the installer from:  
https://github.com/coreybutler/nvm-windows/releases

Then close and reopen your terminal (as Administrator).

**Step 3 – Install and activate Node 18**

```powershell
nvm install 18.20.8
nvm use 18.20.8
```

> **Windows note:** `nvm use` requires the terminal to be run as Administrator.

**Step 4 – Verify**

```powershell
node -v   # must print v18.x.x
npm -v    # confirm npm is available
```

### Install dependencies (once, or after cloning)

```powershell
npm install
```

---

## 7. Running in the Browser (Local Development)

The SPFx toolchain runs a local HTTPS dev server and loads the web part inside the **SharePoint Workbench** hosted on your SharePoint site.

### Step 1 – Start the dev server

```powershell
gulp serve
```

This bundles the project in **debug** mode, starts a local HTTPS server on port `4321`, and opens the URL configured in `config/serve.json`:

```
https://xeptagoncom.sharepoint.com/sites/ISO27001/_layouts/workbench.aspx
```


### Step 2 – Add the web part to the workbench (first time only)

Once the workbench page loads, it will be empty. You need to add the Dashboard web part:

1. Click the **+** (plus) button that appears in the middle of the page.
2. In the search box that appears, type **Dashboard**.
3. Click the **Dashboard** tile to add it to the page.

The dashboard will render and connect to your SharePoint site's data automatically. This step only needs to be done once — after that, the web part stays on the workbench page as long as your browser session is open.

### Step 3 – Iterate

Every time you save a source file, Gulp hot-reloads the bundle. Refresh the browser to see changes.

### Serving without opening a browser

```powershell
gulp serve --nobrowser
```

Then navigate manually to the workbench URL.

---

## 8. Building and Packaging for SharePoint

### Step 1 – Production bundle

```powershell
gulp bundle --ship
```

Compiles TypeScript, bundles all assets (minified, no source maps) into the `release/` folder.

### Step 2 – Package the solution

```powershell
gulp package-solution --ship
```

Creates `sharepoint/solution/dashboard.sppkg`.

### One-liner (bundle + package)

```powershell
gulp bundle --ship ; gulp package-solution --ship
```

The resulting `.sppkg` file at `sharepoint/solution/dashboard.sppkg` is what you upload to SharePoint.

---

## 9. Deploying to SharePoint

### 9.1 Upload to the App Catalog

1. Go to your SharePoint **App Catalog** site.  
   URL pattern: `https://<tenant>.sharepoint.com/sites/appcatalog`  
   (or find it via **SharePoint Admin Center → More features → Apps**)
2. Click **Apps for SharePoint** in the left navigation.
3. Click **Upload** and select `sharepoint/solution/dashboard.sppkg`.
4. In the dialog that appears:
   - **"Make this solution available to all sites…"** — check this if you want to deploy tenant-wide, or leave unchecked to deploy site-by-site.
5. Click **Deploy**.

### 9.2 Add the app to your SharePoint site

> Skip this step if you enabled tenant-wide deployment above.

1. Navigate to the target SharePoint site (e.g. `https://<tenant>.sharepoint.com/sites/ISO27001`).
2. Click the **Settings gear** (top right) → **Add an app**.
3. Find **dashboard-client-side-solution** and click **Add**.

### 9.3 Add the web part to a page

1. Navigate to the SharePoint page where you want the dashboard.
2. Click **Edit** (top right).
3. Hover over a section → click the **+** icon to add a web part.
4. Search for **Dashboard** and select it.
5. Click **Publish** (or **Republish**) to save.

### 9.4 Updating an existing deployment

After making code changes, repeat the build and package steps, then re-upload the new `.sppkg` to the App Catalog. SharePoint will prompt you to update — confirm it. The update propagates to all pages that use the web part without needing to re-add it.

---

## 10. Common Errors and Fixes

| Error                                        | Cause                         | Fix                                                      |
| -------------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| `Download failed: HTTP 404`                  | Wrong `fileUniqueId`          | Get the correct ID from SharePoint file details          |
| `Sheet "Calendar 2026" not found`            | Wrong `sheetName`             | Open the Excel file and copy the exact tab name          |
| `Could not load field metadata for list "…"` | Wrong `sharepointListName`    | Match the list's display name exactly (case-sensitive)   |
| Certificate warning on `localhost:4321`      | Self-signed dev cert          | Visit `https://localhost:4321` and accept the cert       |
| Web part not appearing after upload          | App not added to site         | Follow step 9.2 to add the app to the site               |
| Score colours not updating                   | Score thresholds not matching | Edit `DEFAULT_SCORE_THRESHOLDS` in `objectivesConfig.ts` |
| `node` version mismatch                      | Wrong Node version            | Use Node 18 (`nvm use 18` or switch via nvm-windows)     |
| Old bundle still showing after `gulp serve`  | Browser cache                 | Hard-refresh with `Ctrl+Shift+R` or clear browser cache  |

---

## Quick Reference

```powershell
# Install dependencies
npm install

# Start local dev server (opens browser)
gulp serve

# Start dev server (no browser)
gulp serve --nobrowser

# Production build only
gulp bundle --ship

# Package for SharePoint
gulp package-solution --ship

# Full build + package in one go
gulp bundle --ship ; gulp package-solution --ship

# Clean build output
gulp clean
```

**Key config files at a glance:**

| What to change                      | File                                    |
| ----------------------------------- | --------------------------------------- |
| Events Excel file / sheet / columns | `src/…/config/eventsConfig.ts`          |
| Findings Excel sources              | `src/…/config/excelSourcesConfig.ts`    |
| Objectives Excel source             | `src/…/config/excelSourcesConfig.ts`    |
| Score thresholds & column indices   | `src/…/config/objectivesConfig.ts`      |
| SharePoint list registries          | `src/…/config/registryConfig.ts`        |
| Registers document library folder   | `src/…/config/registersDocLibConfig.ts` |
| Dev server URL                      | `config/serve.json`                     |

