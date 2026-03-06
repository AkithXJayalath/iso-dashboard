export interface IDashboardProps {
  /** Absolute URL of the SharePoint site, e.g. https://contoso.sharepoint.com/sites/iso */
  siteUrl: string;
  isDarkTheme: boolean;
  hasTeamsContext: boolean;
  userDisplayName: string;
}
