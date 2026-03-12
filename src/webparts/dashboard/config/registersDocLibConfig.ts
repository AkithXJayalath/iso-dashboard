// Configuration for the "All Registers" document-library section.
// folderSiteRelativePath is relative to the SharePoint site root.
// Example: if the site is  https://tenant.sharepoint.com/sites/ISO
//   and the folder lives at  .../sites/ISO/ISO 27001/Finalized Documents/External Audit/3. Registers
// then set:  "ISO 27001/Finalized Documents/External Audit/3. Registers"

export interface IRegistersDocLibConfig {
  id: string;
  label: string;
  /**
   * Path to the folder relative to the SharePoint site root.
   * Do NOT include a leading slash.
   * Example: "ISO 27001/Finalized Documents/External Audit/3. Registers"
   */
  folderSiteRelativePath: string;
}

export const REGISTERS_DOC_LIB_CONFIG: IRegistersDocLibConfig = {
  id: "all-registers",
  label: "All Registers",
  folderSiteRelativePath:
    "ISO 27001/Finalized Documents/External Audit/3. Registers",
};
